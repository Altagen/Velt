<script lang="ts">
  import { tabs, activeTabId, addTab, createTab, updateTabFile, saveTab, getTab, updateTabContent, removeTab, settings } from '../stores/appStore';
  import { openFile, saveFile, saveFileAs, type FileContent } from '../lib/fileOperations';
  import { addRecentFile } from '../lib/recentFiles';
  import { openCloseTabDialog } from '../stores/dialogStore';
  import { openReloadDialog } from '../stores/reloadDialogStore';
  import { showSettingsModal } from '../stores/settingsStore';
  import { currentTheme } from '../stores/themeStore';
  import { openFindPanel, openReplacePanel } from '../stores/findReplaceStore';
  import { openGoToLine } from '../stores/goToLineStore';
  import { getFileName } from '@altagen/velt-core';
  import RecentFilesList from './RecentFilesList.svelte';
  import { invoke } from '@tauri-apps/api/core';
  import FilePlus from 'phosphor-svelte/lib/FilePlus';
  import AppWindow from 'phosphor-svelte/lib/AppWindow';
  import FolderOpen from 'phosphor-svelte/lib/FolderOpen';
  import FloppyDisk from 'phosphor-svelte/lib/FloppyDisk';
  import ArrowClockwise from 'phosphor-svelte/lib/ArrowClockwise';
  import GearSix from 'phosphor-svelte/lib/GearSix';

  async function handleOpen() {
    try {
      const fileContent = await openFile();
      if (fileContent) {
        // Check if file is already open
        const existingTab = $tabs.find(t => t.filePath === fileContent.path);
        if (existingTab) {
          activeTabId.set(existingTab.id);
          return;
        }

        // Create new tab with file content
        const newTab = createTab(fileContent.path, fileContent.content);
        newTab.encoding = fileContent.encoding;
        addTab(newTab);

        // Add to recent files
        await addRecentFile(fileContent.path);
      }
    } catch (error) {
      console.error('Failed to open file:', error);
      alert(`Failed to open file: ${error}`);
    }
  }

  async function handleNewWindow() {
    try {
      await invoke('create_new_window');
    } catch (error) {
      console.error('Failed to create new window:', error);
      alert(`Failed to create new window: ${error}`);
    }
  }

  async function handleOpenRecentFile(filePath: string) {
    try {
      // Check if file is already open
      const existingTab = $tabs.find(t => t.filePath === filePath);
      if (existingTab) {
        activeTabId.set(existingTab.id);
        return;
      }

      // Read file content
      const fileContent = await invoke<FileContent>('read_file_content', { path: filePath });

      // Create new tab with file content
      const newTab = createTab(fileContent.path, fileContent.content);
      newTab.encoding = fileContent.encoding;
      addTab(newTab);

      // Add to recent files (moves it to the top)
      await addRecentFile(filePath);
    } catch (error) {
      console.error('Failed to open recent file:', error);
      alert(`Failed to open file: ${error}`);
    }
  }

  async function handleSave() {
    if (!$activeTabId) return;

    const tab = getTab($activeTabId);
    if (!tab) return;

    try {
      if (tab.filePath) {
        // Save to existing path
        await saveFile(tab.filePath, tab.content, tab.encoding);
        saveTab($activeTabId);
      } else {
        // No path, trigger save as
        await handleSaveAs();
      }
    } catch (error) {
      console.error('Failed to save file:', error);
      alert(`Failed to save file: ${error}`);
    }
  }

  async function handleSaveAs() {
    if (!$activeTabId) return;

    const tab = getTab($activeTabId);
    if (!tab) return;

    try {
      const filePath = await saveFileAs(tab.content, tab.encoding);
      if (filePath) {
        updateTabFile($activeTabId, filePath, tab.content, tab.encoding);
        // Add to recent files
        await addRecentFile(filePath);
      }
    } catch (error) {
      console.error('Failed to save file as:', error);
      alert(`Failed to save file: ${error}`);
    }
  }

  async function handleSaveAll() {
    try {
      // Get all dirty tabs that have a file path
      const dirtyTabs = $tabs.filter(tab => tab.isDirty && tab.filePath);

      if (dirtyTabs.length === 0) {
        console.log('No files to save');
        return;
      }

      let savedCount = 0;
      let failedCount = 0;

      // Save each dirty tab
      for (const tab of dirtyTabs) {
        try {
          await saveFile(tab.filePath!, tab.content, tab.encoding);
          saveTab(tab.id);
          savedCount++;
        } catch (error) {
          console.error(`Failed to save ${tab.filePath}:`, error);
          failedCount++;
        }
      }

      // Show feedback
      if (savedCount > 0) {
        console.log(`Saved ${savedCount} file${savedCount > 1 ? 's' : ''}`);
      }
      if (failedCount > 0) {
        alert(`Failed to save ${failedCount} file${failedCount > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Error in save all:', error);
      alert(`Error saving files: ${error}`);
    }
  }

  async function handleReload() {
    if (!$activeTabId) return;

    const tab = getTab($activeTabId);
    if (!tab || !tab.filePath) return;

    // If tab has unsaved changes, show confirmation dialog
    if (tab.isDirty) {
      const filename = getFileName(tab.filePath);
      openReloadDialog($activeTabId, filename);
    } else {
      // No unsaved changes, reload directly
      try {
        const fileContent = await invoke<FileContent>('read_file_content', { path: tab.filePath });
        updateTabFile($activeTabId, fileContent.path, fileContent.content, fileContent.encoding);
      } catch (error) {
        console.error('Failed to reload file:', error);
        alert(`Failed to reload file: ${error}`);
      }
    }
  }

  function handleNew() {
    const newTab = createTab();
    addTab(newTab);
  }

  // Count dirty tabs with file paths
  $: dirtyFilesCount = $tabs.filter(tab => tab.isDirty && tab.filePath).length;

  // Check if current tab can be reloaded
  $: canReload = (() => {
    if (!$activeTabId) return false;
    const tab = getTab($activeTabId);
    return tab ? !!tab.filePath : false;
  })();

  // Keyboard shortcuts
  function handleKeydown(event: KeyboardEvent) {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

    // F5 for reload
    if (event.key === 'F5') {
      event.preventDefault();
      handleReload();
      return;
    }

    // F2 for bookmark navigation
    // F2: Next bookmark
    // Shift+F2: Previous bookmark
    if (event.key === 'F2') {
      event.preventDefault();
      if (event.shiftKey) {
        console.log('[MenuBar] Shift+F2 → previousBookmark');
        handleEditorAction('previousBookmark');
      } else {
        console.log('[MenuBar] F2 → nextBookmark');
        handleEditorAction('nextBookmark');
      }
      return;
    }

    // F9 for Sort Lines Ascending (A-Z)
    if (event.key === 'F9') {
      event.preventDefault();
      console.log('[MenuBar] F9 → sortLinesAscending');
      handleEditorAction('sortLinesAscending');
      return;
    }

    // F10 for Sort Lines Descending (Z-A)
    if (event.key === 'F10') {
      event.preventDefault();
      console.log('[MenuBar] F10 → sortLinesDescending');
      handleEditorAction('sortLinesDescending');
      return;
    }

    // F11 for Convert to LF (Unix line endings)
    if (event.key === 'F11') {
      event.preventDefault();
      console.log('[MenuBar] F11 → convertToLF');
      handleEditorAction('convertToLF');
      return;
    }

    // F12 for Convert to CRLF (Windows line endings)
    // Shift+F12 for Convert to CR (Old Mac line endings)
    if (event.key === 'F12') {
      event.preventDefault();
      if (event.shiftKey) {
        console.log('[MenuBar] Shift+F12 → convertToCR');
        handleEditorAction('convertToCR');
      } else {
        console.log('[MenuBar] F12 → convertToCRLF');
        handleEditorAction('convertToCRLF');
      }
      return;
    }

    if (ctrlKey) {
      if (event.key === 'o' || event.key === 'O') {
        event.preventDefault();
        handleOpen();
      } else if (event.key === 's' || event.key === 'S') {
        event.preventDefault();
        if (event.shiftKey) {
          handleSaveAs();
        } else if (event.altKey) {
          handleSaveAll();
        } else {
          handleSave();
        }
      } else if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        if (event.shiftKey) {
          handleNewWindow();
        } else {
          handleNew();
        }
      } else if (event.key === 'w' || event.key === 'W') {
        event.preventDefault();
        if (event.shiftKey) {
          handleCloseWindow();
        } else {
          handleCloseTab();
        }
      } else if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        openFindPanel();
      } else if (event.key === 'h' || event.key === 'H') {
        event.preventDefault();
        openReplacePanel();
      } else if (event.key === 'g' || event.key === 'G') {
        event.preventDefault();
        handleGoToLine();
      } else if (event.key === 'm' || event.key === 'M') {
        // Ctrl+M: Toggle bookmark
        // Ctrl+Shift+M: Clear all bookmarks
        event.preventDefault();
        if (event.shiftKey) {
          console.log('[MenuBar] Ctrl+Shift+M → clearBookmarks');
          handleEditorAction('clearBookmarks');
        } else {
          console.log('[MenuBar] Ctrl+M → toggleBookmark');
          handleEditorAction('toggleBookmark');
        }
      } else if (event.key === 'd' || event.key === 'D') {
        // Ctrl+D: Duplicate line
        // Ctrl+Shift+D: Remove duplicate lines
        event.preventDefault();
        if (event.shiftKey) {
          console.log('[MenuBar] Ctrl+Shift+D → removeDuplicateLines');
          handleEditorAction('removeDuplicateLines');
        } else {
          handleEditorAction('duplicateLine');
        }
      } else if (event.key === 'k' || event.key === 'K') {
        // Ctrl+Shift+K: Delete line
        if (event.shiftKey) {
          event.preventDefault();
          handleEditorAction('deleteLine');
        }
      } else if (event.key === '/') {
        // Ctrl+/: Toggle line comment
        event.preventDefault();
        handleEditorAction('toggleLineComment');
      } else if (event.key === '=' || event.key === '+') {
        // Ctrl+ or Ctrl=: Zoom in
        event.preventDefault();
        zoomIn();
      } else if (event.key === '-' || event.key === '_') {
        // Ctrl-: Zoom out
        event.preventDefault();
        zoomOut();
      } else if (event.key === '0') {
        // Ctrl+0: Reset zoom
        event.preventDefault();
        resetZoom();
      }
    } else if (event.altKey) {
      // Alt+Up: Move line up
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        handleEditorAction('moveLineUp');
      }
      // Alt+Down: Move line down
      else if (event.key === 'ArrowDown') {
        event.preventDefault();
        handleEditorAction('moveLineDown');
      }
      // Alt+U: Convert to UPPERCASE
      else if (event.key === 'u' || event.key === 'U') {
        event.preventDefault();
        console.log('[MenuBar] Alt+U → convertToUppercase');
        handleEditorAction('convertToUppercase');
      }
      // Alt+L: Convert to lowercase
      else if (event.key === 'l' || event.key === 'L') {
        event.preventDefault();
        console.log('[MenuBar] Alt+L → convertToLowercase');
        handleEditorAction('convertToLowercase');
      }
      // Alt+T: Convert to Title Case
      else if (event.key === 't' || event.key === 'T') {
        event.preventDefault();
        console.log('[MenuBar] Alt+T → convertToTitleCase');
        handleEditorAction('convertToTitleCase');
      }
      // Alt+I: Invert Case
      else if (event.key === 'i' || event.key === 'I') {
        event.preventDefault();
        console.log('[MenuBar] Alt+I → invertCase');
        handleEditorAction('invertCase');
      }
      // Alt+W: Trim trailing whitespace
      else if (event.key === 'w' || event.key === 'W') {
        event.preventDefault();
        console.log('[MenuBar] Alt+W → trimTrailingSpaces');
        handleEditorAction('trimTrailingSpaces');
      }
      // Alt+B: Remove blank lines
      else if (event.key === 'b' || event.key === 'B') {
        event.preventDefault();
        console.log('[MenuBar] Alt+B → removeBlankLines');
        handleEditorAction('removeBlankLines');
      }
    } else if (event.key === 'Tab') {
      // Tab/Shift+Tab for indent/outdent is handled by the editor itself
      // We only need this for multi-line selections
      const hasSelection = window.getSelection()?.toString().includes('\n');
      if (hasSelection) {
        event.preventDefault();
        if (event.shiftKey) {
          handleEditorAction('outdentSelection');
        } else {
          handleEditorAction('indentSelection');
        }
      }
    }
  }

  function handleGoToLine() {
    if (!$activeTabId) return;

    const tab = getTab($activeTabId);
    if (!tab) return;

    // Count total lines in the tab content
    const totalLines = tab.content.split('\n').length;
    openGoToLine(totalLines);
  }

  function handleCloseTab() {
    if (!$activeTabId) return;

    const tab = getTab($activeTabId);
    if (!tab) return;

    // If tab has unsaved changes, show confirmation dialog
    if (tab.isDirty) {
      const filename = tab.filePath ? getFileName(tab.filePath) : 'Untitled';
      openCloseTabDialog($activeTabId, filename);
    } else {
      // No unsaved changes, close directly
      removeTab($activeTabId);
    }
  }

  async function handleCloseWindow() {
    // Check if any tabs have unsaved changes
    const hasUnsavedChanges = $tabs.some(tab => tab.isDirty);

    if (hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to close this window?');
      if (!confirmed) return;
    }

    // Close the window
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const window = getCurrentWindow();
      await window.close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  }

  /**
   * Handle editor actions by dispatching custom events
   */
  function handleEditorAction(action: string) {
    // Dispatch custom event that the Editor component will listen to
    window.dispatchEvent(new CustomEvent('editor-action', { detail: { action } }));
  }

  /**
   * Zoom in (increase font size and zoom level)
   */
  function zoomIn() {
    settings.update(s => ({
      ...s,
      zoomLevel: Math.min(200, s.zoomLevel + 10),
      fontSize: Math.min(32, Math.round(14 * Math.min(200, s.zoomLevel + 10) / 100))
    }));
  }

  /**
   * Zoom out (decrease font size and zoom level)
   */
  function zoomOut() {
    settings.update(s => ({
      ...s,
      zoomLevel: Math.max(50, s.zoomLevel - 10),
      fontSize: Math.max(8, Math.round(14 * Math.max(50, s.zoomLevel - 10) / 100))
    }));
  }

  /**
   * Reset zoom to 100%
   */
  function resetZoom() {
    settings.update(s => ({
      ...s,
      zoomLevel: 100,
      fontSize: 14
    }));
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div
  class="menu-bar"
  style="background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}"
>
  <button
    class="menu-button"
    on:click={handleNew}
    title="New (Ctrl+N)"
    style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
  >
    <span class="icon"><FilePlus size={18} weight="duotone" color={$currentTheme?.icons?.file || '#64B5F6'} /></span>
    <span class="label">New</span>
  </button>

  <button
    class="menu-button"
    on:click={handleNewWindow}
    title="New Window (Ctrl+Shift+N)"
    style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
  >
    <span class="icon"><AppWindow size={18} weight="duotone" color={$currentTheme?.icons?.window || '#7986CB'} /></span>
    <span class="label">New Window</span>
  </button>

  <button
    class="menu-button"
    on:click={handleOpen}
    title="Open (Ctrl+O)"
    style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
  >
    <span class="icon"><FolderOpen size={18} weight="duotone" color={$currentTheme?.icons?.folder || '#FFB74D'} /></span>
    <span class="label">Open</span>
  </button>

  <RecentFilesList onFileSelect={handleOpenRecentFile} />

  <button
    class="menu-button"
    on:click={handleSave}
    title="Save (Ctrl+S)"
    style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
  >
    <span class="icon"><FloppyDisk size={18} weight="duotone" color={$currentTheme?.icons?.save || '#81C784'} /></span>
    <span class="label">Save</span>
  </button>

  <button
    class="menu-button"
    on:click={handleSaveAs}
    title="Save As (Ctrl+Shift+S)"
    style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
  >
    <span class="icon"><FloppyDisk size={18} weight="duotone" color={$currentTheme?.icons?.save || '#81C784'} /></span>
    <span class="label">Save As</span>
  </button>

  <button
    class="menu-button"
    on:click={handleSaveAll}
    title="Save All (Ctrl+Alt+S)"
    style="color: {$currentTheme?.ui?.textColor || '#cccccc'}; opacity: {dirtyFilesCount > 0 ? 1 : 0.5}"
    disabled={dirtyFilesCount === 0}
  >
    <span class="icon"><FloppyDisk size={18} weight="duotone" color={$currentTheme?.icons?.save || '#81C784'} /></span>
    <span class="label">
      Save All
      {#if dirtyFilesCount > 0}
        <span class="badge" style="background-color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}">
          {dirtyFilesCount}
        </span>
      {/if}
    </span>
  </button>

  <div class="separator"></div>

  <button
    class="menu-button"
    on:click={handleReload}
    title="Reload from Disk (F5)"
    style="color: {$currentTheme?.ui?.textColor || '#cccccc'}; opacity: {canReload ? 1 : 0.5}"
    disabled={!canReload}
  >
    <span class="icon"><ArrowClockwise size={18} weight="duotone" color={$currentTheme?.icons?.reload || '#4DD0E1'} /></span>
    <span class="label">Reload</span>
  </button>

  <button
    class="menu-button"
    on:click={() => showSettingsModal.set(true)}
    title="Settings"
    style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
  >
    <span class="icon"><GearSix size={18} weight="duotone" color={$currentTheme?.icons?.settings || '#BA68C8'} /></span>
    <span class="label">Settings</span>
  </button>
</div>

<style>
  .menu-bar {
    display: flex;
    gap: 2px;
    padding: 4px 8px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.3);
  }

  .menu-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background-color: transparent;
    border: none;
    font-size: 13px;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.1s;
  }

  .menu-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
    filter: brightness(1.3);
  }

  .menu-button:active {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .menu-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .menu-button:disabled:hover {
    background-color: transparent;
    filter: brightness(1);
  }

  .icon {
    font-size: 16px;
    line-height: 1;
  }

  .label {
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 9px;
    font-size: 11px;
    font-weight: 600;
    color: #1e1e1e;
  }

  .separator {
    width: 1px;
    height: 24px;
    background-color: #3e3e42;
    margin: 0 4px;
  }
</style>
