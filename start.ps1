$ErrorActionPreference = "SilentlyContinue"

Write-Host "Starting servers..." -ForegroundColor Green

$backendJob = Start-Job -ScriptBlock {
    Set-Location "D:\Opencode\Project 1\project 2"
    node server.js
} -Name "Backend"

$frontendJob = Start-Job -ScriptBlock {
    Set-Location "D:\Opencode\Project 1\project 2\frontend"
    npm run dev
} -Name "Frontend"

Write-Host "Backend job started"
Write-Host "Frontend job started"
Write-Host "Check http://localhost:5173"
Write-Host ""
Write-Host "Press Enter to stop servers..."
Read-Host

Stop-Job $backendJob
Stop-Job $frontendJob
Remove-Job $backendJob
Remove-Job $frontendJob
