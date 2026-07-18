const hostName = 'com.example.mac_changer';
document.getElementById('changeBtn').addEventListener('click', () => {
  const iface = document.getElementById('iface').value.trim();
  const mac = document.getElementById('mac').value.trim();
  const status = document.getElementById('status');
  status.textContent = 'Sending...';
  chrome.runtime.sendNativeMessage(hostName, { interface: iface, mac: mac }, (response) => {
    if (chrome.runtime.lastError) {
      status.textContent = 'Error: ' + chrome.runtime.lastError.message;
      return;
    }
    status.textContent = response && response.status ? (response.status + (response.output ? ': ' + response.output : '')) : JSON.stringify(response);
  });
});
