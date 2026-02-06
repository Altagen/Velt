<script lang="ts">
  import { tabs, activeTabId, removeTab, getTab } from '../stores/appStore';
  import { openCloseTabDialog } from '../stores/dialogStore';
  import { getFileName } from '@altagen/velt-core';
  import type { Tab } from '../types';
  import { currentTheme } from '../stores/themeStore';
  import X from 'phosphor-svelte/lib/X';

  function selectTab(tabId: string) {
    activeTabId.set(tabId);
  }

  function closeTab(event: MouseEvent, tabId: string) {
    event.stopPropagation();

    const tab = getTab(tabId);
    if (!tab) return;

    // If tab has unsaved changes, show confirmation dialog
    if (tab.isDirty) {
      const filename = getTabTitle(tab);
      openCloseTabDialog(tabId, filename);
    } else {
      // No unsaved changes, close directly
      removeTab(tabId);
    }
  }

  function handleKeyDown(event: KeyboardEvent, tabId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectTab(tabId);
    }
  }

  function getTabTitle(tab: Tab): string {
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
  {#each $tabs as tab (tab.id)}
    <div
      class="tab"
      class:active={$activeTabId === tab.id}
      class:dirty={tab.isDirty}
      style="
        background-color: {$activeTabId === tab.id ? ($currentTheme?.ui?.tabActive || '#1e1e1e') : ($currentTheme?.ui?.tabInactive || '#2d2d30')};
        color: {$activeTabId === tab.id ? ($currentTheme?.ui?.textActiveColor || '#ffffff') : ($currentTheme?.ui?.textColor || '#969696')};
      "
      on:click={() => selectTab(tab.id)}
      on:keydown={(e) => handleKeyDown(e, tab.id)}
      role="tab"
      tabindex="0"
      title={tab.filePath || 'Untitled'}
    >
      {#if tab.isDirty}
        <span
          class="dirty-indicator"
          style="background-color: {$currentTheme?.ui?.dirtyIndicator || '#4ec9b0'}"
          title="Unsaved changes"
        ></span>
      {/if}
      <span class="tab-title">{getTabTitle(tab)}</span>
      <button
        class="close-button"
        on:click={(e) => closeTab(e, tab.id)}
        aria-label="Close tab"
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
