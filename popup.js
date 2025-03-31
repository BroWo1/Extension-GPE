document.addEventListener('DOMContentLoaded', function() {
  // Check for any selected text in storage
  chrome.storage.local.get(['selectedText'], function(result) {
    if (result.selectedText) {
      // Fill the source text field with the selected text
      document.getElementById('sourceText').value = result.selectedText;
      // Clear the stored text
      chrome.storage.local.remove('selectedText');
    }
  });  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');

  // Load saved theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  } else {
    // Default to dark theme
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // Toggle theme when button is clicked
  themeToggle.addEventListener('click', function() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });

  // Translation Form
  const translationForm = document.getElementById('translationForm');
  const sourceText = document.getElementById('sourceText');
  const translationResult = document.getElementById('translationResult');
  const loadingPlaceholder = document.getElementById('loadingPlaceholder');
  const actualResponse = document.getElementById('actualResponse');
  const sourceLanguage = document.getElementById('sourceLanguage');
  const targetLanguage = document.getElementById('targetLanguage');

  // Swap Languages
  const swapLanguages = document.getElementById('swapLanguages');
  swapLanguages.addEventListener('click', function() {
    const sourceLang = sourceLanguage.value;
    const targetLang = targetLanguage.value;

    sourceLanguage.value = targetLang;
    targetLanguage.value = sourceLang;
  });

  // Handle form submission
  translationForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const text = sourceText.value.trim();

    if (!text) return;

    // Show result box with loading indicator
    translationResult.style.display = 'block';
    loadingPlaceholder.style.display = 'block';
    actualResponse.style.display = 'none';

    translateText(
      text,
      sourceLanguage.value,
      targetLanguage.value
    ).then(translation => {
      // Hide loading, show result
      loadingPlaceholder.style.display = 'none';
      actualResponse.style.display = 'block';
      actualResponse.textContent = translation;
    }).catch(error => {
      loadingPlaceholder.style.display = 'none';
      actualResponse.style.display = 'block';
      actualResponse.textContent = `Error: ${error.message}`;
    });
  });

  // Function to translate text (replace with your API)
  async function translateText(text, sourceLang, targetLang) {
    // Simulate translation API call with delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // This is a placeholder. In a real extension, you would call a translation API
        // For demonstration, we'll just append "[Translated]" to the text
        try {
          resolve(`${text} [Translated to ${targetLang}]`);
        } catch (error) {
          reject(new Error('Translation failed'));
        }
      }, 1500);
    });

    /*
    // Example of actual API call (using fetch)
    try {
      const response = await fetch('https://translation-api-url.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          source: sourceLang,
          target: targetLang
        })
      });

      if (!response.ok) {
        throw new Error('Translation API error');
      }

      const data = await response.json();
      return data.translatedText;
    } catch (error) {
      throw error;
    }
    */
  }
  // Add these functions to popup.js
function showModal(modalId) {
  document.getElementById(modalId).style.display = 'flex';
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Update your existing code in popup.js
document.addEventListener('DOMContentLoaded', function() {
  // Add this after existing DOM content loaded code
  const modal = document.getElementById('translationModal');
  const closeButton = modal.querySelector('.close-button');

  closeButton.addEventListener('click', function() {
    closeModal('translationModal');
  });

  // Modify your translation handling code:
  translationForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const text = sourceText.value.trim();

    if (!text) return;

    // Show result box with loading indicator
    translationResult.style.display = 'block';
    loadingPlaceholder.style.display = 'block';
    actualResponse.style.display = 'none';

    translateText(
      text,
      sourceLanguage.value,
      targetLanguage.value
    ).then(translation => {
      // Hide loading, show result
      loadingPlaceholder.style.display = 'none';
      actualResponse.style.display = 'block';
      actualResponse.textContent = translation;

      // Show modal after translation is complete
      showModal('translationModal');
    }).catch(error => {
      loadingPlaceholder.style.display = 'none';
      actualResponse.style.display = 'block';
      actualResponse.textContent = `Error: ${error.message}`;
    });
  });
});
});
