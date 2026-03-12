$ServiceName = "ImproBridgeService"
$ExePath = (Resolve-Path ".\bin\Release\net8.0\win-x64\publish\ImproBridgeAPI.exe").Path

if (!(Test-Path $ExePath)) {
    Write-Host "Executable not found. Please run 'dotnet publish -c Release -r win-x64 --self-contained' first." -ForegroundColor Red
    exit
}

Write-Host "Installing Windows Service: $ServiceName" -ForegroundColor Cyan

# Stop service if it already exists
if (Get-Service $ServiceName -ErrorAction SilentlyContinue) {
    Stop-Service $ServiceName -Force
    sc.exe delete $ServiceName
    Start-Sleep -Seconds 2
}

# Create new service
sc.exe create $ServiceName binPath= $ExePath start= auto
sc.exe failure $ServiceName reset= 0 actions= restart/60000/restart/60000/restart/60000
sc.exe description $ServiceName "Impro Hardware Bridge API connecting local Impro systems to Supabase."

# Start service
Start-Service $ServiceName

Write-Host "Service $ServiceName installed and started successfully!" -ForegroundColor Green
