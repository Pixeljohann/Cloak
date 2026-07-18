param(
  [Parameter(Mandatory = $true)]
  [string]$ExtensionId
)

$manifestPath = Join-Path $PSScriptRoot 'com.example.mac_changer.json'
if (-not (Test-Path $manifestPath)) {
  throw "Native messaging manifest not found at $manifestPath"
}

$extensionOrigin = "chrome-extension://$ExtensionId/"
$content = Get-Content -Raw -Path $manifestPath
$content = $content -replace '"chrome-extension://[^"/]+/"', '"' + $extensionOrigin + '"'

try {
  $manifest = $content | ConvertFrom-Json
} catch {
  throw "The manifest is not valid JSON: $($_.Exception.Message)"
}

$manifest.allowed_origins = @($extensionOrigin)
$manifest | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 $manifestPath

Write-Host "Updated native messaging host manifest: $manifestPath"
Write-Host "Allowed origin set to $extensionOrigin"
