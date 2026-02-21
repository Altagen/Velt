<script lang="ts">
  import { currentTheme } from '../stores/themeStore';
  import { focusedPaneId } from '../stores/paneStore';
  import { get } from 'svelte/store';
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

  type ButtonGroup = 'format' | 'heading' | 'link' | 'code' | 'list' | 'block' | 'math' | 'diagram';

  interface ToolbarButton {
    icon: any;
    title: string;
    type: 'wrap' | 'prepend' | 'insert' | 'image';
    group: ButtonGroup;
    before?: string;
    after?: string;
    text?: string;
    placeholder?: string;
    cursorOffset?: number;
  }

  $: groupColors = {
    format: $currentTheme?.ui?.accentPrimary || '#00d4aa',
    heading: $currentTheme?.icons?.language || '#4DB6AC',
    link: $currentTheme?.ui?.accent || '#4a9eff',
    code: $currentTheme?.icons?.encoding || '#F06292',
    list: $currentTheme?.icons?.folder || '#FFB74D',
    block: $currentTheme?.icons?.wrap || '#9575CD',
    math: $currentTheme?.icons?.settings || '#BA68C8',
    diagram: $currentTheme?.icons?.language || '#4DB6AC',
  } as Record<ButtonGroup, string>;

  const buttons: ToolbarButton[] = [
    { icon: TextB, title: 'Bold', type: 'wrap', group: 'format', before: '**', after: '**', placeholder: 'bold text' },
    { icon: TextItalic, title: 'Italic', type: 'wrap', group: 'format', before: '*', after: '*', placeholder: 'italic text' },
    { icon: TextStrikethrough, title: 'Strikethrough', type: 'wrap', group: 'format', before: '~~', after: '~~', placeholder: 'strikethrough' },
    { icon: TextHOne, title: 'Heading 1', type: 'prepend', group: 'heading', before: '# ' },
    { icon: TextHTwo, title: 'Heading 2', type: 'prepend', group: 'heading', before: '## ' },
    { icon: TextHThree, title: 'Heading 3', type: 'prepend', group: 'heading', before: '### ' },
    { icon: LinkSimple, title: 'Link', type: 'wrap', group: 'link', before: '[', after: '](url)', placeholder: 'link text' },
    { icon: ImageSquare, title: 'Image', type: 'image', group: 'link' },
    { icon: Code, title: 'Inline Code', type: 'wrap', group: 'code', before: '`', after: '`', placeholder: 'code' },
    { icon: CodeBlock, title: 'Code Block', type: 'insert', group: 'code', text: '```\n\n```', cursorOffset: 4 },
    { icon: Quotes, title: 'Blockquote', type: 'prepend', group: 'block', before: '> ' },
    { icon: ListBullets, title: 'Unordered List', type: 'prepend', group: 'list', before: '- ' },
    { icon: ListNumbers, title: 'Ordered List', type: 'prepend', group: 'list', before: '1. ' },
    { icon: ListChecks, title: 'Task List', type: 'prepend', group: 'list', before: '- [ ] ' },
    { icon: Table, title: 'Table', type: 'insert', group: 'block', text: '| Header | Header | Header |\n| ------ | ------ | ------ |\n| Cell   | Cell   | Cell   |\n| Cell   | Cell   | Cell   |\n| Cell   | Cell   | Cell   |' },
    { icon: Minus, title: 'Horizontal Rule', type: 'insert', group: 'block', text: '---\n' },
    { icon: MathOperations, title: 'Math Inline', type: 'wrap', group: 'math', before: '$', after: '$', placeholder: 'formula' },
    { icon: MathOperations, title: 'Math Block', type: 'insert', group: 'math', text: '$$\n\n$$', cursorOffset: 3 },
    { icon: TreeStructure, title: 'Mermaid Diagram', type: 'insert', group: 'diagram', text: '```mermaid\ngraph TD\n    A-->B\n```', cursorOffset: 11 },
  ];

  async function handleImageInsert() {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico'],
        }],
      });

      if (selected) {
        const filePath = typeof selected === 'string' ? selected : selected;
        window.dispatchEvent(new CustomEvent('editor-action', {
          detail: {
            action: 'markdownInsert',
            type: 'insert',
            before: '',
            after: '',
            text: `![image](${filePath})`,
            placeholder: '',
            targetPane: get(focusedPaneId),
          }
        }));
        return;
      }
    } catch {
      // Fallback on error
    }

    // Fallback: insert placeholder
    window.dispatchEvent(new CustomEvent('editor-action', {
      detail: {
        action: 'markdownInsert',
        type: 'insert',
        before: '',
        after: '',
        text: '![alt](url)',
        placeholder: '',
        targetPane: get(focusedPaneId),
      }
    }));
  }

  function handleClick(button: ToolbarButton) {
    if (button.type === 'image') {
      handleImageInsert();
      return;
    }

    window.dispatchEvent(new CustomEvent('editor-action', {
      detail: {
        action: 'markdownInsert',
        type: button.type,
        before: button.before || '',
        after: button.after || '',
        text: button.text || '',
        placeholder: button.placeholder || '',
        cursorOffset: button.cursorOffset,
        targetPane: get(focusedPaneId),
      }
    }));
  }
</script>

<div
  class="markdown-toolbar"
  style="
    background-color: {$currentTheme?.ui?.background || '#252526'};
    border-bottom: 1px solid {$currentTheme?.ui?.border || '#3e3e42'};
  "
>
  {#each buttons as button, i}
    {#if i === 3 || i === 6 || i === 8 || i === 10 || i === 11 || i === 14 || i === 16}
      <div class="toolbar-separator" style="background-color: {$currentTheme?.ui?.border || '#3e3e42'}"></div>
    {/if}
    <button
      class="toolbar-button"
      title={button.title}
      tabindex="-1"
      on:click={() => handleClick(button)}
      style="color: {groupColors[button.group]}"
    >
      <svelte:component this={button.icon} size={18} weight="duotone" color={groupColors[button.group]} />
    </button>
  {/each}
</div>

<style>
  .markdown-toolbar {
    display: flex;
    align-items: center;
    padding: 3px 8px;
    gap: 1px;
    overflow-x: auto;
    user-select: none;
  }

  .toolbar-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    flex-shrink: 0;
    transition: background-color 0.1s;
  }

  .toolbar-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .toolbar-button:active {
    background-color: rgba(255, 255, 255, 0.15);
  }

  .toolbar-separator {
    width: 1px;
    height: 20px;
    margin: 0 4px;
    flex-shrink: 0;
  }
</style>
