#!/usr/bin/env bash
# =============================================================================
#  shequn 生产部署脚本（被 GitHub Actions 通过 SSH 调用）
#  适配环境：pm2 + Caddy + 本地 MySQL（项目位于 /home/ubuntu/shequn）
#  用法：deploy.sh <GITHUB_REF> <GITHUB_SHA> <FORCE_REBUILD> <SKIP_MIGRATE>
#
#  说明：源码由 GitHub Actions 打包为 /tmp/shequn-src.tar.gz 并上传到服务器，
#       本脚本负责解压、构建、重启服务（避免服务器直接访问 GitHub）。
# =============================================================================
set -euo pipefail

# -------- 参数 --------
GITHUB_REF="${1:-main}"
GITHUB_SHA="${2:-HEAD}"
FORCE_REBUILD="${3:-false}"
SKIP_MIGRATE="${4:-false}"

# -------- 路径 --------
PROJECT_DIR="/home/ubuntu/shequn"
LOG_DIR="$PROJECT_DIR/deploy/logs"
mkdir -p "$LOG_DIR"
DEPLOY_LOG="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"
SRC_TAR="/tmp/shequn-src.tar.gz"

# -------- 颜色输出 --------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $*" | tee -a "$DEPLOY_LOG"; }
warn() { echo -e "${YELLOW}[$(date +%H:%M:%S)]${NC} $*" | tee -a "$DEPLOY_LOG" >&2; }
fail() { echo -e "${RED}[$(date +%H:%M:%S)] FAIL${NC} $*" | tee -a "$DEPLOY_LOG" >&2; exit 1; }

# -------- 依赖安装（带磁盘检查 + 自动重试 + npm install 回退）--------
# 修复：npm ci 偶发失败（网络/磁盘/缓存）导致部署中断、前端 dist 被清空的问题
install_deps() {
  local dir="$1"
  cd "$PROJECT_DIR/$dir"

  # 磁盘空间检查（<1GB 时清理 npm 缓存）
  local avail
  avail=$(df -Pk . 2>/dev/null | awk 'NR==2{print $4}')
  if [ -n "$avail" ] && [ "$avail" -lt 1048576 ]; then
    warn "[$dir] 磁盘可用空间不足 ${avail}KB (<1GB)，清理 npm 缓存..."
    npm cache clean --force 2>/dev/null || true
  fi

  for attempt in 1 2 3; do
    log "[$dir] 安装依赖（第 $attempt 次）..."
    if npm ci --no-audit --no-fund 2>&1 | tee -a "$DEPLOY_LOG"; then
      if [ "${PIPESTATUS[0]}" = "0" ]; then
        log "[$dir] 依赖安装成功"
        return 0
      fi
    fi
    warn "[$dir] npm ci 第 $attempt 次失败，3s 后重试..."
    sleep 3
  done

  # 连续失败后回退到 npm install（更宽容 lock 文件差异）
  warn "[$dir] npm ci 连续失败，回退 npm install..."
  if ! npm install --no-audit --no-fund 2>&1 | tee -a "$DEPLOY_LOG"; then
    fail "[$dir] 依赖安装彻底失败，请查看 $DEPLOY_LOG 与服务器日志"
  fi
  log "[$dir] 依赖安装成功（npm install）"
}

# -------- 前置检查 --------
[ -d "$PROJECT_DIR" ]        || fail "项目目录不存在: $PROJECT_DIR"
[ -f "$SRC_TAR" ]            || fail "源码包不存在: $SRC_TAR (请先由 GitHub Actions 上传)"
command -v npm  >/dev/null   || fail "npm 未安装"
command -v pm2 >/dev/null    || fail "pm2 未安装"

log "=========================================="
log " 部署开始 (pm2/Caddy + 源码上传模式)"
log "  REF:           $GITHUB_REF"
log "  SHA:           ${GITHUB_SHA:0:8}"
log "  FORCE_REBUILD: $FORCE_REBUILD"
log "  SKIP_MIGRATE:  $SKIP_MIGRATE"
log "=========================================="

# -------- 1. 解压源码（保留 .env 和 uploads 等本地文件）--------
log "解压源码到 $PROJECT_DIR ..."
# 先备份需要保留的本地文件/目录
BACKUP_DIR="/tmp/shequn-backup-$(date +%s)"
mkdir -p "$BACKUP_DIR"
# 备份 .env（后端配置）
[ -f "$PROJECT_DIR/backend/.env" ] && cp -f "$PROJECT_DIR/backend/.env" "$BACKUP_DIR/backend.env" || true
# 备份 uploads（用户上传文件）
[ -d "$PROJECT_DIR/backend/uploads" ] && cp -rf "$PROJECT_DIR/backend/uploads" "$BACKUP_DIR/uploads" || true
# 备份 pm2 生态文件（如有）
[ -f "$PROJECT_DIR/ecosystem.config.js" ] && cp -f "$PROJECT_DIR/ecosystem.config.js" "$BACKUP_DIR/" || true

# 清空项目目录（保留 deploy/logs）
log "清理旧代码（保留 deploy/logs）..."
cd "$PROJECT_DIR"
find . -maxdepth 1 ! -name 'deploy' ! -name '.' -exec rm -rf {} + 2>/dev/null || true

# 解压新源码
log "解压源码包..."
tar -xzf "$SRC_TAR" -C "$PROJECT_DIR"
log "解压完成"

# 恢复本地文件
[ -f "$BACKUP_DIR/backend.env" ] && cp -f "$BACKUP_DIR/backend.env" "$PROJECT_DIR/backend/.env" && log "已恢复 backend/.env" || true
[ -d "$BACKUP_DIR/uploads" ] && cp -rf "$BACKUP_DIR/uploads" "$PROJECT_DIR/backend/uploads" && log "已恢复 backend/uploads" || true
[ -f "$BACKUP_DIR/ecosystem.config.js" ] && cp -f "$BACKUP_DIR/ecosystem.config.js" "$PROJECT_DIR/" && log "已恢复 ecosystem.config.js" || true

# backend/.env 校验：若本次备份缺失（服务器 .env 在历史部署中丢失），则从 /tmp 历史备份恢复最新一份
if [ ! -f "$PROJECT_DIR/backend/.env" ]; then
  warn "backend/.env 在本目录缺失，尝试从 /tmp 历史部署备份恢复..."
  # 找出最新的含 backend.env 的备份目录（按时间倒序）
  latest_backup=$(ls -dt /tmp/shequn-backup-*/ 2>/dev/null | while read dir; do
    [ -f "$dir/backend.env" ] && echo "$dir"
  done | head -1)
  if [ -n "$latest_backup" ] && [ -f "$latest_backup/backend.env" ]; then
    cp -f "$latest_backup/backend.env" "$PROJECT_DIR/backend/.env"
    log "已从历史备份恢复 backend/.env: $latest_backup"
  else
    warn "未找到历史 .env 备份 /tmp/shequn-backup-*/backend.env"
  fi
fi
rm -rf "$BACKUP_DIR"

# backend/.env 校验
[ -f backend/.env ] || fail "backend/.env 不存在，请先创建（可参考 .env.example）"
grep -q "DATABASE_URL" backend/.env || fail "backend/.env 缺 DATABASE_URL"

CURRENT_SHA="${GITHUB_SHA:0:8}"
log "当前版本: $CURRENT_SHA"

# -------- 2. 部署后端 --------
log "--- 后端 ---"
cd "$PROJECT_DIR/backend"
install_deps backend
npx prisma generate 2>&1 | tail -1

# 数据库结构同步（本项目用 prisma db push，不用 migration 文件）
if [ "$SKIP_MIGRATE" = "true" ]; then
  warn "跳过数据库同步（SKIP_MIGRATE=true）"
else
  log "同步数据库结构（prisma db push）..."
  npx prisma db push --skip-generate --accept-data-loss 2>&1 | tail -3
fi

# 补齐全量种子图（若服务器 uploads 缺失则由仓库 seed-assets 补充）
SEED_DIRS="business-covers product-covers activity-covers logo"
for dir in $SEED_DIRS; do
  if [ -d "$PROJECT_DIR/backend/seed-assets/$dir" ]; then
    mkdir -p "$PROJECT_DIR/backend/uploads"
    cp -f "$PROJECT_DIR"/backend/seed-assets/$dir/*.jpg "$PROJECT_DIR/backend/uploads/" 2>/dev/null || true
    log "已同步种子图 → backend/uploads ($dir)"
  fi
done

log "构建后端..."
npm run build 2>&1 | tail -3

log "重启后端服务 (pm2)..."
pm2 restart shequn-backend 2>&1 | tail -3

# -------- 3. 部署管理端 --------
log "--- 管理端 ---"
cd "$PROJECT_DIR/admin"
install_deps admin
npm run build 2>&1 | tail -3
log "管理端构建完成 → admin/dist"

# -------- 4. 部署移动端 --------
log "--- 移动端 ---"
cd "$PROJECT_DIR/mobile"
install_deps mobile
npm run build 2>&1 | tail -3
log "移动端构建完成 → mobile/dist  (Caddy 自动读取)"

# 恢复 App APK（由 build-apk 工作流部署到 deploy/app/，该目录在部署时被保留）
if [ -f "$PROJECT_DIR/deploy/app/shequn.apk" ]; then
  mkdir -p "$PROJECT_DIR/mobile/dist/app"
  cp -f "$PROJECT_DIR/deploy/app/shequn.apk" "$PROJECT_DIR/mobile/dist/app/shequn.apk"
  log "已恢复 App APK → mobile/dist/app/shequn.apk"
fi

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

# -------- 5.5 商机种子数据（幂等，同步到线上数据库）--------
log "同步商机种子数据..."
cd "$PROJECT_DIR/backend"
if npx ts-node prisma/seed-businesses.ts 2>&1 | tee -a "$DEPLOY_LOG"; then
  log "✅ 商机种子数据同步完成"
else
  warn "商机种子数据同步失败（不影响主流程，可后续手动重试）"
fi

# -------- 5.6 管理员头像种子（幂等，更新 admin avatarUrl 为 Logo）--------
log "同步管理员头像..."
cd "$PROJECT_DIR/backend"
if npx ts-node prisma/seed-admin.ts 2>&1 | tee -a "$DEPLOY_LOG"; then
  log "✅ 管理员头像同步完成"
else
  warn "管理员头像同步失败（不影响主流程，可后续手动重试）"
fi

# -------- 6. 清理临时文件 --------
rm -f "$SRC_TAR"
log "已清理临时源码包"

# -------- 7. 完成 --------
log "=========================================="
log " 部署完成！ Commit: $CURRENT_SHA"
log " 日志: $DEPLOY_LOG"
log "=========================================="
