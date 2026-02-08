<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { currentTheme, reloadCurrentTheme } from '../../stores/themeStore';
  import { invoke } from '@tauri-apps/api/core';

  const dispatch = createEventDispatcher<{ error: string; success: string; back: void }>();

  export let themeJson: string;
  export let errorMessage: string;
  export let successMessage: string;

  let newThemeName = '';

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

  async function saveNewTheme() {
    try {
      if (!newThemeName.trim()) {
        dispatch('error', 'Please enter a theme name');
        return;
      }

      const parsedTheme = JSON.parse(themeJson);
      if (!parsedTheme.editor || !parsedTheme.gutter || !parsedTheme.ui) {
        dispatch('error', 'Invalid theme structure');
        return;
      }

      parsedTheme.name = newThemeName;

      await invoke('save_custom_theme', { themeName: newThemeName, theme: parsedTheme });
      await invoke('save_current_theme', { theme: parsedTheme });
      await reloadCurrentTheme();

      dispatch('success', `Theme "${newThemeName}" created successfully!`);
      setTimeout(() => {
        dispatch('back');
      }, 1500);
    } catch (error) {
      console.error('Failed to create theme:', error);
      dispatch('error', `Failed to create theme: ${error}`);
    }
  }
</script>

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
      on:click={() => dispatch('back')}
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

  .message {
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 13px;
  }

  .message.error {
    background-color: #5a1d1d;
    color: #f48771;
  }

  .message.success {
    background-color: #1d5a1d;
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
</style>
