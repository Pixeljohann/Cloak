#!/usr/bin/env node
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function readMessage(stream) {
  return new Promise((resolve, reject) => {
    let buffer = Buffer.alloc(0);
    let expectedLength = null;

    const onError = (err) => {
      stream.off('data', onData);
      stream.off('error', onError);
      reject(err);
    };

    const onData = (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      while (true) {
        if (expectedLength === null) {
          if (buffer.length < 4) {
            return;
          }
          expectedLength = buffer.readUInt32LE(0);
          buffer = buffer.subarray(4);
        }

        if (buffer.length < expectedLength) {
          return;
        }

        const body = buffer.subarray(0, expectedLength).toString('utf8');
        buffer = buffer.subarray(expectedLength);
        expectedLength = null;
        stream.off('data', onData);
        stream.off('error', onError);
        resolve(JSON.parse(body));
        return;
      }
    };

    stream.on('data', onData);
    stream.on('error', onError);
  });
}

function writeMessage(stream, message) {
  const body = Buffer.from(JSON.stringify(message), 'utf8');
  const header = Buffer.alloc(4);
  header.writeUInt32LE(body.length, 0);
  stream.write(header);
  stream.write(body);
}

function resolvePowerShellScriptPath() {
  const candidates = [
    path.join(__dirname, 'change-mac.ps1'),
    path.join(process.cwd(), 'native-host', 'change-mac.ps1'),
    path.join(process.cwd(), 'change-mac.ps1')
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function changeMacWindows(iface, mac) {
  const ps = resolvePowerShellScriptPath();
  if (!ps) {
    return { status: 'error', output: 'change-mac.ps1 not found' };
  }
  const macNoSep = mac.replace(/[^a-zA-Z0-9]/g, '');
  const child = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', ps, '-InterfaceName', iface, '-Mac', macNoSep], {
    stdio: ['pipe', 'pipe', 'pipe']
  });
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ status: 'ok', output: stdout.trim() });
      } else {
        resolve({ status: 'error', output: (stdout + stderr).trim() });
      }
    });
  });
}

async function main() {
  const stdin = process.stdin;
  const stdout = process.stdout;
  while (true) {
    const msg = await readMessage(stdin);
    if (!msg) break;
    const iface = msg.interface || msg.iface;
    let mac = msg.mac;
    if (!mac || ['random', 'rand', 'auto'].includes(String(mac).toLowerCase())) {
      const b = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256));
      b[0] = (b[0] & 0b11111100) | 0b00000010;
      mac = b.map((x) => x.toString(16).padStart(2, '0')).join(':');
    }
    if (!iface || !mac) {
      writeMessage(stdout, { status: 'error', output: 'missing interface or mac' });
      continue;
    }
    let res = process.platform === 'win32' ? await changeMacWindows(iface, mac) : { status: 'ok', output: 'not implemented on this platform' };
    if (res && res.status === 'error') {
      res = {
        status: 'warning',
        output: 'The selected adapter does not support changing the MAC address on this Windows setup. ' + (res.output || '')
      };
    }
    writeMessage(stdout, { ...res, used_mac: mac });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
