<script lang="ts">
  import { onMount } from 'svelte';
  import { getRecentFiles, clearRecentFiles } from '../lib/recentFiles';
  import { currentTheme } from '../stores/themeStore';
  import ClockCounterClockwise from 'phosphor-svelte/lib/ClockCounterClockwise';
  import File from 'phosphor-svelte/lib/File';

  export let onFileSelect: (filePath: string) => void;

  let recentFiles: string[] = [];
  let isOpen = false;

  async function loadRecentFiles() {
    recentFiles = await getRecentFiles();
  }

  function getFileName(filePath: string): string {
    const parts = filePath.split(/[/\\]/);
    return parts[parts.length - 1];
  }

  function handleFileClick(filePath: string) {
    onFileSelect(filePath);
    isOpen = false;
  }

  async function handleClearRecent() {
    await clearRecentFiles();
    await loadRecentFiles();
    isOpen = false;
  }

  function toggleMenu() {
    isOpen = !isOpen;
    if (isOpen) {
      loadRecentFiles();
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (isOpen) {
      const target = event.target as HTMLElement;
      if (!target.closest('.recent-files-container')) {
        isOpen = false;
      }
    }
  }

  onMount(() => {
    loadRecentFiles();
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="recent-files-container">
  <button
    class="menu-button"
    on:click|stopPropagation={toggleMenu}
    title="Recent Files"
    tabindex="-1"
    style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
  >
    <span class="icon"><ClockCounterClockwise size={18} weight="duotone" color={$currentTheme?.icons?.clock || '#FFB74D'} /></span>
    <span class="label">Recent</span>
  </button>

  {#if isOpen}
    <div
      class="recent-files-dropdown"
      style="background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
    >
      {#if recentFiles.length > 0}
        <div class="recent-files-list">
          {#each recentFiles as filePath (filePath)}
            <button
              class="recent-file-item"
              on:click={() => handleFileClick(filePath)}
              title={filePath}
              tabindex="-1"
              style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
            >
              <span class="file-icon"><File size={14} weight="duotone" color={$currentTheme?.icons?.file || '#64B5F6'} /></span>
              <span class="file-name">{getFileName(filePath)}</span>
            </button>
          {/each}
        </div>
        <div
          class="recent-files-footer"
          style="border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
        >
          <button
            class="clear-recent-btn"
            on:click={handleClearRecent}
            tabindex="-1"
            style="color: {$currentTheme?.ui?.textSecondary || '#858585'}"
          >
            Clear Recent Files
          </button>
        </div>
      {:else}
        <div class="empty-recent" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
          No recent files
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .recent-files-container {
    position: relative;
    display: inline-block;
  }

  .menu-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 13px;
    transition: background-color 0.1s;
  }

  .menu-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .icon {
    font-size: 14px;
  }

  .recent-files-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    min-width: 280px;
    max-width: 400px;
    border: 1px solid;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    margin-top: 2px;
  }

  .recent-files-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .recent-file-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    font-size: 13px;
    transition: background-color 0.1s;
  }

  .recent-file-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .file-icon {
    font-size: 12px;
    flex-shrink: 0;
  }

  .file-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .recent-files-footer {
    border-top: 1px solid;
    padding: 4px;
  }

  .clear-recent-btn {
    width: 100%;
    padding: 6px 12px;
    background: none;
    border: none;
    text-align: center;
    cursor: pointer;
    font-size: 12px;
    transition: background-color 0.1s;
  }

  .clear-recent-btn:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .empty-recent {
    padding: 16px;
    text-align: center;
    font-size: 13px;
  }
</style>
