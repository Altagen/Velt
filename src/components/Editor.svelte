<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { VeltEditor, detectLanguageFromPath } from '@altagen/velt-core';
  import type { Tab } from '@altagen/velt-core';
  import { currentTheme } from '../stores/themeStore';
  import { settings } from '../stores/appStore';
  import FindReplacePanel from './FindReplacePanel.svelte';
  import GoToLineDialog from './GoToLineDialog.svelte';
  import { findReplaceState, updateMatchInfo } from '../stores/findReplaceStore';
  import { goToLineState } from '../stores/goToLineStore';
  import type { PaneId } from '../stores/paneStore';

  export let tab: Tab;
  export let paneId: PaneId = 'left';
  export let onContentChange: (content: string) => void;
  export let onStatusUpdate: (data: { line: number; column: number; totalLines: number; totalChars: number; selectedChars: number; eol: string }) => void = () => {};

  let editorContainer: HTMLDivElement;
  let editor: VeltEditor | null = null;
  let lastSearchText = '';
  let lastSearchOptions = { caseSensitive: false, useRegex: false, wholeWord: false };

  // Status bar info
  let cursorLine = 1;
  let cursorColumn = 1;
  let totalLines = 0;
  let totalChars = 0;
  let selectedChars = 0;
  let eolType = 'LF';

  function updateStatusBar() {
    if (!editor) return;

    const pos = editor.getCursorPosition();
    cursorLine = pos.line;
    cursorColumn = pos.column;

    const stats = editor.getDocumentStats();
    totalLines = stats.lines;
    totalChars = stats.chars;

    const selection = editor.getSelectionInfo();
    selectedChars = selection.length;

    // Detect line ending type
    eolType = editor.detectLineEnding();

    onStatusUpdate({
      line: cursorLine,
      column: cursorColumn,
      totalLines,
      totalChars,
      selectedChars,
      eol: eolType,
    });
  }

  function handleEOLChange(newEOL: string) {
    if (!editor) return;


    switch (newEOL) {
      case 'LF':
        editor.convertToLF();
        break;
      case 'CRLF':
        editor.convertToCRLF();
        break;
      case 'CR':
        editor.convertToCR();
        break;
    }

    // Directly set the EOL type since we know what we just converted to
    eolType = newEOL;
    updateStatusBar();
  }

  function handleFind(text: string, direction: 'next' | 'prev' | 'none' = 'none') {
    if (!editor || !text) {
      updateMatchInfo(0, 0);
      lastSearchText = '';
      return;
    }

    // Check if search text or options changed (new search)
    const currentOptions = {
      caseSensitive: $findReplaceState.caseSensitive,
      useRegex: $findReplaceState.useRegex,
      wholeWord: $findReplaceState.wholeWord,
    };

    const isNewSearch = text !== lastSearchText ||
                       currentOptions.caseSensitive !== lastSearchOptions.caseSensitive ||
                       currentOptions.useRegex !== lastSearchOptions.useRegex ||
                       currentOptions.wholeWord !== lastSearchOptions.wholeWord;

    lastSearchText = text;
    lastSearchOptions = { ...currentOptions };

    // Setup the search
    const result = editor.find(text, currentOptions);

    if (result.count === 0) {
      updateMatchInfo(0, 0);
      return;
    }

    // For new searches, always go to first match
    if (isNewSearch && direction === 'none') {
      editor.findFirst();
      // Update info after navigation
      const updatedInfo = editor.getSearchInfo();
      updateMatchInfo(updatedInfo.count, updatedInfo.currentIndex);
    } else if (direction === 'next') {
      editor.findNext();
      const updatedInfo = editor.getSearchInfo();
      updateMatchInfo(updatedInfo.count, updatedInfo.currentIndex);
    } else if (direction === 'prev') {
      editor.findPrevious();
      const updatedInfo = editor.getSearchInfo();
      updateMatchInfo(updatedInfo.count, updatedInfo.currentIndex);
    } else {
      // Just update count without navigating
      updateMatchInfo(result.count, result.currentIndex);
    }
  }

  function handleReplace() {
    if (!editor) return;
    editor.replace($findReplaceState.replaceText);
    // Re-run find to update match count
    handleFind($findReplaceState.searchText, 'next');
  }

  function handleReplaceAll() {
    if (!editor) return;
    editor.replaceAll($findReplaceState.replaceText);
    // Clear search after replace all
    editor.clearSearch();
    updateMatchInfo(0, 0);
  }

  function handleClose() {
    if (!editor) return;
    editor.clearSearch();
    updateMatchInfo(0, 0);
  }

  function handleGoToLine(lineNumber: number) {
    if (!editor) return;
    editor.goToLine(lineNumber);
  }

  onMount(() => {
    const language = tab.language || detectLanguageFromPath(tab.filePath);

    editor = new VeltEditor({
      container: editorContainer,
      content: tab.content,
      language,
      onChange: (content) => {
        onContentChange(content);
      },
      theme: $currentTheme || undefined,
      fontSize: $settings.fontSize,
      fontFamily: $settings.fontFamily,
      tabSize: $settings.tabSize,
      wordWrap: $settings.wordWrap,
      showInvisibles: $settings.showInvisibles,
      autoIndent: $settings.autoIndent,
    });

    // Set up cursor change listener
    editor.onCursorChange(() => {
      updateStatusBar();
    });

    // Initial status bar update
    updateStatusBar();

    // Listen for editor action events from MenuBar
    const handleEditorAction = (event: CustomEvent) => {
      if (!editor) return;

      // Only respond if this event targets our pane (or has no target)
      if (event.detail.targetPane && event.detail.targetPane !== paneId) return;

      const action = event.detail.action;
      switch (action) {
        case 'duplicateLine':
          editor.duplicateLine();
          break;
        case 'deleteLine':
          editor.deleteLine();
          break;
        case 'moveLineUp':
          editor.moveLineUp();
          break;
        case 'moveLineDown':
          editor.moveLineDown();
          break;
        case 'toggleLineComment':
          editor.toggleLineComment();
          break;
        case 'indentSelection':
          editor.indentSelection();
          break;
        case 'outdentSelection':
          editor.outdentSelection();
          break;
        case 'convertToUppercase':
          editor.convertToUppercase();
          break;
        case 'convertToLowercase':
          editor.convertToLowercase();
          break;
        case 'convertToTitleCase':
          editor.convertToTitleCase();
          break;
        case 'invertCase':
          editor.invertCase();
          break;
        case 'sortLinesAscending':
          editor.sortLinesAscending();
          break;
        case 'sortLinesDescending':
          editor.sortLinesDescending();
          break;
        case 'removeDuplicateLines':
          editor.removeDuplicateLines();
          break;
        case 'trimTrailingSpaces':
          editor.trimTrailingSpaces();
          break;
        case 'removeBlankLines':
          editor.removeBlankLines();
          break;
        case 'convertToLF':
          handleEOLChange('LF');
          break;
        case 'convertToCRLF':
          handleEOLChange('CRLF');
          break;
        case 'convertToCR':
          handleEOLChange('CR');
          break;
        case 'toggleBookmark':
          editor.toggleBookmark();
          break;
        case 'nextBookmark':
          editor.nextBookmark();
          break;
        case 'previousBookmark':
          editor.previousBookmark();
          break;
        case 'clearBookmarks':
          editor.clearBookmarks();
          break;
        case 'markdownInsert':
          handleMarkdownInsert(event.detail);
          break;
      }
    };

    function handleMarkdownInsert(detail: { type: string; before: string; after: string; text: string; placeholder: string; cursorOffset?: number }) {
      if (!editor) return;
      const view = editor.getView();
      const state = view.state;
      const { from, to } = state.selection.main;
      const selectedText = state.sliceDoc(from, to);

      if (detail.type === 'wrap') {
        const inner = selectedText || detail.placeholder;
        const replacement = detail.before + inner + detail.after;
        view.dispatch({
          changes: { from, to, insert: replacement },
          selection: {
            anchor: selectedText ? from : from + detail.before.length,
            head: selectedText ? from + replacement.length : from + detail.before.length + inner.length,
          },
        });
      } else if (detail.type === 'prepend') {
        const line = state.doc.lineAt(from);
        view.dispatch({
          changes: { from: line.from, to: line.from, insert: detail.before },
          selection: { anchor: from + detail.before.length },
        });
      } else if (detail.type === 'insert') {
        const text = detail.text;
        const cursorPos = detail.cursorOffset !== undefined
          ? from + detail.cursorOffset
          : from + text.length;
        view.dispatch({
          changes: { from, to, insert: text },
          selection: { anchor: cursorPos },
        });
      }

      view.focus();
    }

    window.addEventListener('editor-action', handleEditorAction as EventListener);


    // Cleanup event listener
    return () => {
      window.removeEventListener('editor-action', handleEditorAction as EventListener);
    };
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });

  // Update editor content when tab changes
  $: if (editor && tab.content !== editor.getContent()) {
    editor.setContent(tab.content);
  }

  // Update language when file path changes
  $: if (editor && tab.filePath) {
    const newLanguage = tab.language || detectLanguageFromPath(tab.filePath);
    if (newLanguage) {
      editor.setLanguage(newLanguage);
    }
  }

  // Apply theme when it changes (hot-reload)
  $: if (editor && $currentTheme) {
    editor.applyTheme($currentTheme);
  }

  // Apply editor preferences when they change
  $: if (editor && $settings.fontSize) {
    editor.setFontSize($settings.fontSize);
  }

  $: if (editor && $settings.fontFamily) {
    editor.setFontFamily($settings.fontFamily);
  }

  $: if (editor && $settings.tabSize !== undefined) {
    editor.setTabSize($settings.tabSize);
  }

  $: if (editor && $settings.wordWrap !== undefined) {
    editor.setWordWrap($settings.wordWrap);
  }

  $: if (editor && $settings.showInvisibles !== undefined) {
    editor.setShowInvisibles($settings.showInvisibles);
  }

  $: if (editor && $settings.autoIndent !== undefined) {
    editor.setAutoIndent($settings.autoIndent);
  }
</script>

<div class="editor-wrapper">
  <div bind:this={editorContainer} class="editor-container"></div>
  <FindReplacePanel
    onFind={handleFind}
    onReplace={handleReplace}
    onReplaceAll={handleReplaceAll}
    onClose={handleClose}
  />
  <GoToLineDialog onGoToLine={handleGoToLine} />
</div>

<style>
  .editor-wrapper {
    width: 100%;
    height: 100%;
    overflow: hidden;
    margin: 0;
    padding: 0;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .editor-container {
    width: 100%;
    flex: 1;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  :global(.cm-editor) {
    height: 100%;
    width: 100%;
    font-size: 14px;
    font-family: 'Consolas', 'Courier New', monospace;
    margin: 0;
    padding: 0;
  }

  :global(.cm-scroller) {
    overflow: auto;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  :global(.cm-content) {
    padding: 4px 0;
    margin: 0;
  }

  :global(.cm-gutters) {
    margin: 0;
    padding: 0;
    left: 0 !important;
  }

  :global(.cm-lineNumbers) {
    margin: 0;
    padding: 0;
  }

  :global(.cm-line) {
    padding-left: 8px;
  }

  /* Force search match highlighting */
  :global(.cm-searchMatch) {
    background-color: rgba(255, 213, 0, 0.5) !important;
    outline: 2px solid rgba(255, 200, 0, 0.9) !important;
    outline-offset: -1px !important;
    border-radius: 2px !important;
  }

  :global(.cm-searchMatch.cm-searchMatch-selected) {
    background-color: rgba(255, 100, 0, 0.7) !important;
    outline: 3px solid rgba(255, 80, 0, 1) !important;
    outline-offset: -1px !important;
    border-radius: 2px !important;
  }
</style>
