<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Editor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import Image from '@tiptap/extension-image';
  import { Table } from '@tiptap/extension-table';
  import TableRow from '@tiptap/extension-table-row';
  import TableHeader from '@tiptap/extension-table-header';
  import TableCell from '@tiptap/extension-table-cell';
  import TaskList from '@tiptap/extension-task-list';
  import TaskItem from '@tiptap/extension-task-item';
  import Focus from '@tiptap/extension-focus';
  import Placeholder from '@tiptap/extension-placeholder';
  import { Markdown } from 'tiptap-markdown';
  import { AdmonitionNode } from '../lib/tiptap/AdmonitionNode';
  import { CodeBlockNode } from '../lib/tiptap/CodeBlockNode';
  import NoteToolbar from './NoteToolbar.svelte';
  import { currentTheme } from '../stores/themeStore';
  import { isLightTheme } from '../lib/themeUtils';
  import type { Theme } from '../types';
  import type { Tab } from '../types';
  import '../styles/markdownPreview.css';

  export let tab: Tab;
  export let onContentChange: (content: string) => void = () => {};

  // ── :root vars for CodeBlockNode dropdown (appended to document.body) ──────
  $: {
    const root = document.documentElement;
    root.style.setProperty('--note-dropdown-bg',   $currentTheme?.ui?.background    || '#252526');
    root.style.setProperty('--note-border',        $currentTheme?.ui?.border        || '#3e3e42');
    root.style.setProperty('--note-text-color',    $currentTheme?.ui?.textColor     || '#cccccc');
    root.style.setProperty('--note-text-secondary',$currentTheme?.ui?.textSecondary || '#858585');
    root.style.setProperty('--note-accent',        $currentTheme?.ui?.accentPrimary || '#00d4aa');
  }

  // ── Container style (all other CSS vars, scoped to this component) ──────────
  $: isLight = isLightTheme($currentTheme?.editor?.background || '#1e1e1e');

  function buildContainerStyle(theme: Theme | null, light: boolean): string {
    const bg      = theme?.editor?.background        || '#1e1e1e';
    const uiBg    = theme?.ui?.background            || '#252526';
    const border  = theme?.ui?.border               || '#3e3e42';
    const text    = theme?.ui?.textColor            || '#cccccc';
    const textSec = theme?.ui?.textSecondary        || '#858585';
    const accent  = theme?.ui?.accentPrimary        || '#00d4aa';
    const link    = theme?.ui?.accent               || '#4a9eff';
    const mp      = theme?.markdownPreview;
    const adm     = mp?.admonitions;

    // Sensible light/dark fallbacks for vars that markdownPreview.css uses
    const lOrD = (l: string, d: string) => light ? l : d;

    return [
      `background-color:${bg}`,
      // ── Note-specific vars ────────────────────────────────────────────────
      `--note-bg:${bg}`,
      `--note-dropdown-bg:${uiBg}`,
      `--note-border:${border}`,
      `--note-text-color:${text}`,
      `--note-text-secondary:${textSec}`,
      `--note-accent:${accent}`,
      `--note-link-color:${link}`,
      `--note-focus-bar:${accent}`,
      `--note-code-bg:${mp?.codeBlockBg || lOrD('rgba(0,0,0,0.06)', 'rgba(0,0,0,0.3)')}`,
      `--note-hover-bg:${lOrD('rgba(0,0,0,0.07)', 'rgba(255,255,255,0.1)')}`,
      `--note-active-bg:${lOrD('rgba(0,0,0,0.12)', 'rgba(255,255,255,0.15)')}`,
      // ── Markdown preview vars (consumed by markdownPreview.css) ───────────
      `--md-link-color:${mp?.linkColor || link}`,
      `--md-blockquote-border:${mp?.blockquoteBorder      || lOrD('rgba(0,0,0,0.15)',  'rgba(255,255,255,0.2)')}`,
      `--md-blockquote-bg:${mp?.blockquoteBackground      || lOrD('rgba(0,0,0,0.03)',  'rgba(255,255,255,0.03)')}`,
      `--md-code-inline-bg:${mp?.codeInlineBg             || lOrD('rgba(0,0,0,0.06)',  'rgba(255,255,255,0.08)')}`,
      `--md-code-block-bg:${mp?.codeBlockBg               || lOrD('rgba(0,0,0,0.06)',  'rgba(0,0,0,0.3)')}`,
      `--md-table-border:${mp?.tableBorder                || lOrD('rgba(0,0,0,0.12)',  'rgba(255,255,255,0.12)')}`,
      `--md-table-header-bg:${mp?.tableHeaderBackground   || lOrD('rgba(0,0,0,0.04)',  'rgba(255,255,255,0.06)')}`,
      `--md-hr-color:${mp?.hrColor                        || lOrD('rgba(0,0,0,0.15)',  'rgba(255,255,255,0.15)')}`,
      // ── Admonition vars (consumed by markdownPreview.css + ::before labels) ─
      `--md-admonition-note-bg:${adm?.note?.background         || 'rgba(158,158,158,0.12)'}`,
      `--md-admonition-note-border:${adm?.note?.borderColor    || '#9e9e9e'}`,
      `--md-admonition-note-title:${adm?.note?.titleColor      || '#9e9e9e'}`,
      `--md-admonition-info-bg:${adm?.info?.background         || 'rgba(33,150,243,0.12)'}`,
      `--md-admonition-info-border:${adm?.info?.borderColor    || '#2196f3'}`,
      `--md-admonition-info-title:${adm?.info?.titleColor      || '#2196f3'}`,
      `--md-admonition-warning-bg:${adm?.warning?.background   || 'rgba(230,167,0,0.12)'}`,
      `--md-admonition-warning-border:${adm?.warning?.borderColor || '#e6a700'}`,
      `--md-admonition-warning-title:${adm?.warning?.titleColor  || '#e6a700'}`,
      `--md-admonition-danger-bg:${adm?.danger?.background      || 'rgba(229,57,53,0.12)'}`,
      `--md-admonition-danger-border:${adm?.danger?.borderColor || '#e53935'}`,
      `--md-admonition-danger-title:${adm?.danger?.titleColor   || '#e53935'}`,
      `--md-admonition-tip-bg:${adm?.tip?.background            || 'rgba(76,175,80,0.12)'}`,
      `--md-admonition-tip-border:${adm?.tip?.borderColor       || '#4caf50'}`,
      `--md-admonition-tip-title:${adm?.tip?.titleColor         || '#4caf50'}`,
    ].join(';');
  }

  $: containerStyle = buildContainerStyle($currentTheme, isLight);

  // ── Editor state ─────────────────────────────────────────────────────────────
  let editorEl: HTMLDivElement;
  let noteScrollEl: HTMLDivElement;
  let editor: Editor | null = null;
  let toolbarVisible = true;
  let isUpdatingFromProp = false;

  // ── Table hover overlay ───────────────────────────────────────────────────────
  let tableRect: { top: number; left: number; width: number; height: number } | null = null;
  let tableHovered = false;
  let hideTableTimer: ReturnType<typeof setTimeout> | null = null;
  let currentHoveredTable: HTMLTableElement | null = null;
  let scrollHandler: (() => void) | null = null;

  function getTableRect(tbl: HTMLTableElement) {
    if (!noteScrollEl) return null;
    const r = tbl.getBoundingClientRect();
    const s = noteScrollEl.getBoundingClientRect();
    return {
      top:    r.top  - s.top  + noteScrollEl.scrollTop,
      left:   r.left - s.left,
      width:  r.width,
      height: r.height,
    };
  }

  function onEditorMouseOver(e: MouseEvent) {
    const el = (e.target as HTMLElement)?.closest?.('table') as HTMLTableElement | null;
    if (el) {
      if (hideTableTimer) { clearTimeout(hideTableTimer); hideTableTimer = null; }
      currentHoveredTable = el;
      tableRect = getTableRect(el);
      tableHovered = true;
    }
  }

  function startHideTable() {
    hideTableTimer = setTimeout(() => {
      tableHovered = false;
      currentHoveredTable = null;
      tableRect = null;
    }, 150);
  }

  function cancelHideTable() {
    if (hideTableTimer) { clearTimeout(hideTableTimer); hideTableTimer = null; }
  }

  function onEditorMouseOut(e: MouseEvent) {
    const from = e.target as HTMLElement;
    const to   = e.relatedTarget as HTMLElement;
    if (from.closest?.('table') && !to?.closest?.('table')) {
      startHideTable();
    }
  }

  onMount(() => {
    editor = new Editor({
      element: editorEl,
      extensions: [
        StarterKit.configure({ codeBlock: false, link: { openOnClick: false } }),
        Markdown,
        CodeBlockNode,
        Image.configure({ allowBase64: true }),
        Table.configure({ resizable: false }),
        TableRow, TableHeader, TableCell,
        TaskList,
        TaskItem.configure({ nested: true }),
        AdmonitionNode,
        Focus.configure({ className: 'is-focused', mode: 'shallowest' }),
        Placeholder.configure({ placeholder: 'Start writing…' }),
      ],
      onUpdate: ({ editor: e }) => {
        if (isUpdatingFromProp) return;
        onContentChange((e.storage as any).markdown.getMarkdown());
      },
    });

    // Keep table overlay in sync while scrolling
    scrollHandler = () => {
      if (currentHoveredTable && tableHovered) {
        tableRect = getTableRect(currentHoveredTable);
      }
    };
    noteScrollEl?.addEventListener('scroll', scrollHandler);

    // Initialise content without triggering onContentChange / dirty state
    isUpdatingFromProp = true;
    if (tab.content) {
      editor.commands.setContent(tab.content);
    } else {
      editor.commands.setContent({
        type: 'doc',
        content: [{ type: 'heading', attrs: { level: 1 }, content: [] }],
      });
    }
    isUpdatingFromProp = false;
  });

  // Sync external content changes (e.g. file reload) while the editor is not focused.
  // Skip when tab.content is empty — the editor may have been initialised with a
  // placeholder heading that hasn't been synced back yet.
  $: if (editor && !editor.isFocused && tab.content) {
    const current = (editor.storage as any).markdown.getMarkdown();
    if (current !== tab.content) {
      isUpdatingFromProp = true;
      editor.commands.setContent(tab.content);
      isUpdatingFromProp = false;
    }
  }

  onDestroy(() => {
    editor?.destroy();
    if (hideTableTimer) clearTimeout(hideTableTimer);
    if (scrollHandler) noteScrollEl?.removeEventListener('scroll', scrollHandler);
  });
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="note-editor-container" style={containerStyle}>
  {#if toolbarVisible}
    <NoteToolbar {editor} onHide={() => { toolbarVisible = false; }} />
  {:else}
    <button
      class="show-toolbar-btn"
      tabindex="-1"
      on:click={() => { toolbarVisible = true; }}
      style="color: {$currentTheme?.ui?.textSecondary || '#858585'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
    >
      Show toolbar
    </button>
  {/if}

  <div
    class="note-scroll"
    bind:this={noteScrollEl}
    on:mouseover={onEditorMouseOver}
    on:mouseout={onEditorMouseOut}
    style="color: {$currentTheme?.editor?.foreground || '#d4d4d4'}"
  >
    <div class="markdown-body note-prosemirror-host" bind:this={editorEl}></div>

    <!-- Table overlay controls (appear on table hover) -->
    {#if tableRect && tableHovered}
      <!-- Add row -->
      <button
        class="table-ctrl-btn"
        title="Add row below"
        style="
          top:              {tableRect.top + tableRect.height + 6}px;
          left:             {tableRect.left + tableRect.width / 2 - 26}px;
          background-color: {$currentTheme?.ui?.background || '#252526'};
          border-color:     {$currentTheme?.ui?.border || '#3e3e42'};
          color:            {$currentTheme?.ui?.accentPrimary || '#00d4aa'};
        "
        on:mouseenter={cancelHideTable}
        on:mouseleave={startHideTable}
        on:mousedown|preventDefault={() => editor?.chain().focus().addRowAfter().run()}
      >+</button>

      <!-- Delete row -->
      <button
        class="table-ctrl-btn"
        title="Delete row"
        style="
          top:              {tableRect.top + tableRect.height + 6}px;
          left:             {tableRect.left + tableRect.width / 2 + 4}px;
          background-color: {$currentTheme?.ui?.background || '#252526'};
          border-color:     {$currentTheme?.ui?.border || '#3e3e42'};
          color:            {$currentTheme?.ui?.accentDanger || '#e53935'};
        "
        on:mouseenter={cancelHideTable}
        on:mouseleave={startHideTable}
        on:mousedown|preventDefault={() => editor?.chain().focus().deleteRow().run()}
      >−</button>

      <!-- Add column -->
      <button
        class="table-ctrl-btn"
        title="Add column after"
        style="
          top:              {tableRect.top + tableRect.height / 2 - 26}px;
          left:             {tableRect.left + tableRect.width + 6}px;
          background-color: {$currentTheme?.ui?.background || '#252526'};
          border-color:     {$currentTheme?.ui?.border || '#3e3e42'};
          color:            {$currentTheme?.ui?.accentPrimary || '#00d4aa'};
        "
        on:mouseenter={cancelHideTable}
        on:mouseleave={startHideTable}
        on:mousedown|preventDefault={() => editor?.chain().focus().addColumnAfter().run()}
      >+</button>

      <!-- Delete column -->
      <button
        class="table-ctrl-btn"
        title="Delete column"
        style="
          top:              {tableRect.top + tableRect.height / 2 + 4}px;
          left:             {tableRect.left + tableRect.width + 6}px;
          background-color: {$currentTheme?.ui?.background || '#252526'};
          border-color:     {$currentTheme?.ui?.border || '#3e3e42'};
          color:            {$currentTheme?.ui?.accentDanger || '#e53935'};
        "
        on:mouseenter={cancelHideTable}
        on:mouseleave={startHideTable}
        on:mousedown|preventDefault={() => editor?.chain().focus().deleteColumn().run()}
      >−</button>
    {/if}
  </div>
</div>

<style>
  .note-editor-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .note-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 24px 40px 60px;
    position: relative;
  }

  .note-prosemirror-host {
    max-width: 860px;
    margin: 0 auto;
    min-height: 100%;
  }

  /* ─── ProseMirror base ─────────────────────────────────────────── */
  :global(.note-prosemirror-host .ProseMirror) {
    outline: none;
    cursor: text;
    min-height: 200px;
    padding-left: 20px; /* room for focus bar */
  }

  :global(.note-prosemirror-host .ProseMirror > h1:first-child) {
    margin-top: 0;
  }

  /* Matches any empty first block (paragraph or heading) */
  :global(.note-prosemirror-host .ProseMirror .is-editor-empty:first-child::before) {
    content: attr(data-placeholder);
    float: left;
    color: var(--note-text-secondary, #858585);
    pointer-events: none;
    height: 0;
  }

  /* ─── Focus indicator (left bar) ──────────────────────────────── */
  :global(.note-prosemirror-host .ProseMirror .is-focused:not(li):not(td):not(th)) {
    position: relative;
  }

  /* Exclude empty blocks so the focus bar doesn't conflict with the
     placeholder ::before on the same element */
  :global(.note-prosemirror-host .ProseMirror .is-focused:not(li):not(td):not(th):not(.is-editor-empty)::before) {
    content: '';
    position: absolute;
    left: -16px;
    top: 0;
    bottom: 0;
    width: 3px;
    background: var(--note-focus-bar, rgba(0, 212, 170, 0.6));
    border-radius: 0 2px 2px 0;
  }

  /* ─── Links ────────────────────────────────────────────────────── */
  :global(.note-prosemirror-host .ProseMirror a) {
    color: var(--md-link-color, var(--note-link-color, #58a6ff));
    text-decoration: underline;
    cursor: pointer;
  }

  /* ─── Code blocks ──────────────────────────────────────────────── */
  :global(.note-prosemirror-host .note-code-block) {
    border-radius: 6px;
    overflow: visible; /* let language dropdown escape */
    margin: 1em 0;
    border: 1px solid var(--note-border, rgba(255, 255, 255, 0.1));
  }

  :global(.note-prosemirror-host .note-code-block-header) {
    display: flex;
    align-items: center;
    padding: 4px 10px;
    background: rgba(0, 0, 0, 0.4);
    border-bottom: 1px solid var(--note-border, rgba(255, 255, 255, 0.08));
    border-radius: 6px 6px 0 0;
    user-select: none;
    overflow: visible;
  }

  /* ─── Language selector button ─────────────────────────────────── */
  :global(.note-code-lang-btn) {
    display: flex;
    align-items: center;
    gap: 4px;
    background: transparent;
    border: none;
    color: var(--note-text-secondary, #858585);
    font-size: 11px;
    font-family: monospace;
    cursor: pointer;
    padding: 2px 5px;
    border-radius: 3px;
    transition: color 0.15s, background 0.15s;
  }

  :global(.note-code-lang-btn:hover) {
    color: var(--note-text-color, #cccccc);
    background: rgba(255, 255, 255, 0.08);
  }

  :global(.note-code-lang-caret) {
    opacity: 0.5;
    font-size: 9px;
  }

  /* ─── Language dropdown (appended to body, reads :root vars) ────── */
  :global(.note-code-lang-dropdown) {
    position: fixed;
    background: var(--note-dropdown-bg, #252526);
    border: 1px solid var(--note-border, #3e3e42);
    border-radius: 5px;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5);
    overflow-y: auto;
    max-height: 220px;
    z-index: 9999;
    min-width: 140px;
    padding: 3px 0;
  }

  :global(.note-code-lang-option) {
    display: block;
    width: 100%;
    text-align: left;
    padding: 5px 12px;
    background: none;
    border: none;
    color: var(--note-text-color, #cccccc);
    font-size: 11px;
    font-family: monospace;
    cursor: pointer;
    transition: background 0.1s, color 0.1s;
  }

  :global(.note-code-lang-option:hover) {
    background: rgba(255, 255, 255, 0.08);
    color: var(--note-accent, #00d4aa);
  }

  :global(.note-prosemirror-host .note-code-block pre.hljs) {
    margin: 0;
    padding: 1em;
    border-radius: 0 0 6px 6px;
    background: var(--md-code-block-bg, var(--note-code-bg, rgba(0, 0, 0, 0.3)));
  }

  :global(.note-prosemirror-host .note-code-block code.hljs) {
    background: transparent;
    padding: 0;
    font-size: 0.875em;
    line-height: 1.6;
    font-family: 'Consolas', 'Courier New', monospace;
    display: block;
  }

  /* ─── Admonitions ──────────────────────────────────────────────────
     Border colour and background come from markdownPreview.css via
     --md-admonition-*-border and --md-admonition-*-bg CSS vars which
     are set on the container from the active theme.
     We only add the ::before type label here (not in markdownPreview.css
     because TipTap nodes don't have a separate .admonition-title element).
  ─────────────────────────────────────────────────────────────────── */
  :global(.note-prosemirror-host .admonition::before) {
    display: block;
    font-weight: 700;
    font-size: 0.78em;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.5em;
    content: attr(data-admonition-type);
  }

  :global(.note-prosemirror-host .admonition-note::before)    { color: var(--md-admonition-note-title,    #9e9e9e); }
  :global(.note-prosemirror-host .admonition-info::before)    { color: var(--md-admonition-info-title,    #2196f3); }
  :global(.note-prosemirror-host .admonition-warning::before) { color: var(--md-admonition-warning-title, #e6a700); }
  :global(.note-prosemirror-host .admonition-danger::before)  { color: var(--md-admonition-danger-title,  #e53935); }
  :global(.note-prosemirror-host .admonition-tip::before)     { color: var(--md-admonition-tip-title,     #4caf50); }

  /* ─── Task list ────────────────────────────────────────────────── */
  :global(.note-prosemirror-host .ProseMirror ul[data-type="taskList"]) {
    list-style: none;
    padding-left: 0.5em;
  }

  :global(.note-prosemirror-host .ProseMirror li[data-type="taskItem"]) {
    display: flex;
    align-items: flex-start;
    gap: 0.5em;
  }

  :global(.note-prosemirror-host .ProseMirror li[data-type="taskItem"] > label) {
    flex-shrink: 0;
    margin-top: 0.15em;
  }

  :global(.note-prosemirror-host .ProseMirror li[data-type="taskItem"] > div) { flex: 1; }

  /* ─── Tables ───────────────────────────────────────────────────── */
  :global(.note-prosemirror-host .ProseMirror .tableWrapper) {
    overflow-x: auto;
    margin: 1em 0;
  }

  :global(.note-prosemirror-host .ProseMirror table) {
    border-collapse: collapse;
    width: 100%;
  }

  :global(.note-prosemirror-host .ProseMirror th,
          .note-prosemirror-host .ProseMirror td) {
    border: 1px solid var(--md-table-border, rgba(255, 255, 255, 0.15));
    padding: 6px 12px;
    vertical-align: top;
    min-width: 60px;
    position: relative;
  }

  :global(.note-prosemirror-host .ProseMirror th) {
    background: var(--md-table-header-bg, rgba(255, 255, 255, 0.06));
    font-weight: 600;
  }

  :global(.note-prosemirror-host .ProseMirror .selectedCell::after) {
    z-index: 2;
    position: absolute;
    content: "";
    inset: 0;
    background: rgba(0, 212, 170, 0.12);
    pointer-events: none;
  }

  /* ─── Table overlay buttons ────────────────────────────────────── */
  .table-ctrl-btn {
    position: absolute;
    width: 22px;
    height: 22px;
    border: 1px solid;
    border-radius: 4px;
    font-size: 15px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    z-index: 10;
    font-weight: 600;
    opacity: 0.85;
    transition: opacity 0.15s, filter 0.15s;
  }

  .table-ctrl-btn:hover {
    opacity: 1;
    filter: brightness(1.3);
  }

  /* ─── Show toolbar button ──────────────────────────────────────── */
  .show-toolbar-btn {
    align-self: flex-start;
    background: none;
    border: 1px solid;
    border-radius: 3px;
    padding: 2px 8px;
    font-size: 11px;
    cursor: pointer;
    margin: 4px 8px;
    opacity: 0.7;
    transition: opacity 0.1s;
  }

  .show-toolbar-btn:hover { opacity: 1; }
</style>
