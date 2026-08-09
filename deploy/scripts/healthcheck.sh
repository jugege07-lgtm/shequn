#!/usr/bin/env bash
# =============================================================================
#  shequn 健康检查（每 5 分钟跑一次）
#  crontab：*/5 * * * * /home/deploy/shequn/deploy/scripts/healthcheck.sh
# =============================================================================
set -uo pipefail

API_BASE="${API_BASE:-http://127.0.0.1:3000/api}"
ADMIN_URL="${ADMIN_URL:-https://jugekeji.cn/admin/}"
LOG="/var/log/shequn/health.log"
ALERT_FILE="/tmp/shequn-alert"

ts() { date '+%Y-%m-%d %H:%M:%S'; }
mkdir -p "$(dirname "$LOG")"

check() {
  local name="$1" url="$2"
  local code
  code=$(curl -fsS -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
  if [ "$code" = "200" ] || [ "$code" = "301" ] || [ "$code" = "302" ]; then
    echo "$(ts) ✅ $name HTTP $code" >> "$LOG"
    return 0
  else
    echo "$(ts) ❌ $name HTTP $code" >> "$LOG"
    return 1
  fi
}

failed=0
check "Backend Swagger"   "$API_BASE/docs"            || failed=$((failed+1))
check "Backend big-screen" "$API_BASE/public/big-screen" || failed=$((failed+1))
check "Admin SPA"          "$ADMIN_URL"                 || failed=$((failed+1))

# 容器状态
for svc in mysql redis backend; do
  if ! docker ps --format '{{.Names}}' | grep -q "shequn-$svc"; then
    echo "$(ts) ❌ Container shequn-$svc NOT running" >> "$LOG"
    failed=$((failed+1))
  fi
done

# 磁盘
disk=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')
if [ "$disk" -ge 85 ]; then
  echo "$(ts) ⚠️  Disk usage: ${disk}%" >> "$LOG"
  failed=$((failed+1))
fi

if [ "$failed" -gt 0 ]; then
  echo "$(ts) ⚠️  $failed checks failed" >> "$LOG"
  # 触发告警：写入文件，配合 systemd / monit 发送通知
  echo "$(ts) $failed failed" > "$ALERT_FILE"
  # 如有企业微信/钉钉 webhook，可在此 curl 通知
  # curl -X POST "$WECHAT_WEBHOOK" -d "{\"content\": \"shequn $failed checks failed at $(ts)\"}"
  exit 1
fi

echo "$(ts) ✅ All checks passed" >> "$LOG"
rm -f "$ALERT_FILE"
exit 0
