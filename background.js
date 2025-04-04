// background.js

// Single onMessage listener for API calls
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'callAPI') {
    fetch(message.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message.data)
    })
    .then(response => response.json())
    .then(data => sendResponse({ success: true, data }))
    .catch(error => sendResponse({ success: false, error: error.toString() }));
    return true;
  }
});