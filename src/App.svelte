<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import MenuBar from './components/MenuBar.svelte';
  import MarkdownToolbar from './components/MarkdownToolbar.svelte';
  import PaneGroup from './components/PaneGroup.svelte';
  import SettingsModal from './components/SettingsModal.svelte';
  import ConfirmDialog from './components/ConfirmDialog.svelte';
  import SimpleConfirmDialog from './components/SimpleConfirmDialog.svelte';
  import StatusBar from './components/StatusBar.svelte';
  import { tabs, activeTabId, addTab, createTab, updateTabContent, settings, defaultSettings, removeTab, getTab, saveTab, updateTabFile, updateTabEncoding, setOnTabAdded, setOnTabRemoved } from './stores/appStore';
  import { isMarkdownFile, isMarkdownToolbarActive, toggleMarkdownToolbar } from './stores/markdownPreviewStore';
  import { paneLayout, leftPane, rightPane, hasRightPane, focusedPaneId, draggingTabId, addTabToPane, moveTabToPane, setFocusedPane } from './stores/paneStore';
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
  let dropZoneActive = false;

  // Split pane resize
  let splitRatio = 50; // left pane width percentage
  let isResizing = false;
  let editorAreaEl: HTMLDivElement;

  function handleDividerMouseDown(event: MouseEvent) {
    event.preventDefault();
    isResizing = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (e: MouseEvent) => {
      if (!editorAreaEl) return;
      const rect = editorAreaEl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = (x / rect.width) * 100;
      splitRatio = Math.min(80, Math.max(20, ratio));
    };

    const onMouseUp = () => {
      isResizing = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function handleDividerDblClick() {
    splitRatio = 50;
  }

  // Reset ratio when right pane closes
  $: if (!$hasRightPane) {
    splitRatio = 50;
  }

  // Status bar state per pane
  let leftPaneStatus = { line: 1, column: 1, totalLines: 0, totalChars: 0, selectedChars: 0, eol: 'LF' };
  let rightPaneStatus = { line: 1, column: 1, totalLines: 0, totalChars: 0, selectedChars: 0, eol: 'LF' };

  // Derived: which status to show in StatusBar
  $: currentStatus = $focusedPaneId === 'right' && $hasRightPane && rightPaneActiveTab
    ? rightPaneStatus
    : leftPaneStatus;

  // Active tabs per pane for status bar
  $: leftPaneActiveTab = $leftPane.activeTabId
    ? $tabs.find(t => t.id === $leftPane.activeTabId) || null
    : null;

  $: rightPaneActiveTab = $rightPane?.activeTabId
    ? $tabs.find(t => t.id === $rightPane.activeTabId) || null
    : null;

  // Derived: which tab's info to show in StatusBar
  $: statusTab = $focusedPaneId === 'right' && rightPaneActiveTab ? rightPaneActiveTab : leftPaneActiveTab;

  $: {
    if ($activeTabId) {
      activeTab = $tabs.find(t => t.id === $activeTabId);
    } else {
      activeTab = null;
    }
  }

  function handleLeftPaneStatusUpdate(data: { line: number; column: number; totalLines: number; totalChars: number; selectedChars: number; eol: string }) {
    leftPaneStatus = data;
  }

  function handleRightPaneStatusUpdate(data: { line: number; column: number; totalLines: number; totalChars: number; selectedChars: number; eol: string }) {
    rightPaneStatus = data;
  }

  function handleStatusEOLChange(newEOL: string) {
    const action = newEOL === 'LF' ? 'convertToLF' : newEOL === 'CRLF' ? 'convertToCRLF' : 'convertToCR';
    window.dispatchEvent(new CustomEvent('editor-action', { detail: { action, targetPane: $focusedPaneId } }));
    if ($focusedPaneId === 'right') {
      rightPaneStatus = { ...rightPaneStatus, eol: newEOL };
    } else {
      leftPaneStatus = { ...leftPaneStatus, eol: newEOL };
    }
  }

  function handleStatusEncodingChange(newEncoding: string) {
    const targetTabId = $focusedPaneId === 'right' && $rightPane?.activeTabId
      ? $rightPane.activeTabId
      : $leftPane.activeTabId;
    if (targetTabId) {
      window.dispatchEvent(new CustomEvent('encoding-change', {
        detail: { tabId: targetTabId, encoding: newEncoding }
      }));
    }
  }

  function handleDropOnZone(event: DragEvent) {
    event.preventDefault();
    dropZoneActive = false;
    if ($draggingTabId) {
      moveTabToPane($draggingTabId, 'right');
      draggingTabId.set(null);
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
      if (tab.filePath) {
        await saveFile(tab.filePath, tab.content, tab.encoding);
        saveTab($closeTabDialog.tabId);
      }
      removeTab($closeTabDialog.tabId);
      closeCloseTabDialog();
    } catch (error) {
      console.error('Failed to save file:', error);
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
      const fileContent = await invoke<FileContent>('read_file_content', { path: tab.filePath });
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
    // Register paneStore hooks
    setOnTabAdded((tabId: string) => {
      addTabToPane(tabId, $focusedPaneId, true);
    });

    // Initialize platform detection early (for font selection)
    await initPlatformDetection();

    // Load settings from localStorage
    try {
      const stored = localStorage.getItem('velt-settings');
      if (stored) {
        const loadedSettings = JSON.parse(stored);
        settings.set({ ...defaultSettings, ...loadedSettings });
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
        for (const filePath of cliFiles) {
          try {
            const fileContent = await invoke<FileContent>('read_file_content', { path: filePath });
            const newTab = createTab(fileContent.path, fileContent.content);
            newTab.encoding = fileContent.encoding;
            addTab(newTab);
          } catch (error) {
            console.error(`Failed to open file ${filePath}:`, error);
            const newTab = createTab(filePath, '');
            addTab(newTab);
          }
        }
      } else if ($tabs.length === 0) {
        handleNewFile();
      }
    } catch (error) {
      console.error('Failed to get CLI files:', error);
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

  {#if activeTab && $isMarkdownFile && $isMarkdownToolbarActive}
    <MarkdownToolbar />
  {/if}

  <div class="editor-area" bind:this={editorAreaEl}>
    <PaneGroup
      paneId="left"
      paneState={$leftPane}
      isFocused={$focusedPaneId === 'left' || !$hasRightPane}
      onStatusUpdate={handleLeftPaneStatusUpdate}
      {autoSaveManager}
      paneStyle={$hasRightPane ? `flex: 0 0 ${splitRatio}%` : ''}
    />

    {#if $hasRightPane && $rightPane}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="pane-divider"
        class:divider-active={isResizing}
        style="background-color: {$currentTheme?.ui?.border || '#3e3e42'}"
        on:mousedown={handleDividerMouseDown}
        on:dblclick={handleDividerDblClick}
      ></div>
      <PaneGroup
        paneId="right"
        paneState={$rightPane}
        isFocused={$focusedPaneId === 'right'}
        onStatusUpdate={handleRightPaneStatusUpdate}
        {autoSaveManager}
        paneStyle={`flex: 0 0 ${100 - splitRatio}%`}
      />
    {/if}

    <!-- Drop zone overlay when dragging a tab and no right pane exists -->
    {#if $draggingTabId && !$hasRightPane}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="drop-zone-overlay"
        class:drop-active={dropZoneActive}
        on:dragover|preventDefault={() => { dropZoneActive = true; }}
        on:dragenter={() => { dropZoneActive = true; }}
        on:dragleave={() => { dropZoneActive = false; }}
        on:drop|preventDefault={handleDropOnZone}
      >
        <span
          class="drop-zone-label"
          style="border-color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}; color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"
        >
          Drop to open in split view
        </span>
      </div>
    {/if}
  </div>

  {#if statusTab}
    <StatusBar
      line={currentStatus.line}
      column={currentStatus.column}
      totalLines={currentStatus.totalLines}
      totalChars={currentStatus.totalChars}
      selectedChars={currentStatus.selectedChars}
      encoding={statusTab.encoding?.toUpperCase() || 'UTF-8'}
      language={statusTab.isPreview ? 'Markdown' : (statusTab.language || 'Plain Text')}
      eol={currentStatus.eol}
      onEOLChange={handleStatusEOLChange}
      onEncodingChange={handleStatusEncodingChange}
      isMarkdown={$isMarkdownFile}
      isToolbarActive={$isMarkdownToolbarActive}
      onToggleToolbar={toggleMarkdownToolbar}
    />
  {/if}
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
    display: flex;
  }

  .pane-divider {
    width: 4px;
    flex-shrink: 0;
    cursor: col-resize;
    transition: background-color 0.15s;
    z-index: 10;
  }

  .pane-divider:hover,
  .pane-divider.divider-active {
    background-color: var(--divider-hover, rgba(0, 212, 170, 0.6)) !important;
  }

  .drop-zone-overlay {
    position: absolute;
    right: 0;
    top: 0;
    width: 50%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    transition: background-color 0.15s;
    z-index: 100;
  }

  .drop-zone-overlay.drop-active {
    background: rgba(0, 212, 170, 0.08);
  }

  .drop-zone-label {
    padding: 12px 24px;
    border: 2px dashed;
    border-radius: 8px;
    font-size: 13px;
    opacity: 0;
    transition: opacity 0.15s;
    pointer-events: none;
  }

  .drop-zone-overlay.drop-active .drop-zone-label {
    opacity: 1;
  }
</style>
