const hostName = 'com.example.mac_changer';

chrome.runtime.onInstalled.addListener(() => {
  // create alarm only if autoRandom is enabled
  chrome.storage.local.get('autoRandom', (res) => {
    if (res && res.autoRandom) {
      chrome.alarms.create('hourlyMacChange', { periodInMinutes: 60 });
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get('autoRandom', (res) => {
    if (res && res.autoRandom) {
      chrome.alarms.create('hourlyMacChange', { periodInMinutes: 60 });
    }
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== 'hourlyMacChange') return;
  // check whether autoRandom is still enabled
  chrome.storage.local.get(['autoRandom','iface'], (items) => {
    if (!items.autoRandom) {
      console.log('autoRandom disabled; skipping alarm action');
      return;
    }
    const iface = items.iface || '';
    if (!iface) {
      console.warn('Missing iface in storage; skipping native message');
      return;
    }
    const macToSend = 'random';
    chrome.runtime.sendNativeMessage(hostName, { interface: iface, mac: macToSend }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Native message error:', chrome.runtime.lastError.message);
      } else {
        console.log('Native message response:', response);
      }
    });
  });
});
