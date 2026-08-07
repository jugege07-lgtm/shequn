# 社群名片(shequn) 服务"打不开"排查指南

适用场景：**昨天关机前正常、今天开机后打不开**。本文按"最可能 → 较少见"排序，给出判定方法与修复步骤。

> 架构速记：前端代理 `proxy-server.js` 监听 **80**，把 `/api` 转发到后端 **3001**；后端 NestJS 用 **Prisma + SQLite**（本地文件 `backend/prisma/dev.db`，**无独立数据库进程/端口**）；进程由 **pm2** 管理；开机自启靠 Windows 任务计划 `shequn-autostart` 调 `pm2-boot.ps1` → `pm2 resurrect`（从 `dump.pm2` 恢复）。

---

## 现象一：服务根本没起来（自启未生效 / 启动失败）

**判定**
- 运行 `diagnose.ps1`：若"端口监听"两项都是 `[FAIL]`，且 pm2 里两进程 status 不是 online。
- 检查任务计划：`Get-ScheduledTask -TaskName shequn-autostart` 看 Enabled；`Get-ScheduledTaskInfo ... | Select LastRunTime,LastTaskResult` 看结果码（非 0 = 失败）。
- 看自启日志：`C:\Users\Administrator\.pm2\boot.log`，搜 `resurrect exit=` 与 `fallback`。

**常见原因与修复**
1. **`dump.pm2` 过期**：改代码/改 `.env`/手动 `pm2 delete` 后没 `pm2 save`，重启机器恢复的是旧快照甚至空列表。
   - 修复：先确保当前进程正常 → `pm2 save` 刷新快照 → 重启验证。
2. **`.env` 变动后未 `pm2 save`**：后端环境变量（含 `DATABASE_URL`）来自 `pm2 save` 时 captured 的值；改了 `backend/.env` 却没 save，自启进程用陈旧 env，可能连不上库。
   - 修复：`pm2 restart shequn-backend --update-env` 后立刻 `pm2 save`。
3. **任务计划被禁用/删除**：`Settings.Enabled=False` 或任务不存在。
   - 修复：重新创建任务（BootTrigger + SYSTEM + 最高权限），动作 `powershell -NoProfile -ExecutionPolicy Bypass -File C:\code\shequn\pm2-boot.ps1`；或重跑 `pm2-boot.ps1` 兜底 `pm2 start ecosystem.config.js`。
4. **路径/运行时变动**：`pm2-boot.ps1` 写死了 Node 与 pm2 的绝对路径，若 WorkBuddy 升级换了 Node 版本目录，路径失效。
   - 修复：更新 `pm2-boot.ps1` 里的 `$nodeHome` 与 `ecosystem.config.js` 里的 `NODE` 路径。

---

## 现象二：端口被占用（起来了但监听失败）

**判定**
- 80 端口：`netstat -ano | findstr ":80"` 看占用 PID 是不是预期的 node；常见凶手是 **IIS(W3SVC)**。
- 3001 端口：看是否被另一个 node/旧实例占用。
- 后端日志若含 `EADDRINUSE` 即端口冲突。

**修复**
- 80 被 IIS 占：`Get-Service W3SVC`；`Stop-Service W3SVC; Set-Service W3SVC -StartupType Disabled`，再 `pm2 restart shequn-frontend`。
- 3001 被旧实例占：`pm2 delete shequn-backend` 后 `pm2 start ecosystem.config.js` 对应项。
- 通用：换端口需在 `proxy-server.js`(PORT) 与 `main.ts`(PORT) 同时改动并重建。

---

## 现象三：环境变量 / 配置文件变动

**判定**
- 后端能起但接口 500 / 连库报错：多半是 `DATABASE_URL` 或密钥在自启时未被正确加载。
- 对比 `pm2 env 0`（backend 的环境）与 `backend/.env` 当前内容是否一致。

**修复**
- 统一规则：**改 `.env` 或 `ecosystem.config.js` 的 env 后，必须 `pm2 restart shequn-backend --update-env` 并 `pm2 save`**。
- 不要在 `ecosystem.config.js` 里只写 `NODE_ENV` 而指望自动读 `.env`——`resurrect` 恢复的是快照里的 env，不会实时重读 `.env`。

---

## 现象四：代码改了但没重新构建

**判定**
- 改了 `backend/src/**` 却跑旧逻辑、或改了 `admin`/`mobile` 前端却页面没变。
- `dist/` 目录修改时间远早于源码。

**修复**
- 后端：`cd C:\code\shequn\backend` → `npx tsc -p tsconfig.json`（或 `node ./node_modules/typescript/lib/tsc.js -p ./tsconfig.json`）→ `pm2 restart shequn-backend --update-env`。
- 前端：`cd admin && npm run build`；`cd mobile && npm run build`。代理无状态、每次读盘，**无需重启前端**，新 dist 即时生效。
- 构建后务必 `pm2 save`（尤其改了启动方式/入口时）。

---

## 现象五：防火墙 / 网络 / 运营商问题

**判定**
- 本机 `curl http://127.0.0.1:80/admin/` 正常，但外部 `http://<公网IP>/admin` 打不开 → 网络层问题，不是服务问题。
- 本项目**公网 80 端口被运营商封禁**（用户侧联通网络连不通），属已知限制。

**修复**
- 本机服务正常即可，公网访问需换**高位端口**（如 8080/9000）或完成**ICP 备案**后放通 80。
- 若临时验证：`proxy-server.js` 改 `PORT` 为高位端口 + 重建，再用 `http://<公网IP>:<端口>/admin` 访问。
- Windows 防火墙：确认入站规则允许对应端口（本机回环 127.0.0.1 不受防火墙限制）。
- 服务器重启后**公网 IP 可能变化**（非固定 IP 实例）：用 `curl ip.sb` 或控制台确认新 IP。

---

## 现象六：数据库文件问题（SQLite）

**判定**
- 后端进程 online 但所有接口 500，日志出现 SQLite 相关错误（`no such table`、`database disk image is malformed`）。
- `diagnose.ps1` 第 4 节显示 dev.db 不存在。

**修复**
- 文件丢失：`cd backend && npx prisma migrate deploy`（或 `prisma db push`）重建库与表，再 `pm2 restart shequn-backend --update-env`。
- 文件损坏：用备份 `dev.db` 覆盖；无备份则需从迁移脚本重建（生产环境建议尽快迁移到 PostgreSQL/MySQL，见 `schema.prisma` 顶部说明）。

---

## 一键定位流程（推荐顺序）

1. 跑 `diagnose.ps1` —— 一眼看出哪层 FAIL。
2. 端口 FAIL → 查 `netstat` 占用 / IIS / boot.log。
3. pm2 FAIL → `pm2 logs <name>` 看具体报错；多半是 env 或构建问题。
4. 本机 200、外部打不开 → 网络/运营商/防火墙（现象五）。
5. 接口 500 → 看后端日志 + 数据库（现象三/六）。
6. 修完无论改了什么，**最后一步一定 `pm2 save`**，否则下次开机又回到旧状态。

---

## 常用命令速查

```powershell
# 健康检查
powershell -NoProfile -ExecutionPolicy Bypass -File C:\code\shequn\diagnose.ps1

# 手动启动 / 重启
$env:PM2_HOME='C:\Users\Administrator\.pm2'
$node='C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node.exe'
& $node 'C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node_modules\pm2\bin\pm2' start C:\code\shequn\ecosystem.config.js
& $node '...\pm2\bin\pm2' restart shequn-backend --update-env
& $node '...\pm2\bin\pm2' restart shequn-frontend
& $node '...\pm2\bin\pm2' save        # 关键：刷新开机自启快照

# 端口占用排查
netstat -ano | findstr ":80 :3001"
Get-Service W3SVC            # IIS 是否占用 80

# 自启任务
Get-ScheduledTask -TaskName shequn-autostart
Get-ScheduledTaskInfo -TaskName shequn-autostart | Select LastRunTime,LastTaskResult
```
