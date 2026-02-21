<script lang="ts">
  import { onMount } from 'svelte';
  import { debounce } from '@altagen/velt-core';
  import { createMarkdownRenderer, sanitizeHtml } from '../lib/markdownRenderer';
  import { currentTheme } from '../stores/themeStore';
  import '../styles/markdownPreview.css';

  export let content: string = '';

  let previewContainer: HTMLDivElement;
  let renderedHtml = '';
  let mermaidModule: any = null;
  let mermaidInitialized = false;

  // Helper to get a specific admonition type style from the structured theme
  function getAdStyle(type: string): any {
    const admonitions = $currentTheme?.markdownPreview?.admonitions;
    if (!admonitions) return null;
    return (admonitions as any)[type] || null;
  }

  // Helper to resolve admonition background with legacy flat fallback
  function adBg(type: string): string | undefined {
    const style = getAdStyle(type);
    if (style?.background) return style.background;
    // Legacy flat fallback
    const mp = $currentTheme?.markdownPreview;
    if (!mp) return undefined;
    const legacyKey = `admonition${type.charAt(0).toUpperCase() + type.slice(1)}Bg`;
    return (mp as any)[legacyKey] as string | undefined;
  }

  function adBorder(type: string): string | undefined {
    return getAdStyle(type)?.borderColor;
  }

  function adTitle(type: string): string | undefined {
    return getAdStyle(type)?.titleColor;
  }

  function adText(type: string): string | undefined {
    return getAdStyle(type)?.textColor;
  }

  // Recreate renderer when theme changes (for admonition icons + custom types)
  let md = createMarkdownRenderer($currentTheme?.markdownPreview);

  $: {
    md = createMarkdownRenderer($currentTheme?.markdownPreview);
    // Re-render with new renderer
    if (content !== undefined) {
      renderMarkdown(content);
      requestAnimationFrame(() => { processMermaid(); });
    }
  }

  function renderMarkdown(text: string) {
    const raw = md.render(text);
    renderedHtml = sanitizeHtml(raw);
  }

  const debouncedRender = debounce((text: string) => {
    renderMarkdown(text);
    // After DOM update, process mermaid diagrams
    requestAnimationFrame(() => {
      processMermaid();
    });
  }, 300);

  async function processMermaid() {
    if (!previewContainer) return;

    const mermaidBlocks = previewContainer.querySelectorAll('pre.mermaid');
    if (mermaidBlocks.length === 0) return;

    // Lazy-load mermaid
    if (!mermaidModule) {
      try {
        mermaidModule = (await import('mermaid')).default;
      } catch {
        return;
      }
    }

    if (!mermaidInitialized) {
      const isDark = $currentTheme?.editor?.background
        ? isColorDark($currentTheme.editor.background)
        : true;

      mermaidModule.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'strict',
      });
      mermaidInitialized = true;
    }

    // Render each mermaid block
    for (let i = 0; i < mermaidBlocks.length; i++) {
      const block = mermaidBlocks[i] as HTMLElement;
      const code = block.textContent || '';

      // Skip already rendered blocks
      if (block.getAttribute('data-processed') === 'true') continue;

      try {
        const id = `mermaid-${Date.now()}-${i}`;
        const { svg } = await mermaidModule.render(id, code);
        block.innerHTML = svg;
        block.setAttribute('data-processed', 'true');
      } catch {
        block.classList.add('mermaid-error');
      }
    }
  }

  function isColorDark(hex: string): boolean {
    const color = hex.replace('#', '');
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  }

  // Re-initialize mermaid when theme changes
  $: if ($currentTheme && mermaidModule) {
    const isDark = $currentTheme?.editor?.background
      ? isColorDark($currentTheme.editor.background)
      : true;

    mermaidModule.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'strict',
    });

    // Re-render mermaid blocks
    if (previewContainer) {
      const blocks = previewContainer.querySelectorAll('pre.mermaid');
      blocks.forEach(b => b.removeAttribute('data-processed'));
      processMermaid();
    }
  }

  // Render on content change
  $: debouncedRender(content);

  // Initial render
  onMount(() => {
    renderMarkdown(content);
    requestAnimationFrame(() => {
      processMermaid();
    });
  });

  // Shorthand
  $: mp = $currentTheme?.markdownPreview;
  $: cs = mp?.codeSyntax;

  const defaultCodeFont = "'Consolas', 'Courier New', monospace";
</script>

<div
  class="markdown-preview"
  bind:this={previewContainer}
  style="
    background-color: {mp?.background || $currentTheme?.editor?.background || '#1e1e1e'};
    color: {mp?.foreground || $currentTheme?.editor?.foreground || '#d4d4d4'};
    font-family: {mp?.fontFamily || 'inherit'};
    font-size: {mp?.fontSize || 'inherit'};
    padding: {mp?.padding || '24px'};

    --md-line-height: {mp?.lineHeight || '1.7'};

    --md-link-color: {mp?.linkColor || '#58a6ff'};
    --md-link-hover-color: {mp?.linkHoverColor || mp?.linkColor || '#58a6ff'};
    --md-link-decoration: {mp?.linkDecoration || 'none'};

    --md-heading-color: {mp?.headingColor || $currentTheme?.editor?.foreground || '#d4d4d4'};
    --md-heading-font-family: {mp?.headingFontFamily || 'inherit'};
    --md-heading-font-weight: {mp?.headingFontWeight || '600'};
    --md-h1-color: {mp?.h1?.color || ''};
    --md-h1-font-size: {mp?.h1?.fontSize || '2em'};
    --md-h1-font-weight: {mp?.h1?.fontWeight || ''};
    --md-h1-border-bottom: {mp?.h1?.borderBottom || '1px solid rgba(255, 255, 255, 0.1)'};
    --md-h2-color: {mp?.h2?.color || ''};
    --md-h2-font-size: {mp?.h2?.fontSize || '1.5em'};
    --md-h2-font-weight: {mp?.h2?.fontWeight || ''};
    --md-h2-border-bottom: {mp?.h2?.borderBottom || '1px solid rgba(255, 255, 255, 0.07)'};
    --md-h3-color: {mp?.h3?.color || ''};
    --md-h3-font-size: {mp?.h3?.fontSize || '1.25em'};
    --md-h3-font-weight: {mp?.h3?.fontWeight || ''};
    --md-h4-color: {mp?.h4?.color || ''};
    --md-h4-font-size: {mp?.h4?.fontSize || '1em'};
    --md-h4-font-weight: {mp?.h4?.fontWeight || ''};
    --md-h5-color: {mp?.h5?.color || ''};
    --md-h5-font-size: {mp?.h5?.fontSize || '0.875em'};
    --md-h5-font-weight: {mp?.h5?.fontWeight || ''};
    --md-h6-color: {mp?.h6?.color || ''};
    --md-h6-font-size: {mp?.h6?.fontSize || '0.85em'};
    --md-h6-font-weight: {mp?.h6?.fontWeight || ''};
    --md-h6-opacity: {mp?.h6?.opacity || '0.8'};

    --md-blockquote-border: {mp?.blockquoteBorder || 'rgba(255, 255, 255, 0.2)'};
    --md-blockquote-bg: {mp?.blockquoteBackground || 'rgba(255, 255, 255, 0.03)'};
    --md-blockquote-text-color: {mp?.blockquoteTextColor || 'inherit'};
    --md-blockquote-border-width: {mp?.blockquoteBorderWidth || '4px'};

    --md-code-inline-bg: {mp?.codeInlineBg || 'rgba(255, 255, 255, 0.08)'};
    --md-code-inline-color: {mp?.codeInlineColor || 'inherit'};
    --md-code-inline-font-family: {mp?.codeInlineFontFamily || defaultCodeFont};
    --md-code-block-bg: {mp?.codeBlockBg || 'rgba(0, 0, 0, 0.3)'};
    --md-code-block-color: {mp?.codeBlockColor || '#abb2bf'};
    --md-code-block-font-family: {mp?.codeBlockFontFamily || defaultCodeFont};
    --md-code-block-border-radius: {mp?.codeBlockBorderRadius || '6px'};

    --md-syntax-keyword: {cs?.keyword || '#c678dd'};
    --md-syntax-string: {cs?.string || '#98c379'};
    --md-syntax-comment: {cs?.comment || '#5c6370'};
    --md-syntax-number: {cs?.number || '#d19a66'};
    --md-syntax-function: {cs?.function || '#61afef'};
    --md-syntax-builtin: {cs?.builtin || '#e6c07b'};
    --md-syntax-attribute: {cs?.attribute || '#d19a66'};
    --md-syntax-regexp: {cs?.regexp || '#56b6c2'};
    --md-syntax-variable: {cs?.variable || '#abb2bf'};
    --md-syntax-tag: {cs?.tag || '#e06c75'};
    --md-syntax-operator: {cs?.operator || '#56b6c2'};
    --md-syntax-punctuation: {cs?.punctuation || '#abb2bf'};
    --md-syntax-meta: {cs?.meta || '#5c6370'};
    --md-syntax-type: {cs?.type || '#e6c07b'};

    --md-table-border: {mp?.tableBorder || 'rgba(255, 255, 255, 0.12)'};
    --md-table-header-bg: {mp?.tableHeaderBackground || 'rgba(255, 255, 255, 0.06)'};
    --md-table-header-color: {mp?.tableHeaderColor || 'inherit'};
    --md-table-row-even-bg: {mp?.tableRowEvenBg || 'rgba(255, 255, 255, 0.02)'};
    --md-table-row-hover-bg: {mp?.tableRowHoverBg || 'transparent'};

    --md-hr-color: {mp?.hrColor || 'rgba(255, 255, 255, 0.15)'};
    --md-hr-style: {mp?.hrStyle || 'solid'};

    --md-list-marker-color: {mp?.listMarkerColor || 'inherit'};
    --md-task-list-check-color: {mp?.taskListCheckColor || '#58a6ff'};

    --md-image-border-radius: {mp?.imageBorderRadius || '4px'};
    --md-image-border: {mp?.imageBorder || 'none'};

    --md-admonition-border-radius: {mp?.admonitions?.borderRadius || '6px'};
    --md-admonition-border-width: {mp?.admonitions?.borderWidth || '4px'};
    --md-admonition-title-font-weight: {mp?.admonitions?.titleFontWeight || '600'};
    --md-admonition-info-bg: {adBg('info') || 'rgba(33, 150, 243, 0.15)'};
    --md-admonition-info-border: {adBorder('info') || '#2196f3'};
    --md-admonition-info-title: {adTitle('info') || 'inherit'};
    --md-admonition-info-text: {adText('info') || 'inherit'};
    --md-admonition-warning-bg: {adBg('warning') || 'rgba(230, 167, 0, 0.15)'};
    --md-admonition-warning-border: {adBorder('warning') || '#e6a700'};
    --md-admonition-warning-title: {adTitle('warning') || 'inherit'};
    --md-admonition-warning-text: {adText('warning') || 'inherit'};
    --md-admonition-danger-bg: {adBg('danger') || 'rgba(229, 57, 53, 0.15)'};
    --md-admonition-danger-border: {adBorder('danger') || '#e53935'};
    --md-admonition-danger-title: {adTitle('danger') || 'inherit'};
    --md-admonition-danger-text: {adText('danger') || 'inherit'};
    --md-admonition-tip-bg: {adBg('tip') || 'rgba(76, 175, 80, 0.15)'};
    --md-admonition-tip-border: {adBorder('tip') || '#4caf50'};
    --md-admonition-tip-title: {adTitle('tip') || 'inherit'};
    --md-admonition-tip-text: {adText('tip') || 'inherit'};
    --md-admonition-note-bg: {adBg('note') || 'rgba(158, 158, 158, 0.15)'};
    --md-admonition-note-border: {adBorder('note') || '#9e9e9e'};
    --md-admonition-note-title: {adTitle('note') || 'inherit'};
    --md-admonition-note-text: {adText('note') || 'inherit'};

    --md-katex-color: {mp?.katexColor || 'inherit'};
    --md-katex-font-size: {mp?.katexFontSize || '1.1em'};

    --md-strong-color: {mp?.strongColor || 'inherit'};
    --md-emphasis-color: {mp?.emphasisColor || 'inherit'};
    --md-strikethrough-opacity: {mp?.strikethroughOpacity || '0.6'};
  "
>
  <div class="markdown-body" style="max-width: {mp?.maxWidth || '900px'}">
    {@html renderedHtml}
  </div>
</div>

<style>
  .markdown-preview {
    height: 100%;
    overflow-y: auto;
  }

  .markdown-body {
    margin: 0 auto;
  }
</style>
