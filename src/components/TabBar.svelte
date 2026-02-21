<script lang="ts">
  import { getTab } from '../stores/appStore';
  import { openCloseTabDialog } from '../stores/dialogStore';
  import { markdownModeSet, toggleMarkdownMode } from '../stores/markdownPreviewStore';
  import { getFileName } from '@altagen/velt-core';
  import type { Tab } from '../types';
  import { currentTheme } from '../stores/themeStore';
  import { draggingTabId } from '../stores/paneStore';
  import type { PaneId } from '../stores/paneStore';
  import X from 'phosphor-svelte/lib/X';
  import Eye from 'phosphor-svelte/lib/Eye';
  import EyeSlash from 'phosphor-svelte/lib/EyeSlash';

  export let paneId: PaneId;
  export let paneTabs: Tab[];
  export let paneActiveTabId: string | null;
  export let onSelectTab: (tabId: string) => void;
  export let onCloseTab: (event: MouseEvent, tabId: string) => void;

  function handleDragStart(event: DragEvent, tabId: string) {
    draggingTabId.set(tabId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', tabId);
    }
  }

  function handleDragEnd() {
    draggingTabId.set(null);
  }

  function handleKeyDown(event: KeyboardEvent, tabId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectTab(tabId);
    }
  }

  function isTabMdFile(tab: Tab): boolean {
    if (tab.language === 'markdown') return true;
    if (tab.filePath) {
      const ext = tab.filePath.split('.').pop()?.toLowerCase();
      return ext === 'md' || ext === 'markdown' || ext === 'mdx';
    }
    return false;
  }

  function handleTogglePreview(event: MouseEvent, tabId: string) {
    event.stopPropagation();
    toggleMarkdownMode(tabId);
  }

  function getTabTitle(tab: Tab): string {
    if (tab.isPreview) {
      const name = tab.filePath ? getFileName(tab.filePath) : 'Untitled';
      return `Preview: ${name}`;
    }
    if (tab.filePath) {
      return getFileName(tab.filePath);
    }
    return 'Untitled';
  }
</script>

<div
  class="tab-bar"
  style="background-color: {$currentTheme?.ui?.tabBar || '#2d2d30'}"
>
  {#each paneTabs as tab (tab.id)}
    <div
      class="tab"
      class:active={paneActiveTabId === tab.id}
      class:dirty={tab.isDirty}
      style="
        background-color: {paneActiveTabId === tab.id ? ($currentTheme?.ui?.tabActive || '#1e1e1e') : ($currentTheme?.ui?.tabInactive || '#2d2d30')};
        color: {paneActiveTabId === tab.id ? ($currentTheme?.ui?.textActiveColor || '#ffffff') : ($currentTheme?.ui?.textColor || '#969696')};
      "
      on:click={() => onSelectTab(tab.id)}
      on:keydown={(e) => handleKeyDown(e, tab.id)}
      draggable="true"
      on:dragstart={(e) => handleDragStart(e, tab.id)}
      on:dragend={handleDragEnd}
      role="tab"
      tabindex="-1"
      title={tab.filePath || 'Untitled'}
    >
      {#if !tab.isPreview && isTabMdFile(tab)}
        <button
          class="preview-toggle"
          on:click={(e) => handleTogglePreview(e, tab.id)}
          aria-label="Toggle preview"
          tabindex="-1"
          title={$markdownModeSet.has(tab.id) ? 'Hide preview' : 'Show preview'}
        >
          {#if $markdownModeSet.has(tab.id)}
            <Eye size={14} weight="duotone" color={$currentTheme?.ui?.accentPrimary || '#00d4aa'} />
          {:else}
            <EyeSlash size={14} weight="duotone" color={$currentTheme?.ui?.textSecondary || '#858585'} />
          {/if}
        </button>
      {:else if tab.isPreview}
        <span class="icon preview-icon">
          <Eye size={14} weight="duotone" color={$currentTheme?.ui?.accentPrimary || '#00d4aa'} />
        </span>
      {:else if tab.isDirty}
        <span
          class="dirty-indicator"
          style="background-color: {$currentTheme?.ui?.dirtyIndicator || '#4ec9b0'}"
          title="Unsaved changes"
        ></span>
      {/if}
      <span class="tab-title">{getTabTitle(tab)}</span>
      <button
        class="close-button"
        on:click={(e) => onCloseTab(e, tab.id)}
        aria-label="Close tab"
        tabindex="-1"
      >
        <X size={14} weight="bold" color={$currentTheme?.icons?.close || '#9E9E9E'} />
      </button>
    </div>
  {/each}
</div>

<style>
  .tab-bar {
    display: flex;
    border-bottom: 1px solid rgba(0, 0, 0, 0.3);
    overflow-x: auto;
    height: 35px;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 12px;
    min-width: 120px;
    max-width: 200px;
    border-right: 1px solid rgba(0, 0, 0, 0.2);
    cursor: pointer;
    user-select: none;
    transition: all 0.1s;
  }

  .tab:hover {
    filter: brightness(1.15);
  }

  .preview-icon {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    line-height: 1;
  }

  .dirty-indicator {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .tab-title {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 13px;
  }

  .preview-toggle {
    background: none;
    border: none;
    color: inherit;
    line-height: 1;
    padding: 2px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.1s;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    border-radius: 3px;
  }

  .preview-toggle:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
  }

  .close-button {
    background: none;
    border: none;
    color: inherit;
    font-size: 20px;
    line-height: 1;
    padding: 0;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.1s;
    flex-shrink: 0;
  }

  .close-button:hover {
    opacity: 1;
  }
</style>
