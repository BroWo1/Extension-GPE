// Create the translation button element
const translationButton = document.createElement('div');
translationButton.className = 'gpe-translator-button';
translationButton.textContent = 'Translate';
translationButton.style.display = 'none';
translationButton.style.position = 'absolute';
translationButton.style.zIndex = '10000';
translationButton.style.padding = '5px 10px';
translationButton.style.backgroundColor = '#10a37f';
translationButton.style.color = 'white';
translationButton.style.borderRadius = '4px';
translationButton.style.fontSize = '14px';
translationButton.style.cursor = 'pointer';
translationButton.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
document.body.appendChild(translationButton);

// Show button when text is selected
document.addEventListener('mouseup', function() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    translationButton.style.display = 'block';
    translationButton.style.top = `${window.scrollY + rect.bottom + 10}px`;
    translationButton.style.left = `${window.scrollX + rect.left}px`;
    translationButton.dataset.selectedText = selectedText;
  }
});

// Hide button when clicking elsewhere
document.addEventListener('mousedown', function(event) {
  if (event.target !== translationButton) {
    translationButton.style.display = 'none';
  }
});

// Handle translate button click
translationButton.addEventListener('click', function() {
  const selectedText = translationButton.dataset.selectedText;

  // Save the selected text to storage for the popup to retrieve
  chrome.storage.local.set({ selectedText: selectedText }, function() {
    // Notify user to check the extension popup
    const notification = document.createElement('div');
    notification.textContent = 'Text ready for translation. Click the extension icon.';
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.padding = '10px';
    notification.style.backgroundColor = '#333';
    notification.style.color = 'white';
    notification.style.borderRadius = '4px';
    notification.style.zIndex = '10001';

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  });

  translationButton.style.display = 'none';
});