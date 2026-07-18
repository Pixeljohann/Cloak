const hostName = 'com.example.mac_changer';

function sendNow(iface, mac, cb) {
  const status = document.getElementById('status');
  status.textContent = 'Sending...';
  chrome.runtime.sendNativeMessage(hostName, { interface: iface, mac: mac }, (response) => {
    if (chrome.runtime.lastError) {
      status.textContent = 'Error: ' + chrome.runtime.lastError.message;
      if (cb) cb(false, chrome.runtime.lastError.message);
      return;
    }
    const text = response && response.status ? (response.status + (response.output ? ': ' + response.output : '')) : JSON.stringify(response);
    status.textContent = text;
    if (cb) cb(true, text);
  });
}

document.getElementById('changeBtn').addEventListener('click', () => {
  const iface = document.getElementById('iface').value.trim();
  const mac = document.getElementById('mac').value.trim();
  // persist before sending
  chrome.storage.local.set({ iface: iface, mac: mac }, () => {
    sendNow(iface, mac);
  });
});

document.getElementById('saveBtn').addEventListener('click', () => {
  const iface = document.getElementById('iface').value.trim();
  const mac = document.getElementById('mac').value.trim();
  chrome.storage.local.set({ iface: iface, mac: mac }, () => {
    document.getElementById('status').textContent = 'Settings saved.';
  });
});

document.getElementById('randomBtn').addEventListener('click', () => {
  const iface = document.getElementById('iface').value.trim();
  if (!iface) {
    document.getElementById('status').textContent = 'Please enter an interface before randomizing.';
    return;
  }
  // do not persist a random MAC here; just request randomization now
  sendNow(iface, 'random');
});

function updateNext() {
  chrome.alarms.get('hourlyMacChange', (alarm) => {
    const nextEl = document.getElementById('next');
    if (!alarm || !alarm.scheduledTime) {
      nextEl.textContent = '--:--:--';
      return;
    }
    const now = Date.now();
    const diff = Math.max(0, Math.floor((alarm.scheduledTime - now) / 1000));
    const h = String(Math.floor(diff / 3600)).padStart(2,'0');
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2,'0');
    const s = String(diff % 60).padStart(2,'0');
    nextEl.textContent = `${h}:${m}:${s}`;
  });
}

// populate saved values
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['iface','mac','autoRandom'], (items) => {
    if (items.iface) document.getElementById('iface').value = items.iface;
    if (items.mac) document.getElementById('mac').value = items.mac;
    document.getElementById('autoToggle').checked = !!items.autoRandom;
  });
  updateNext();
  setInterval(updateNext, 1000);
});

// toggle handler: create or clear alarm
document.getElementById('autoToggle').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  chrome.storage.local.set({ autoRandom: enabled }, () => {
    document.getElementById('status').textContent = enabled ? 'Hourly randomization enabled' : 'Hourly randomization disabled';
    if (enabled) {
      chrome.alarms.create('hourlyMacChange', { periodInMinutes: 60 });
    } else {
      chrome.alarms.clear('hourlyMacChange');
    }
    updateNext();
  });
});

