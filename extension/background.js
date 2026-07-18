const hostName = 'com.example.mac_changer';

function ensureAlarm() {
  // create or reset hourly alarm
  chrome.alarms.create('hourlyMacChange', { periodInMinutes: 60 });
}

chrome.runtime.onInstalled.addListener(() => {
  ensureAlarm();
});

// Ensure alarm exists on startup
ensureAlarm();

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'hourlyMacChange') return;
  // fetch stored iface/mac and send
  chrome.storage.local.get(['iface','mac'], (items) => {
    const iface = items.iface || '';
    const mac = items.mac || '';
    if (!iface || !mac) {
      console.warn('Missing iface or mac in storage; skipping native message');
      return;
    }
    chrome.runtime.sendNativeMessage(hostName, { interface: iface, mac: mac }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Native message error:', chrome.runtime.lastError.message);
      } else {
        console.log('Native message response:', response);
      }
    });
  });
});
