# 部署运维脚本说明

本目录包含生产环境部署与运维所需的所有脚本与配置。

## 目录结构

```
deploy/
├── README.md                  # 本文件
├── nginx/
│   └── shequn.conf            # Nginx 站点配置（API 反代 + 静态托管）
└── scripts/
    ├── deploy.sh              # 部署主脚本（被 GitHub Actions 调用）
    └── healthcheck.sh         # 健康检查（cron 跑）
```

## 部署流程

```
本地 git push / tag
        │
        ▼
GitHub Actions (.github/workflows/deploy-prod.yml)
        │
        │  SSH
        ▼
CVM 上 deploy.sh
   ├── git fetch + checkout
   ├── docker compose build
   ├── prisma migrate deploy
   ├── docker compose up -d backend
   └── health check
```

## 首次部署（手动）

```bash
ssh deploy@<CVM-IP>
sudo mkdir -p /var/log/shequn
cd /home/deploy
git clone https://github.com/jugege07-lgtm/shequn.git
cd shequn
git checkout v2.0

# 复制 .env
cp backend/.env.example backend/.env
vim backend/.env   # 修改密码/密钥

# 启动
docker compose up -d
# 跑迁移
docker compose run --rm backend npx prisma migrate deploy
```

## 后续部署（自动）

只需：
- `git push origin main` → 触发 workflow
- 或 `git push origin v2.1` → 触发 tag workflow

## 健康检查

```bash
# 安装定时任务
crontab -e
# 加一行（每 5 分钟跑一次）
*/5 * * * * /home/deploy/shequn/deploy/scripts/healthcheck.sh

# 查看日志
tail -f /var/log/shequn/health.log
```

## 手动回滚

```bash
ssh deploy@<CVM-IP>
cd /home/deploy/shequn

# 查看历史镜像
docker images shequn-backend

# 回滚到 previous
docker compose down backend
docker tag shequn-backend:previous shequn-backend:latest
docker compose up -d backend
```

## 故障排查

| 现象 | 命令 |
|---|---|
| 后端启动失败 | `docker compose logs --tail=200 backend` |
| 容器状态 | `docker compose ps` |
| 磁盘满 | `du -sh /home/deploy/shequn/* | sort -h` |
| 数据库连不上 | `docker compose exec mysql mysql -uroot -p` |
| Nginx 502 | `sudo nginx -t && sudo tail -f /var/log/nginx/shequn-api.error.log` |
