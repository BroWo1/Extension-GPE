// Global variable to track which shortcut is being edited
let currentEditIndex = -1;

// Initialize the new tab page
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const quickLinks = document.getElementById('quickLinks');
  const themeToggle = document.getElementById('themeToggle');
  const addShortcutTile = document.getElementById('addShortcutTile');
  const shortcutModal = document.getElementById('shortcutModal');
  const closeModal = document.getElementById('closeModal');
  const saveShortcut = document.getElementById('saveShortcut');
  const deleteShortcut = document.getElementById('deleteShortcut');

  // Initialize and update the clock and date
  updateClockAndDate();
  setInterval(updateClockAndDate, 1000);

  // Initialize theme based on localStorage or system preference
  initTheme();

  // Theme toggle event listener
  themeToggle.addEventListener('click', toggleTheme);

  // Handle search functionality
  searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        // Default to Google if storage API is not available (for non-extension environments)
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.sync.get(['searchEngine'], function(data) {
            const engine = data.searchEngine || 'google';
            const engines = {
              google: 'https://www.google.com/search?q=',
              bing: 'https://www.bing.com/search?q='
            };

            const baseUrl = engines[engine] || engines.google;
            window.location.href = baseUrl + encodeURIComponent(query);
          });
        } else {
          // Fallback if chrome.storage is not available
          window.location.href = 'https://www.google.com/search?q=' + encodeURIComponent(query);
        }
      }
    }
  });

  // REMOVED: loadQuickLinks() call from here to prevent double loading

  // Focus the search input on page load
  searchInput.focus();

  // Add shortcut button click event
  if (addShortcutTile) {
    addShortcutTile.addEventListener('click', function() {
      openShortcutModal();
    });
  }

  // Close modal button click event
  if (closeModal) {
    closeModal.addEventListener('click', function() {
      shortcutModal.style.display = 'none';
    });
  }

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === shortcutModal) {
      shortcutModal.style.display = 'none';
    }
  });

  // Save shortcut button click event
  if (saveShortcut) {
    saveShortcut.addEventListener('click', function() {
      const name = document.getElementById('shortcutName').value.trim();
      const url = document.getElementById('shortcutUrl').value.trim();
      const icon = document.getElementById('shortcutIcon').value.trim();
      const color = document.getElementById('shortcutColor').value;

      if (!name || !url || !icon) {
        alert('Please fill in all fields');
        return;
      }

      // Make sure URL has http:// or https://
      let validUrl = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        validUrl = 'https://' + url;
      }

      // Use localStorage if chrome.storage is not available
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['quickLinks'], function(data) {
          const links = data.quickLinks || getDefaultLinks();
          saveShortcutToLinks(links, name, validUrl, icon, color);
        });
      } else {
        try {
          const savedLinks = localStorage.getItem('quickLinks');
          const links = savedLinks ? JSON.parse(savedLinks) : getDefaultLinks();
          saveShortcutToLinks(links, name, validUrl, icon, color);
        } catch (e) {
          console.error('Error saving shortcut:', e);
          alert('There was an error saving your shortcut. Please try again.');
        }
      }
    });
  }

  // Delete shortcut button click event
  if (deleteShortcut) {
    deleteShortcut.addEventListener('click', function() {
      if (currentEditIndex === -1) {
        shortcutModal.style.display = 'none';
        return;
      }

      if (confirm('Are you sure you want to delete this shortcut?')) {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.sync.get(['quickLinks'], function(data) {
            const links = data.quickLinks || getDefaultLinks();
            if (currentEditIndex >= 0 && currentEditIndex < links.length) {
              links.splice(currentEditIndex, 1);
              chrome.storage.sync.set({ quickLinks: links }, function() {
                loadQuickLinks();
                shortcutModal.style.display = 'none';
              });
            }
          });
        } else {
          try {
            const savedLinks = localStorage.getItem('quickLinks');
            const links = savedLinks ? JSON.parse(savedLinks) : getDefaultLinks();

            if (currentEditIndex >= 0 && currentEditIndex < links.length) {
              links.splice(currentEditIndex, 1);
              localStorage.setItem('quickLinks', JSON.stringify(links));
              loadQuickLinks();
              shortcutModal.style.display = 'none';
            }
          } catch (e) {
            console.error('Error deleting shortcut:', e);
            alert('There was an error deleting your shortcut. Please try again.');
          }
        }
      }
    });
  }
});

// Save shortcut to links array and update storage
function saveShortcutToLinks(links, name, url, icon, color) {
  const newShortcut = {
    name: name,
    url: url,
    icon: icon.toUpperCase().substring(0, 2),
    color: color
  };

  if (currentEditIndex >= 0 && currentEditIndex < links.length) {
    // Edit existing
    links[currentEditIndex] = newShortcut;
  } else {
    // Add new
    links.push(newShortcut);
  }

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.set({ quickLinks: links }, function() {
      loadQuickLinks();
      document.getElementById('shortcutModal').style.display = 'none';
    });
  } else {
    localStorage.setItem('quickLinks', JSON.stringify(links));
    loadQuickLinks();
    document.getElementById('shortcutModal').style.display = 'none';
  }
}

// Update clock and date display
function updateClockAndDate() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  // Update clock
  const clockElement = document.getElementById('clock');
  if (clockElement) {
    clockElement.textContent = `${hours}:${minutes}`;
  }

  // Update date - format like "Monday, January 1"
  const dateElement = document.getElementById('date');
  if (dateElement) {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateString = now.toLocaleDateString(undefined, options);
    dateElement.textContent = dateString;
  }
}

// Initialize theme from storage or system preference
function initTheme() {
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  let theme = 'light';

  // Try to get saved theme from chrome.storage
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(['theme'], function(data) {
      theme = data.theme || (prefersDarkScheme.matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    });
  } else {
    // Fallback to localStorage
    try {
      const savedTheme = localStorage.getItem('theme');
      theme = savedTheme || (prefersDarkScheme.matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      // If all else fails, use system preference
      theme = prefersDarkScheme.matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}

// Toggle between light and dark themes
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  document.documentElement.setAttribute('data-theme', newTheme);

  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.set({ theme: newTheme });
  } else {
    try {
      localStorage.setItem('theme', newTheme);
    } catch (e) {
      console.error('Could not save theme preference:', e);
    }
  }
}

// Default links data
function getDefaultLinks() {
  return [
    { name: 'Google', url: 'https://www.google.com', icon: 'G', color: '#d44a31' },
    {name: 'GPE Club', url: 'https://www.gpeclub.com', icon: 'GPE', color: '#be3cfa'},
    {name: 'PowerSchool', url: 'https://power.this.edu.cn/public/home.html', icon: 'PS', color: '#1a4379'},
    {name: 'Schoology', url: 'https://thisedu.schoology.com/home', icon: 'S', color: '#4a90e2'},
  ];
}

// Load quick links from storage
function loadQuickLinks() {
  const quickLinks = document.getElementById('quickLinks');
  if (!quickLinks) return;

  // Save a reference to the "Add shortcut" tile before clearing
  const addTile = document.getElementById('addShortcutTile');

  quickLinks.innerHTML = ''; // Clear any existing links

  // Function to create and append links
  function createLinks(links) {
    // Create link elements
    links.forEach((link, index) => {
      const shortcutTile = document.createElement('a');
      shortcutTile.className = 'shortcut-tile';
      shortcutTile.href = link.url;
      shortcutTile.title = link.name;

      // Prevent default when clicking edit button
      shortcutTile.addEventListener('click', function(e) {
        if (e.target.closest('.edit-btn')) {
          e.preventDefault();
        }
      });

      const icon = document.createElement('div');
      icon.className = 'shortcut-icon';
      icon.textContent = link.icon;
      if (link.color) {
        icon.style.backgroundColor = link.color;
      }

      const name = document.createElement('div');
      name.className = 'shortcut-name';
      name.textContent = link.name;

      // Add edit controls
      const controls = document.createElement('div');
      controls.className = 'shortcut-controls';

      const editBtn = document.createElement('button');
      editBtn.className = 'edit-btn';
      editBtn.innerHTML = '✏️';
      editBtn.addEventListener('click', function() {
        openShortcutModal(index, link);
      });

      controls.appendChild(editBtn);

      shortcutTile.appendChild(icon);
      shortcutTile.appendChild(name);
      shortcutTile.appendChild(controls);
      quickLinks.appendChild(shortcutTile);
    });

    // Re-create the "Add shortcut" tile if it was removed
    if (!document.getElementById('addShortcutTile')) {
      const newAddTile = document.createElement('div');
      newAddTile.id = 'addShortcutTile';
      newAddTile.className = 'add-shortcut-tile';
      newAddTile.innerHTML = `
        <div class="add-icon">+</div>
        <div class="shortcut-name">Add shortcut</div>
      `;
      newAddTile.addEventListener('click', function() {
        openShortcutModal();
      });

      quickLinks.appendChild(newAddTile);
    } else if (addTile) {
      // If we saved a reference to the original tile, append it
      quickLinks.appendChild(addTile);
    }
  }

  // Load from chrome.storage if available
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.sync.get(['quickLinks'], function(data) {
      const links = data.quickLinks || getDefaultLinks();
      createLinks(links);
    });
  } else {
    // Fallback to localStorage
    try {
      const savedLinks = localStorage.getItem('quickLinks');
      const links = savedLinks ? JSON.parse(savedLinks) : getDefaultLinks();
      createLinks(links);
    } catch (e) {
      console.error('Error loading quick links:', e);
      createLinks(getDefaultLinks());
    }
  }
}

// Open the modal for adding or editing a shortcut
function openShortcutModal(index = -1, shortcut = null) {
  const modalTitle = document.getElementById('modalTitle');
  const shortcutName = document.getElementById('shortcutName');
  const shortcutUrl = document.getElementById('shortcutUrl');
  const shortcutIcon = document.getElementById('shortcutIcon');
  const shortcutColor = document.getElementById('shortcutColor');
  const deleteButton = document.getElementById('deleteShortcut');
  const shortcutModal = document.getElementById('shortcutModal');

  if (!modalTitle || !shortcutName || !shortcutUrl || !shortcutIcon ||
      !shortcutColor || !deleteButton || !shortcutModal) {
    console.error('Missing modal elements');
    return;
  }

  currentEditIndex = index;

  if (shortcut) {
    // Edit mode
    modalTitle.textContent = 'Edit shortcut';
    shortcutName.value = shortcut.name;
    shortcutUrl.value = shortcut.url;
    shortcutIcon.value = shortcut.icon;
    shortcutColor.value = shortcut.color;
    deleteButton.style.display = 'block';
  } else {
    // Add mode
    modalTitle.textContent = 'Add shortcut';
    shortcutName.value = '';
    shortcutUrl.value = '';
    shortcutIcon.value = '';
    shortcutColor.value = '#10a37f';
    deleteButton.style.display = 'none';
  }

  shortcutModal.style.display = 'flex';
  shortcutModal.classList.add('show');
  shortcutName.focus();
}

chrome.storage.sync.get("defaultnewtab", function(storage) {
  if (storage.defaultnewtab) {
    // If the option is checked, load the default new tab page.
    chrome.tabs.update({ url: "chrome-search://local-ntp/local-ntp.html" });
  } else {
    // Load your custom new tab page logic here.
    // For example, load quick links, clock, date, theme etc.
    loadQuickLinks();
    updateClockAndDate();
    initTheme();
  }
});