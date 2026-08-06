# shequn boot script - restores pm2 managed processes at system startup
# Called by Windows Scheduled Task "shequn-autostart" running as SYSTEM
# Restart policy (crash auto-restart) is defined in the pm2 dump (pm2 save).

$ErrorActionPreference = 'Continue'

$env:PM2_HOME = 'C:\Users\Administrator\.pm2'
$nodeHome = 'C:\Users\Administrator\.workbuddy\binaries\node\versions\22.22.2'
$node = Join-Path $nodeHome 'node.exe'
$pm2  = Join-Path $nodeHome 'node_modules\pm2\bin\pm2'
$bootLog = Join-Path $env:PM2_HOME 'boot.log'

function Log($msg) {
    $line = "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $msg"
    Add-Content -Path $bootLog -Value $line
    Write-Host $line
}

Log "shequn boot start"

try {
    & $node $pm2 resurrect
    $rc = $LASTEXITCODE
    Log "resurrect exit=$rc"
    if ($rc -ne 0) {
        Log "fallback: start via ecosystem.config.js"
        & $node $pm2 start 'C:\code\shequn\ecosystem.config.js'
        Log "ecosystem start exit=$LASTEXITCODE"
    }
} catch {
    Log "ERROR: $_"
}

Log "shequn boot done"
