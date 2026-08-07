# 社群名片（shequn）服务健康检查与开机自启排查报告
生成时间：2026-08-07 08:47 (GMT+8)  检查人：熊二

## 一、运行环境判断依据
- **操作系统**：Windows Server（内核 `10.0.20348`，MINGW64_NT 系）。依据：开机自启用 **Windows 任务计划**（BootTrigger + SYSTEM）；`pm2-boot.ps1` 用 PowerShell 调用；进程以 `Services` 会话运行。
- **进程管理**：pm2（安装在 WorkBuddy 托管 Node 运行时 `C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node_modules\pm2`）。Git Bash 默认 PATH 无 `pm2`，需用完整路径调用，且必须 `export PM2_HOME=C:\Users\Administrator\.pm2`。
- **部署形态**：后端 NestJS（`backend/dist/main.js`）监听 3001；前端 Node 代理 `proxy-server.js` 监听 80，把 `/api` 转发到 `127.0.0.1:3001`，并托管 `/admin`（admin/dist）与 `/mobile`（mobile/dist）。

## 二、启动命令、监听端口与访问地址
> 当前两个服务**已在运行**（今日 08:40 由开机自启拉起），状态 online、uptime 7m、重启 0 次。下方为规范启动命令（如需手动启动/重启时使用）。

### 后端 shequn-backend
- 启动命令（pm2 完整路径）：
  ```
  set PM2_HOME=C:\Users\Administrator\.pm2
  C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node.exe ^
    C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2\node_modules\pm2\bin\pm2 ^
    start C:\code\shequn\ecosystem.config.js
  ```
  或直接：`pm2 start C:\code\shequn\backend\dist\main.js --name shequn-backend`（NODE_ENV=production）
- 监听端口：**3001**
- 访问地址（本机）：`http://127.0.0.1:3001` ｜ Swagger：`http://127.0.0.1:3001/api/docs`

### 前端 shequn-frontend（反向代理）
- 启动命令：`pm2 start C:\code\shequn\proxy-server.js --name shequn-frontend`
- 监听端口：**80**
- 访问地址（本机）：`http://127.0.0.1/admin/`（管理端）｜ `http://127.0.0.1/mobile/`（移动端）｜ API 基址 `http://127.0.0.1/api/`
- 公网访问：`http://121.43.141.147/admin`、`/mobile`、`/api/...`
  - ⚠️ 注意：运营商对**用户侧网络封禁了 80 端口**（记忆已记录），用户客户端经公网 80 可能连不通，需改用高位端口或 ICP 备案。服务本身在服务器本机 80 监听正常。

## 三、健康检查结果
| 检查项 | 结果 |
|---|---|
| 进程存活 | ✅ backend(pid 5880) / frontend(pid 3472) 均 `online`，重启 0 次 |
| 端口监听 | ✅ `0.0.0.0:80`(3472)、`0.0.0.0:3001`(5880) 均 LISTENING |
| 后端响应 | ✅ `GET /api/docs` → 200（直连 3001 与经代理 80 均 200） |
| 前端托管 | ✅ `GET /admin/` → 200、`GET /mobile/` → 200 |
| 业务接口(DB) | ✅ `GET /api/public/product-categories`（经代理）→ 200 |
| 启动日志报错 | ✅ 无 `FATAL/Unhandled/EADDRINUSE/ECONNREFUSED/TypeError`；仅 `GET /` 返回 404（NestJS 无根路由，属正常） |

**结论：后端与前端均正常运行，API 全链路（proxy→backend→DB）畅通，无报错/警告。**

## 四、开机自启排查
- **是否已配置**：✅ 已配置。Windows 任务计划 `shequn-autostart`。
- **启用状态**：State=Ready、Enabled=True。
- **运行身份/触发**：Principal=`SYSTEM`、RunLevel=Highest、LogonType=ServiceAccount（无需登录即可运行）；Trigger=`BootTrigger`（开机触发，Enabled=True）；Action=`powershell -NoProfile -ExecutionPolicy Bypass -File C:\code\shequn\pm2-boot.ps1`。
- **运行日志**：`C:\Users\Administrator\.pm2\boot.log` 显示 7/21 起历次开机均成功（`resurrect exit=0` → `boot done`）。最近一次 **2026-08-07 08:40:45** 成功。
- **最近执行结果**：`Get-ScheduledTaskInfo` 显示 LastRunTime=2026/8/7 8:40:40，LastTaskResult=**0（成功）**。
- **失败原因**：❌ 当前**不存在**自启失败。服务在今晨开机已被正确拉起并持续在线。

### 潜在风险（不影响当前运行，但需注意）
1. **dump.pm2 时效性**：自启靠 `pm2 resurrect` 恢复 `dump.pm2`（当前文件时间 2026-08-07 00:04）。改代码/改 `.env`/重启进程后**必须 `pm2 save`**，否则自启恢复的是旧进程列表或旧环境变量。
2. **env 来源**：`ecosystem.config.js` 仅给 backend 设 `NODE_ENV=production`，其余环境变量依赖 `pm2 save` 时 captured 进 dump 的值。若之后改了 `backend/.env` 忘记 `pm2 save`，自启进程会用陈旧 env。
3. **80 端口冲突**：代理绑定 80，需确保 IIS(W3SVC) 已禁用，否则开机抢端口会导致代理 `EADDRINUSE` 启动失败。当前无冲突。

## 五、结论与修复/验证方案
### 结论
服务与健康均正常，开机自启已正确配置且今晨成功生效，**目前不存在自启失败**。需要保持的是“改完即 `pm2 save`”的运维纪律。

### 如未来自启异常，修复清单
- 路径/权限：确认 `pm2-boot.ps1` 路径存在、SYSTEM 有读取权限；`PM2_HOME` 指向 `C:\Users\Administrator\.pm2`。
- 依赖未就绪：代理依赖后端 3001，但 `resurrect` 会同时拉起两者；若需严格顺序，可在 boot 脚本里对 backend 做端口探测重试。
- env 缺失：在 `pm2 save` 前确保 `.env` 已就绪；或改造 `pm2-boot.ps1` 显式 `dotenv` 注入。
- 端口占用：开机前禁用 W3SVC（`Get-Service W3SVC` → `Set-Service W3SVC -StartupType Disabled`）。

### 修复后如何验证开机自启生效
1. 先 `pm2 save`（刷新 dump.pm2）。
2. 重启服务器：`shutdown /r /t 0`（生产环境请选低峰期）。
3. 重启后验证：
   - `pm2 list` → 两进程 `online`、uptime 从 0 重新计数；
   - `Get-ScheduledTaskInfo shequn-autostart` → LastTaskResult=0；
   - `tail C:\Users\Administrator\.pm2\boot.log` → 出现新的 `shequn boot done`；
   - `curl http://127.0.0.1/admin/`、`curl http://127.0.0.1:3001/api/docs` → 200。
4. 注意：**不要**手动 `Start-ScheduledTask shequn-autostart` 来“测试”，因为进程已在运行，`resurrect` 会报“已存在”而走兜底，易误判。应以真实重启验证。
