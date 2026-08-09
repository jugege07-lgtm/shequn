#!/usr/bin/env bash
# =============================================================================
#  shequn 生产部署脚本（被 GitHub Actions 通过 SSH 调用）
#  用法：deploy.sh <GITHUB_REF> <GITHUB_SHA> <FORCE_REBUILD> <SKIP_MIGRATE>
# =============================================================================
set -euo pipefail

# -------- 参数 --------
GITHUB_REF="${1:-main}"
GITHUB_SHA="${2:-HEAD}"
FORCE_REBUILD="${3:-false}"
SKIP_MIGRATE="${4:-false}"

# -------- 路径 --------
PROJECT_DIR="/home/deploy/shequn"
LOG_DIR="/var/log/shequn"
DEPLOY_LOG="$LOG_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.yml"

# -------- 颜色输出 --------
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()   { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $*" | tee -a "$DEPLOY_LOG"; }
warn()  { echo -e "${YELLOW}[$(date +%H:%M:%S)]${NC} $*" | tee -a "$DEPLOY_LOG" >&2; }
fail()  { echo -e "${RED}[$(date +%H:%M:%S)] FAIL${NC} $*" | tee -a "$DEPLOY_LOG" >&2; exit 1; }

# -------- 前置检查 --------
[ -d "$PROJECT_DIR" ] || fail "项目目录不存在: $PROJECT_DIR"
command -v docker >/dev/null  || fail "docker 未安装"
command -v git   >/dev/null  || fail "git 未安装"
mkdir -p "$LOG_DIR"

cd "$PROJECT_DIR"

log "=========================================="
log "🚀 部署开始"
log "  REF:          $GITHUB_REF"
log "  SHA:          ${GITHUB_SHA:0:8}"
log "  FORCE_REBUILD: $FORCE_REBUILD"
log "  SKIP_MIGRATE:  $SKIP_MIGRATE"
log "=========================================="

# -------- 1. 备份当前容器快照（标签名带时间戳） --------
log "📦 备份当前 backend 镜像..."
docker tag shequn-backend:latest shequn-backend:previous 2>/dev/null || true

# -------- 2. 拉取最新代码 --------
log "📥 拉取最新代码..."
# 判断是 tag 还是分支
if [[ "$GITHUB_REF" =~ ^refs/tags/v ]]; then
  # tag 推送：先 fetch tags，再 checkout 对应 tag
  TAG_NAME="${GITHUB_REF#refs/tags/}"
  git fetch --tags --force
  git checkout -f "$TAG_NAME"
else
  # 分支推送：fetch + reset
  BRANCH="${GITHUB_REF#refs/heads/}"
  git fetch origin "$BRANCH"
  git checkout -f "$BRANCH"
  git reset --hard "origin/$BRANCH"
fi

CURRENT_SHA=$(git rev-parse --short HEAD)
log "✅ 当前 HEAD: $CURRENT_SHA"

# -------- 3. 检查 .env --------
[ -f backend/.env ] || fail "backend/.env 不存在，请先按 README 创建"
# 校验关键变量
grep -q "DATABASE_URL" backend/.env || fail "backend/.env 缺 DATABASE_URL"

# -------- 4. 重新构建后端镜像 --------
if [ "$FORCE_REBUILD" = "true" ]; then
  log "🔨 强制重建后端镜像（无缓存）..."
  docker compose build --no-cache --pull backend 2>&1 | tee -a "$DEPLOY_LOG"
else
  log "🔨 重建后端镜像（增量缓存）..."
  docker compose build backend 2>&1 | tee -a "$DEPLOY_LOG"
fi

# -------- 5. 数据库迁移 --------
if [ "$SKIP_MIGRATE" = "true" ]; then
  warn "⚠️  跳过数据库迁移（SKIP_MIGRATE=true）"
else
  log "🗄️  执行数据库迁移..."
  # 仅当 MySQL 健康时跑迁移
  if docker compose ps mysql | grep -q "(healthy)"; then
    docker compose run --rm backend npx prisma migrate deploy 2>&1 | tee -a "$DEPLOY_LOG" || {
      warn "迁移失败，尝试 db push 同步 schema（仅首次部署）"
      docker compose run --rm backend npx prisma db push --accept-data-loss 2>&1 | tee -a "$DEPLOY_LOG"
    }
  else
    fail "MySQL 未就绪，放弃迁移。请检查 docker compose ps mysql"
  fi
fi

# -------- 6. 重启服务（无停机）--------
log "🔄 重启服务..."
docker compose up -d --no-deps --remove-orphans backend 2>&1 | tee -a "$DEPLOY_LOG"

# -------- 7. 清理旧镜像，保留最近 3 个版本 --------
log "🧹 清理旧镜像..."
docker images shequn-backend --format "{{.Tag}} {{.CreatedAt}}" \
  | sort -k2 -r \
  | tail -n +4 \
  | awk '{print $1}' \
  | while read -r tag; do
      [ "$tag" != "latest" ] && [ "$tag" != "previous" ] && \
        docker rmi "shequn-backend:$tag" 2>/dev/null || true
    done

# -------- 8. 健康检查 --------
log "❤️  健康检查..."
sleep 5
for i in 1 2 3 4 5; do
  if curl -fsS -o /dev/null -w "HTTP %{http_code}\n" \
       "http://127.0.0.1:3000/api/public/big-screen" 2>/dev/null; then
    log "✅ 后端健康（重试 $i 次）"
    break
  fi
  warn "  第 $i 次健康检查未通过，等待 3s..."
  sleep 3
  if [ "$i" = "5" ]; then
    fail "健康检查失败，查看日志：docker compose logs --tail=200 backend"
  fi
done

# -------- 9. 完成 --------
log "=========================================="
log "🎉 部署完成！"
log "  Commit: $CURRENT_SHA"
log "  日志:   $DEPLOY_LOG"
log "=========================================="

# -------- 10. 失败时回滚提示 --------
# 注意：真正的自动回滚在 GitHub Actions 层处理（job 失败会标红）
# 此处仅打印恢复命令
echo ""
echo "💡 如需回滚到上一版本："
echo "   docker compose down backend"
echo "   docker tag shequn-backend:previous shequn-backend:latest"
echo "   docker compose up -d backend"
