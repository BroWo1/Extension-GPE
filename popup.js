document.addEventListener('DOMContentLoaded', function() {
  // ======== DOM Elements ========
  const themeToggle = document.getElementById('themeToggle');
  const actionCards = document.querySelectorAll('.action-card');
  const translateOptions = document.getElementById('translateOptions');
  const searchOptions = document.getElementById('searchOptions');
  const translationForm = document.getElementById('translationForm');
  const sourceText = document.getElementById('sourceText');
  const translationResult = document.getElementById('translationResult');
  const loadingPlaceholder = document.getElementById('loadingPlaceholder');
  const actualResponse = document.getElementById('actualResponse');
  const sourceLanguage = document.getElementById('sourceLanguage');
  const targetLanguage = document.getElementById('targetLanguage');
  const translationModal = document.getElementById('translationModal');
  const closeButton = translationModal.querySelector('.close-button');
  const historyList = document.getElementById('historyList');

  // ======== History Management ========
  const MAX_HISTORY_ITEMS = 10;
  const HISTORY_STORAGE_KEY = 'requestHistory';

  async function addHistoryEntry(action, text) {
    try {
      const result = await chrome.storage.local.get([HISTORY_STORAGE_KEY]);
      let history = result[HISTORY_STORAGE_KEY] || [];
      
      // Add new entry to the beginning
      history.unshift({ action, text, timestamp: new Date().toISOString() });
      
      // Keep only the last MAX_HISTORY_ITEMS entries
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }
      
      await chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: history });
      // Update display if popup is open
      if (historyList) {
          displayHistory();
      }
    } catch (error) {
      console.error("Error adding history entry:", error);
    }
  }

  async function displayHistory() {
      if (!historyList) return; // Only run if the history list element exists

      try {
          const result = await chrome.storage.local.get([HISTORY_STORAGE_KEY]);
          const history = result[HISTORY_STORAGE_KEY] || [];

          historyList.innerHTML = ''; // Clear current list

          if (history.length === 0) {
              const li = document.createElement('li');
              li.textContent = 'No history yet.';
              li.style.fontStyle = 'italic';
              historyList.appendChild(li);
              return;
          }

          history.forEach(item => {
              const li = document.createElement('li');
              const actionSpan = document.createElement('span');
              actionSpan.className = 'history-action';
              actionSpan.textContent = `[${item.action}]`;
              
              const textSpan = document.createElement('span');
              textSpan.className = 'history-text';
              // Truncate long text for display
              textSpan.textContent = item.text.length > 50 ? item.text.substring(0, 47) + '...' : item.text;
              textSpan.title = item.text; // Show full text on hover

              const timeSpan = document.createElement('span');
              timeSpan.className = 'history-time';
              timeSpan.textContent = new Date(item.timestamp).toLocaleString();


              li.appendChild(actionSpan);
              li.appendChild(textSpan);
              // li.appendChild(timeSpan); // Optional: Show timestamp
              historyList.appendChild(li);
          });
      } catch (error) {
          console.error("Error displaying history:", error);
          historyList.innerHTML = '<li>Error loading history.</li>';
      }
  }

  function initTheme() {
    const themeToggle = document.getElementById('themeToggle');

    if (!themeToggle) {
      console.error('Theme toggle button not found');
      return;
    }

    // Get saved theme or use system preference as fallback
    const savedTheme = localStorage.getItem('theme') ||
                       (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    // Apply theme to HTML element
    document.documentElement.setAttribute('data-theme', savedTheme);
    console.log('Initial theme set to:', savedTheme);

    // Add click event listener
    themeToggle.addEventListener('click', function() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

      // Apply new theme
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      console.log('Theme changed to:', newTheme);
    });
  }

  // ======== Function Selection ========
  function initFunctionSelection() {
    // Load saved preference
    chrome.storage.sync.get('iconFunction', function(data) {
      const selectedValue = data.iconFunction || 'translate';

      // Update UI to match saved preference
      actionCards.forEach(card => {
        card.classList.toggle('selected', card.dataset.value === selectedValue);
      });

      updateVisibleOptions(selectedValue);
    });

    // Setup card selection
    actionCards.forEach(card => {
      card.addEventListener('click', function() {
      const value = this.getAttribute('data-value');

      // Special handling for toggle cards
      if (this.classList.contains('toggle-card')) {
        this.classList.toggle('active');

        if (value === 'newtab') {
          toggleNewTabOverride();
        }
        return; // Don't affect other selections
      }

      // Regular action cards (mutually exclusive)
      document.querySelectorAll('.action-card:not(.toggle-card)').forEach(c => {
        c.classList.remove('selected');
      });
      this.classList.add('selected');

        const selectedValue = this.dataset.value;
        updateVisibleOptions(selectedValue);

        // Save preference
        chrome.storage.sync.set({'iconFunction': selectedValue}, function() {
          showFeedback('Preference saved!');
        });
      });
    });
  }

  // ======== Options Visibility ========
  function updateVisibleOptions(value) {
    translateOptions.style.display = value === 'translate' ? 'block' : 'none';
    searchOptions.style.display = value === 'search' ? 'block' : 'none';
  }

  // ======== Translation Functions ========
  function initTranslation() {
    // Check for selected text
    chrome.storage.local.get(['selectedText'], function(result) {
      if (result.selectedText) {
        sourceText.value = result.selectedText;
        chrome.storage.local.remove('selectedText');
      }
    });

    // Handle form submission
    translationForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const text = sourceText.value.trim();
      if (!text) return;

      // Show loading
      translationResult.style.display = 'block';
      loadingPlaceholder.style.display = 'block';
      actualResponse.style.display = 'none';

      // Add to history
      addHistoryEntry('Translate', text);

      translateText(text, sourceLanguage.value, targetLanguage.value)
        .then(translation => {
          loadingPlaceholder.style.display = 'none';
          actualResponse.style.display = 'block';
          actualResponse.textContent = translation;
          showModal('translationModal');
        })
        .catch(error => {
          loadingPlaceholder.style.display = 'none';
          actualResponse.style.display = 'block';
          actualResponse.textContent = `Error: ${error.message}`;
        });
    });
  }

  async function translateText(text, sourceLang = 'auto', targetLang = 'en') {
    try {
      const response = await fetch('https://server.gpeclub.com:1000/api/chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: text,
          model: 'deepseek-chat',
          prompt1: `You are a translation assistant. Translate the following text from ${sourceLang} to ${targetLang}. Only return the translated text, no explanations.`
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Failed to translate text');
    }
  }

  // ======== Modal Management ========
  function showModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
  }

  function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  }

  closeButton.addEventListener('click', function() {
    closeModal('translationModal');
  });

  // ======== Utility Functions ========
  function showFeedback(message) {
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.position = 'fixed';
    feedback.style.bottom = '20px';
    feedback.style.left = '50%';
    feedback.style.transform = 'translateX(-50%)';
    feedback.style.padding = '10px 20px';
    feedback.style.backgroundColor = 'var(--primary-color)';
    feedback.style.color = 'white';
    feedback.style.borderRadius = '4px';
    feedback.style.zIndex = '1000';

    setTimeout(() => feedback.remove(), 2000);
  }

  function initAutoSave() {
    // Get all select elements that need auto-saving
    const sourceLanguage = document.getElementById('sourceLanguage');
    const targetLanguage = document.getElementById('targetLanguage');
    const searchEngine = document.getElementById('searchEngine');

    // Load saved values
    chrome.storage.sync.get(['sourceLanguage', 'targetLanguage', 'searchEngine'], function(data) {
      if (data.sourceLanguage) sourceLanguage.value = data.sourceLanguage;
      if (data.targetLanguage) targetLanguage.value = data.targetLanguage;
      if (data.searchEngine) searchEngine.value = data.searchEngine;
    });

    // Add change event listeners
    sourceLanguage.addEventListener('change', function() {
      chrome.storage.sync.set({'sourceLanguage': this.value});
    });

    targetLanguage.addEventListener('change', function() {
      chrome.storage.sync.set({'targetLanguage': this.value});
    });

    searchEngine.addEventListener('change', function() {
      chrome.storage.sync.set({'searchEngine': this.value});
    });
  }

  initTheme();
  initFunctionSelection();
  initTranslation();
  initAutoSave();
  initializeNewTabToggle();
  displayHistory();

});

function initializeNewTabToggle() {
  chrome.storage.sync.get(['newTabEnabled'], function(data) {
    const newtabToggle = document.getElementById('newtabToggle');
    if (newtabToggle) {
      if (data.newTabEnabled) {
        newtabToggle.classList.add('active');
      } else {
        newtabToggle.classList.remove('active');
      }
    }
  });
}

function toggleNewTabOverride() {
  chrome.storage.sync.get(['newTabEnabled'], function(data) {
    const isEnabled = !data.newTabEnabled;

    chrome.storage.sync.set({ newTabEnabled: isEnabled }, function() {
      const newtabToggle = document.getElementById('newtabToggle');

      if (isEnabled) {
        newtabToggle.classList.add('active');
        showFeedbackToast('Custom new tab switch not available yet');
      } else {
        newtabToggle.classList.remove('active');
        showFeedbackToast('Custom new tab switch not available yet');
      }
    });
  });
}

function showFeedbackToast(message) {
  const toast = document.createElement('div');
  toast.className = 'feedback-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger a reflow
  toast.offsetHeight;

  // Add visible class to start animation
  toast.classList.add('visible');

  // Remove after animation completes
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}
