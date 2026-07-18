# MAC Changer Extension + Native Host

This workspace contains a browser extension and a native messaging host that can change a network interface's MAC address on supported Windows systems.

## Project layout
- extension/: the browser extension (manifest, popup UI, background logic)
- native-host/: the Windows native host, PowerShell helper, and host manifest

## Current setup
The native host now uses a Node.js-based entrypoint for Windows. The host is launched through a wrapper script and communicates with the extension over the standard native messaging protocol.

## Required dependencies
- Node.js 16+ (required for the primary host)
- PowerShell 5+ (required on Windows)
- Optional: Python 3 (kept only as a fallback/reference implementation)

## Windows setup
1. Install Node.js and make sure it is available in PATH.
2. Open the manifest at native-host/com.example.mac_changer.json and update:
   - the path to the wrapper script native-host/native_host.cmd
   - the allowed origin to your extension ID
3. Replace YOUR_EXTENSION_ID in the manifest with your real extension ID.
4. Register the native host in the registry for Chrome or Edge.
5. Load the unpacked extension from the extension/ folder in your browser.
6. Open the popup, enter the interface name and a MAC address, then click Change MAC.

## Registering the native host
Use the helper script or create the registry entry manually.

### PowerShell helper
```powershell
powershell -ExecutionPolicy Bypass -File .\native-host\update_native_host_manifest.ps1 -ExtensionId YOUR_EXTENSION_ID
```

### Registry example
```powershell
reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\com.example.mac_changer" /ve /d "C:\path\to\your\workspace\native-host\com.example.mac_changer.json" /f
```

For Edge, replace the registry path with:
```powershell
reg add "HKCU\Software\Microsoft\Edge\NativeMessagingHosts\com.example.mac_changer" /ve /d "C:\path\to\your\workspace\native-host\com.example.mac_changer.json" /f
```

## Notes
- The host runs locally and may require elevated privileges to change system networking settings.
- Some adapters do not expose the properties needed for MAC spoofing, so the operation may fail even when the host is configured correctly.
- The extension still supports randomization features, including hourly random MAC changes when enabled from the popup.
