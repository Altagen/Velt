<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import MenuBar from './components/MenuBar.svelte';
  import TabBar from './components/TabBar.svelte';
  import Editor from './components/Editor.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import ConfirmDialog from './components/ConfirmDialog.svelte';
  import SimpleConfirmDialog from './components/SimpleConfirmDialog.svelte';
  import { tabs, activeTabId, addTab, createTab, updateTabContent, settings, removeTab, getTab, saveTab, updateTabFile, updateTabEncoding } from './stores/appStore';
  import { closeTabDialog, closeCloseTabDialog } from './stores/dialogStore';
  import { reloadDialog, closeReloadDialog } from './stores/reloadDialogStore';
  import { saveFile, type FileContent } from './lib/fileOperations';
  import { invoke } from '@tauri-apps/api/core';
  import { AutoSaveManager } from './lib/autoSave';
  import { initializeTheme, initializeThemeWatcher, currentTheme } from './stores/themeStore';
  import { loadImportedFonts } from './lib/importedFonts';
  import { initPlatformDetection } from './lib/systemFonts';

  let activeTab: any = null;
  let autoSaveManager: AutoSaveManager;
  let encodingChangeHandler: ((event: Event) => void) | null = null;

  $: {
    if ($activeTabId) {
      activeTab = $tabs.find(t => t.id === $activeTabId);
    } else {
      activeTab = null;
    }
  }

  function handleContentChange(content: string) {
    if ($activeTabId) {
      updateTabContent($activeTabId, content);

      // Trigger auto-save if enabled
      const tab = $tabs.find(t => t.id === $activeTabId);
      if (tab && autoSaveManager) {
        autoSaveManager.save($activeTabId, tab.filePath, content, tab.encoding);
      }
    }
  }

  function handleNewFile() {
    const newTab = createTab();
    addTab(newTab);
  }

  // Close tab dialog handlers
  async function handleSaveAndClose() {
    if (!$closeTabDialog.tabId) return;

    const tab = getTab($closeTabDialog.tabId);
    if (!tab) return;

    try {
      // Save the file
      if (tab.filePath) {
        await saveFile(tab.filePath, tab.content, tab.encoding);
        saveTab($closeTabDialog.tabId);
      }
      // If no file path, we should open save as dialog, but for now just close
      // TODO: Implement save as dialog for untitled files

      // Close the tab
      removeTab($closeTabDialog.tabId);
      closeCloseTabDialog();
    } catch (error) {
      console.error('Failed to save file:', error);
      // Keep dialog open on error
    }
  }

  function handleDontSaveAndClose() {
    if (!$closeTabDialog.tabId) return;
    removeTab($closeTabDialog.tabId);
    closeCloseTabDialog();
  }

  function handleCancelClose() {
    closeCloseTabDialog();
  }

  // Reload dialog handlers
  async function handleConfirmReload() {
    if (!$reloadDialog.tabId) return;

    const tab = getTab($reloadDialog.tabId);
    if (!tab || !tab.filePath) return;

    try {
      // Reload file content from disk
      const fileContent = await invoke<FileContent>('read_file_content', { path: tab.filePath });

      // Update tab with new content
      updateTabFile($reloadDialog.tabId, fileContent.path, fileContent.content, fileContent.encoding);

      closeReloadDialog();
    } catch (error) {
      console.error('Failed to reload file:', error);
      alert(`Failed to reload file: ${error}`);
    }
  }

  function handleCancelReload() {
    closeReloadDialog();
  }

  onMount(async () => {
    // Initialize platform detection early (for font selection)
    await initPlatformDetection();

    // Load settings from localStorage
    try {
      const stored = localStorage.getItem('velt-settings');
      if (stored) {
        const loadedSettings = JSON.parse(stored);
        settings.set({ ...loadedSettings });
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }

    // Save settings to localStorage on changes
    settings.subscribe(value => {
      try {
        localStorage.setItem('velt-settings', JSON.stringify(value));
      } catch (e) {
        console.error('Failed to save settings:', e);
      }
    });

    // Initialize theme system
    await initializeTheme();
    await initializeThemeWatcher();

    // Load imported fonts
    await loadImportedFonts();

    // Initialize auto-save manager
    autoSaveManager = new AutoSaveManager({
      delay: $settings.autoSaveDelay,
      enabled: $settings.autoSave,
    });

    // Check for CLI files to open
    try {
      const cliFiles = await invoke<string[]>('get_cli_files');

      if (cliFiles && cliFiles.length > 0) {
        // Open each file from CLI
        for (const filePath of cliFiles) {
          try {
            const fileContent = await invoke<FileContent>('read_file_content', { path: filePath });
            const newTab = createTab(fileContent.path, fileContent.content);
            newTab.encoding = fileContent.encoding;
            addTab(newTab);
          } catch (error) {
            console.error(`Failed to open file ${filePath}:`, error);
            // Create an empty tab with the file path for new files
            const newTab = createTab(filePath, '');
            addTab(newTab);
          }
        }
      } else if ($tabs.length === 0) {
        // No CLI files and no existing tabs, create initial empty tab
        handleNewFile();
      }
    } catch (error) {
      console.error('Failed to get CLI files:', error);
      // Fallback to creating initial tab
      if ($tabs.length === 0) {
        handleNewFile();
      }
    }

    // Listen for encoding changes
    encodingChangeHandler = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { tabId, encoding } = customEvent.detail;
      updateTabEncoding(tabId, encoding);
    };

    window.addEventListener('encoding-change', encodingChangeHandler);
  });

  onDestroy(() => {
    if (encodingChangeHandler) {
      window.removeEventListener('encoding-change', encodingChangeHandler);
    }
  });

  // Update auto-save settings when they change
  $: if (autoSaveManager) {
    autoSaveManager.setOptions({
      delay: $settings.autoSaveDelay,
      enabled: $settings.autoSave,
    });
  }
</script>

<div
  class="app"
  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; color: {$currentTheme?.editor?.foreground || '#d4d4d4'}"
>
  <MenuBar />
  <TabBar />

  <div class="editor-area">
    {#if activeTab}
      <Editor tab={activeTab} onContentChange={handleContentChange} />
    {:else}
      <div class="empty-state">
        <p style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">No file open</p>
        <button
          on:click={handleNewFile}
          style="background-color: {$currentTheme?.ui?.accent || '#0e639c'}; color: #ffffff"
        >
          Create New File
        </button>
      </div>
    {/if}
  </div>
</div>

<SettingsModal />

<ConfirmDialog
  isOpen={$closeTabDialog.isOpen}
  title="Unsaved Changes"
  message="Do you want to save the changes you made to"
  filename={$closeTabDialog.filename}
  onSave={handleSaveAndClose}
  onDontSave={handleDontSaveAndClose}
  onCancel={handleCancelClose}
/>

<SimpleConfirmDialog
  isOpen={$reloadDialog.isOpen}
  title="Reload from Disk"
  message="Reload from disk? Your unsaved changes to"
  filename={$reloadDialog.filename}
  confirmLabel="Reload"
  cancelLabel="Cancel"
  onConfirm={handleConfirmReload}
  onCancel={handleCancelReload}
/>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(html, body) {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    overflow: hidden;
  }

  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
  }

  .editor-area {
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .empty-state p {
    margin-bottom: 16px;
    font-size: 14px;
  }

  .empty-state button {
    border: none;
    padding: 8px 16px;
    font-size: 13px;
    border-radius: 3px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .empty-state button:hover {
    filter: brightness(1.15);
  }
</style>
