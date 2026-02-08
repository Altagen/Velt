<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { currentTheme, reloadCurrentTheme } from '../../stores/themeStore';
  import { invoke } from '@tauri-apps/api/core';

  const dispatch = createEventDispatcher<{ error: string; success: string; back: void }>();

  export let editingThemeName: string;
  export let themeJson: string;
  export let isReadOnly: boolean;
  export let isLoading: boolean;
  export let defaultThemes: string[];

  function getDisplayName(themeName: string): string {
    if (themeName === 'default-dark') return 'Default Dark';
    if (themeName === 'default-light') return 'Default Light';
    return themeName.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  function handleThemeInput() {
    try {
      const parsedTheme = JSON.parse(themeJson);
      if (!parsedTheme.editor || !parsedTheme.gutter || !parsedTheme.ui) {
        dispatch('error', 'Invalid theme structure');
        return;
      }
      currentTheme.set(parsedTheme);
    } catch (error) {
      if (error instanceof SyntaxError) {
        dispatch('error', `JSON Error: ${error.message}`);
      }
    }
  }

  async function saveEditedTheme() {
    try {
      const parsedTheme = JSON.parse(themeJson);
      if (!parsedTheme.editor || !parsedTheme.gutter || !parsedTheme.ui) {
        dispatch('error', 'Invalid theme structure');
        return;
      }

      await invoke('save_current_theme', { theme: parsedTheme });

      if (!defaultThemes.includes(editingThemeName)) {
        await invoke('save_custom_theme', { themeName: editingThemeName, theme: parsedTheme });
      }

      await reloadCurrentTheme();
      dispatch('success', 'Theme saved successfully!');
      setTimeout(() => {
        dispatch('back');
      }, 1500);
    } catch (error) {
      console.error('Failed to save theme:', error);
      dispatch('error', `Failed to save theme: ${error}`);
    }
  }
</script>

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
        on:click={() => dispatch('back')}
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

<style>
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
</style>
