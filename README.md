MAC Changer Extension + Native Host

This workspace contains a browser extension (unpacked) and a native messaging host that can change a network interface's MAC address.

Files:
- extension/: browser extension (manifest, popup UI)
- native-host/: native host Python script + PowerShell helper + host manifest template

Quick install (Chrome on Windows) — summary:
1. Edit `native-host/com.example.mac_changer.json` and set the `path` to the full path of `native-host\\native_host.py`.
2. Replace `__CHANGE_THIS_EXTENSION_ID__` in that manifest with your extension id (or install unpacked and update manifest accordingly).
3. Register the native host by placing the manifest file path into the registry (example):

   - Registry key (per-user): `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.example.mac_changer` with default value = full path to the manifest JSON.

4. Install the extension unpacked: open `chrome://extensions`, enable developer mode, "Load unpacked" and pick the `extension/` folder.
5. Ensure Python 3 is installed and accessible; for Windows, PowerShell script requires administrative privileges.
6. Open the extension popup, enter interface name and MAC, click "Change MAC".

Notes and security:
- The native host runs locally and needs admin privileges to change system settings. Use at your own risk.
- On Linux/macOS the native host attempts to use `ip`/`ifconfig` commands.
- You must run the PowerShell helper with sufficient privileges; some adapters do not expose a "Network Address" advanced property.
