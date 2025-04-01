// Create theme-aware styling
const styleElement = document.createElement('style');
styleElement.textContent = `
  :root {
    --bg-color: white;
    --text-color: #333;
    --primary-color: #10a37f;
    --primary-light: rgba(16, 163, 127, 0.3);
    --hover-light: rgba(0, 0, 0, 0.05);
    --hover-heavy: rgba(0, 0, 0, 0.1);
    --shadow-color: rgba(0, 0, 0, 0.2);
  }
  
  [data-theme="dark"] {
  --bg-color: #2d2d2d;
  --text-color: #f0f0f0;
  --primary-color: #10a37f; // Add this
  --primary-light: rgba(16, 163, 127, 0.3); // Add this
  --hover-light: rgba(255, 255, 255, 0.05);
  --hover-heavy: rgba(255, 255, 255, 0.1);
  --shadow-color: rgba(0, 0, 0, 0.4);
}
  
  .gpe-translator-button {
    padding: 8px 12px;
    background-color: var(--primary-color);
    color: white;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    box-shadow: 0 2px 8px var(--shadow-color);
    transition: all 0.2s ease;
  }
  
  .gpe-translator-button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
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

// Get saved theme
const savedTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);


// Create the translation button element
const translationButton = document.createElement('button');
translationButton.type = 'button'; // Explicitly set type
translationButton.className = 'gpe-translator-button';
translationButton.style.pointerEvents = 'auto';
translationButton.innerHTML = `
  <div style="display: flex; align-items: center; justify-content: center;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 6px;">
      <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" fill="currentColor"/>
    </svg>
    Translate
  </div>
`;
translationButton.style.display = 'none';
translationButton.style.position = 'absolute';
translationButton.style.zIndex = '10000';
document.body.appendChild(translationButton);

// Create translation popup
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
console.log('Button positioned at:', translationButton.style.top, translationButton.style.left);
    translationButton.dataset.selectedText = selectedText;
  }
});

document.addEventListener('mousedown', function(event) {
  // Check if the click was directly on the button (not just contains)
  if (event.target !== translationButton &&
      !translationButton.contains(event.target) &&
      !translationPopup.contains(event.target)) {
    translationButton.style.display = 'none';
    translationPopup.style.display = 'none';
  }
});
// Translation function
async function translateText(text, sourceLang = 'auto', targetLang = 'en') {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(`${text} [Translated to ${targetLang}]`);
    }, 1000);
  });
}

// Close button functionality
document.querySelector('.gpe-close-button').addEventListener('click', function() {
  translationPopup.style.display = 'none';
});

// Handle translate button click
translationButton.addEventListener('click', function(event) {
  // Stop event from bubbling up to document
  event.stopPropagation();
  event.preventDefault();

  console.log('Translation button clicked');
  const selectedText = translationButton.dataset.selectedText;

  // Position and show the popup
  translationPopup.style.display = 'block';
  translationPopup.style.top = translationButton.style.top;
  translationPopup.style.left = translationButton.style.left;

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
  });

  // Hide the translate button
  translationButton.style.display = 'none';
});

translationButton.style.cursor = 'pointer';