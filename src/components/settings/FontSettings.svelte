<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { currentTheme } from '../../stores/themeStore';
  import { settings } from '../../stores/appStore';
  import { getSystemFonts, getDefaultMonospaceFont } from '../../lib/systemFonts';
  import { reloadImportedFonts, type ImportedFont } from '../../lib/importedFonts';
  import { invoke } from '@tauri-apps/api/core';
  import { open } from '@tauri-apps/plugin-dialog';

  const dispatch = createEventDispatcher<{ error: string; success: string }>();

  // Custom font input
  let customFontInput = '';
  let systemFontsList: string[] = [];
  let showSystemFontsList = false;
  let loadingSystemFontsList = false;
  let systemFontsFilter = '';
  let showSuggestions = false;
  let fontInputFocused = false;

  // Imported fonts
  export let importedFonts: ImportedFont[] = [];

  // Get system fonts
  const defaultFont = getDefaultMonospaceFont();

  const fontFamilies = [
    { value: defaultFont, label: 'System Default (Recommended)' },
    { value: '"Fira Code", monospace', label: 'Fira Code (Bundled)' },
    { value: '"JetBrains Mono", monospace', label: 'JetBrains Mono (Bundled)' },
    { value: '"Source Code Pro", monospace', label: 'Source Code Pro (Bundled)' },
    { value: '"Cascadia Code", "Cascadia Mono", monospace', label: 'Cascadia Code (Bundled)' },
    { value: '"Ubuntu Mono", "Liberation Mono", monospace', label: 'Ubuntu Mono (Bundled)' },
    { value: 'SF Mono, Monaco, Menlo, monospace', label: 'SF Mono (macOS System)' },
    { value: 'Consolas, "Courier New", monospace', label: 'Consolas (Windows System)' },
    { value: '"Courier New", Courier, monospace', label: 'Courier New' },
    { value: 'monospace', label: 'Generic Monospace' },
  ];

  function updateFontFamily(event: Event) {
    const target = event.target as HTMLSelectElement;
    settings.update(s => ({ ...s, fontFamily: target.value }));
  }

  function applyCustomFont() {
    if (customFontInput.trim()) {
      const fontFamily = customFontInput.includes(',')
        ? customFontInput
        : `"${customFontInput.trim()}", monospace`;
      settings.update(s => ({ ...s, fontFamily }));
      console.log('[Settings] Applied custom font:', fontFamily);
    }
  }

  async function loadSystemFonts() {
    if (systemFontsList.length > 0) {
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
      dispatch('error', `Failed to load system fonts: ${error}`);
    } finally {
      loadingSystemFontsList = false;
    }
  }

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

  $: autocompleteSuggestions = customFontInput && systemFontsList.length > 0
    ? systemFontsList
        .filter(font => font.toLowerCase().includes(customFontInput.toLowerCase()))
        .slice(0, 20)
    : [];

  $: if (customFontInput.length > 0 && autocompleteSuggestions.length > 0 && fontInputFocused) {
    showSuggestions = true;
  }

  $: filteredSystemFonts = systemFontsFilter
    ? systemFontsList.filter(font =>
        font.toLowerCase().includes(systemFontsFilter.toLowerCase())
      )
    : systemFontsList;

  async function importFontFile() {
    try {
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Font Files',
          extensions: ['ttf', 'otf', 'woff', 'woff2']
        }]
      });

      if (!selected) return;

      const files = Array.isArray(selected) ? selected : [selected];

      for (const filePath of files) {
        try {
          const imported = await invoke<ImportedFont>('import_font', { sourcePath: filePath });
          console.log('[Settings] Imported font:', imported.name);
        } catch (error) {
          console.error(`[Settings] Failed to import ${filePath}:`, error);
          dispatch('error', `Failed to import font: ${error}`);
        }
      }

      importedFonts = await invoke<ImportedFont[]>('list_imported_fonts');
      await reloadImportedFonts();

      dispatch('success', `Imported ${files.length} font${files.length > 1 ? 's' : ''}`);
    } catch (error) {
      console.error('[Settings] Font import dialog error:', error);
      dispatch('error', `Failed to open file dialog: ${error}`);
    }
  }

  async function deleteFont(filename: string) {
    try {
      await invoke('delete_imported_font', { filename });
      console.log('[Settings] Deleted font:', filename);

      importedFonts = await invoke<ImportedFont[]>('list_imported_fonts');
      await reloadImportedFonts();

      dispatch('success', 'Font deleted successfully');
    } catch (error) {
      console.error('[Settings] Failed to delete font:', error);
      dispatch('error', `Failed to delete font: ${error}`);
    }
  }
</script>

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

<style>
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

  .font-select {
    min-width: 180px;
    height: 32px;
    padding: 4px 12px;
    border: 1px solid;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
  }

  .font-select:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .font-select:focus {
    outline: none;
    border-color: var(--accent-color, #00d4aa);
  }

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

  .font-input-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 300px;
    position: relative;
  }
</style>
