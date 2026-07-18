Param(
  [Parameter(Mandatory=$true)][string]$InterfaceName,
  [Parameter(Mandatory=$true)][string]$Mac
)
try {
  Set-NetAdapterAdvancedProperty -Name $InterfaceName -DisplayName 'Network Address' -RegistryValue $Mac -ErrorAction Stop
  Disable-NetAdapter -Name $InterfaceName -Confirm:$false -ErrorAction Stop
  Start-Sleep -Seconds 1
  Enable-NetAdapter -Name $InterfaceName -Confirm:$false -ErrorAction Stop
  Write-Output 'OK'
} catch {
  Write-Error $_.Exception.Message
  exit 1
}
