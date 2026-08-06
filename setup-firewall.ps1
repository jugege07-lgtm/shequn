# 社群项目 Windows 防火墙配置脚本
# 以管理员身份运行 PowerShell 后执行此脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  配置 Windows 防火墙规则" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 允许 HTTP (端口 80)
New-NetFirewallRule -DisplayName "Shequn HTTP (Port 80)" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 80 `
    -Action Allow `
    -Profile Any `
    -Description "Allow inbound HTTP traffic for Shequn project"

# 允许后端 API (端口 3001)
New-NetFirewallRule -DisplayName "Shequn API (Port 3001)" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 3001 `
    -Action Allow `
    -Profile Any `
    -Description "Allow inbound API traffic for Shequn backend"

Write-Host ""
Write-Host "防火墙规则已添加！" -ForegroundColor Green
Write-Host ""
Write-Host "当前入站规则:" -ForegroundColor Yellow
Get-NetFirewallRule | Where-Object { $_.DisplayName -like "Shequn*" } | Format-Table DisplayName, Enabled, Direction, Action -AutoSize
