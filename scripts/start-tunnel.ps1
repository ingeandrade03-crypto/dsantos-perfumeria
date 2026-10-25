$ErrorActionPreference = "SilentlyContinue"
$dir = "C:\Users\Ingea\.gemini\antigravity\scratch\dsantos-store"
Set-Location $dir

# Kill any previous cloudflared or node on port 3000
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Clean old log
$logFile = "$dir\tunnel.log"
if (Test-Path $logFile) { Remove-Item $logFile -Force }

# Start dev server
$serverProc = Start-Process -FilePath "node.exe" -ArgumentList "node_modules/tsx/dist/cli.mjs", "server.ts" -WorkingDirectory $dir -PassThru -WindowStyle Hidden

# Wait for server port 3000 to be open
for ($s = 0; $s -lt 20; $s++) {
    Start-Sleep -Seconds 1
    $conn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($conn) { break }
}

# Start cloudflared tunnel
$tunnelProc = Start-Process -FilePath "$dir\cloudflared.exe" -ArgumentList "tunnel --url http://127.0.0.1:3000" -WorkingDirectory $dir -RedirectStandardError $logFile -PassThru -WindowStyle Hidden

# Find public URL in tunnel log
$url = ""
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $logFile) {
        $content = Get-Content $logFile -Raw -ErrorAction SilentlyContinue
        if ($content -match "(https://[a-zA-Z0-9-]+\.trycloudflare\.com)") {
            $url = $matches[1]
            break
        }
    }
}

if ($url) {
    Set-Content -Path "$dir\public_url.txt" -Value $url -Force
    Write-Output "SUCCESS: $url"
} else {
    Write-Output "FAILED_TO_GET_URL"
    if (Test-Path $logFile) {
        Get-Content $logFile
    }
}
