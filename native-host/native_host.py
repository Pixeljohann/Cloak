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

def resolve_ps_script_path():
    candidate_dirs = []
    if getattr(sys, 'frozen', False):
        candidate_dirs.extend([
            os.path.dirname(sys.executable),
            os.path.dirname(os.path.dirname(sys.executable)),
            getattr(sys, '_MEIPASS', ''),
        ])

    script_dir = os.path.dirname(os.path.realpath(__file__))
    candidate_dirs.extend([script_dir, os.path.dirname(script_dir)])

    for base_dir in candidate_dirs:
        if not base_dir:
            continue
        candidate = os.path.join(base_dir, 'change-mac.ps1')
        if os.path.exists(candidate):
            return candidate

    return None


def change_mac_windows(iface, mac):
    ps = resolve_ps_script_path()
    if not ps:
        return {"status": "error", "output": "change-mac.ps1 not found"}
    # For Windows registry value, pass MAC without separators
    mac_nosep = ''.join(c for c in mac if c.isalnum())
    cmd = ['powershell', '-ExecutionPolicy', 'Bypass', '-File', ps, '-InterfaceName', iface, '-Mac', mac_nosep]
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
            # If mac is missing or set to 'random', generate a random locally-administered unicast MAC
            if not mac or (isinstance(mac, str) and mac.lower() in ('random','rand','auto')):
                import random
                # generate 6 random bytes
                b = [random.randrange(0, 256) for _ in range(6)]
                # set locally administered bit and clear multicast bit on first byte
                b[0] = (b[0] & 0b11111100) | 0b00000010
                mac_colon = ':'.join('{:02x}'.format(x) for x in b)
                mac = mac_colon
            if not iface or not mac:
                send_message({"status": "error", "output": "missing interface or mac"})
                continue
            system = platform.system()
            if system == 'Windows':
                # For Windows pass mac without separators
                res = change_mac_windows(iface, mac)
            else:
                res = change_mac_unix(iface, mac)
            # include the effective MAC used in the response
            if isinstance(res, dict):
                res.setdefault('used_mac', mac)
            send_message(res)
        except Exception:
            send_message({"status": "error", "output": traceback.format_exc()})
            break

if __name__ == '__main__':
    main()
