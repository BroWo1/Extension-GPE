  document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const iconFunction = document.getElementById('iconFunction');
  const saveFunction = document.getElementById('saveFunction');
  const translateOptions = document.getElementById('translateOptions');
  const searchOptions = document.getElementById('searchOptions');

  // Load saved function preference
  chrome.storage.sync.get('iconFunction', function(data) {
    if (data.iconFunction) {
      iconFunction.value = data.iconFunction;
      showRelevantOptions(data.iconFunction);
    }
  });

  // Function selection change handler
  iconFunction.addEventListener('change', function() {
    showRelevantOptions(this.value);
  });

  // Show only relevant options based on selected function
  function showRelevantOptions(functionType) {
    // Hide all option sections first
    const allOptions = document.querySelectorAll('.function-options');
    allOptions.forEach(option => option.style.display = 'none');

    // Show relevant section
    if (functionType === 'translate') {
      translateOptions.style.display = 'block';
    } else if (functionType === 'search') {
      searchOptions.style.display = 'block';
    }
  }

  // Save preferences
  saveFunction.addEventListener('click', function() {
    const selectedFunction = iconFunction.value;

    // Save main function preference
    chrome.storage.sync.set({'iconFunction': selectedFunction}, function() {
      console.log('Icon function saved: ' + selectedFunction);
    });

    // Save specific settings based on function
    if (selectedFunction === 'translate') {
      chrome.storage.sync.set({
        'sourceLanguage': document.getElementById('sourceLanguage').value,
        'targetLanguage': document.getElementById('targetLanguage').value
      });
    } else if (selectedFunction === 'search') {
      chrome.storage.sync.set({
        'searchEngine': document.getElementById('searchEngine').value
      });
    }

    // Show feedback
    const feedback = document.createElement('div');
    feedback.textContent = 'Preferences saved!';
    feedback.style.color = '#10a37f';
    feedback.style.marginTop = '10px';
    feedback.style.textAlign = 'center';
    this.parentNode.appendChild(feedback);

    setTimeout(() => {
      feedback.remove();
    }, 2000);
  });
  // Check for any selected text in storage
  chrome.storage.local.get(['selectedText'], function(result) {
    if (result.selectedText) {
      // Fill the source text field with the selected text
      document.getElementById('sourceText').value = result.selectedText;
      // Clear the stored text
      chrome.storage.local.remove('selectedText');
    }
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
// Replace dropdown selection with card selection
document.addEventListener('DOMContentLoaded', function() {
  // Hide the original dropdown
  const originalSelect = document.getElementById('iconFunction');
  if (originalSelect) {
    originalSelect.style.display = 'none';
  }

  // Hide the save button since we're auto-saving
  const saveButton = document.getElementById('saveFunction');
  if (saveButton) {
    saveButton.style.display = 'none';
  }

  // Get all action cards
  const actionCards = document.querySelectorAll('.action-card');
  let selectedValue = 'translate'; // Default value

  // Add click event listener to each card
  actionCards.forEach(card => {
    card.addEventListener('click', function() {
      // Remove selected class from all cards
      actionCards.forEach(c => c.classList.remove('selected'));

      // Add selected class to clicked card
      this.classList.add('selected');

      // Update selected value
      selectedValue = this.dataset.value;

      // Update the hidden select element to maintain compatibility
      if (originalSelect) {
        originalSelect.value = selectedValue;
      }

      // Show/hide corresponding options based on selected card
      updateVisibleOptions(selectedValue);

      // Auto-save the preference
      chrome.storage.sync.set({
        'iconFunction': selectedValue
      }, function() {
        // Show feedback to user
        showFeedback('Preference saved!');
      });
    });
  });

  // Initialize selection based on saved preference
  chrome.storage.sync.get('iconFunction', function(data) {
    if (data.iconFunction) {
      selectedValue = data.iconFunction;

      // Find the card with the saved value and select it
      actionCards.forEach(card => {
        if (card.dataset.value === selectedValue) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
      });

      // Update visible options
      updateVisibleOptions(selectedValue);
    }
  });
});

// Function to update visible options based on selection
function updateVisibleOptions(value) {
  const translateOptions = document.getElementById('translateOptions');
  const searchOptions = document.getElementById('searchOptions');

  // Hide all options first
  translateOptions.style.display = 'none';
  searchOptions.style.display = 'none';

  // Show relevant options based on selection
  if (value === 'translate') {
    translateOptions.style.display = 'block';
  } else if (value === 'search') {
    searchOptions.style.display = 'block';
  }
}

// Feedback toast function
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

  setTimeout(() => {
    feedback.remove();
  }, 2000);
}

// Replace your theme toggle code with this
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  // Use let instead of const so we can reassign it
  let gpeContainer = document.querySelector('.gpe-container');
  if (!gpeContainer) {
    // Create container if it doesn't exist
    const newContainer = document.createElement('div');
    newContainer.className = 'gpe-container';
    document.body.appendChild(newContainer);
    gpeContainer = newContainer; // Now works with let
  }

  // Load saved theme
  const savedTheme = localStorage.getItem('theme') || 'dark';
  gpeContainer.setAttribute('data-theme', savedTheme);
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Toggle theme when button is clicked
  themeToggle.addEventListener('click', function() {
    const currentTheme = gpeContainer.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Update both elements for consistency
    gpeContainer.setAttribute('data-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);

    localStorage.setItem('theme', newTheme);
    console.log('Theme changed to:', newTheme);
  });
});