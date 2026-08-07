# diagnose.ps1 - 社群名片(shequn) 服务健康检查脚本
# 用途：一键检查 前端代理(80) / 后端API(3001) / pm2进程 / 开机自启任务 / SQLite数据库 / 关键HTTP接口
# 用法：powershell -NoProfile -ExecutionPolicy Bypass -File diagnose.ps1
# 环境：Windows Server（pm2 装在 WorkBuddy 托管的 Node 运行时内）
# 注意：保存为 UTF-8 with BOM，否则中文在非 Unicode 控制台会被乱码解析

$ErrorActionPreference = 'Continue'
$ProgressPreference    = 'SilentlyContinue'   # 关闭 Invoke-WebRequest 进度流，输出更干净

# ---------------- 配置 ----------------
$nodeHome     = 'C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2'
$node         = Join-Path $nodeHome 'node.exe'
$pm2          = Join-Path $nodeHome 'node_modules\pm2\bin\pm2'
$env:PM2_HOME = 'C:\Users\Administrator\.pm2'   # 必须，否则 pm2 找不到运行时数据

$BackendPort  = 3001
$FrontendPort = 80
$TaskName     = 'shequn-autostart'

$ProbeUrls = @(
  [PSCustomObject]@{ Name='前端-管理端 /admin';     Url="http://127.0.0.1:$FrontendPort/admin/" }
  [PSCustomObject]@{ Name='前端-移动端 /mobile';    Url="http://127.0.0.1:$FrontendPort/mobile/" }
  [PSCustomObject]@{ Name='后端-API文档 /api/docs'; Url="http://127.0.0.1:$BackendPort/api/docs" }
  [PSCustomObject]@{ Name='代理-API文档 /api/docs'; Url="http://127.0.0.1:$FrontendPort/api/docs" }
  [PSCustomObject]@{ Name='业务接口-商品分类';      Url="http://127.0.0.1:$FrontendPort/api/public/product-categories" }
)

# SQLite 文件可能所在的路径（Prisma file:./dev.db 相对 schema 目录或 cwd）
$SqliteCandidates = @(
  'C:\code\shequn\backend\prisma\dev.db'
  'C:\code\shequn\backend\dev.db'
)

# ---------------- 输出助手 ----------------
function Write-Status($text, $state) {
  $color = switch ($state) { 'OK'{'Green'}; 'WARN'{'Yellow'}; 'FAIL'{'Red'}; default{'White'} }
  $tag   = switch ($state) { 'OK'{'[PASS]'}; 'WARN'{'[WARN]'}; 'FAIL'{'[FAIL]'}; default{'[INFO]'} }
  Write-Host ('{0,-7} {1}' -f $tag, $text) -ForegroundColor $color
}
function Write-Section($t) { Write-Host "`n================ $t ================" -ForegroundColor Cyan }

# ---------------- 1. 端口监听与进程 ----------------
function Get-Listener($port) {
  try {
    $conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -eq $port }
    if (-not $conns) { return $null }
    $pids  = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    $procs = $pids | ForEach-Object { Get-CimInstance Win32_Process -Filter "ProcessId=$_" -ErrorAction SilentlyContinue } | Where-Object { $_ }
    return @{ Pids=$pids; Procs=$procs }
  } catch { return $null }
}

Write-Section '1. 端口监听与进程信息'
foreach ($p in @($FrontendPort, $BackendPort)) {
  $svc   = if ($p -eq $FrontendPort) { '前端代理(proxy-server.js)' } else { '后端API(NestJS)' }
  $info  = Get-Listener $p
  if ($info) {
    Write-Status "$svc : 端口 $p 正在监听 (PID: $($info.Pids -join ','))" 'OK'
    foreach ($pr in $info.Procs) {
      $cmd = ($pr.CommandLine -replace '\s+', ' ').Trim()
      if ($cmd.Length -gt 170) { $cmd = $cmd.Substring(0,170) + '...' }
      Write-Host ("        进程 {0} ({1}): {2}" -f $pr.ProcessId, $pr.Name, $cmd)
    }
  } else {
    Write-Status "$svc : 端口 $p 无监听！服务未启动 / 启动失败 / 被占用" 'FAIL'
  }
}

# ---------------- 2. pm2 进程状态 ----------------
# 说明：
#  - PowerShell 的 ConvertFrom-Json 解析不了 pm2 jlist 的超长 JSON；
#  - 两个原生命令用管道传输时，PowerShell 会重编码 UTF-8（jlist 含中文）导致 JSON 损坏。
# 故改为：单个 node 进程用 child_process.execSync 直接捕获 pm2 jlist 原始输出并 JSON.parse；
#         node/pm2 路径经环境变量传入，规避反斜杠转义问题。
Write-Section '2. pm2 进程状态'
$env:SHEQUN_NODE = $node
$env:SHEQUN_PM2  = $pm2
$jsParse = "const cp=require('child_process');const out=cp.execSync(process.env.SHEQUN_NODE+' '+process.env.SHEQUN_PM2+' jlist',{encoding:'utf8',maxBuffer:64*1024*1024});try{const a=JSON.parse(out);a.forEach(x=>console.log(x.name+'|'+x.pm2_env.status+'|'+x.pm2_env.restart_time+'|'+x.pid))}catch(e){console.log('PARSE_ERR')}"
$tmpJs = Join-Path $PSScriptRoot 'shequn-pm2-parse.js'
[System.IO.File]::WriteAllText($tmpJs, $jsParse, [System.Text.UTF8Encoding]::new($false))
try {
  $lines = & $node $tmpJs 2>&1
} catch { $lines = $null }
Remove-Item $tmpJs -ErrorAction SilentlyContinue

if ($lines -and $lines -notmatch 'PARSE_ERR') {
  foreach ($name in @('shequn-backend','shequn-frontend')) {
    $hit = $lines | Where-Object { $_ -like "$name|*" }
    if ($hit) {
      $parts = $hit.Split('|')
      $st    = $parts[1]
      $state = if ($st -eq 'online') { 'OK' } else { 'FAIL' }
      Write-Status "$name : status=$st, restart=$($parts[2]), pid=$($parts[3])" $state
    } else {
      Write-Status "$name : 未在 pm2 注册（dump.pm2 过期或未 pm2 start）" 'FAIL'
    }
  }
} else {
  Write-Status '无法调用 pm2 或解析失败（检查 nodeHome / PM2_HOME）' 'WARN'
}

# ---------------- 3. 开机自启任务计划 ----------------
Write-Section '3. 开机自启任务计划'
$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($task) {
  $info    = Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction SilentlyContinue
  $enabled = $task.Settings.Enabled
  $state   = $task.State
  Write-Status "任务 '$TaskName' : Enabled=$enabled, State=$state" $(if($enabled -and $state -eq 'Ready'){'OK'}else{'WARN'})
  if ($info) {
    Write-Host ("        上次运行: {0} | 结果码: {1} | 下次: {2}" -f $info.LastRunTime, $info.LastTaskResult, $info.NextRunTime)
    if ($info.LastTaskResult -ne 0) { Write-Status '        上次运行返回非0 -> 自启曾失败，见 C:\Users\Administrator\.pm2\boot.log' 'FAIL' }
  }
  $trig = ($task.Triggers | ForEach-Object { $_.GetType().Name }) -join ','
  $act  = ($task.Actions | ForEach-Object { "$($_.Execute) $($_.Arguments)" }) -join ' '
  Write-Host ("        触发器: $trig")
  Write-Host ("        动作:   $act")
} else {
  Write-Status "任务 '$TaskName' 不存在 -> 未配置开机自启" 'FAIL'
}

# ---------------- 4. 数据库(SQLite 文件) ----------------
Write-Section '4. 数据库(SQLite 文件)'
$dbFound = $false
foreach ($c in $SqliteCandidates) {
  if (Test-Path $c) {
    $sz = (Get-Item $c).Length
    Write-Status "SQLite 文件存在: $c (大小 $sz 字节)" 'OK'
    $dbFound = $true
  }
}
if (-not $dbFound) { Write-Status '未找到 dev.db（后端会因数据库缺失而启动失败）' 'FAIL' }

# ---------------- 5. HTTP 接口探活 ----------------
Write-Section '5. HTTP 接口探活'
foreach ($u in $ProbeUrls) {
  try {
    $r    = Invoke-WebRequest -Uri $u.Url -UseBasicParsing -TimeoutSec 5 -Method Get -ErrorAction Stop
    $code = [int]$r.StatusCode
    $state = if ($code -ge 200 -and $code -lt 400) { 'OK' } else { 'WARN' }
    Write-Status "$($u.Name) -> HTTP $code" $state
  } catch {
    Write-Status "$($u.Name) -> 失败: $($_.Exception.Message)" 'FAIL'
  }
}

# ---------------- 6. 汇总 ----------------
Write-Section '6. 结论与下一步'
Write-Host '检查完成。任一 [FAIL] 项请对照 SERVICE-TROUBLESHOOTING.md 的排查步骤处理。' -ForegroundColor White
Write-Host '快速修复：先 pm2 save 刷新自启快照；必要时 pm2 restart shequn-backend --update-env 与 pm2 restart shequn-frontend。' -ForegroundColor White
