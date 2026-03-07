<script lang="ts">
  import { currentTheme } from '../stores/themeStore';
  import { isLightTheme } from '../lib/themeUtils';
  import { ADMONITION_TYPES, type AdmonitionType } from '../lib/tiptap/AdmonitionNode';
  import type { Editor } from '@tiptap/core';
  import TextB from 'phosphor-svelte/lib/TextB';
  import TextItalic from 'phosphor-svelte/lib/TextItalic';
  import TextStrikethrough from 'phosphor-svelte/lib/TextStrikethrough';
  import TextHOne from 'phosphor-svelte/lib/TextHOne';
  import TextHTwo from 'phosphor-svelte/lib/TextHTwo';
  import TextHThree from 'phosphor-svelte/lib/TextHThree';
  import LinkSimple from 'phosphor-svelte/lib/LinkSimple';
  import ImageSquare from 'phosphor-svelte/lib/ImageSquare';
  import Code from 'phosphor-svelte/lib/Code';
  import CodeBlock from 'phosphor-svelte/lib/CodeBlock';
  import Quotes from 'phosphor-svelte/lib/Quotes';
  import ListBullets from 'phosphor-svelte/lib/ListBullets';
  import ListNumbers from 'phosphor-svelte/lib/ListNumbers';
  import ListChecks from 'phosphor-svelte/lib/ListChecks';
  import Table from 'phosphor-svelte/lib/Table';
  import Minus from 'phosphor-svelte/lib/Minus';
  import MathOperations from 'phosphor-svelte/lib/MathOperations';
  import TreeStructure from 'phosphor-svelte/lib/TreeStructure';
  import Warning from 'phosphor-svelte/lib/Warning';

  export let editor: Editor | null = null;
  export let onHide: () => void = () => {};

  // ── Theme ─────────────────────────────────────────────────────────────────
  $: isLight = isLightTheme($currentTheme?.editor?.background || '#1e1e1e');

  // Admonition colours from theme — falls back to sensible defaults
  $: admonitionColors = {
    note:    $currentTheme?.markdownPreview?.admonitions?.note?.borderColor    || '#9e9e9e',
    info:    $currentTheme?.markdownPreview?.admonitions?.info?.borderColor    || '#2196f3',
    warning: $currentTheme?.markdownPreview?.admonitions?.warning?.borderColor || '#e6a700',
    danger:  $currentTheme?.markdownPreview?.admonitions?.danger?.borderColor  || '#e53935',
    tip:     $currentTheme?.markdownPreview?.admonitions?.tip?.borderColor     || '#4caf50',
  } as Record<AdmonitionType, string>;

  // ── Admonition dropdown ───────────────────────────────────────────────────
  let showAdmonitionMenu = false;
  let admonitionDropdownStyle = '';
  let admonitionBtnEl: HTMLButtonElement;

  function toggleAdmonitionMenu(e: MouseEvent) {
    e.stopPropagation();
    if (!showAdmonitionMenu && admonitionBtnEl) {
      const rect = admonitionBtnEl.getBoundingClientRect();
      admonitionDropdownStyle = `position:fixed;top:${rect.bottom + 4}px;left:${rect.left}px;z-index:9999`;
    }
    showAdmonitionMenu = !showAdmonitionMenu;
  }

  // ── Link dialog ───────────────────────────────────────────────────────────
  let showLinkDialog = false;
  let linkDialogText = '';
  let linkDialogUrl = '';
  let savedSelection: { from: number; to: number; empty: boolean } | null = null;

  function handleLink() {
    if (!editor) return;
    const { from, to, empty } = editor.state.selection;
    savedSelection = { from, to, empty };
    const existingUrl = editor.getAttributes('link').href as string | undefined;
    const selectedText = !empty ? editor.state.doc.textBetween(from, to) : '';
    linkDialogText = selectedText;
    linkDialogUrl = existingUrl ?? '';
    showLinkDialog = true;
  }

  function submitLinkDialog() {
    const text = linkDialogText.trim();
    const url  = linkDialogUrl.trim();
    const saved = savedSelection;
    showLinkDialog = false;
    if (!editor || !saved) return;

    editor.commands.focus();

    if (!url) {
      editor.chain()
        .setTextSelection({ from: saved.from, to: saved.to })
        .extendMarkRange('link')
        .unsetLink()
        .run();
      return;
    }

    if (saved.empty && text) {
      editor.chain()
        .setTextSelection(saved.from)
        .insertContent([{ type: 'text', text, marks: [{ type: 'link', attrs: { href: url } }] }])
        .run();
    } else if (!saved.empty && text) {
      const currentText = editor.state.doc.textBetween(saved.from, saved.to);
      if (text !== currentText) {
        editor.chain()
          .setTextSelection({ from: saved.from, to: saved.to })
          .deleteSelection()
          .insertContent([{ type: 'text', text, marks: [{ type: 'link', attrs: { href: url } }] }])
          .run();
      } else {
        editor.chain()
          .setTextSelection({ from: saved.from, to: saved.to })
          .extendMarkRange('link')
          .setLink({ href: url })
          .run();
      }
    } else {
      editor.chain()
        .setTextSelection({ from: saved.from, to: saved.to })
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }
  }

  function cancelLinkDialog() {
    showLinkDialog = false;
    editor?.commands.focus();
  }

  function handleLinkKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter')  { e.preventDefault(); submitLinkDialog(); }
    if (e.key === 'Escape') { e.preventDefault(); cancelLinkDialog(); }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function chain() { return editor?.chain().focus(); }

  $: isActive = (type: string, attrs?: Record<string, unknown>) =>
    editor?.isActive(type, attrs) ?? false;

  async function handleImage() {
    if (!editor) return;
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { invoke } = await import('@tauri-apps/api/core');
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp'] }],
      });
      if (selected && typeof selected === 'string') {
        const ext = selected.split('.').pop()?.toLowerCase() ?? '';
        const mimeMap: Record<string, string> = {
          png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
          gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp', bmp: 'image/bmp',
        };
        const mime = mimeMap[ext] ?? 'image/png';
        const base64 = await invoke<string>('read_file_as_base64', { path: selected });
        chain()?.setImage({ src: `data:${mime};base64,${base64}` }).run();
      }
    } catch {
      const url = window.prompt('Image URL:');
      if (url) chain()?.setImage({ src: url }).run();
    }
  }

  function handleTable() {
    chain()?.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  function handleMathInline() {
    const sel = editor?.state.selection;
    if (sel && !sel.empty) {
      const text = editor!.state.doc.textBetween(sel.from, sel.to);
      chain()?.deleteSelection().insertContent(`$${text}$`).run();
    } else {
      chain()?.insertContent('$formula$').run();
    }
  }

  function handleMathBlock() {
    chain()?.insertContent('\n$$\n\n$$\n').run();
  }

  function handleMermaid() {
    chain()?.setCodeBlock({ language: 'mermaid' }).insertContent('graph TD\n    A-->B').run();
  }

  function handleAdmonition(type: AdmonitionType) {
    showAdmonitionMenu = false;
    editor?.chain().focus().insertContent({
      type: 'admonition',
      attrs: { type },
      content: [{ type: 'paragraph' }],
    }).run();
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
  class="note-toolbar"
  style="
    background-color: {$currentTheme?.ui?.background || '#252526'};
    border-bottom: 1px solid {$currentTheme?.ui?.border || '#3e3e42'};
    --tb-hover-bg:  {isLight ? 'rgba(0,0,0,0.07)'  : 'rgba(255,255,255,0.1)'};
    --tb-active-bg: {isLight ? 'rgba(0,0,0,0.12)'  : 'rgba(255,255,255,0.15)'};
    --tb-accent:    {$currentTheme?.ui?.accentPrimary || '#00d4aa'};
    --tb-input-bg:  {$currentTheme?.editor?.background || '#1e1e1e'};
    --tb-border:    {$currentTheme?.ui?.border || '#3e3e42'};
    --tb-text:      {$currentTheme?.ui?.textColor || '#cccccc'};
    --tb-text-sec:  {$currentTheme?.ui?.textSecondary || '#858585'};
  "
>
  <!-- Format -->
  <button class="tb" class:active={isActive('bold')} title="Bold" tabindex="-1"
    on:click={() => chain()?.toggleBold().run()}>
    <TextB size={17} weight="duotone" color={$currentTheme?.ui?.accentPrimary || '#00d4aa'} />
  </button>
  <button class="tb" class:active={isActive('italic')} title="Italic" tabindex="-1"
    on:click={() => chain()?.toggleItalic().run()}>
    <TextItalic size={17} weight="duotone" color={$currentTheme?.ui?.accentPrimary || '#00d4aa'} />
  </button>
  <button class="tb" class:active={isActive('strike')} title="Strikethrough" tabindex="-1"
    on:click={() => chain()?.toggleStrike().run()}>
    <TextStrikethrough size={17} weight="duotone" color={$currentTheme?.ui?.accentPrimary || '#00d4aa'} />
  </button>

  <div class="sep" style="background-color: {$currentTheme?.ui?.border || '#3e3e42'}"></div>

  <!-- Headings -->
  <button class="tb" class:active={isActive('heading', { level: 1 })} title="Heading 1" tabindex="-1"
    on:click={() => chain()?.toggleHeading({ level: 1 }).run()}>
    <TextHOne size={17} weight="duotone" color={$currentTheme?.ui?.textColor || '#cccccc'} />
  </button>
  <button class="tb" class:active={isActive('heading', { level: 2 })} title="Heading 2" tabindex="-1"
    on:click={() => chain()?.toggleHeading({ level: 2 }).run()}>
    <TextHTwo size={17} weight="duotone" color={$currentTheme?.ui?.textColor || '#cccccc'} />
  </button>
  <button class="tb" class:active={isActive('heading', { level: 3 })} title="Heading 3" tabindex="-1"
    on:click={() => chain()?.toggleHeading({ level: 3 }).run()}>
    <TextHThree size={17} weight="duotone" color={$currentTheme?.ui?.textColor || '#cccccc'} />
  </button>

  <div class="sep" style="background-color: {$currentTheme?.ui?.border || '#3e3e42'}"></div>

  <!-- Lists -->
  <button class="tb" class:active={isActive('bulletList')} title="Bullet List" tabindex="-1"
    on:click={() => chain()?.toggleBulletList().run()}>
    <ListBullets size={17} weight="duotone" color={$currentTheme?.icons?.folder || '#FFB74D'} />
  </button>
  <button class="tb" class:active={isActive('orderedList')} title="Ordered List" tabindex="-1"
    on:click={() => chain()?.toggleOrderedList().run()}>
    <ListNumbers size={17} weight="duotone" color={$currentTheme?.icons?.folder || '#FFB74D'} />
  </button>
  <button class="tb" class:active={isActive('taskList')} title="Task List" tabindex="-1"
    on:click={() => chain()?.toggleTaskList().run()}>
    <ListChecks size={17} weight="duotone" color={$currentTheme?.icons?.folder || '#FFB74D'} />
  </button>

  <div class="sep" style="background-color: {$currentTheme?.ui?.border || '#3e3e42'}"></div>

  <!-- Link + Image -->
  <button class="tb" class:active={isActive('link')} title="Link" tabindex="-1"
    on:click={handleLink}>
    <LinkSimple size={17} weight="duotone" color={$currentTheme?.ui?.accent || '#4a9eff'} />
  </button>
  <button class="tb" title="Image" tabindex="-1" on:click={handleImage}>
    <ImageSquare size={17} weight="duotone" color={$currentTheme?.ui?.accent || '#4a9eff'} />
  </button>

  <div class="sep" style="background-color: {$currentTheme?.ui?.border || '#3e3e42'}"></div>

  <!-- Code -->
  <button class="tb" class:active={isActive('code')} title="Inline Code" tabindex="-1"
    on:click={() => chain()?.toggleCode().run()}>
    <Code size={17} weight="duotone" color={$currentTheme?.icons?.encoding || '#F06292'} />
  </button>
  <button class="tb" class:active={isActive('codeBlock')} title="Code Block" tabindex="-1"
    on:click={() => chain()?.toggleCodeBlock().run()}>
    <CodeBlock size={17} weight="duotone" color={$currentTheme?.icons?.encoding || '#F06292'} />
  </button>
  <button class="tb" title="Mermaid Diagram" tabindex="-1" on:click={handleMermaid}>
    <TreeStructure size={17} weight="duotone" color={$currentTheme?.icons?.language || '#4DB6AC'} />
  </button>

  <div class="sep" style="background-color: {$currentTheme?.ui?.border || '#3e3e42'}"></div>

  <!-- Table + Block elements -->
  <button class="tb" title="Insert Table (3×3)" tabindex="-1" on:click={handleTable}>
    <Table size={17} weight="duotone" color={$currentTheme?.icons?.wrap || '#9575CD'} />
  </button>
  <button class="tb" class:active={isActive('blockquote')} title="Blockquote" tabindex="-1"
    on:click={() => chain()?.toggleBlockquote().run()}>
    <Quotes size={17} weight="duotone" color={$currentTheme?.icons?.wrap || '#9575CD'} />
  </button>
  <button class="tb" title="Horizontal Rule" tabindex="-1"
    on:click={() => chain()?.setHorizontalRule().run()}>
    <Minus size={17} weight="duotone" color={$currentTheme?.icons?.wrap || '#9575CD'} />
  </button>

  <div class="sep" style="background-color: {$currentTheme?.ui?.border || '#3e3e42'}"></div>

  <!-- Math -->
  <button class="tb" title="Inline Math ($…$)" tabindex="-1" on:click={handleMathInline}>
    <MathOperations size={17} weight="duotone" color={$currentTheme?.icons?.settings || '#BA68C8'} />
  </button>
  <button
    class="tb tb-text"
    title="Block Math ($$…$$)"
    tabindex="-1"
    on:click={handleMathBlock}
    style="color: {$currentTheme?.icons?.settings || '#BA68C8'}"
  >$$</button>

  <div class="sep" style="background-color: {$currentTheme?.ui?.border || '#3e3e42'}"></div>

  <!-- Admonitions dropdown -->
  <button
    class="tb tb-admonition"
    title="Insert Admonition"
    tabindex="-1"
    bind:this={admonitionBtnEl}
    on:click={toggleAdmonitionMenu}
    style="color: {$currentTheme?.ui?.textSecondary || '#858585'}"
  >
    <Warning size={17} weight="duotone" color={$currentTheme?.ui?.textSecondary || '#858585'} />
    <span class="tb-caret">▾</span>
  </button>

  {#if showAdmonitionMenu}
    <!-- svelte-ignore a11y-no-static-element-interactions a11y-click-events-have-key-events -->
    <div
      class="admonition-dropdown"
      style="{admonitionDropdownStyle}; background-color: {$currentTheme?.ui?.background || '#252526'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
      on:click|stopPropagation
    >
      {#each ADMONITION_TYPES as type}
        <button
          class="admonition-item"
          tabindex="-1"
          on:click={() => handleAdmonition(type)}
          style="color: {admonitionColors[type]}"
        >
          <span class="admonition-dot" style="background: {admonitionColors[type]}"></span>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
      {/each}
    </div>
  {/if}

  <div class="spacer"></div>

  <button
    class="tb tb-hide"
    title="Hide toolbar"
    tabindex="-1"
    on:click={onHide}
    style="color: {$currentTheme?.ui?.textSecondary || '#858585'}"
  >Hide</button>
</div>

<!-- Close admonition menu on outside click -->
<svelte:window on:click={() => { showAdmonitionMenu = false; }} />

<!-- ─── Link Dialog ─────────────────────────────────────────────────────── -->
{#if showLinkDialog}
  <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
  <div class="link-dialog-overlay" on:click={cancelLinkDialog}>
    <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
    <div
      class="link-dialog"
      style="
        background-color: {$currentTheme?.ui?.background || '#252526'};
        border-color:     {$currentTheme?.ui?.border || '#3e3e42'};
        color:            {$currentTheme?.ui?.textColor || '#cccccc'};
      "
      on:click|stopPropagation
    >
      <div class="link-dialog-title">Insert Link</div>

      <div class="link-dialog-field">
        <label class="link-dialog-label" for="link-dialog-text-input">Text</label>
        <!-- svelte-ignore a11y-autofocus -->
        <input
          id="link-dialog-text-input"
          class="link-dialog-input"
          type="text"
          placeholder="Display text"
          bind:value={linkDialogText}
          on:keydown={handleLinkKeydown}
          autofocus
        />
      </div>

      <div class="link-dialog-field">
        <label class="link-dialog-label" for="link-dialog-url-input">URL</label>
        <input
          id="link-dialog-url-input"
          class="link-dialog-input"
          type="url"
          placeholder="https://"
          bind:value={linkDialogUrl}
          on:keydown={handleLinkKeydown}
        />
      </div>

      <div class="link-dialog-actions">
        <button
          class="link-btn link-btn-cancel"
          on:click={cancelLinkDialog}
        >Cancel</button>
        <button
          class="link-btn link-btn-submit"
          on:click={submitLinkDialog}
          style="background-color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"
        >{linkDialogUrl ? 'Apply' : 'Remove Link'}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .note-toolbar {
    display: flex;
    align-items: center;
    padding: 3px 8px;
    gap: 1px;
    overflow-x: auto;
    user-select: none;
    flex-shrink: 0;
  }

  /* ─── Toolbar buttons ─────────────────────────────────────────── */
  .tb {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    flex-shrink: 0;
    padding: 0;
    transition: background-color 0.1s;
  }

  .tb:hover  { background-color: var(--tb-hover-bg,  rgba(255, 255, 255, 0.1)); }
  .tb.active { background-color: var(--tb-active-bg, rgba(255, 255, 255, 0.15)); }

  .tb-text {
    width: auto;
    padding: 0 6px;
    font-size: 12px;
    font-weight: 700;
    font-family: monospace;
  }

  .tb-hide {
    width: auto;
    padding: 0 8px;
    font-size: 11px;
    opacity: 0.7;
  }

  .tb-hide:hover { opacity: 1; background: transparent; }

  .tb-admonition {
    width: auto;
    padding: 0 6px;
    gap: 2px;
  }

  .tb-caret {
    font-size: 10px;
    opacity: 0.6;
  }

  .sep {
    width: 1px;
    height: 18px;
    margin: 0 3px;
    flex-shrink: 0;
  }

  .spacer { flex: 1; }

  /* ─── Admonition dropdown ─────────────────────────────────────── */
  .admonition-dropdown {
    border: 1px solid;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    min-width: 110px;
    overflow: hidden;
  }

  .admonition-item {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 12px;
    border: none;
    background: none;
    text-align: left;
    font-size: 12px;
    cursor: pointer;
    transition: background-color 0.1s;
  }

  .admonition-item:hover {
    background-color: var(--tb-hover-bg, rgba(255, 255, 255, 0.1));
  }

  .admonition-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* ─── Link Dialog ─────────────────────────────────────────────── */
  .link-dialog-overlay {
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .link-dialog {
    border: 1px solid;
    border-radius: 8px;
    padding: 20px 24px;
    min-width: 340px;
    max-width: 480px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .link-dialog-title {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: var(--tb-text, #cccccc);
  }

  .link-dialog-field {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .link-dialog-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--tb-text-sec, #858585);
  }

  .link-dialog-input {
    background-color: var(--tb-input-bg, #1e1e1e);
    border: 1px solid var(--tb-border, #3e3e42);
    color: var(--tb-text, #cccccc);
    border-radius: 4px;
    padding: 7px 10px;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s;
    width: 100%;
    box-sizing: border-box;
  }

  .link-dialog-input:focus {
    border-color: var(--tb-accent, #00d4aa);
  }

  .link-dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 2px;
  }

  .link-btn {
    padding: 6px 16px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.15s, filter 0.15s;
  }

  .link-btn-cancel {
    background: transparent;
    border: 1px solid var(--tb-border, #3e3e42);
    color: var(--tb-text-sec, #858585);
  }

  .link-btn-cancel:hover { opacity: 0.8; }

  .link-btn-submit {
    border: none;
    font-weight: 600;
    color: #000;
  }

  .link-btn-submit:hover { filter: brightness(1.15); }
</style>
