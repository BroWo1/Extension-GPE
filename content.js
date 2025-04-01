// Create theme-aware styling
const styleElement = document.createElement('style');
const logoURL = chrome.runtime.getURL('GPE.png');
styleElement.textContent = `
  .gpe-container {
    --bg-color: white;
    --text-color: #333;
    --primary-color: #10a37f;
    --primary-light: rgba(16, 163, 127, 0.3);
    --hover-light: rgba(0, 0, 0, 0.05);
    --hover-heavy: rgba(0, 0, 0, 0.1);
    --shadow-color: rgba(0, 0, 0, 0.2);
  }

  .gpe-container[data-theme="dark"] {
    --bg-color: #2d2d2d;
    --text-color: #f0f0f0;
    --primary-color: #10a37f;
    --primary-light: rgba(16, 163, 127, 0.3);
    --hover-light: rgba(255, 255, 255, 0.05);
    --hover-heavy: rgba(255, 255, 255, 0.1);
    --shadow-color: rgba(0, 0, 0, 0.4);
  }

  .gpe-translator-popup {
    background-color: var(--bg-color);
    color: var(--text-color);
    border-radius: 12px;
    box-shadow: 0 4px 12px var(--shadow-color);
    padding: 15px;
    transition: all 0.2s ease;
  }

  .gpe-close-button:hover {
    background-color: var(--hover-light);
  }

  @keyframes gpe-spin {
    to { transform: rotate(360deg); }
  }

  .gpe-loading-spinner {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid var(--primary-light);
    border-radius: 50%;
    border-top-color: var(--primary-color);
    animation: gpe-spin 1s linear infinite;
  }
`;
document.head.appendChild(styleElement);

const gpeContainer = document.createElement('div');
gpeContainer.className = 'gpe-container';
document.body.appendChild(gpeContainer);

// Get saved theme and apply it to the container only
const savedTheme = localStorage.getItem('theme') || 'dark';
gpeContainer.setAttribute('data-theme', savedTheme);



const translationIcon = document.createElement('img');
translationIcon.src = logoURL;
translationIcon.alt = 'Translate';
translationIcon.style.position = 'absolute';
translationIcon.style.zIndex = '10000';
translationIcon.style.display = 'none'; // Start hidden
translationIcon.style.cursor = 'pointer';
translationIcon.style.width = '24px';
translationIcon.style.height = '24px';
translationIcon.style.opacity = '0';
translationIcon.style.transition = 'opacity 0.15s ease-in-out';
document.body.appendChild(translationIcon);

// Create translation popup (remains the same)
const translationPopup = document.createElement('div');
translationPopup.className = 'gpe-translator-popup';
translationPopup.style.display = 'none';
translationPopup.style.position = 'absolute';
translationPopup.style.zIndex = '10001';
translationPopup.style.maxWidth = '300px';
translationPopup.style.minWidth = '200px';
translationPopup.innerHTML = `
  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
    <div style="font-weight: bold; display: flex; align-items: center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
        <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" fill="currentColor"/>
      </svg>
      Translation
    </div>
    <div class="gpe-close-button" style="cursor: pointer; font-size: 18px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">×</div>
  </div>
  <div class="gpe-translation-content">
    <div class="gpe-loading" style="display: none; text-align: center; padding: 15px;">
      <div class="gpe-loading-spinner"></div>
      <span style="margin-left: 10px;">Translating...</span>
    </div>
    <div class="gpe-result" style="display: none; padding: 10px 0;"></div>
  </div>
`;
document.body.appendChild(translationPopup);
gpeContainer.appendChild(translationIcon);
gpeContainer.appendChild(translationPopup);

document.addEventListener('mouseup', function(event) {
  // Avoid showing icon if the click was on the icon itself or the popup
  if (translationIcon.contains(event.target) || translationPopup.contains(event.target)) {
    return;
  }

  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // First make it visible but transparent
    translationIcon.style.display = 'block';
    translationIcon.style.top = `${window.scrollY + rect.bottom + 5}px`;
    translationIcon.style.left = `${window.scrollX + rect.left}px`;

    // Force a reflow before changing opacity for animation to work
    translationIcon.offsetHeight;

    // Now fade it in
    translationIcon.style.opacity = '1';
    console.log('Icon positioned at:', translationIcon.style.top, translationIcon.style.left);
  } else {
    // Fade out when selection is cleared
    if (!translationPopup.contains(event.target)) {
      fadeOutIcon();
    }
  }
});

// Add a function to handle fade out
function fadeOutIcon() {
  translationIcon.style.opacity = '0';
  setTimeout(() => {
    if (translationIcon.style.opacity === '0') {
      translationIcon.style.display = 'none';
    }
  }, 300); // Match the transition duration
}

document.addEventListener('mousedown', function(event) {
  if (event.target !== translationIcon &&
      !translationIcon.contains(event.target) &&
      !translationPopup.contains(event.target)) {
    fadeOutIcon();
    translationPopup.style.display = 'none';
  }
});

// Translation function (Placeholder)
async function translateText(text, sourceLang = 'auto', targetLang = 'en') {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate translation
      resolve(`${text} [Translated to ${targetLang}]`);
    }, 1000);
  });
  // Replace with actual API call in a real extension
}

// Close button functionality for the popup
translationPopup.querySelector('.gpe-close-button').addEventListener('click', function() {
  translationPopup.style.display = 'none';
});

// Handle translation icon click
translationIcon.addEventListener('click', function(event) {
  // Stop event from bubbling up to document
  event.stopPropagation();
  event.preventDefault();

  // Get selected text *again* directly from window selection
  const selectedText = window.getSelection().toString().trim();
  if (!selectedText) {
      console.log('Translation icon clicked, but no text selected.');
      translationIcon.style.display = 'none'; // Hide icon if selection lost
      return;
  }

  console.log('Translation icon clicked with text:', selectedText);

  // Position and show the popup relative to the icon
  translationPopup.style.display = 'block';
  translationPopup.style.top = translationIcon.style.top; // Use icon's position
  translationPopup.style.left = translationIcon.style.left; // Use icon's position

  // Show loading indicator
  const loadingElement = translationPopup.querySelector('.gpe-loading');
  const resultElement = translationPopup.querySelector('.gpe-result');
  loadingElement.style.display = 'block';
  resultElement.style.display = 'none';

  // Perform translation
  translateText(selectedText).then(translation => {
    loadingElement.style.display = 'none';
    resultElement.style.display = 'block';
    resultElement.textContent = translation;
  }).catch(error => {
      console.error("Translation error:", error);
      loadingElement.style.display = 'none';
      resultElement.style.display = 'block';
      resultElement.textContent = `Error: ${error.message || 'Translation failed'}`;
  });

  // Hide the translate icon after initiating translation
  translationIcon.style.display = 'none';
  fadeOutIcon();
});

console.log('GPE Translator content script loaded.'); // Log script loading