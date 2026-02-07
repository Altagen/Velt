<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { currentTheme } from '../../stores/themeStore';
  import type { ImportedFont } from '../../lib/importedFonts';
  import AutoSaveSettings from './AutoSaveSettings.svelte';
  import FontSettings from './FontSettings.svelte';
  import EditorSettings from './EditorSettings.svelte';

  const dispatch = createEventDispatcher<{ error: string; success: string }>();

  export let importedFonts: ImportedFont[] = [];

  function handleError(event: CustomEvent<string>) {
    dispatch('error', event.detail);
  }

  function handleSuccess(event: CustomEvent<string>) {
    dispatch('success', event.detail);
  }
</script>

<div class="general-settings">
  <h3 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">General Settings</h3>

  <!-- Auto-save Settings -->
  <div class="settings-section">
    <h4 style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Auto-Save</h4>
    <AutoSaveSettings />
  </div>

  <!-- Editor Settings -->
  <div class="settings-section">
    <h4 style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Editor</h4>
    <FontSettings
      bind:importedFonts
      on:error={handleError}
      on:success={handleSuccess}
    />
    <EditorSettings />
  </div>
</div>

<style>
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
</style>
