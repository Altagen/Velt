<script lang="ts">
  import { showSettingsModal } from '../stores/settingsStore';
  import { currentTheme, reloadCurrentTheme } from '../stores/themeStore';
  import { settings } from '../stores/appStore';
  import { getTheme, listThemes, getConfig, saveConfig } from '../lib/theme';
  import { invoke } from '@tauri-apps/api/core';
  import type { Theme } from '@altagen/velt-core';
  import { getSystemFonts, getDefaultMonospaceFont } from '../lib/systemFonts';
  import { reloadImportedFonts, type ImportedFont } from '../lib/importedFonts';
  import { open } from '@tauri-apps/plugin-dialog';

  // Navigation state
  type Section = 'themes' | 'general' | 'shortcuts' | 'about';
  type ThemeView = 'list' | 'edit' | 'create';

  let activeSection: Section = 'general';

  // Keyboard shortcuts data
  const shortcuts = [
    { category: 'File', items: [
      { keys: 'Ctrl+N', action: 'New file' },
      { keys: 'Ctrl+O', action: 'Open file' },
      { keys: 'Ctrl+S', action: 'Save file' },
      { keys: 'Ctrl+Shift+S', action: 'Save as' },
      { keys: 'Ctrl+W', action: 'Close tab' },
      { keys: 'Ctrl+Shift+N', action: 'New window' },
    ]},
    { category: 'Edit', items: [
      { keys: 'Ctrl+Z', action: 'Undo' },
      { keys: 'Ctrl+Y', action: 'Redo' },
      { keys: 'Ctrl+X', action: 'Cut' },
      { keys: 'Ctrl+C', action: 'Copy' },
      { keys: 'Ctrl+V', action: 'Paste' },
      { keys: 'Ctrl+A', action: 'Select all' },
      { keys: 'Ctrl+D', action: 'Duplicate line' },
      { keys: 'Ctrl+Shift+K', action: 'Delete line' },
      { keys: 'Alt+↑', action: 'Move line up' },
      { keys: 'Alt+↓', action: 'Move line down' },
      { keys: 'Ctrl+/', action: 'Toggle comment' },
      { keys: 'Tab', action: 'Indent' },
      { keys: 'Shift+Tab', action: 'Outdent' },
    ]},
    { category: 'Search', items: [
      { keys: 'Ctrl+F', action: 'Find' },
      { keys: 'Ctrl+H', action: 'Find & Replace' },
      { keys: 'F3', action: 'Find next' },
      { keys: 'Shift+F3', action: 'Find previous' },
      { keys: 'Ctrl+G', action: 'Go to line' },
    ]},
    { category: 'Text Transform', items: [
      { keys: 'Alt+U', action: 'UPPERCASE' },
      { keys: 'Alt+L', action: 'lowercase' },
      { keys: 'Alt+T', action: 'Title Case' },
      { keys: 'Alt+I', action: 'iNVERT cASE' },
      { keys: 'F9', action: 'Sort lines A→Z' },
      { keys: 'F10', action: 'Sort lines Z→A' },
      { keys: 'Ctrl+Shift+D', action: 'Remove duplicate lines' },
      { keys: 'Alt+W', action: 'Trim trailing spaces' },
      { keys: 'Alt+B', action: 'Remove blank lines' },
    ]},
    { category: 'Bookmarks', items: [
      { keys: 'Ctrl+M', action: 'Toggle bookmark' },
      { keys: 'F2', action: 'Next bookmark' },
      { keys: 'Shift+F2', action: 'Previous bookmark' },
      { keys: 'Ctrl+Shift+M', action: 'Clear all bookmarks' },
    ]},
    { category: 'View', items: [
      { keys: 'Ctrl++', action: 'Zoom in' },
      { keys: 'Ctrl+-', action: 'Zoom out' },
      { keys: 'Ctrl+0', action: 'Reset zoom' },
      { keys: 'F11', action: 'Convert to LF' },
      { keys: 'F12', action: 'Convert to CRLF' },
    ]},
  ];

  // App info
  const appInfo = {
    name: 'Velt',
    version: '0.1.0',
    description: 'A modern, minimal notepad built with Tauri, Svelte, and CodeMirror.',
    repository: 'https://github.com/altagen/velt',
    license: 'MIT',
    authors: ['Altagen'],
    year: new Date().getFullYear(),
  };
  let themeView: ThemeView = 'list';

  // Themes data
  let availableThemes: string[] = [];
  let defaultThemes = ['default-dark', 'default-light'];
  let customThemes: string[] = [];
  let favoriteThemes: string[] = [];
  let defaultThemeName = 'default-dark';
  let activeThemeName = '';

  // Editor state
  let themeJson = '';
  let editingThemeName = '';
  let newThemeName = '';
  let isLoading = false;
  let isReadOnly = false;
  let errorMessage = '';
  let successMessage = '';

  // Load themes list when modal opens
  $: if ($showSettingsModal) {
    loadThemesList();
    loadFavorites();
  }

  async function loadThemesList() {
    try {
      availableThemes = await listThemes();
      customThemes = availableThemes
        .filter(name => !defaultThemes.includes(name) && name !== 'current')
        .sort((a, b) => a.localeCompare(b)); // Sort alphabetically

      // Load config to get default theme
      const config = await getConfig();
      defaultThemeName = config.theme || 'default-dark';

      // Try to determine active theme
      try {
        const currentThemeData = await invoke<Theme>('get_current_theme');
        activeThemeName = currentThemeData.name || '';
      } catch {
        activeThemeName = '';
      }
    } catch (error) {
      console.error('Failed to load themes list:', error);
      errorMessage = `Failed to load themes: ${error}`;
    }
  }

  // Sort favorites alphabetically
  $: sortedFavorites = [...favoriteThemes].sort((a, b) => a.localeCompare(b));

  async function loadFavorites() {
    try {
      const favorites = localStorage.getItem('velt-favorite-themes');
      if (favorites) {
        favoriteThemes = JSON.parse(favorites);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }

  function toggleFavorite(themeName: string) {
    if (favoriteThemes.includes(themeName)) {
      favoriteThemes = favoriteThemes.filter(name => name !== themeName);
    } else {
      favoriteThemes = [...favoriteThemes, themeName];
    }
    localStorage.setItem('velt-favorite-themes', JSON.stringify(favoriteThemes));
  }

  async function setAsStartupTheme(themeName: string) {
    try {
      const config = await getConfig();
      config.theme = themeName;
      await saveConfig(config);
      defaultThemeName = themeName;
      successMessage = `"${getDisplayName(themeName)}" will load on startup`;
      setTimeout(() => { successMessage = ''; }, 2000);
    } catch (error) {
      console.error('Failed to set startup theme:', error);
      errorMessage = `Failed to set startup theme: ${error}`;
    }
  }

  async function applyTheme(themeName: string) {
    try {
      errorMessage = '';
      const theme = await getTheme(themeName);

      // Save to current.json
      await invoke('save_current_theme', { theme });

      // Apply to editor
      currentTheme.set(theme);
      await reloadCurrentTheme();

      activeThemeName = theme.name;
      successMessage = `Applied theme: ${themeName}`;
      setTimeout(() => { successMessage = ''; }, 2000);
    } catch (error) {
      console.error('Failed to apply theme:', error);
      errorMessage = `Failed to apply theme: ${error}`;
    }
  }

  async function viewTheme(themeName: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    try {
      errorMessage = '';
      isLoading = true;
      editingThemeName = themeName;
      isReadOnly = true; // Read-only mode for built-in themes

      const theme = await getTheme(themeName);
      themeJson = JSON.stringify(theme, null, 2);
      themeView = 'edit';
      isLoading = false;
    } catch (error) {
      console.error('Failed to load theme for viewing:', error);
      errorMessage = `Failed to load theme: ${error}`;
      isLoading = false;
    }
  }

  async function editTheme(themeName: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

    try {
      errorMessage = '';
      isLoading = true;
      editingThemeName = themeName;
      isReadOnly = false; // Editable mode for custom themes

      const theme = await getTheme(themeName);
      themeJson = JSON.stringify(theme, null, 2);
      themeView = 'edit';
      isLoading = false;
    } catch (error) {
      console.error('Failed to load theme for editing:', error);
      errorMessage = `Failed to load theme: ${error}`;
      isLoading = false;
    }
  }

  function createNewTheme() {
    newThemeName = '';
    isReadOnly = false;
    themeJson = JSON.stringify({
      name: "New Theme",
      editor: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        lineHighlight: "#2d2d30",
        selection: "rgba(58, 110, 165, 0.3)",
        cursor: "#ffffff",
        selectionMatch: "rgba(100, 200, 100, 0.3)"
      },
      gutter: {
        background: "#1e1e1e",
        foreground: "#858585",
        border: "#3e3e42"
      },
      ui: {
        menuBar: "#2d2d30",
        tabBar: "#2d2d30",
        tabActive: "#1e1e1e",
        tabInactive: "#2d2d30",
        textColor: "#cccccc",
        textHoverColor: "#ffffff",
        textActiveColor: "#ffffff",
        background: "#252526",
        border: "#3e3e42",
        accent: "#4a9eff",
        accentHover: "#6eb4ff",
        accentPrimary: "#00d4aa",
        accentPrimaryHover: "#00ffcc",
        accentDanger: "#f48771",
        accentDangerHover: "#ff9b87",
        iconColor: "#858585",
        iconActiveColor: "#ffd700"
      }
    }, null, 2);
    themeView = 'create';
  }

  function handleThemeInput() {
    errorMessage = '';
    successMessage = '';

    try {
      const parsedTheme = JSON.parse(themeJson);
      if (!parsedTheme.editor || !parsedTheme.gutter || !parsedTheme.ui) {
        errorMessage = 'Invalid theme structure';
        return;
      }
      currentTheme.set(parsedTheme);
    } catch (error) {
      if (error instanceof SyntaxError) {
        errorMessage = `JSON Error: ${error.message}`;
      }
    }
  }

  async function saveEditedTheme() {
    try {
      errorMessage = '';
      successMessage = '';

      const parsedTheme = JSON.parse(themeJson);
      if (!parsedTheme.editor || !parsedTheme.gutter || !parsedTheme.ui) {
        errorMessage = 'Invalid theme structure';
        return;
      }

      // Save to current.json for immediate use
      await invoke('save_current_theme', { theme: parsedTheme });

      // If editing a custom theme, update it
      if (!defaultThemes.includes(editingThemeName)) {
        await invoke('save_custom_theme', { themeName: editingThemeName, theme: parsedTheme });
      }

      await reloadCurrentTheme();
      successMessage = 'Theme saved successfully!';
      setTimeout(() => {
        successMessage = '';
        themeView = 'list';
        loadThemesList();
      }, 1500);
    } catch (error) {
      console.error('Failed to save theme:', error);
      errorMessage = `Failed to save theme: ${error}`;
    }
  }

  async function saveNewTheme() {
    try {
      errorMessage = '';
      successMessage = '';

      if (!newThemeName.trim()) {
        errorMessage = 'Please enter a theme name';
        return;
      }

      const parsedTheme = JSON.parse(themeJson);
      if (!parsedTheme.editor || !parsedTheme.gutter || !parsedTheme.ui) {
        errorMessage = 'Invalid theme structure';
        return;
      }

      parsedTheme.name = newThemeName;

      await invoke('save_custom_theme', { themeName: newThemeName, theme: parsedTheme });
      await invoke('save_current_theme', { theme: parsedTheme });
      await reloadCurrentTheme();

      successMessage = `Theme "${newThemeName}" created successfully!`;
      setTimeout(() => {
        successMessage = '';
        themeView = 'list';
        loadThemesList();
      }, 1500);
    } catch (error) {
      console.error('Failed to create theme:', error);
      errorMessage = `Failed to create theme: ${error}`;
    }
  }

  async function deleteCustomTheme(themeName: string, event: Event) {
    event.stopPropagation();

    if (!confirm(`Are you sure you want to delete the theme "${themeName}"?`)) {
      return;
    }

    try {
      errorMessage = '';
      await invoke('delete_theme', { themeName });

      // Remove from favorites if present
      if (favoriteThemes.includes(themeName)) {
        toggleFavorite(themeName);
      }

      successMessage = `Theme "${themeName}" deleted`;
      setTimeout(() => { successMessage = ''; }, 2000);
      await loadThemesList();
    } catch (error) {
      console.error('Failed to delete theme:', error);
      errorMessage = `Failed to delete theme: ${error}`;
    }
  }

  function cancelEdit() {
    themeView = 'list';
    editingThemeName = '';
    newThemeName = '';
    isReadOnly = false;
    errorMessage = '';
    successMessage = '';
  }

  function handleCloseButton() {
    // If we're in edit/create view, go back to list
    // Otherwise, close the modal completely
    if (themeView !== 'list') {
      cancelEdit();
    } else {
      closeModal();
    }
  }

  function closeModal() {
    showSettingsModal.set(false);
    themeView = 'list';
    activeSection = 'general';
    editingThemeName = '';
    newThemeName = '';
    isReadOnly = false;
    errorMessage = '';
    successMessage = '';
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (themeView !== 'list') {
        cancelEdit();
      } else {
        closeModal();
      }
    }
  }

  // Helper to get display name
  function getDisplayName(themeName: string): string {
    if (themeName === 'default-dark') return 'Default Dark';
    if (themeName === 'default-light') return 'Default Light';
    return themeName.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // General settings handlers
  function toggleAutoSave() {
    settings.update(s => ({ ...s, autoSave: !s.autoSave }));
  }

  function updateAutoSaveDelay(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value);
    if (!isNaN(value) && value >= 100) {
      settings.update(s => ({ ...s, autoSaveDelay: value }));
    }
  }

  function incrementDelay() {
    settings.update(s => ({ ...s, autoSaveDelay: s.autoSaveDelay + 100 }));
  }

  function decrementDelay() {
    settings.update(s => ({ ...s, autoSaveDelay: Math.max(100, s.autoSaveDelay - 100) }));
  }

  // Custom font input
  let customFontInput = '';
  let systemFontsList: string[] = [];
  let showSystemFontsList = false;
  let loadingSystemFontsList = false;
  let systemFontsFilter = '';
  let showSuggestions = false;
  let fontInputFocused = false;

  // Imported fonts
  let importedFonts: ImportedFont[] = [];

  // Editor preferences handlers
  function updateFontFamily(event: Event) {
    const target = event.target as HTMLSelectElement;
    settings.update(s => ({ ...s, fontFamily: target.value }));
  }

  function applyCustomFont() {
    if (customFontInput.trim()) {
      // Add fallback to monospace
      const fontFamily = customFontInput.includes(',')
        ? customFontInput
        : `"${customFontInput.trim()}", monospace`;

      settings.update(s => ({ ...s, fontFamily }));
      console.log('[Settings] Applied custom font:', fontFamily);
    }
  }

  async function loadSystemFonts() {
    if (systemFontsList.length > 0) {
      // Already loaded, just toggle visibility
      showSystemFontsList = !showSystemFontsList;
      return;
    }

    loadingSystemFontsList = true;
    try {
      const fonts = await invoke<string[]>('list_system_fonts');
      systemFontsList = fonts;
      showSystemFontsList = true;
      console.log(`[Settings] Loaded ${fonts.length} system fonts`);
    } catch (error) {
      console.error('[Settings] Failed to load system fonts:', error);
      errorMessage = `Failed to load system fonts: ${error}`;
    } finally {
      loadingSystemFontsList = false;
    }
  }

  // Load fonts when user focuses on input
  async function handleFontInputFocus() {
    fontInputFocused = true;
    if (systemFontsList.length === 0 && !loadingSystemFontsList) {
      loadingSystemFontsList = true;
      try {
        const fonts = await invoke<string[]>('list_system_fonts');
        systemFontsList = fonts;
        console.log(`[Settings] Loaded ${fonts.length} system fonts`);
      } catch (error) {
        console.error('[Settings] Failed to load system fonts:', error);
      } finally {
        loadingSystemFontsList = false;
      }
    }
  }

  function handleFontInputBlur() {
    // Delay to allow clicking on suggestions
    setTimeout(() => {
      fontInputFocused = false;
      showSuggestions = false;
    }, 200);
  }

  function handleFontInputChange() {
    if (customFontInput.length > 0 && systemFontsList.length > 0) {
      showSuggestions = true;
    } else {
      showSuggestions = false;
    }
  }

  function selectSystemFont(fontName: string) {
    const fontFamily = `"${fontName}", monospace`;
    settings.update(s => ({ ...s, fontFamily }));
    customFontInput = fontName;
    showSystemFontsList = false;
    showSuggestions = false;
    console.log('[Settings] Selected system font:', fontFamily);
  }

  // Computed filtered system fonts based on input
  $: autocompleteSuggestions = customFontInput && systemFontsList.length > 0
    ? systemFontsList
        .filter(font => font.toLowerCase().includes(customFontInput.toLowerCase()))
        .slice(0, 20) // Limit to 20 suggestions
    : [];

  // Show suggestions when typing and there are matches
  $: if (customFontInput.length > 0 && autocompleteSuggestions.length > 0 && fontInputFocused) {
    showSuggestions = true;
  }

  // Computed filtered system fonts for browse view
  $: filteredSystemFonts = systemFontsFilter
    ? systemFontsList.filter(font =>
        font.toLowerCase().includes(systemFontsFilter.toLowerCase())
      )
    : systemFontsList;

  // Load imported fonts when modal opens
  $: if ($showSettingsModal) {
    loadImportedFontsList();
  }

  async function loadImportedFontsList() {
    try {
      importedFonts = await invoke<ImportedFont[]>('list_imported_fonts');
    } catch (error) {
      console.error('[Settings] Failed to load imported fonts:', error);
      importedFonts = [];
    }
  }

  async function importFontFile() {
    try {
      // Open file dialog to select font file
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Font Files',
          extensions: ['ttf', 'otf', 'woff', 'woff2']
        }]
      });

      if (!selected) return; // User cancelled

      const files = Array.isArray(selected) ? selected : [selected];

      for (const filePath of files) {
        try {
          // Import font via Rust backend
          const imported = await invoke<ImportedFont>('import_font', { sourcePath: filePath });
          console.log('[Settings] Imported font:', imported.name);
        } catch (error) {
          console.error(`[Settings] Failed to import ${filePath}:`, error);
          errorMessage = `Failed to import font: ${error}`;
        }
      }

      // Reload fonts list and reload @font-face rules
      await loadImportedFontsList();
      await reloadImportedFonts();

      successMessage = `Imported ${files.length} font${files.length > 1 ? 's' : ''}`;
      setTimeout(() => { successMessage = ''; }, 2000);
    } catch (error) {
      console.error('[Settings] Font import dialog error:', error);
      errorMessage = `Failed to open file dialog: ${error}`;
    }
  }

  async function deleteFont(filename: string) {
    try {
      await invoke('delete_imported_font', { filename });
      console.log('[Settings] Deleted font:', filename);

      // Reload fonts list and @font-face rules
      await loadImportedFontsList();
      await reloadImportedFonts();

      successMessage = 'Font deleted successfully';
      setTimeout(() => { successMessage = ''; }, 2000);
    } catch (error) {
      console.error('[Settings] Failed to delete font:', error);
      errorMessage = `Failed to delete font: ${error}`;
    }
  }

  function updateTabSize(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = parseInt(target.value);
    settings.update(s => ({ ...s, tabSize: value }));
  }

  function toggleWordWrap() {
    settings.update(s => ({ ...s, wordWrap: !s.wordWrap }));
  }

  function toggleShowInvisibles() {
    settings.update(s => ({ ...s, showInvisibles: !s.showInvisibles }));
  }

  // Available font families
  // Get system fonts
  const systemFonts = getSystemFonts();
  const defaultFont = getDefaultMonospaceFont();

  const fontFamilies = [
    // System Default (auto-detected based on OS)
    { value: defaultFont, label: 'System Default (Recommended)' },

    // Bundled Web Fonts (always available)
    { value: '"Fira Code", monospace', label: 'Fira Code (Bundled)' },
    { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono (Bundled)' },
    { value: '"Source Code Pro", monospace', label: 'Source Code Pro (Bundled)' },
    { value: '"Cascadia Code", "Cascadia Mono", monospace', label: 'Cascadia Code (Bundled)' },
    { value: '"Ubuntu Mono", "Liberation Mono", monospace', label: 'Ubuntu Mono (Bundled)' },

    // System Fonts (may be available depending on OS)
    { value: 'SF Mono, Monaco, Menlo, monospace', label: 'SF Mono (macOS System)' },
    { value: 'Consolas, "Courier New", monospace', label: 'Consolas (Windows System)' },

    // Fallback
    { value: '"Courier New", Courier, monospace', label: 'Courier New' },
    { value: 'monospace', label: 'Generic Monospace' },
  ];
</script>

<svelte:window on:keydown={handleEscape} />

{#if $showSettingsModal}
  <div class="modal-overlay" on:click={handleOverlayClick}>
    <div
      class="modal"
      style="background-color: {$currentTheme?.ui?.background || '#252526'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
    >
      <div
        class="modal-header"
        style="background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}"
      >
        <h2>Settings</h2>
        <button
          class="close-button"
          style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}"
          on:click={handleCloseButton}
        >
          ×
        </button>
      </div>

      <div class="modal-body">
        <!-- Sidebar -->
        <div
          class="sidebar"
          style="background-color: {$currentTheme?.ui?.tabBar || '#2d2d30'}"
        >
          <button
            class="sidebar-item"
            class:active={activeSection === 'general'}
            on:click={() => activeSection = 'general'}
            style="
              color: {activeSection === 'general' ? ($currentTheme?.ui?.textActiveColor || '#ffffff') : ($currentTheme?.ui?.textColor || '#d4d4d4')};
              {activeSection === 'general' ? `background-color: ${$currentTheme?.ui?.sidebarActive || '#1e1e1e'}; border-left: 3px solid ${$currentTheme?.ui?.sidebarActiveBorder || '#00d4aa'};` : ''}
            "
          >
            General
          </button>
          <button
            class="sidebar-item"
            class:active={activeSection === 'themes'}
            on:click={() => activeSection = 'themes'}
            style="
              color: {activeSection === 'themes' ? ($currentTheme?.ui?.textActiveColor || '#ffffff') : ($currentTheme?.ui?.textColor || '#d4d4d4')};
              {activeSection === 'themes' ? `background-color: ${$currentTheme?.ui?.sidebarActive || '#1e1e1e'}; border-left: 3px solid ${$currentTheme?.ui?.sidebarActiveBorder || '#00d4aa'};` : ''}
            "
          >
            Themes
          </button>
          <button
            class="sidebar-item"
            class:active={activeSection === 'shortcuts'}
            on:click={() => activeSection = 'shortcuts'}
            style="
              color: {activeSection === 'shortcuts' ? ($currentTheme?.ui?.textActiveColor || '#ffffff') : ($currentTheme?.ui?.textColor || '#d4d4d4')};
              {activeSection === 'shortcuts' ? `background-color: ${$currentTheme?.ui?.sidebarActive || '#1e1e1e'}; border-left: 3px solid ${$currentTheme?.ui?.sidebarActiveBorder || '#00d4aa'};` : ''}
            "
          >
            Shortcuts
          </button>
          <button
            class="sidebar-item"
            class:active={activeSection === 'about'}
            on:click={() => activeSection = 'about'}
            style="
              color: {activeSection === 'about' ? ($currentTheme?.ui?.textActiveColor || '#ffffff') : ($currentTheme?.ui?.textColor || '#d4d4d4')};
              {activeSection === 'about' ? `background-color: ${$currentTheme?.ui?.sidebarActive || '#1e1e1e'}; border-left: 3px solid ${$currentTheme?.ui?.sidebarActiveBorder || '#00d4aa'};` : ''}
            "
          >
            About
          </button>
        </div>

        <!-- Content -->
        <div
          class="content"
          style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}"
        >
          {#if activeSection === 'themes'}
            {#if themeView === 'list'}
              <!-- Themes List View -->
              <div class="themes-list">
                <div class="section-header">
                  <h3 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">Themes</h3>
                  <button
                    class="btn btn-primary"
                    on:click={createNewTheme}
                    style="background-color: {$currentTheme?.ui?.accent || '#0e639c'}; color: {$currentTheme?.editor?.background || '#ffffff'}"
                  >
                    + New Theme
                  </button>
                </div>

                <!-- Built-in Themes -->
                <div class="themes-section">
                  <h4 style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Built-in Themes</h4>
                  <div class="theme-grid">
                    {#each defaultThemes as themeName}
                      <div
                        class="theme-card"
                        class:active={activeThemeName.toLowerCase().includes(themeName.split('-')[1])}
                        style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                      >
                        <div class="theme-card-main">
                          <div class="theme-info">
                            <span class="theme-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">{getDisplayName(themeName)}</span>
                            <div class="theme-badges">
                              {#if defaultThemeName === themeName}
                                <span class="theme-badge default">Startup</span>
                              {/if}
                              <span class="theme-badge builtin">Built-in</span>
                            </div>
                          </div>
                          <button
                            class="icon-btn"
                            class:active={favoriteThemes.includes(themeName)}
                            on:click={(e) => {
                              e.stopPropagation();
                              toggleFavorite(themeName);
                            }}
                            title={favoriteThemes.includes(themeName) ? "Remove from favorites" : "Add to favorites"}
                            style="--icon-color: {$currentTheme?.ui?.iconColor || '#858585'}; --icon-active-color: {$currentTheme?.ui?.iconActiveColor || '#ffd700'}; color: {favoriteThemes.includes(themeName) ? ($currentTheme?.ui?.iconActiveColor || '#ffd700') : ($currentTheme?.ui?.iconColor || '#858585')}"
                          >
                            {favoriteThemes.includes(themeName) ? '★' : '☆'}
                          </button>
                        </div>
                        <div
                          class="theme-actions-bar"
                          style="background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                        >
                          <button
                            class="action-link primary"
                            on:click={(e) => {
                              e.stopPropagation();
                              applyTheme(themeName);
                            }}
                            style="--accent-primary: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}; --accent-primary-hover: {$currentTheme?.ui?.accentPrimaryHover || '#00ffcc'}; color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"
                          >
                            Apply Theme
                          </button>
                          <button
                            class="action-link"
                            on:click={(e) => viewTheme(themeName, e)}
                            style="--accent: {$currentTheme?.ui?.accent || '#4a9eff'}; --accent-hover: {$currentTheme?.ui?.accentHover || '#6eb4ff'}; color: {$currentTheme?.ui?.accent || '#4a9eff'}"
                          >
                            View Theme
                          </button>
                          {#if themeName !== defaultThemeName}
                            <button
                              class="action-link"
                              on:click={(e) => {
                                e.stopPropagation();
                                setAsStartupTheme(themeName);
                              }}
                              style="--accent: {$currentTheme?.ui?.accent || '#4a9eff'}; --accent-hover: {$currentTheme?.ui?.accentHover || '#6eb4ff'}; color: {$currentTheme?.ui?.accent || '#4a9eff'}"
                            >
                              Set Default
                            </button>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>

                <!-- Custom Themes -->
                {#if customThemes.length > 0}
                  <div class="themes-section">
                    <h4 style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Custom Themes</h4>
                    <div class="theme-grid">
                      <!-- Favorites first (with star), then others alphabetically -->
                      {#each sortedFavorites.filter(name => customThemes.includes(name)) as themeName}
                        <div
                          class="theme-card"
                          class:active={activeThemeName === themeName}
                          style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                        >
                          <div class="theme-card-main">
                            <div class="theme-info">
                              <span class="theme-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">{getDisplayName(themeName)}</span>
                              <div class="theme-badges">
                                {#if defaultThemeName === themeName}
                                  <span class="theme-badge default">Startup</span>
                                {/if}
                                <span class="theme-badge custom">Custom</span>
                              </div>
                            </div>
                            <button
                              class="icon-btn active"
                              on:click={(e) => {
                                e.stopPropagation();
                                toggleFavorite(themeName);
                              }}
                              title="Remove from favorites"
                              style="--icon-color: {$currentTheme?.ui?.iconColor || '#858585'}; --icon-active-color: {$currentTheme?.ui?.iconActiveColor || '#ffd700'}; color: {$currentTheme?.ui?.iconActiveColor || '#ffd700'}"
                            >
                              ★
                            </button>
                          </div>
                          <div
                            class="theme-actions-bar"
                            style="background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                          >
                            <button
                              class="action-link primary"
                              on:click={(e) => {
                                e.stopPropagation();
                                applyTheme(themeName);
                              }}
                              style="--accent-primary: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}; --accent-primary-hover: {$currentTheme?.ui?.accentPrimaryHover || '#00ffcc'}; color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"
                            >
                              Apply Theme
                            </button>
                            <button
                              class="action-link"
                              on:click={(e) => editTheme(themeName, e)}
                              style="--accent: {$currentTheme?.ui?.accent || '#4a9eff'}; --accent-hover: {$currentTheme?.ui?.accentHover || '#6eb4ff'}; color: {$currentTheme?.ui?.accent || '#4a9eff'}"
                            >
                              Edit
                            </button>
                            {#if themeName !== defaultThemeName}
                              <button
                                class="action-link"
                                on:click={(e) => {
                                  e.stopPropagation();
                                  setAsStartupTheme(themeName);
                                }}
                                style="--accent: {$currentTheme?.ui?.accent || '#4a9eff'}; --accent-hover: {$currentTheme?.ui?.accentHover || '#6eb4ff'}; color: {$currentTheme?.ui?.accent || '#4a9eff'}"
                              >
                                Set Default
                              </button>
                            {/if}
                            <button
                              class="action-link danger"
                              on:click={(e) => deleteCustomTheme(themeName, e)}
                              style="--accent-danger: {$currentTheme?.ui?.accentDanger || '#f48771'}; --accent-danger-hover: {$currentTheme?.ui?.accentDangerHover || '#ff9b87'}; color: {$currentTheme?.ui?.accentDanger || '#f48771'}"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      {/each}
                      <!-- Non-favorite themes -->
                      {#each customThemes.filter(name => !sortedFavorites.includes(name)) as themeName}
                        <div
                          class="theme-card"
                          class:active={activeThemeName === themeName}
                          style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                        >
                          <div class="theme-card-main">
                            <div class="theme-info">
                              <span class="theme-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">{getDisplayName(themeName)}</span>
                              <div class="theme-badges">
                                {#if defaultThemeName === themeName}
                                  <span class="theme-badge default">Startup</span>
                                {/if}
                                <span class="theme-badge custom">Custom</span>
                              </div>
                            </div>
                            <button
                              class="icon-btn"
                              on:click={(e) => {
                                e.stopPropagation();
                                toggleFavorite(themeName);
                              }}
                              title="Add to favorites"
                              style="--icon-color: {$currentTheme?.ui?.iconColor || '#858585'}; --icon-active-color: {$currentTheme?.ui?.iconActiveColor || '#ffd700'}; color: {$currentTheme?.ui?.iconColor || '#858585'}"
                            >
                              ☆
                            </button>
                          </div>
                          <div
                            class="theme-actions-bar"
                            style="background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                          >
                            <button
                              class="action-link primary"
                              on:click={(e) => {
                                e.stopPropagation();
                                applyTheme(themeName);
                              }}
                              style="--accent-primary: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}; --accent-primary-hover: {$currentTheme?.ui?.accentPrimaryHover || '#00ffcc'}; color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"
                            >
                              Apply Theme
                            </button>
                            <button
                              class="action-link"
                              on:click={(e) => editTheme(themeName, e)}
                              style="--accent: {$currentTheme?.ui?.accent || '#4a9eff'}; --accent-hover: {$currentTheme?.ui?.accentHover || '#6eb4ff'}; color: {$currentTheme?.ui?.accent || '#4a9eff'}"
                            >
                              Edit
                            </button>
                            {#if themeName !== defaultThemeName}
                              <button
                                class="action-link"
                                on:click={(e) => {
                                  e.stopPropagation();
                                  setAsStartupTheme(themeName);
                                }}
                                style="--accent: {$currentTheme?.ui?.accent || '#4a9eff'}; --accent-hover: {$currentTheme?.ui?.accentHover || '#6eb4ff'}; color: {$currentTheme?.ui?.accent || '#4a9eff'}"
                              >
                                Set Default
                              </button>
                            {/if}
                            <button
                              class="action-link danger"
                              on:click={(e) => deleteCustomTheme(themeName, e)}
                              style="--accent-danger: {$currentTheme?.ui?.accentDanger || '#f48771'}; --accent-danger-hover: {$currentTheme?.ui?.accentDangerHover || '#ff9b87'}; color: {$currentTheme?.ui?.accentDanger || '#f48771'}"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              </div>
            {:else if themeView === 'edit'}
              <!-- Edit Theme View -->
              <div class="theme-editor">
                <div class="editor-header">
                  <h3 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
                    {isReadOnly ? 'View' : 'Edit'} Theme: {getDisplayName(editingThemeName)}
                  </h3>
                  <p class="hint" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
                    {#if isReadOnly}
                      Viewing built-in theme in read-only mode. Use "Set as Default" to apply it at startup.
                    {:else}
                      Edit and preview in real-time. Click Save to persist changes.
                    {/if}
                  </p>
                </div>

                {#if isLoading}
                  <div class="loading" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Loading theme...</div>
                {:else}
                  <textarea
                    class="json-editor"
                    class:readonly={isReadOnly}
                    bind:value={themeJson}
                    on:input={isReadOnly ? undefined : handleThemeInput}
                    readonly={isReadOnly}
                    spellcheck="false"
                    placeholder="Enter theme JSON..."
                    style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; color: {$currentTheme?.editor?.foreground || '#d4d4d4'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                  ></textarea>


                  <div class="actions">
                    <button
                    class="btn btn-secondary"
                    on:click={cancelEdit}
                    style="background-color: {$currentTheme?.ui?.tabInactive || '#3e3e42'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}"
                  >
                      Back
                    </button>
                    {#if !isReadOnly}
                      <button
                      class="btn btn-primary"
                      on:click={saveEditedTheme}
                      style="background-color: {$currentTheme?.ui?.accent || '#0e639c'}; color: #ffffff"
                    >
                        Save Theme
                      </button>
                    {/if}
                  </div>
                {/if}
              </div>
            {:else if themeView === 'create'}
              <!-- Create Theme View -->
              <div class="theme-editor">
                <div class="editor-header">
                  <h3 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">Create New Theme</h3>
                  <p class="hint" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Give your theme a name and customize the colors.</p>
                </div>

                <div class="form-group">
                  <label for="theme-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">Theme Name</label>
                  <input
                    id="theme-name"
                    type="text"
                    class="text-input"
                    bind:value={newThemeName}
                    placeholder="my-awesome-theme"
                    style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; color: {$currentTheme?.editor?.foreground || '#d4d4d4'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                  />
                </div>

                <textarea
                  class="json-editor"
                  bind:value={themeJson}
                  on:input={handleThemeInput}
                  spellcheck="false"
                  placeholder="Enter theme JSON..."
                  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; color: {$currentTheme?.editor?.foreground || '#d4d4d4'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                ></textarea>

                {#if errorMessage}
                  <div class="message error">{errorMessage}</div>
                {/if}
                {#if successMessage}
                  <div class="message success">{successMessage}</div>
                {/if}

                <div class="actions">
                  <button
                    class="btn btn-secondary"
                    on:click={cancelEdit}
                    style="background-color: {$currentTheme?.ui?.tabInactive || '#3e3e42'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}"
                  >
                    Cancel
                  </button>
                  <button
                    class="btn btn-primary"
                    on:click={saveNewTheme}
                    style="background-color: {$currentTheme?.ui?.accent || '#0e639c'}; color: #ffffff"
                  >
                    Create Theme
                  </button>
                </div>
              </div>
            {/if}
          {:else if activeSection === 'general'}
            <div class="general-settings">
              <h3 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">General Settings</h3>

              <!-- Auto-save Settings -->
              <div class="settings-section">
                <h4 style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Auto-Save</h4>

                <div
                  class="setting-card"
                  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                >
                  <div class="setting-card-header">
                    <div class="setting-info">
                      <h5 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
                        Enable Auto-Save
                      </h5>
                      <p style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
                        Automatically save changes to files after a delay
                      </p>
                    </div>
                    <label class="toggle-switch">
                      <input
                        type="checkbox"
                        checked={$settings.autoSave}
                        on:change={toggleAutoSave}
                      />
                      <span class="toggle-slider" style="--toggle-bg: {$currentTheme?.ui?.border || '#3e3e42'}; --toggle-active: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"></span>
                    </label>
                  </div>

                  {#if $settings.autoSave}
                    <div
                      class="setting-card-footer"
                      style="background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                    >
                      <label style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
                        Delay (ms):
                      </label>
                      <div class="number-control">
                        <button
                          class="number-btn"
                          on:click={decrementDelay}
                          style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}"
                          title="Decrease delay"
                        >
                          −
                        </button>
                        <input
                          type="text"
                          inputmode="numeric"
                          value={$settings.autoSaveDelay}
                          on:input={updateAutoSaveDelay}
                          class="number-input"
                          style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}"
                          readonly
                        />
                        <button
                          class="number-btn"
                          on:click={incrementDelay}
                          style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}"
                          title="Increase delay"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Editor Settings -->
              <div class="settings-section">
                <h4 style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Editor</h4>

                <!-- Font Family - Preset Fonts -->
                <div
                  class="setting-card"
                  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                >
                  <div class="setting-card-header">
                    <div class="setting-info">
                      <h5 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
                        Font Family - Preset Fonts
                      </h5>
                      <p style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
                        Choose from bundled and system fonts
                      </p>
                    </div>
                    <select
                      class="font-select"
                      value={$settings.fontFamily}
                      on:change={updateFontFamily}
                      style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}; min-width: 250px;"
                    >
                      {#each fontFamilies as font}
                        <option value={font.value}>{font.label}</option>
                      {/each}
                    </select>
                  </div>
                </div>

                <!-- Custom System Font -->
                <div
                  class="setting-card"
                  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                >
                  <div class="setting-card-header">
                    <div class="setting-info">
                      <h5 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
                        OR Use Custom System Font
                      </h5>
                      <p style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
                        Start typing to see suggestions
                      </p>
                    </div>
                    <div class="font-input-container">
                      <div style="display: flex; gap: 8px;">
                        <input
                          type="text"
                          bind:value={customFontInput}
                          on:focus={handleFontInputFocus}
                          on:blur={handleFontInputBlur}
                          on:input={handleFontInputChange}
                          on:keydown={(e) => e.key === 'Enter' && applyCustomFont()}
                          placeholder="Type to search fonts..."
                          style="flex: 1; background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border: 1px solid {$currentTheme?.ui?.border || '#3e3e42'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}; padding: 8px 12px; border-radius: 4px; font-size: 13px;"
                        />
                        <button
                          on:click={loadSystemFonts}
                          disabled={loadingSystemFontsList}
                          style="background-color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}; color: {$currentTheme?.editor?.background || '#1e1e1e'}; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 13px; white-space: nowrap;"
                        >
                          {loadingSystemFontsList ? 'Loading...' : showSystemFontsList ? 'Hide All' : 'Browse All'}
                        </button>
                      </div>

                      <!-- Autocomplete suggestions dropdown -->
                      {#if showSuggestions && autocompleteSuggestions.length > 0}
                        <div
                          class="font-autocomplete-dropdown"
                          style="background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'};"
                        >
                          {#each autocompleteSuggestions as font}
                            <button
                              class="font-suggestion-item"
                              on:click={() => selectSystemFont(font)}
                              style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}; border-bottom-color: {$currentTheme?.ui?.border || '#3e3e42'}; font-family: '{font}', monospace;"
                            >
                              {font}
                            </button>
                          {/each}
                          <div
                            class="font-suggestion-footer"
                            style="color: {$currentTheme?.ui?.textSecondary || '#858585'}; background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-top-color: {$currentTheme?.ui?.border || '#3e3e42'};"
                          >
                            {autocompleteSuggestions.length} / {systemFontsList.length} fonts
                          </div>
                        </div>
                      {/if}

                      {#if loadingSystemFontsList && customFontInput.length > 0}
                        <small style="color: {$currentTheme?.ui?.textSecondary || '#858585'}; font-size: 11px;">
                          Loading system fonts...
                        </small>
                      {/if}
                    </div>
                  </div>

                  <!-- System fonts browser (full view) -->
                  {#if showSystemFontsList}
                    <div style="margin-top: 12px; padding: 8px; background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; border: 1px solid {$currentTheme?.ui?.border || '#3e3e42'}; border-radius: 4px;">
                      <!-- Search filter -->
                      <input
                        type="text"
                        bind:value={systemFontsFilter}
                        placeholder="Search fonts..."
                        style="width: 100%; background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border: 1px solid {$currentTheme?.ui?.border || '#3e3e42'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}; padding: 6px 12px; border-radius: 4px; font-size: 13px; margin-bottom: 8px;"
                      />

                      <!-- Font list -->
                      <div style="max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px;">
                        {#each filteredSystemFonts as font}
                          <button
                            on:click={() => selectSystemFont(font)}
                            style="background-color: transparent; border: none; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}; padding: 6px 12px; text-align: left; cursor: pointer; border-radius: 3px; font-family: '{font}', monospace; font-size: 13px;"
                            on:mouseenter={(e) => e.currentTarget.style.backgroundColor = $currentTheme?.editor?.selection || '#264f78'}
                            on:mouseleave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {font}
                          </button>
                        {:else}
                          <p style="color: {$currentTheme?.ui?.textSecondary || '#858585'}; padding: 12px; text-align: center; font-size: 12px;">
                            {systemFontsFilter ? 'No fonts match your search' : 'No fonts found'}
                          </p>
                        {/each}
                      </div>

                      <small style="display: block; color: {$currentTheme?.ui?.textSecondary || '#858585'}; font-size: 11px; margin-top: 8px; padding: 4px;">
                        {filteredSystemFonts.length} font{filteredSystemFonts.length !== 1 ? 's' : ''} available
                        {systemFontsFilter ? ` (filtered from ${systemFontsList.length})` : ''}
                      </small>
                    </div>
                  {/if}
                </div>

                <!-- Import Fonts -->
                <div
                  class="setting-card"
                  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                >
                  <div class="setting-card-header">
                    <div class="setting-info">
                      <h5 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
                        Import Fonts
                      </h5>
                      <p style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
                        Add custom font files (TTF, OTF, WOFF, WOFF2)
                      </p>
                    </div>
                    <button
                      on:click={importFontFile}
                      style="background-color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}; color: {$currentTheme?.editor?.background || '#1e1e1e'}; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500;"
                    >
                      Import Font...
                    </button>
                  </div>

                  <!-- List of imported fonts -->
                  {#if importedFonts.length > 0}
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid {$currentTheme?.ui?.border || '#3e3e42'};">
                      <small style="color: {$currentTheme?.ui?.textSecondary || '#858585'}; font-size: 12px; display: block; margin-bottom: 8px;">
                        Imported Fonts ({importedFonts.length})
                      </small>
                      <div style="display: flex; flex-direction: column; gap: 4px;">
                        {#each importedFonts as font}
                          <div style="display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; border-radius: 4px;">
                            <span style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}; font-size: 13px; font-family: '{font.name}', monospace;">
                              {font.name}
                            </span>
                            <div style="display: flex; gap: 8px;">
                              <button
                                on:click={() => selectSystemFont(font.name)}
                                style="background-color: transparent; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}; border: 1px solid {$currentTheme?.ui?.border || '#3e3e42'}; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;"
                              >
                                Use
                              </button>
                              <button
                                on:click={() => deleteFont(font.filename)}
                                style="background-color: transparent; color: #f48771; border: 1px solid #f48771; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>

                <!-- Tab Size -->
                <div
                  class="setting-card"
                  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                >
                  <div class="setting-card-header">
                    <div class="setting-info">
                      <h5 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
                        Tab Size
                      </h5>
                      <p style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
                        Number of spaces per tab
                      </p>
                    </div>
                    <select
                      class="tab-size-select"
                      value={$settings.tabSize}
                      on:change={updateTabSize}
                      style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}"
                    >
                      <option value={2}>2 spaces</option>
                      <option value={4}>4 spaces</option>
                      <option value={8}>8 spaces</option>
                    </select>
                  </div>
                </div>

                <!-- Word Wrap -->
                <div
                  class="setting-card"
                  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                >
                  <div class="setting-card-header">
                    <div class="setting-info">
                      <h5 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
                        Word Wrap
                      </h5>
                      <p style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
                        Wrap long lines to fit within the editor
                      </p>
                    </div>
                    <label class="toggle-switch">
                      <input
                        type="checkbox"
                        checked={$settings.wordWrap}
                        on:change={toggleWordWrap}
                      />
                      <span class="toggle-slider" style="--toggle-bg: {$currentTheme?.ui?.border || '#3e3e42'}; --toggle-active: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"></span>
                    </label>
                  </div>
                </div>

                <!-- Show Invisibles -->
                <div
                  class="setting-card"
                  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                >
                  <div class="setting-card-header">
                    <div class="setting-info">
                      <h5 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
                        Show Invisibles
                      </h5>
                      <p style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
                        Display whitespace characters (spaces, tabs)
                      </p>
                    </div>
                    <label class="toggle-switch">
                      <input
                        type="checkbox"
                        checked={$settings.showInvisibles}
                        on:change={toggleShowInvisibles}
                      />
                      <span class="toggle-slider" style="--toggle-bg: {$currentTheme?.ui?.border || '#3e3e42'}; --toggle-active: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          {:else if activeSection === 'shortcuts'}
            <div class="shortcuts-section">
              <h3 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">Keyboard Shortcuts</h3>
              <p class="shortcuts-intro" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
                Quick reference for all available keyboard shortcuts.
              </p>

              <div class="shortcuts-grid">
                {#each shortcuts as category}
                  <div
                    class="shortcuts-category"
                    style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                  >
                    <h4 style="color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}">{category.category}</h4>
                    <table class="shortcuts-table">
                      <tbody>
                        {#each category.items as shortcut}
                          <tr>
                            <td class="shortcut-keys" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
                              <kbd style="background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}">{shortcut.keys}</kbd>
                            </td>
                            <td class="shortcut-action" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">{shortcut.action}</td>
                          </tr>
                        {/each}
                      </tbody>
                    </table>
                  </div>
                {/each}
              </div>
            </div>
          {:else if activeSection === 'about'}
            <div class="about-section">
              <div class="about-header">
                <div class="about-logo">
                  <img src="/velt-logo.png" alt="Velt Logo" />
                </div>
                <div class="about-title">
                  <h2 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">{appInfo.name}</h2>
                  <span class="version-badge" style="background-color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}; color: {$currentTheme?.editor?.background || '#1e1e1e'}">
                    v{appInfo.version}
                  </span>
                </div>
              </div>

              <p class="about-description" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
                {appInfo.description}
              </p>

              <div class="about-cards">
                <div
                  class="about-card"
                  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                >
                  <h4 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">License</h4>
                  <div class="license-content" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
                    <p class="license-type" style="color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}">{appInfo.license} License</p>
                    <p class="license-text">
                      Copyright © {appInfo.year} {appInfo.authors.join(', ')}
                    </p>
                    <p class="license-text">
                      Permission is hereby granted, free of charge, to any person obtaining a copy
                      of this software and associated documentation files (the "Software"), to deal
                      in the Software without restriction, including without limitation the rights
                      to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                      copies of the Software, and to permit persons to whom the Software is
                      furnished to do so, subject to the following conditions:
                    </p>
                    <p class="license-text">
                      The above copyright notice and this permission notice shall be included in all
                      copies or substantial portions of the Software.
                    </p>
                    <p class="license-text license-disclaimer">
                      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
                    </p>
                  </div>
                </div>

                <div
                  class="about-card"
                  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
                >
                  <h4 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">Built With</h4>
                  <div class="tech-stack">
                    <div class="tech-item">
                      <span class="tech-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">Tauri</span>
                      <span class="tech-desc" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Desktop framework</span>
                    </div>
                    <div class="tech-item">
                      <span class="tech-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">Rust</span>
                      <span class="tech-desc" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Backend</span>
                    </div>
                    <div class="tech-item">
                      <span class="tech-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">Svelte</span>
                      <span class="tech-desc" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">UI framework</span>
                    </div>
                    <div class="tech-item">
                      <span class="tech-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">CodeMirror 6</span>
                      <span class="tech-desc" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Editor engine</span>
                    </div>
                    <div class="tech-item">
                      <span class="tech-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">TypeScript</span>
                      <span class="tech-desc" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Language</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="about-footer" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
                <p>Made with ❤️ by the Velt team</p>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Toast notifications (fixed position) -->
  {#if errorMessage}
    <div class="toast toast-error">{errorMessage}</div>
  {/if}
  {#if successMessage}
    <div class="toast toast-success">{successMessage}</div>
  {/if}
{/if}

<style>
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background-color: #252526;
    border: 1px solid #3e3e42;
    border-radius: 8px;
    width: 90%;
    max-width: 1000px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  }

  .modal-header h2 {
    margin: 0;
    font-size: 18px;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 28px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.1s;
  }

  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .modal-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  .sidebar {
    width: 200px;
    border-right: 1px solid rgba(0, 0, 0, 0.3);
    padding: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sidebar-item {
    background: none;
    border: none;
    border-left: 3px solid transparent;
    padding: 10px 16px;
    cursor: pointer;
    font-size: 14px;
    text-align: left;
    border-radius: 4px;
    transition: all 0.15s;
  }

  .sidebar-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .content {
    flex: 1;
    overflow: auto;
    padding: 20px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .section-header h3 {
    margin: 0;
    font-size: 16px;
    color: #d4d4d4;
  }

  .themes-section {
    margin-bottom: 32px;
  }

  .themes-section h4 {
    margin: 0 0 12px 0;
    font-size: 13px;
    color: #858585;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .theme-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .theme-card {
    background-color: #1e1e1e;
    border: 2px solid #3e3e42;
    border-radius: 6px;
    padding: 0;
    display: flex;
    flex-direction: column;
    transition: all 0.15s ease;
  }

  .theme-card:hover {
    border-color: #4a4a4a;
  }

  .theme-card.active {
    border-color: #0e639c;
    background-color: #1a3a52;
  }

  .theme-card-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
  }

  .theme-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .theme-name {
    color: #d4d4d4;
    font-size: 14px;
    font-weight: 500;
  }

  .theme-badges {
    display: flex;
    gap: 6px;
  }

  .theme-badge {
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .theme-badge.builtin {
    background-color: #094771;
    color: #87cefa;
  }

  .theme-badge.custom {
    background-color: #7a3e9d;
    color: #e0b0ff;
  }

  .theme-badge.default {
    background-color: #1a5c1a;
    color: #90ee90;
  }

  .icon-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 4px 8px;
    transition: color 0.1s;
  }

  .icon-btn:hover {
    color: var(--icon-active-color, #ffd700) !important;
  }

  .theme-actions-bar {
    display: flex;
    gap: 16px;
    padding: 10px 16px;
    border-top: 1px solid #3e3e42;
    background-color: rgba(0, 0, 0, 0.2);
  }

  .action-link {
    background: none;
    border: none;
    font-size: 12px;
    cursor: pointer;
    padding: 0;
    text-decoration: none;
    transition: color 0.1s;
  }

  .action-link:hover {
    color: var(--accent-hover, #6eb4ff) !important;
    text-decoration: underline;
  }

  .action-link.primary {
    font-weight: 600;
  }

  .action-link.primary:hover {
    color: var(--accent-primary-hover, #00ffcc) !important;
  }

  .action-link.danger:hover {
    color: var(--accent-danger-hover, #ff9b87) !important;
  }

  .theme-editor {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
  }

  .editor-header h3 {
    margin: 0 0 8px 0;
    font-size: 16px;
    color: #d4d4d4;
  }

  .hint {
    margin: 0;
    font-size: 13px;
    color: #858585;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-group label {
    font-size: 13px;
    color: #d4d4d4;
  }

  .text-input {
    background-color: #1e1e1e;
    color: #d4d4d4;
    border: 1px solid #3e3e42;
    border-radius: 4px;
    padding: 8px 12px;
    font-size: 13px;
    outline: none;
  }

  .text-input:focus {
    border-color: #0e639c;
  }

  .loading {
    text-align: center;
    padding: 40px;
    color: #858585;
  }

  .json-editor {
    flex: 1;
    min-height: 300px;
    background-color: #1e1e1e;
    color: #d4d4d4;
    border: 1px solid #3e3e42;
    border-radius: 4px;
    padding: 12px;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;
    resize: vertical;
    outline: none;
  }

  .json-editor:focus {
    border-color: #0e639c;
  }

  .json-editor.readonly {
    background-color: #1a1a1a;
    border-color: #4a4a4a;
    cursor: text;
  }

  .json-editor.readonly:focus {
    border-color: #5a5a5a;
  }

  .toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 13px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 2000;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .toast-error {
    background-color: #5a1d1d;
    border: 1px solid #be1100;
    color: #f48771;
  }

  .toast-success {
    background-color: #1d5a1d;
    border: 1px solid #00be11;
    color: #71f487;
  }

  .actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .btn-primary {
    background-color: #0e639c;
    color: white;
  }

  .btn-primary:hover {
    background-color: #1177bb;
  }

  .btn-secondary {
    background-color: #3e3e42;
    color: #d4d4d4;
  }

  .btn-secondary:hover {
    background-color: #4e4e52;
  }

  .general-settings {
    padding: 24px;
    max-width: 900px;
  }

  .general-settings h3 {
    margin: 0 0 32px 0;
    font-size: 20px;
    font-weight: 600;
  }

  .settings-section {
    margin-bottom: 32px;
  }

  .settings-section h4 {
    margin: 0 0 16px 0;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .setting-card {
    border: 1px solid;
    border-radius: 6px;
    overflow: visible;
    margin-bottom: 16px;
    transition: border-color 0.2s;
  }

  .setting-card:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  .setting-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    gap: 20px;
  }

  .setting-info {
    flex: 1;
  }

  .setting-info h5 {
    margin: 0 0 6px 0;
    font-size: 15px;
    font-weight: 600;
  }

  .setting-info p {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
  }

  .setting-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-top: 1px solid;
    gap: 12px;
  }

  .setting-card-footer label {
    font-size: 13px;
    font-weight: 500;
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 26px;
    flex-shrink: 0;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--toggle-bg);
    transition: 0.3s;
    border-radius: 26px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }

  input:checked + .toggle-slider {
    background-color: var(--toggle-active);
  }

  input:checked + .toggle-slider:before {
    transform: translateX(22px);
  }

  .toggle-slider:hover {
    opacity: 0.9;
  }

  .number-control {
    display: flex;
    align-items: center;
    gap: 0;
  }

  .number-btn {
    width: 32px;
    height: 32px;
    border: 1px solid;
    background-color: transparent;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .number-btn:first-child {
    border-radius: 4px 0 0 4px;
    border-right: none;
  }

  .number-btn:last-child {
    border-radius: 0 4px 4px 0;
    border-left: none;
  }

  .number-btn:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .number-btn:active {
    background-color: rgba(255, 255, 255, 0.1);
    transform: scale(0.95);
  }

  .number-input {
    width: 80px;
    height: 32px;
    padding: 0;
    border: 1px solid;
    border-left: none;
    border-right: none;
    font-size: 13px;
    font-family: 'Consolas', 'Monaco', monospace;
    text-align: center;
    transition: border-color 0.2s;
    cursor: default;
  }

  .number-input:focus {
    outline: none;
  }

  .number-input::-webkit-inner-spin-button,
  .number-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .font-select,
  .tab-size-select {
    min-width: 180px;
    height: 32px;
    padding: 4px 12px;
    border: 1px solid;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
  }

  .font-select:hover,
  .tab-size-select:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .font-select:focus,
  .tab-size-select:focus {
    outline: none;
    border-color: var(--accent-color, #00d4aa);
  }

  /* Font autocomplete dropdown */
  .font-autocomplete-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 10000;
    border-radius: 4px;
    border: 1px solid;
    max-height: 350px;
    overflow-y: auto;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    margin-top: 4px;
  }

  .font-suggestion-item {
    width: 100%;
    background-color: transparent;
    border: none;
    border-bottom: 1px solid;
    padding: 10px 12px;
    text-align: left;
    cursor: pointer;
    font-size: 13px;
    transition: background-color 0.1s;
  }

  .font-suggestion-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .font-suggestion-item:last-of-type {
    border-bottom: none;
  }

  .font-suggestion-footer {
    padding: 8px 12px;
    font-size: 11px;
    border-top: 1px solid;
  }

  /* Custom font input container */
  .font-input-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 300px;
    position: relative;
  }

  /* ===== SHORTCUTS SECTION ===== */
  .shortcuts-section {
    padding: 24px;
  }

  .shortcuts-section h3 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
  }

  .shortcuts-intro {
    margin: 0 0 24px 0;
    font-size: 14px;
  }

  .shortcuts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }

  .shortcuts-category {
    border: 1px solid;
    border-radius: 8px;
    padding: 16px;
  }

  .shortcuts-category h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .shortcuts-table {
    width: 100%;
    border-collapse: collapse;
  }

  .shortcuts-table tr {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .shortcuts-table tr:last-child {
    border-bottom: none;
  }

  .shortcuts-table td {
    padding: 8px 0;
    vertical-align: middle;
  }

  .shortcut-keys {
    width: 120px;
  }

  .shortcut-keys kbd {
    display: inline-block;
    padding: 4px 8px;
    font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    border: 1px solid;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .shortcut-action {
    font-size: 13px;
    padding-left: 12px;
  }

  /* ===== ABOUT SECTION ===== */
  .about-section {
    padding: 32px;
    max-width: 700px;
    margin: 0 auto;
  }

  .about-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
  }

  .about-logo {
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .about-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .about-title {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .about-title h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }

  .version-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    width: fit-content;
  }

  .about-description {
    font-size: 15px;
    line-height: 1.6;
    margin: 0 0 32px 0;
  }

  .about-cards {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 32px;
  }

  .about-card {
    border: 1px solid;
    border-radius: 8px;
    padding: 20px;
  }

  .about-card h4 {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .license-content {
    font-size: 13px;
    line-height: 1.6;
  }

  .license-type {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 12px 0;
  }

  .license-text {
    margin: 0 0 12px 0;
  }

  .license-text:last-child {
    margin-bottom: 0;
  }

  .license-disclaimer {
    font-style: italic;
    opacity: 0.8;
  }

  .tech-stack {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }

  .tech-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tech-name {
    font-size: 14px;
    font-weight: 500;
  }

  .tech-desc {
    font-size: 12px;
  }

  .about-footer {
    text-align: center;
    font-size: 13px;
  }

  .about-footer p {
    margin: 0;
  }
</style>
