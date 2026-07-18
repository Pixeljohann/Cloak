# Native host notes

This folder now uses a Windows-friendly native messaging host that runs through Node.js.

## Current setup
- The manifest points to [native-host/native_host.cmd](native-host/native_host.cmd), which launches [native-host/native_host.cjs](native-host/native_host.cjs).
- The host speaks the standard Chrome native messaging protocol over stdin/stdout.
- The PowerShell helper script [native-host/change-mac.ps1](native-host/change-mac.ps1) is called when the selected adapter supports MAC changes.

## Requirements
- Node.js must be installed and available on the machine.
- PowerShell must be available on Windows.
- The manifest must allow your extension origin, which you can set with the helper script below.

## Host files
- [native-host/native_host.cjs](native-host/native_host.cjs) — Node.js native messaging host
- [native-host/native_host.cmd](native-host/native_host.cmd) — Windows wrapper that launches the Node host
- [native-host/change-mac.ps1](native-host/change-mac.ps1) — Windows helper for adapter MAC changes
- [native-host/native_host.py](native-host/native_host.py) — Python fallback kept for reference/testing

## Update the extension origin
Chrome will reject the host unless the allowed origin in [native-host/com.example.mac_changer.json](native-host/com.example.mac_changer.json) matches your real extension ID.

Run this from PowerShell to update it automatically:

```powershell
powershell -ExecutionPolicy Bypass -File .\native-host\update_native_host_manifest.ps1 -ExtensionId YOUR_EXTENSION_ID
```

## Re-register the host
If the manifest changes, re-register the host with:

```powershell
reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.example.mac_changer" /ve /d "C:\Users\Johann\Downloads\New folder (10)\native-host\com.example.mac_changer.json" /f
```

If you use Edge, replace the registry path with:

```powershell
reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.example.mac_changer" /ve /d "C:\Users\Johann\Downloads\New folder (10)\native-host\com.example.mac_changer.json" /f
```

## Optional packaging
If you later want a true executable, you can package the Node host with a tool such as pkg or nexe, but the current setup does not require that.
