Param(
  [Parameter(Mandatory=$true)][string]$InterfaceName,
  [Parameter(Mandatory=$true)][string]$Mac
)

try {
  $adapter = Get-NetAdapter -Name $InterfaceName -ErrorAction SilentlyContinue
  if (-not $adapter) {
    $adapter = Get-NetAdapter | Where-Object { $_.InterfaceAlias -eq $InterfaceName -or $_.Name -eq $InterfaceName } | Select-Object -First 1
  }

  if (-not $adapter) {
    throw "Adapter '$InterfaceName' was not found"
  }

  $effectiveName = $adapter.Name
  $propertyNames = @('Network Address', 'NetworkAddress', 'Locally Administered Address')

  $setSucceeded = $false
  foreach ($propertyName in $propertyNames) {
    try {
      Set-NetAdapterAdvancedProperty -Name $effectiveName -DisplayName $propertyName -RegistryValue $Mac -ErrorAction Stop | Out-Null
      $setSucceeded = $true
      break
    } catch {
      continue
    }
  }

  if (-not $setSucceeded) {
    throw "Could not set MAC address on adapter '$effectiveName'"
  }

  Disable-NetAdapter -Name $effectiveName -Confirm:$false -ErrorAction Stop | Out-Null
  Start-Sleep -Seconds 1
  Enable-NetAdapter -Name $effectiveName -Confirm:$false -ErrorAction Stop | Out-Null
  Write-Output "OK:$effectiveName"
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
