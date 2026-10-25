Add-Type -AssemblyName System.IO.Compression.FileSystem
$dest = "C:\Users\Ingea\.gemini\antigravity\scratch\dsantos-perfumeria-render.zip"
$srcDir = "C:\Users\Ingea\.gemini\antigravity\scratch\dsantos-store"

if (Test-Path $dest) { Remove-Item $dest -Force }

$zip = [System.IO.Compression.ZipFile]::Open($dest, [System.IO.Compression.ZipArchiveMode]::Create)

Get-ChildItem -Path $srcDir -Recurse | Where-Object {
    $_.FullName -notmatch '\\node_modules(\\|$)' -and
    $_.FullName -notmatch '\\dist(\\|$)' -and
    $_.FullName -notmatch '\\\.git(\\|$)' -and
    $_.Name -ne 'cloudflared.exe' -and
    $_.Name -notmatch '\.log$' -and
    $_.Name -ne 'public_url.txt' -and
    -not $_.PSIsContainer
} | ForEach-Object {
    $rel = $_.FullName.Substring($srcDir.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel)
}

$zip.Dispose()
$len = (Get-Item $dest).Length
Write-Output "Zip created: $dest ($len bytes)"
