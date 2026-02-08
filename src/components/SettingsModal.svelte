<script lang="ts">
  import { showSettingsModal } from '../stores/settingsStore';
  import { currentTheme } from '../stores/themeStore';
  import { invoke } from '@tauri-apps/api/core';
  import type { ImportedFont } from '../lib/importedFonts';
  import ThemesSection from './settings/ThemesSection.svelte';
  import GeneralSection from './settings/GeneralSection.svelte';
  import ShortcutsSection from './settings/ShortcutsSection.svelte';
  import AboutSection from './settings/AboutSection.svelte';

  // Navigation state
  type Section = 'themes' | 'general' | 'shortcuts' | 'about';
  let activeSection: Section = 'general';

  // Toast notifications
  let errorMessage = '';
  let successMessage = '';

  // Imported fonts (shared between GeneralSection)
  let importedFonts: ImportedFont[] = [];

  // ThemesSection ref for controlling sub-views
  let themesSection: ThemesSection;

  // Load data when modal opens
  $: if ($showSettingsModal) {
    themesSection?.loadThemesList();
    themesSection?.loadFavorites();
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

  function handleCloseButton() {
    if (activeSection === 'themes' && themesSection?.isInSubView()) {
      themesSection.goBackToList();
    } else {
      closeModal();
    }
  }

  function closeModal() {
    showSettingsModal.set(false);
    activeSection = 'general';
    errorMessage = '';
    successMessage = '';
    themesSection?.resetView();
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }

  function handleEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      if (activeSection === 'themes' && themesSection?.isInSubView()) {
        themesSection.goBackToList();
      } else {
        closeModal();
      }
    }
  }

  function handleError(event: CustomEvent<string>) {
    errorMessage = event.detail;
  }

  function handleSuccess(event: CustomEvent<string>) {
    successMessage = event.detail;
    setTimeout(() => { successMessage = ''; }, 2000);
  }
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
            <ThemesSection
              bind:this={themesSection}
              on:error={handleError}
              on:success={handleSuccess}
            />
          {:else if activeSection === 'general'}
            <GeneralSection
              bind:importedFonts
              on:error={handleError}
              on:success={handleSuccess}
            />
          {:else if activeSection === 'shortcuts'}
            <ShortcutsSection />
          {:else if activeSection === 'about'}
            <AboutSection />
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
</style>
