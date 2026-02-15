<script lang="ts">
  import { currentTheme } from '../stores/themeStore';
  import { settings } from '../stores/appStore';
  import Crosshair from 'phosphor-svelte/lib/Crosshair';
  import CheckCircle from 'phosphor-svelte/lib/CheckCircle';
  import ArrowRight from 'phosphor-svelte/lib/ArrowRight';
  import TextOutdent from 'phosphor-svelte/lib/TextOutdent';
  import TextIndent from 'phosphor-svelte/lib/TextIndent';
  import Paragraph from 'phosphor-svelte/lib/Paragraph';
  import CircleDashed from 'phosphor-svelte/lib/CircleDashed';
  import MagnifyingGlass from 'phosphor-svelte/lib/MagnifyingGlass';
  import KeyReturn from 'phosphor-svelte/lib/KeyReturn';
  import FileText from 'phosphor-svelte/lib/FileText';
  import Code from 'phosphor-svelte/lib/Code';

  export let line: number = 1;
  export let column: number = 1;
  export let totalLines: number = 0;
  export let totalChars: number = 0;
  export let selectedChars: number = 0;
  export let encoding: string = 'UTF-8';
  export let language: string = 'Plain Text';
  export let eol: string = 'LF'; // Line ending type
  export let onEOLChange: (eol: string) => void = () => {}; // Callback to change EOL
  export let onEncodingChange: (encoding: string) => void = () => {}; // Callback to change encoding

  // Dropdown states
  let showTabSizeMenu = false;
  let showWordWrapMenu = false;
  let showEOLMenu = false;
  let showEncodingMenu = false;

  function toggleTabSizeMenu() {
    showTabSizeMenu = !showTabSizeMenu;
    showWordWrapMenu = false;
    showEOLMenu = false;
    showEncodingMenu = false;
  }

  function toggleWordWrapMenu() {
    showWordWrapMenu = !showWordWrapMenu;
    showTabSizeMenu = false;
    showEOLMenu = false;
    showEncodingMenu = false;
  }

  function toggleEOLMenu() {
    showEOLMenu = !showEOLMenu;
    showTabSizeMenu = false;
    showWordWrapMenu = false;
    showEncodingMenu = false;
  }

  function toggleEncodingMenu() {
    showEncodingMenu = !showEncodingMenu;
    showTabSizeMenu = false;
    showWordWrapMenu = false;
    showEOLMenu = false;
  }

  function setTabSize(size: number) {
    settings.update(s => ({ ...s, tabSize: size }));
    showTabSizeMenu = false;
  }

  function toggleWordWrap() {
    settings.update(s => ({ ...s, wordWrap: !s.wordWrap }));
    showWordWrapMenu = false;
  }

  function toggleShowInvisibles() {
    settings.update(s => ({ ...s, showInvisibles: !s.showInvisibles }));
  }

  function changeEOL(newEOL: string) {
    onEOLChange(newEOL);
    showEOLMenu = false;
  }

  function changeEncoding(newEncoding: string) {
    onEncodingChange(newEncoding);
    showEncodingMenu = false;
  }

  // Close menus when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.status-item')) {
      showTabSizeMenu = false;
      showWordWrapMenu = false;
      showEOLMenu = false;
      showEncodingMenu = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div
  class="status-bar"
  style="
    background-color: {$currentTheme?.ui?.background || '#252526'};
    border-top: 1px solid {$currentTheme?.ui?.border || '#3e3e42'};
    color: {$currentTheme?.ui?.textColor || '#cccccc'};
  "
>
  <div class="status-left">
    <div
      class="status-item"
      title="Cursor Position (Line : Column)"
      style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
    >
      <span class="icon"><Crosshair size={14} weight="duotone" color={$currentTheme?.icons?.cursor || '#42A5F5'} /></span>
      <span>Ln {line}, Col {column}</span>
    </div>

    {#if selectedChars > 0}
      <div
        class="status-item"
        title="Selection"
        style="color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"
      >
        <span class="icon"><CheckCircle size={14} weight="duotone" color={$currentTheme?.icons?.selection || '#66BB6A'} /></span>
        <span>{selectedChars} selected</span>
      </div>
    {/if}

    <div
      class="status-item"
      title="Document Statistics"
      style="color: {$currentTheme?.ui?.textSecondary || '#858585'}"
    >
      <span>{totalLines} lines, {totalChars} chars</span>
    </div>
  </div>

  <div class="status-right">
    <!-- Tab Size -->
    <div
      class="status-item clickable"
      title="Tab Size (click to change)"
      style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
      on:click={(e) => { e.stopPropagation(); toggleTabSizeMenu(); }}
    >
      <span class="icon"><ArrowRight size={14} weight="duotone" color={$currentTheme?.icons?.whitespace || '#78909C'} /></span>
      <span>Spaces: {$settings.tabSize}</span>
      {#if showTabSizeMenu}
        <div class="dropdown-menu" style="background-color: {$currentTheme?.ui?.background || '#252526'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}">
          <button class="dropdown-item" tabindex="-1" class:active={$settings.tabSize === 2} on:click={() => setTabSize(2)} style="color: {$currentTheme?.ui?.textColor || '#cccccc'}">2 Spaces</button>
          <button class="dropdown-item" tabindex="-1" class:active={$settings.tabSize === 4} on:click={() => setTabSize(4)} style="color: {$currentTheme?.ui?.textColor || '#cccccc'}">4 Spaces</button>
          <button class="dropdown-item" tabindex="-1" class:active={$settings.tabSize === 8} on:click={() => setTabSize(8)} style="color: {$currentTheme?.ui?.textColor || '#cccccc'}">8 Spaces</button>
        </div>
      {/if}
    </div>

    <!-- Word Wrap -->
    <div
      class="status-item clickable"
      title="Word Wrap (click to toggle)"
      style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
      on:click={(e) => { e.stopPropagation(); toggleWordWrap(); }}
    >
      <span class="icon">{#if $settings.wordWrap}<TextIndent size={14} weight="duotone" color={$currentTheme?.icons?.wrap || '#9575CD'} />{:else}<TextOutdent size={14} weight="duotone" color={$currentTheme?.icons?.wrap || '#9575CD'} />{/if}</span>
      <span>{$settings.wordWrap ? 'Wrap' : 'No Wrap'}</span>
    </div>

    <!-- Show Invisibles -->
    <div
      class="status-item clickable"
      title="Show Whitespace (click to toggle)"
      style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
      on:click={(e) => { e.stopPropagation(); toggleShowInvisibles(); }}
    >
      <span class="icon">{#if $settings.showInvisibles}<Paragraph size={14} weight="duotone" color={$currentTheme?.icons?.whitespace || '#78909C'} />{:else}<CircleDashed size={14} weight="duotone" color={$currentTheme?.icons?.whitespace || '#78909C'} />{/if}</span>
      <span>{$settings.showInvisibles ? 'Visible' : 'Hidden'}</span>
    </div>

    <!-- Zoom Level -->
    <div
      class="status-item"
      title="Zoom Level (Ctrl+/Ctrl-/Ctrl+0)"
      style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
    >
      <span class="icon"><MagnifyingGlass size={14} weight="duotone" color={$currentTheme?.icons?.zoom || '#4FC3F7'} /></span>
      <span>{$settings.zoomLevel}%</span>
    </div>

    <!-- EOL (Line Endings) -->
    <div
      class="status-item clickable"
      title="Line Endings (click to change)"
      style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
      on:click={(e) => { e.stopPropagation(); toggleEOLMenu(); }}
    >
      <span class="icon"><KeyReturn size={14} weight="duotone" color={$currentTheme?.icons?.eol || '#A1887F'} /></span>
      <span>{eol}</span>
      {#if showEOLMenu}
        <div class="dropdown-menu" style="background-color: {$currentTheme?.ui?.background || '#252526'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}">
          <button class="dropdown-item" tabindex="-1" class:active={eol === 'LF'} on:click={() => changeEOL('LF')} style="color: {$currentTheme?.ui?.textColor || '#cccccc'}">LF (Unix)</button>
          <button class="dropdown-item" tabindex="-1" class:active={eol === 'CRLF'} on:click={() => changeEOL('CRLF')} style="color: {$currentTheme?.ui?.textColor || '#cccccc'}">CRLF (Windows)</button>
          <button class="dropdown-item" tabindex="-1" class:active={eol === 'CR'} on:click={() => changeEOL('CR')} style="color: {$currentTheme?.ui?.textColor || '#cccccc'}">CR (Old Mac)</button>
        </div>
      {/if}
    </div>

    <!-- Encoding -->
    <div
      class="status-item clickable"
      title="File Encoding (click to change)"
      style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
      on:click={(e) => { e.stopPropagation(); toggleEncodingMenu(); }}
    >
      <span class="icon"><FileText size={14} weight="duotone" color={$currentTheme?.icons?.encoding || '#F06292'} /></span>
      <span>{encoding}</span>
      {#if showEncodingMenu}
        <div class="dropdown-menu" style="background-color: {$currentTheme?.ui?.background || '#252526'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}">
          <button class="dropdown-item" tabindex="-1" class:active={encoding === 'UTF-8'} on:click={() => changeEncoding('UTF-8')} style="color: {$currentTheme?.ui?.textColor || '#cccccc'}">UTF-8</button>
          <button class="dropdown-item" tabindex="-1" class:active={encoding === 'UTF-8-BOM'} on:click={() => changeEncoding('UTF-8-BOM')} style="color: {$currentTheme?.ui?.textColor || '#cccccc'}">UTF-8 with BOM</button>
          <button class="dropdown-item" tabindex="-1" class:active={encoding === 'UTF-16LE'} on:click={() => changeEncoding('UTF-16LE')} style="color: {$currentTheme?.ui?.textColor || '#cccccc'}">UTF-16 LE</button>
          <button class="dropdown-item" tabindex="-1" class:active={encoding === 'UTF-16BE'} on:click={() => changeEncoding('UTF-16BE')} style="color: {$currentTheme?.ui?.textColor || '#cccccc'}">UTF-16 BE</button>
          <button class="dropdown-item" tabindex="-1" class:active={encoding === 'WINDOWS-1252' || encoding === 'ANSI'} on:click={() => changeEncoding('WINDOWS-1252')} style="color: {$currentTheme?.ui?.textColor || '#cccccc'}">ANSI / Windows-1252</button>
        </div>
      {/if}
    </div>

    <!-- Language -->
    <div
      class="status-item"
      title="Language Mode"
      style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
    >
      <span class="icon"><Code size={14} weight="duotone" color={$currentTheme?.icons?.language || '#4DB6AC'} /></span>
      <span>{language}</span>
    </div>
  </div>
</div>

<style>
  .status-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 12px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    min-height: 26px;
    user-select: none;
  }

  .status-left,
  .status-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .status-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 3px;
    transition: background-color 0.15s;
    position: relative;
  }

  .status-item.clickable {
    cursor: pointer;
    user-select: none;
  }

  .status-item.clickable:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .status-item.clickable:active {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .icon {
    font-size: 11px;
    line-height: 1;
  }

  .dropdown-menu {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 4px;
    border: 1px solid;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    min-width: 120px;
    overflow: hidden;
  }

  .dropdown-item {
    display: block;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: none;
    text-align: left;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.1s;
  }

  .dropdown-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .dropdown-item.active {
    background-color: rgba(0, 212, 170, 0.2);
    font-weight: 600;
  }
</style>
