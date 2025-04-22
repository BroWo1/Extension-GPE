// Create theme-aware styling
const styleElement = document.createElement('style');
const logoURL = chrome.runtime.getURL('GPE.png');
document.head.appendChild(styleElement);

const gpeContainer = document.createElement('div');
gpeContainer.className = 'gpe-container';
document.body.appendChild(gpeContainer);

// Get saved theme and apply it to the container only
const savedTheme = localStorage.getItem('theme') || 'dark';
gpeContainer.setAttribute('data-theme', savedTheme);



// Replace the translation icon creation code
const translationIcon = document.createElement('img');
translationIcon.src = logoURL;
translationIcon.alt = 'Translate';
translationIcon.className = 'gpe-translation-icon';
gpeContainer.appendChild(translationIcon);
// Replace the popup creation code
const translationPopup = document.createElement('div');
translationPopup.className = 'gpe-translator-popup';
translationPopup.innerHTML = `
  <div class="gpe-popup-header">
    <div class="gpe-popup-title">
      <!-- Title will be set dynamically -->
    </div>
    <div class="gpe-close-button">×</div>
  </div>
  <div class="gpe-popup-content">
    <div class="gpe-loading">
      <div class="gpe-loading-spinner"></div>
      <span>Processing...</span>
    </div>
    <div class="gpe-result"></div>
    <div class="gpe-ask-interface">
      <div class="gpe-selected-text-display"></div>
      <textarea class="gpe-ask-input" placeholder="Ask a question about the text..." style="resize: none;"></textarea>
      <button class="gpe-ask-submit">Send</button>
    </div>
  </div>
`;
gpeContainer.appendChild(translationPopup);
document.addEventListener('mouseup', function(event) {
  // Avoid showing icon if the click was on the icon itself or the popup
  if (translationIcon.contains(event.target) || translationPopup.contains(event.target)) {
    return;
  }

const selection = window.getSelection();
let selectedText = selection.toString().trim();

const MAX_CHARS = 3000;
if (selectedText.length > MAX_CHARS) {
  selectedText = selectedText.substring(0, MAX_CHARS);
  console.log(`Selection truncated to ${MAX_CHARS} characters`);
}

  if (selectedText.length > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // First make it visible but transparent
    // translationIcon.style.display = 'block';
    // translationIcon.style.top = `${window.scrollY + rect.bottom + 5}px`;
    // translationIcon.style.left = `${window.scrollX + rect.left}px`;

    const scrollY     = window.scrollY || document.documentElement.scrollTop;
    const scrollX     = window.scrollX || document.documentElement.scrollLeft;
    const iconOffset  = 8; // px offset from cursor
    
    translationIcon.style.display = 'block';
    translationIcon.style.top     = `${scrollY + event.clientY + iconOffset}px`;
    translationIcon.style.left    = `${scrollX + event.clientX + iconOffset}px`;

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

async function translateText(text, sourceLang = 'auto', targetLang = 'en') {
  try {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'callAPI',
        url: 'https://server.gpeclub.com:1000/api/chatgpt',
        data: {
          query: text,
          model: 'deepseek-chat',
          prompt1: `You are a translation assistant. Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text, no explanations.`
        }
      }, response => {
        if (response && response.success) {
          resolve(response.data.response);
        } else {
          reject(new Error(response?.error || 'API call failed'));
        }
      });
    });
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
}
// Close button functionality for the popup
translationPopup.querySelector('.gpe-close-button').addEventListener('click', function() {
  translationPopup.style.display = 'none';
});

/// Add to content_old.js - replace the translation icon click handler

translationIcon.addEventListener('click', function(event) {
  // Stop event from bubbling up to document
  event.stopPropagation();
  event.preventDefault();

  // Get selected text again from window selection
  const selectedText = window.getSelection().toString().trim();
  if (!selectedText) {
    console.log('Translation icon clicked, but no text selected.');
    translationIcon.style.display = 'none';
    return;
  }

  // Get the user's preferred function
  chrome.storage.sync.get(['iconFunction', 'sourceLanguage', 'targetLanguage', 'searchEngine'],
    function(data) {
      const action = data.iconFunction || 'translate';

      switch(action) {
        case 'translate':
          showTranslationPopup(selectedText, data.sourceLanguage || 'auto', data.targetLanguage || 'en');
          break;
        case 'copy':
          copyToClipboard(selectedText);
          break;
        case 'search':
          searchWeb(selectedText, data.searchEngine || 'google');
          break;
        case 'define':
          defineText(selectedText);
          break;
        case 'ask': // Add this case
          showAskAIPanel(selectedText);
          break;
        case 'speak':
          speakText(selectedText);
          break;
        case 'newtab':
          toggleNewTabOverride();
          break;
        default:
          showTranslationPopup(selectedText);
      }
    }
  );

  // Hide the translate icon
  fadeOutIcon();
});

function showTranslationPopup(text, sourceLang = 'auto', targetLang = 'en') {
  translationPopup.style.display = 'block';
  translationPopup.style.top = translationIcon.style.top;
  translationPopup.style.left = translationIcon.style.left;

  setPopupTitle('Translation', `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
      <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z" fill="currentColor"/>
    </svg>
  `);

  hideAllPopupSections();
  showPopupSection('gpe-loading');
  translationPopup.querySelector('.gpe-loading span').textContent = 'Translating...';


  translateText(text, sourceLang, targetLang).then(translation => {
    showPopupSection('gpe-loading', 'none');
    showPopupSection('gpe-result');
    translationPopup.querySelector('.gpe-result').textContent = translation;
  }).catch(error => {
    showPopupSection('gpe-loading', 'none');
    showPopupSection('gpe-result');
    translationPopup.querySelector('.gpe-result').textContent = `Error: ${error.message || 'Translation failed'}`;
  });
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showFeedbackToast('Copied to clipboard');
  }).catch(err => {
    showFeedbackToast('Failed to copy: ' + err);
  });
}

function searchWeb(text, engine = 'google') {
  const engines = {
    google: 'https://www.google.com/search?q=',
    bing: 'https://www.bing.com/search?q='
  };

  const baseUrl = engines[engine] || engines.google;
  window.open(baseUrl + encodeURIComponent(text), '_blank');
}

function defineText(text) {
  translationPopup.style.display = 'block';
  translationPopup.style.top = translationIcon.style.top;
  translationPopup.style.left = translationIcon.style.left;

  setPopupTitle('Definition', `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-right: 8px;">
      <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" fill="currentColor"/>
    </svg>
  `);

  hideAllPopupSections();
  showPopupSection('gpe-loading');
  translationPopup.querySelector('.gpe-loading span').textContent = 'Defining...';


  chrome.runtime.sendMessage({
    action: 'callAPI',
    url: 'https://server.gpeclub.com:1000/api/chatgpt',
    data: {
      query: text,
      model: 'deepseek-chat',
      prompt1: 'You are a dictionary assistant. Provide a clear and concise definition of the following term or phrase. Include part of speech, meaning, and a simple example if appropriate.'
    }
  }, response => {
    showPopupSection('gpe-loading', 'none');
    showPopupSection('gpe-result');

    if (response && response.success) {
      translationPopup.querySelector('.gpe-result').textContent = response.data.response;
    } else {
      translationPopup.querySelector('.gpe-result').textContent = `Error: ${response?.error || 'Definition failed'}`;
    }
  });
}

function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
  showFeedbackToast('Speaking text');
}

function showFeedbackToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.padding = '10px 20px';
  toast.style.backgroundColor = 'var(--primary-color)';
  toast.style.color = 'white';
  toast.style.borderRadius = '4px';
  toast.style.zIndex = '10002';
  toast.style.opacity = '0';
  toast.style.transition = 'opacity 0.3s ease';

  document.body.appendChild(toast);

  // Force reflow
  toast.offsetHeight;

  // Fade in
  toast.style.opacity = '1';

  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}
function toggleNewTabOverride() {
  chrome.storage.sync.get(['newTabEnabled'], function(data) {
    const isEnabled = !data.newTabEnabled;

    chrome.storage.sync.set({ newTabEnabled: isEnabled }, function() {
      showFeedbackToast(isEnabled ?
        'Custom new tab page enabled' :
        'Default new tab page restored');
    });
  });
}
console.log('GPE Translator content script loaded.'); // Log script loading

function setPopupTitle(title, svgIconHtml) {
  const popupTitleElement = translationPopup.querySelector('.gpe-popup-title');
  if (popupTitleElement) {
    popupTitleElement.innerHTML = `<span class="gpe-icon-wrapper">${svgIconHtml}</span>${title}`;
  }
}

// Function to show/hide specific parts of the popup content
function showPopupSection(sectionClass, display = 'block') {
  const section = translationPopup.querySelector(`.${sectionClass}`);
  if (section) section.style.display = display;
}

// Function to hide all dynamic content sections
function hideAllPopupSections() {
  showPopupSection('gpe-loading', 'none');
  showPopupSection('gpe-result', 'none');
  showPopupSection('gpe-ask-interface', 'none');
}

function showAskAIPanel(selectedText) {
  translationPopup.style.display = 'block';
  translationPopup.style.top = translationIcon.style.top;
  translationPopup.style.left = translationIcon.style.left;

  setPopupTitle('Ask AI', `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px;">
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
      <path d="M12 17h.01"></path>
      <circle cx="12" cy="12" r="10"></circle>
    </svg>
  `);

  hideAllPopupSections();
  showPopupSection('gpe-ask-interface');

  const selectedTextDisplay = translationPopup.querySelector('.gpe-selected-text-display');
  const askInput = translationPopup.querySelector('.gpe-ask-input');
  const askSubmit = translationPopup.querySelector('.gpe-ask-submit');
  const resultElement = translationPopup.querySelector('.gpe-result');
  const loadingElement = translationPopup.querySelector('.gpe-loading');

  selectedTextDisplay.textContent = `Context: "${selectedText}"`;
  askInput.value = ''; // Clear previous question
  resultElement.textContent = ''; // Clear previous result

  // Remove previous listener to avoid duplicates if panel is reopened
  const newSubmitButton = askSubmit.cloneNode(true);
  askSubmit.parentNode.replaceChild(newSubmitButton, askSubmit);

  newSubmitButton.addEventListener('click', () => {
    const question = askInput.value.trim();
    if (!question) {
      showFeedbackToast('Please enter a question.');
      return;
    }
    hideAllPopupSections();
    showPopupSection('gpe-ask-interface'); // Keep interface visible
    showPopupSection('gpe-loading'); // Show loading below input
    loadingElement.querySelector('span').textContent = 'Thinking...';


    chrome.runtime.sendMessage({
      action: 'callAPI',
      url: 'https://server.gpeclub.com:1000/api/chatgpt',
      data: {
        query: `Context: "${selectedText}"\n\nQuestion: "${question}"`,
        model: 'deepseek-chat',
        prompt1: 'You are a helpful assistant. Answer the user\'s question based on the provided context. If the context doesn\'t contain the answer, say so clearly. Format your response using Markdown.' // Added Markdown instruction
      }
    }, response => {
      showPopupSection('gpe-loading', 'none');
      showPopupSection('gpe-result'); // Show result area

      if (response && response.success && typeof marked !== 'undefined') { // Check if marked is loaded
        // Use marked to parse the Markdown response into HTML
        resultElement.innerHTML = marked.parse(response.data.response);
      } else if (response && response.success) {
        // Fallback if marked is not available
        resultElement.textContent = response.data.response;
        console.warn('Marked library not found. Displaying raw text.');
      }
       else {
        resultElement.textContent = `Error: ${response?.error || 'Failed to get answer'}`;
      }
      // Keep the ask interface visible so the user can ask follow-up questions or see the context/question
      showPopupSection('gpe-ask-interface');
    });
  });
}