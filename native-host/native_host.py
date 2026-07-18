#!/usr/bin/env python3
import sys
import struct
import json
import subprocess
import os
import platform
import traceback

def read_message():
    raw_len = sys.stdin.buffer.read(4)
    if not raw_len:
        return None
    msg_len = struct.unpack('<I', raw_len)[0]
    msg = sys.stdin.buffer.read(msg_len).decode('utf-8')
    return json.loads(msg)

def send_message(message):
    encoded = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('<I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()

def change_mac_windows(iface, mac):
    script_dir = os.path.dirname(os.path.realpath(__file__))
    ps = os.path.join(script_dir, 'change-mac.ps1')
    cmd = ['powershell', '-ExecutionPolicy', 'Bypass', '-File', ps, '-InterfaceName', iface, '-Mac', mac]
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return {"status": "ok", "output": proc.stdout.strip()}
    except subprocess.CalledProcessError as e:
        return {"status": "error", "output": (e.stdout or '') + (e.stderr or '')}

def change_mac_unix(iface, mac):
    try:
        if platform.system() == 'Linux':
            subprocess.run(['ip', 'link', 'set', 'dev', iface, 'down'], check=True)
            subprocess.run(['ip', 'link', 'set', 'dev', iface, 'address', mac], check=True)
            subprocess.run(['ip', 'link', 'set', 'dev', iface, 'up'], check=True)
        else:
            subprocess.run(['ifconfig', iface, 'ether', mac], check=True)
        return {"status": "ok", "output": "changed"}
    except Exception as e:
        return {"status": "error", "output": str(e)}

def main():
    while True:
        try:
            msg = read_message()
            if msg is None:
                break
            iface = msg.get('interface') or msg.get('iface')
            mac = msg.get('mac')
            if not iface or not mac:
                send_message({"status": "error", "output": "missing interface or mac"})
                continue
            system = platform.system()
            if system == 'Windows':
                res = change_mac_windows(iface, mac)
            else:
                res = change_mac_unix(iface, mac)
            send_message(res)
        except Exception:
            send_message({"status": "error", "output": traceback.format_exc()})
            break

if __name__ == '__main__':
    main()
