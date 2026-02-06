<script lang="ts">
  import { findReplaceState, closeFindReplace, toggleExpand, updateSearchText, updateReplaceText, toggleCaseSensitive, toggleUseRegex, toggleWholeWord } from '../stores/findReplaceStore';
  import { currentTheme } from '../stores/themeStore';
  import MagnifyingGlass from 'phosphor-svelte/lib/MagnifyingGlass';
  import ArrowsClockwise from 'phosphor-svelte/lib/ArrowsClockwise';
  import X from 'phosphor-svelte/lib/X';
  import CaretUp from 'phosphor-svelte/lib/CaretUp';
  import CaretDown from 'phosphor-svelte/lib/CaretDown';

  export let onFind: (text: string, direction: 'next' | 'prev' | 'none') => void;
  export let onReplace: () => void;
  export let onReplaceAll: () => void;
  export let onClose: () => void;

  let searchInput: HTMLInputElement;
  let replaceInput: HTMLInputElement;
  let lastOpenState = false;

  $: {
    // Only focus when panel transitions from closed to open (not on every render)
    if ($findReplaceState.isOpen && !lastOpenState && searchInput) {
      setTimeout(() => searchInput?.focus(), 50);
    }
    lastOpenState = $findReplaceState.isOpen;
  }

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    updateSearchText(target.value);
    // Trigger search on input but don't navigate (just update highlights and count)
    onFind(target.value, 'none');
  }

  function handleReplaceInput(event: Event) {
    const target = event.target as HTMLInputElement;
    updateReplaceText(target.value);
    // Don't trigger search when typing in replace box to avoid refocus issue
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeFindReplace();
      onClose();
    } else if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Shift+Enter: Previous
        onFind($findReplaceState.searchText, 'prev');
      } else {
        // Enter: Next
        onFind($findReplaceState.searchText, 'next');
      }
    }
  }

  function handleCloseClick() {
    closeFindReplace();
    onClose();
  }

  function handleToggleExpand() {
    toggleExpand();
    if ($findReplaceState.isExpanded && replaceInput) {
      setTimeout(() => replaceInput?.focus(), 50);
    }
  }

  function handleToggleCaseSensitive() {
    toggleCaseSensitive();
    // Re-run search with new option
    if ($findReplaceState.searchText) {
      onFind($findReplaceState.searchText, 'none');
    }
  }

  function handleToggleUseRegex() {
    toggleUseRegex();
    // Re-run search with new option
    if ($findReplaceState.searchText) {
      onFind($findReplaceState.searchText, 'none');
    }
  }

  function handleToggleWholeWord() {
    toggleWholeWord();
    // Re-run search with new option
    if ($findReplaceState.searchText) {
      onFind($findReplaceState.searchText, 'none');
    }
  }
</script>

{#if $findReplaceState.isOpen}
  <div
    class="find-replace-panel"
    class:expanded={$findReplaceState.isExpanded}
    style="
      background-color: {$currentTheme?.ui?.background || '#252526'};
      border-color: {$currentTheme?.ui?.border || '#3e3e42'};
      color: {$currentTheme?.ui?.textColor || '#cccccc'};
    "
    on:keydown={handleKeyDown}
  >
    <!-- Find Section -->
    <div class="panel-section">
      <div class="section-header">
        <span class="section-icon"><MagnifyingGlass size={16} weight="duotone" color={$currentTheme?.icons?.search || '#64B5F6'} /></span>
        <span class="section-title">Find{$findReplaceState.isExpanded ? ' & Replace' : ''}</span>
        <div class="header-actions">
          <button
            class="icon-button"
            on:click={handleCloseClick}
            title="Close (Esc)"
            style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
          >
            <X size={16} weight="bold" color={$currentTheme?.icons?.close || '#9E9E9E'} />
          </button>
        </div>
      </div>

      <div class="input-row">
        <input
          bind:this={searchInput}
          type="text"
          class="search-input"
          placeholder="Search text..."
          value={$findReplaceState.searchText}
          on:input={handleSearchInput}
          style="
            background-color: {$currentTheme?.editor?.background || '#1e1e1e'};
            border-color: {$currentTheme?.ui?.border || '#3e3e42'};
            color: {$currentTheme?.editor?.foreground || '#d4d4d4'};
          "
        />
        <div class="nav-buttons">
          <button
            class="icon-button small"
            on:click={() => onFind($findReplaceState.searchText, 'prev')}
            title="Previous (Shift+Enter)"
            disabled={!$findReplaceState.searchText || $findReplaceState.matchCount === 0}
            style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
          >
            <CaretUp size={14} weight="bold" color={$currentTheme?.icons?.search || '#64B5F6'} />
          </button>
          <button
            class="icon-button small"
            on:click={() => onFind($findReplaceState.searchText, 'next')}
            title="Next (Enter)"
            disabled={!$findReplaceState.searchText || $findReplaceState.matchCount === 0}
            style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
          >
            <CaretDown size={14} weight="bold" color={$currentTheme?.icons?.search || '#64B5F6'} />
          </button>
        </div>
      </div>

      <div class="options-row">
        {#if $findReplaceState.matchCount > 0}
          <span class="match-counter" style="color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}">
            {$findReplaceState.currentMatchIndex} of {$findReplaceState.matchCount}
          </span>
        {:else if $findReplaceState.searchText}
          <span class="match-counter" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
            No matches
          </span>
        {:else}
          <span class="match-counter"></span>
        {/if}

        <div class="toggle-buttons">
          <button
            class="toggle-button"
            class:active={$findReplaceState.caseSensitive}
            on:click={handleToggleCaseSensitive}
            title="Match Case"
            style="
              color: {$findReplaceState.caseSensitive ? ($currentTheme?.ui?.accentPrimary || '#00d4aa') : ($currentTheme?.ui?.textColor || '#cccccc')};
              border-color: {$findReplaceState.caseSensitive ? ($currentTheme?.ui?.accentPrimary || '#00d4aa') : ($currentTheme?.ui?.border || '#3e3e42')};
            "
          >
            Aa
          </button>
          <button
            class="toggle-button"
            class:active={$findReplaceState.useRegex}
            on:click={handleToggleUseRegex}
            title="Use Regular Expression"
            style="
              color: {$findReplaceState.useRegex ? ($currentTheme?.ui?.accentPrimary || '#00d4aa') : ($currentTheme?.ui?.textColor || '#cccccc')};
              border-color: {$findReplaceState.useRegex ? ($currentTheme?.ui?.accentPrimary || '#00d4aa') : ($currentTheme?.ui?.border || '#3e3e42')};
            "
          >
            .*
          </button>
          <button
            class="toggle-button"
            class:active={$findReplaceState.wholeWord}
            on:click={handleToggleWholeWord}
            title="Match Whole Word"
            style="
              color: {$findReplaceState.wholeWord ? ($currentTheme?.ui?.accentPrimary || '#00d4aa') : ($currentTheme?.ui?.textColor || '#cccccc')};
              border-color: {$findReplaceState.wholeWord ? ($currentTheme?.ui?.accentPrimary || '#00d4aa') : ($currentTheme?.ui?.border || '#3e3e42')};
            "
          >
            Ab
          </button>
        </div>
      </div>

      <!-- Expand/Collapse button in bottom left -->
      <div class="expand-row">
        <button
          class="expand-button"
          on:click={handleToggleExpand}
          title={$findReplaceState.isExpanded ? 'Collapse Replace' : 'Expand to Replace'}
          style="
            color: {$currentTheme?.ui?.textColor || '#cccccc'};
            border-color: {$currentTheme?.ui?.border || '#3e3e42'};
          "
        >
          <span class="expand-icon">{#if $findReplaceState.isExpanded}<CaretUp size={12} weight="bold" color={$currentTheme?.icons?.replace || '#FFD54F'} />{:else}<CaretDown size={12} weight="bold" color={$currentTheme?.icons?.replace || '#FFD54F'} />{/if}</span>
          <span>{$findReplaceState.isExpanded ? 'Hide Replace' : 'Show Replace'}</span>
        </button>
      </div>
    </div>

    <!-- Replace Section (shown when expanded) -->
    {#if $findReplaceState.isExpanded}
      <div class="panel-section replace-section">
        <div class="section-label">
          <span class="section-icon"><ArrowsClockwise size={16} weight="duotone" color={$currentTheme?.icons?.replace || '#FFD54F'} /></span>
          <span>Replace</span>
        </div>

        <div class="input-row">
          <input
            bind:this={replaceInput}
            type="text"
            class="search-input"
            placeholder="Replace with..."
            value={$findReplaceState.replaceText}
            on:input={handleReplaceInput}
            style="
              background-color: {$currentTheme?.editor?.background || '#1e1e1e'};
              border-color: {$currentTheme?.ui?.border || '#3e3e42'};
              color: {$currentTheme?.editor?.foreground || '#d4d4d4'};
            "
          />
        </div>

        <div class="action-buttons">
          <button
            class="action-button"
            on:click={onReplace}
            disabled={!$findReplaceState.searchText || $findReplaceState.matchCount === 0}
            style="
              background-color: {$currentTheme?.ui?.accent || '#0e639c'};
              color: #ffffff;
              opacity: {!$findReplaceState.searchText || $findReplaceState.matchCount === 0 ? 0.5 : 1};
            "
          >
            Replace
          </button>
          <button
            class="action-button"
            on:click={onReplaceAll}
            disabled={!$findReplaceState.searchText || $findReplaceState.matchCount === 0}
            style="
              background-color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'};
              color: {$currentTheme?.editor?.background || '#1e1e1e'};
              opacity: {!$findReplaceState.searchText || $findReplaceState.matchCount === 0 ? 0.5 : 1};
            "
          >
            Replace All
          </button>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .find-replace-panel {
    position: absolute;
    top: 8px;
    right: 8px;
    min-width: 400px;
    border: 1px solid;
    border-radius: 6px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
    z-index: 100;
    padding: 12px;
    animation: slideIn 0.2s ease-out;
    max-height: 90vh;
    overflow-y: auto;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .panel-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .replace-section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    animation: expandIn 0.2s ease-out;
  }

  @keyframes expandIn {
    from {
      opacity: 0;
      max-height: 0;
      overflow: hidden;
    }
    to {
      opacity: 1;
      max-height: 500px;
    }
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .section-icon {
    font-size: 16px;
    line-height: 1;
  }

  .section-title {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 4px;
  }

  .section-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    margin-bottom: 4px;
  }

  .input-row {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .search-input {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid;
    border-radius: 4px;
    font-size: 13px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
  }

  .search-input:focus {
    border-color: rgba(0, 212, 170, 0.6);
    box-shadow: 0 0 0 2px rgba(0, 212, 170, 0.1);
  }

  .nav-buttons {
    display: flex;
    gap: 2px;
  }

  .icon-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background-color: transparent;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .icon-button.small {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  .icon-button:hover:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .icon-button:active:not(:disabled) {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .icon-button:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .options-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 24px;
  }

  .match-counter {
    font-size: 12px;
    font-weight: 500;
    min-width: 80px;
  }

  .toggle-buttons {
    display: flex;
    gap: 6px;
  }

  .toggle-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 24px;
    background-color: transparent;
    border: 1px solid;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .toggle-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .toggle-button.active {
    background-color: rgba(0, 212, 170, 0.15);
  }

  .action-buttons {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .action-button {
    flex: 1;
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .action-button:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  .action-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .action-button:disabled {
    cursor: not-allowed;
  }

  .expand-row {
    display: flex;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }

  .expand-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    background-color: transparent;
    border: 1px solid;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .expand-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .expand-icon {
    font-size: 10px;
  }
</style>
