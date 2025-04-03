document.addEventListener('DOMContentLoaded', function() {
  // ======== DOM Elements ========
  const themeToggle = document.getElementById('themeToggle');
  const actionCards = document.querySelectorAll('.action-card');
  const translateOptions = document.getElementById('translateOptions');
  const searchOptions = document.getElementById('searchOptions');
  const swapLanguages = document.getElementById('swapLanguages');
  const translationForm = document.getElementById('translationForm');
  const sourceText = document.getElementById('sourceText');
  const translationResult = document.getElementById('translationResult');
  const loadingPlaceholder = document.getElementById('loadingPlaceholder');
  const actualResponse = document.getElementById('actualResponse');
  const sourceLanguage = document.getElementById('sourceLanguage');
  const targetLanguage = document.getElementById('targetLanguage');
  const translationModal = document.getElementById('translationModal');
  const closeButton = translationModal.querySelector('.close-button');

  // ======== Theme Management ========
  function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', function() {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
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
        // Update UI
        actionCards.forEach(c => c.classList.remove('selected'));
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

    // Setup language swap
    swapLanguages.addEventListener('click', function() {
      [sourceLanguage.value, targetLanguage.value] = [targetLanguage.value, sourceLanguage.value];
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

  async function translateText(text, sourceLang, targetLang) {
    // Simulate translation API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          resolve(`${text} [Translated to ${targetLang}]`);
        } catch (error) {
          reject(new Error('Translation failed'));
        }
      }, 1500);
    });
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

    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 2000);
  }

  // ======== Initialize Everything ========
  initTheme();
  initFunctionSelection();
  initTranslation();
});