<script lang="ts">
  import TabBar from './TabBar.svelte';
  import Editor from './Editor.svelte';
  import MarkdownPreview from './MarkdownPreview.svelte';
  import { tabs, removeTab, getTab, updateTabContent, createTab, addTab } from '../stores/appStore';
  import { setActiveTab, setFocusedPane, moveTabToPane, draggingTabId } from '../stores/paneStore';
  import type { PaneId, PaneState } from '../stores/paneStore';
  import { openCloseTabDialog } from '../stores/dialogStore';
  import { toggleMarkdownMode } from '../stores/markdownPreviewStore';
  import { currentTheme } from '../stores/themeStore';
  import { getFileName } from '@altagen/velt-core';
  import type { Tab } from '../types';

  export let paneId: PaneId;
  export let paneState: PaneState;
  export let isFocused: boolean;
  export let onStatusUpdate: (data: { line: number; column: number; totalLines: number; totalChars: number; selectedChars: number; eol: string }) => void = () => {};
  export let autoSaveManager: any = null;
  export let paneStyle: string = '';

  // Resolve tab objects from IDs
  $: paneTabs = paneState.tabIds
    .map(id => $tabs.find(t => t.id === id))
    .filter((t): t is Tab => t !== undefined);

  $: activeTab = paneState.activeTabId
    ? $tabs.find(t => t.id === paneState.activeTabId) || null
    : null;

  // For preview tabs, get source content
  $: previewSourceContent = activeTab?.isPreview && activeTab?.sourceTabId
    ? ($tabs.find(t => t.id === activeTab.sourceTabId)?.content || '')
    : '';

  // When active tab is a preview, compute status from source content
  $: if (activeTab?.isPreview && previewSourceContent !== undefined) {
    onStatusUpdate({
      line: 1, column: 1,
      totalLines: previewSourceContent ? previewSourceContent.split('\n').length : 0,
      totalChars: previewSourceContent ? previewSourceContent.length : 0,
      selectedChars: 0, eol: 'LF'
    });
  }

  function handleSelectTab(tabId: string) {
    setActiveTab(paneId, tabId);
  }

  function handleCloseTab(event: MouseEvent, tabId: string) {
    event.stopPropagation();

    const tab = getTab(tabId);
    if (!tab) return;

    // Preview tabs: toggle off markdown mode
    if (tab.isPreview) {
      if (tab.sourceTabId) {
        toggleMarkdownMode(tab.sourceTabId);
      } else {
        removeTab(tabId);
      }
      return;
    }

    if (tab.isDirty) {
      const filename = tab.filePath ? getFileName(tab.filePath) : 'Untitled';
      openCloseTabDialog(tabId, filename);
    } else {
      removeTab(tabId);
    }
  }

  function handleContentChange(content: string) {
    if (paneState.activeTabId) {
      updateTabContent(paneState.activeTabId, content);

      if (autoSaveManager) {
        const tab = $tabs.find(t => t.id === paneState.activeTabId);
        if (tab) {
          autoSaveManager.save(paneState.activeTabId, tab.filePath, content, tab.encoding);
        }
      }
    }
  }

  function handleFocus() {
    setFocusedPane(paneId);
  }

  // Drop zone handling for receiving tabs from other pane
  let dropActive = false;

  function handleDragOver(event: DragEvent) {
    if ($draggingTabId) {
      event.preventDefault();
      dropActive = true;
    }
  }

  function handleDragLeave() {
    dropActive = false;
  }

  function handleDrop(event: DragEvent) {
    dropActive = false;
    if ($draggingTabId) {
      event.preventDefault();
      moveTabToPane($draggingTabId, paneId);
      draggingTabId.set(null);
    }
  }

  function handleNewFile() {
    const newTab = createTab();
    addTab(newTab);
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions a11y-no-noninteractive-element-interactions -->
<div
  class="pane-group"
  class:pane-focused={isFocused}
  class:drop-target={dropActive}
  on:focusin={handleFocus}
  on:dragover={handleDragOver}
  on:dragleave={handleDragLeave}
  on:drop={handleDrop}
  style="--focus-color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}; {paneStyle}"
  role="group"
  aria-label="{paneId} editor pane"
>
  <TabBar
    {paneId}
    {paneTabs}
    paneActiveTabId={paneState.activeTabId}
    onSelectTab={handleSelectTab}
    onCloseTab={handleCloseTab}
  />

  <div class="pane-content">
    {#if activeTab}
      {#if activeTab.isPreview}
        <MarkdownPreview content={previewSourceContent} />
      {:else}
        <Editor tab={activeTab} {paneId} onContentChange={handleContentChange} {onStatusUpdate} />
      {/if}
    {:else}
      <div class="empty-state">
        <p style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">No file open</p>
        <button
          on:click={handleNewFile}
          tabindex="-1"
          style="background-color: {$currentTheme?.ui?.accent || '#0e639c'}; color: #ffffff"
        >
          Create New File
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .pane-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
    position: relative;
  }

  .pane-focused {
    box-shadow: inset 0 2px 0 0 var(--focus-color);
  }

  .pane-content {
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .drop-target {
    outline: 2px dashed var(--focus-color);
    outline-offset: -2px;
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
