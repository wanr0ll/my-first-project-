param(
    [string]$XamppPath = 'C:\\xampp'
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = Join-Path -Path $XamppPath -ChildPath "backup_configs_$timestamp"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null

$httpd = Join-Path $XamppPath 'apache\\conf\\httpd.conf'
$phpini = Join-Path $XamppPath 'php\\php.ini'

function Backup-File($path, $backupDir){
    if (Test-Path $path){
        Copy-Item -Path $path -Destination $backupDir -Force
        Write-Output "Backed up: $path -> $backupDir"
    } else {
        Write-Output "Not found: $path"
    }
}

Backup-File $httpd $backupDir
Backup-File $phpini $backupDir

# Patch httpd.conf: set ServerSignature Off and ServerTokens Prod
if (Test-Path $httpd){
    $content = Get-Content $httpd -Raw
    if ($content -match '(?m)^\s*ServerSignature'){
        $content = $content -replace '(?m)^\s*ServerSignature.*', 'ServerSignature Off'
    } else {
        $content += "`r`nServerSignature Off`r`n"
    }
    if ($content -match '(?m)^\s*ServerTokens'){
        $content = $content -replace '(?m)^\s*ServerTokens.*', 'ServerTokens Prod'
    } else {
        $content += "ServerTokens Prod`r`n"
    }
    Set-Content -Path $httpd -Value $content -Encoding UTF8
    Write-Output "Patched httpd.conf"
}

# Patch php.ini: set expose_php = Off
if (Test-Path $phpini){
    $content = Get-Content $phpini -Raw
    if ($content -match '(?m)^\s*;?\s*expose_php\s*='){
        $content = $content -replace '(?m)^\s*;?\s*expose_php\s*=.*', 'expose_php = Off'
    } else {
        $content += "`r`nexpose_php = Off`r`n"
    }
    Set-Content -Path $phpini -Value $content -Encoding UTF8
    Write-Output "Patched php.ini"
}

Write-Output "Done. Please restart Apache (use XAMPP Control Panel) to apply changes."