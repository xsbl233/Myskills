$ErrorActionPreference = 'Stop'

$source = 'C:\Users\Admin\.codex\skills'
$destination = 'D:\code\skills'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = "C:\Users\Admin\.codex\skills.backup-$timestamp"

if (-not (Test-Path -LiteralPath $source -PathType Container)) {
    throw "Codex skills directory not found: $source"
}

if (-not (Test-Path -LiteralPath $destination -PathType Container)) {
    throw "Destination directory not found: $destination"
}

$sourceItem = Get-Item -Force -LiteralPath $source
if ($sourceItem.LinkType -eq 'Junction') {
    Write-Output "Already relocated: $source -> $($sourceItem.Target)"
    exit 0
}

# Merge any changes made since the initial copy before switching the path.
& robocopy.exe $source $destination /E /COPY:DAT /DCOPY:DAT /R:2 /W:1 /NFL /NDL /NJH /NJS /NP
$robocopyExitCode = $LASTEXITCODE
if ($robocopyExitCode -ge 8) {
    throw "Robocopy failed with exit code $robocopyExitCode"
}

Rename-Item -LiteralPath $source -NewName (Split-Path -Leaf $backup)

try {
    New-Item -ItemType Junction -Path $source -Target $destination -ErrorAction Stop | Out-Null
}
catch {
    Rename-Item -LiteralPath $backup -NewName 'skills'
    throw
}

$junction = Get-Item -Force -LiteralPath $source
Write-Output "Relocated Codex skills: $($junction.FullName) -> $($junction.Target)"
Write-Output "Original directory retained at: $backup"
