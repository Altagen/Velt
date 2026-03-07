import { Node, mergeAttributes } from '@tiptap/core';
import markdownItContainer from 'markdown-it-container';

export const ADMONITION_TYPES = ['note', 'info', 'warning', 'danger', 'tip'] as const;
export type AdmonitionType = typeof ADMONITION_TYPES[number];

export const AdmonitionNode = Node.create({
  name: 'admonition',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      type: {
        default: 'note',
        parseHTML: (el) => (el as HTMLElement).getAttribute('data-admonition-type'),
        renderHTML: (attrs) => ({ 'data-admonition-type': attrs.type }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-admonition-type]',
        getAttrs: (el) => ({
          type: (el as HTMLElement).getAttribute('data-admonition-type'),
        }),
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const type = node.attrs.type as AdmonitionType;
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: `admonition admonition-${type}`,
        'data-admonition-type': type,
      }),
      0,
    ];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`:::${node.attrs.type}\n`);
          state.renderContent(node);
          state.write('\n:::');
          state.closeBlock(node);
        },
        parse: {
          setup(markdownit: any) {
            for (const type of ADMONITION_TYPES) {
              markdownit.use(markdownItContainer, type, {
                render(tokens: any[], idx: number) {
                  if (tokens[idx].nesting === 1) {
                    return `<div data-admonition-type="${type}">\n`;
                  }
                  return '</div>\n';
                },
              });
            }
          },
        },
      },
    };
  },
});
