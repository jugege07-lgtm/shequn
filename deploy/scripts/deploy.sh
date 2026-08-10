#!/usr/bin/env bash
# =============================================================================
#  shequn 生产部署脚本（被 GitHub Actions 通过 SSH 调用）
#  适配环境：pm2 + Caddy + 本地 MySQL（项目位于 /home/ubuntu/shequn）
#  用法：deploy.sh <GITHUB_REF> <GITHUB_SHA> <FORCE_REBUILD> <SKIP_MIGRATE>
# =============================================================================
set -euo pipefail

# -------- 参数 --------
GITHUB_REF="${1:-main}"
GITHUB_SHA="${2:-HEAD}"
FORCE_REBUILD="${3:-false}"
SKIP_MIGRATE="${4:-false}"

# -------- 路径 --------
PROJECT_DIR="/home/ubuntu/shequn"
LOG_DIR="/home/ubuntu/shequn/deploy/logs"
mkdir -p "$LOG_DIR"
DEPLOY_LOG="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"

# -------- 颜色输出 --------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $*" | tee -a "$DEPLOY_LOG"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)]${NC} $*" | tee -a "$DEPLOY_LOG" >&2; }
fail() { echo -e "${RED}[$(date +%H:%M:%S)] FAIL${NC} $*" | tee -a "$DEPLOY_LOG" >&2; exit 1; }

# -------- 前置检查 --------
[ -d "$PROJECT_DIR" ]        || fail "项目目录不存在: $PROJECT_DIR"
command -v git  >/dev/null   || fail "git 未安装"
command -v npm  >/dev/null   || fail "npm 未安装"
command -v pm2 >/dev/null    || fail "pm2 未安装"

cd "$PROJECT_DIR"

log "=========================================="
log " 部署开始 (pm2/Caddy)"
log "  REF:           $GITHUB_REF"
log "  SHA:           ${GITHUB_SHA:0:8}"
log "  FORCE_REBUILD: $FORCE_REBUILD"
log "  SKIP_MIGRATE:  $SKIP_MIGRATE"
log "=========================================="

# -------- 1. 拉取最新代码（tag 或分支）--------
if [[ "$GITHUB_REF" =~ ^refs/tags/v ]]; then
  TAG_NAME="${GITHUB_REF#refs/tags/}"
  log "检出 tag: $TAG_NAME"
  git fetch --tags --force
  git checkout -f "$TAG_NAME"
else
  BRANCH="${GITHUB_REF#refs/heads/}"
  log "检出分支: $BRANCH"
  git fetch origin "$BRANCH"
  git checkout -f "$BRANCH" 2>/dev/null || git checkout -f -B "$BRANCH" "origin/$BRANCH"
  git reset --hard "origin/$BRANCH"
fi
CURRENT_SHA=$(git rev-parse --short HEAD)
log "当前 HEAD: $CURRENT_SHA"

# backend/.env 不入库，重置不影响；校验存在
[ -f backend/.env ] || fail "backend/.env 不存在，请先创建（可参考 .env.example）"
grep -q "DATABASE_URL" backend/.env || fail "backend/.env 缺 DATABASE_URL"

# -------- 2. 部署后端 --------
log "--- 后端 ---"
cd "$PROJECT_DIR/backend"
npm ci --no-audit --no-fund 2>&1 | tail -2
npx prisma generate 2>&1 | tail -1

# 数据库结构同步（本项目用 prisma db push，不用 migration 文件）
if [ "$SKIP_MIGRATE" = "true" ]; then
  warn "跳过数据库同步（SKIP_MIGRATE=true）"
else
  log "同步数据库结构（prisma db push）..."
  npx prisma db push --skip-generate --accept-data-loss 2>&1 | tail -3
fi

log "构建后端..."
npm run build 2>&1 | tail -3

log "重启后端服务 (pm2)..."
pm2 restart shequn-backend 2>&1 | tail -3

# -------- 3. 部署管理端 --------
log "--- 管理端 ---"
cd "$PROJECT_DIR/admin"
npm ci --no-audit --no-fund 2>&1 | tail -2
npm run build 2>&1 | tail -3
log "管理端构建完成 → admin/dist"

# -------- 4. 部署移动端 --------
log "--- 移动端 ---"
cd "$PROJECT_DIR/mobile"
npm ci --no-audit --no-fund 2>&1 | tail -2
npm run build 2>&1 | tail -3
log "移动端构建完成 → mobile/dist  (Caddy 自动读取)"

# -------- 5. 健康检查 --------
log "健康检查..."
sleep 5
for i in 1 2 3 4 5; do
  if curl -fsS -o /dev/null -w "HTTP %{http_code}\n" \
       "http://127.0.0.1:3000/api/public/big-screen" 2>/dev/null; then
    log "✅ 后端健康（重试 $i 次）"
    break
  fi
  warn "第 $i 次健康检查未通过，等待 3s..."
  sleep 3
  if [ "$i" = "5" ]; then
    fail "健康检查失败，查看日志：pm2 logs shequn-backend --lines 200"
  fi
done

# -------- 6. 完成 --------
log "=========================================="
log " 部署完成！ Commit: $CURRENT_SHA"
log " 日志: $DEPLOY_LOG"
log "=========================================="