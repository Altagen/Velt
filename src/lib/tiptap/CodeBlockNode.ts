import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';

// Register the same languages as markdownRenderer.ts
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import css from 'highlight.js/lib/languages/css';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import sql from 'highlight.js/lib/languages/sql';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';

const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('js', javascript);
lowlight.register('typescript', typescript);
lowlight.register('ts', typescript);
lowlight.register('python', python);
lowlight.register('py', python);
lowlight.register('rust', rust);
lowlight.register('css', css);
lowlight.register('html', xml);
lowlight.register('xml', xml);
lowlight.register('bash', bash);
lowlight.register('sh', bash);
lowlight.register('json', json);
lowlight.register('yaml', yaml);
lowlight.register('yml', yaml);
lowlight.register('sql', sql);
lowlight.register('go', go);
lowlight.register('java', java);
lowlight.register('c', c);
lowlight.register('cpp', cpp);

const LANGUAGES = [
  { label: 'Plain Text', value: '' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Python', value: 'python' },
  { label: 'Rust', value: 'rust' },
  { label: 'CSS', value: 'css' },
  { label: 'HTML', value: 'html' },
  { label: 'Bash / Shell', value: 'bash' },
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
  { label: 'SQL', value: 'sql' },
  { label: 'Go', value: 'go' },
  { label: 'Java', value: 'java' },
  { label: 'C', value: 'c' },
  { label: 'C++', value: 'cpp' },
  { label: 'Mermaid', value: 'mermaid' },
];

function getLangLabel(value: string): string {
  return LANGUAGES.find(l => l.value === value)?.label ?? (value || 'Plain Text');
}

export const CodeBlockNode = CodeBlockLowlight.extend({
  addNodeView() {
    return ({ node: initialNode, editor, getPos }) => {
      let currentNode = initialNode;

      // --- Outer wrapper ---
      const wrapper = document.createElement('div');
      wrapper.className = 'note-code-block';

      // --- Header ---
      const header = document.createElement('div');
      header.className = 'note-code-block-header';
      header.contentEditable = 'false';

      // --- Custom language selector ---
      const langBtn = document.createElement('button');
      langBtn.type = 'button';
      langBtn.className = 'note-code-lang-btn';

      const langLabel = document.createElement('span');
      langLabel.className = 'note-code-lang-label';
      langLabel.textContent = getLangLabel(currentNode.attrs.language || '');

      const langCaret = document.createElement('span');
      langCaret.className = 'note-code-lang-caret';
      langCaret.textContent = '▾';

      langBtn.appendChild(langLabel);
      langBtn.appendChild(langCaret);

      // Dropdown (appended to body, position: fixed)
      const langDropdown = document.createElement('div');
      langDropdown.className = 'note-code-lang-dropdown';
      let dropdownOpen = false;

      function openDropdown() {
        if (dropdownOpen) return;
        dropdownOpen = true;
        document.body.appendChild(langDropdown);
        const rect = langBtn.getBoundingClientRect();
        langDropdown.style.top = rect.bottom + 4 + 'px';
        langDropdown.style.left = rect.left + 'px';
        requestAnimationFrame(() => {
          document.addEventListener('mousedown', onOutsideClick, true);
        });
      }

      function closeDropdown() {
        if (!dropdownOpen) return;
        dropdownOpen = false;
        if (langDropdown.parentElement === document.body) {
          document.body.removeChild(langDropdown);
        }
        document.removeEventListener('mousedown', onOutsideClick, true);
      }

      function onOutsideClick(e: MouseEvent) {
        if (!langDropdown.contains(e.target as Node) && !langBtn.contains(e.target as Node)) {
          closeDropdown();
        }
      }

      langBtn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dropdownOpen) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });

      LANGUAGES.forEach(({ label, value }) => {
        const opt = document.createElement('button');
        opt.type = 'button';
        opt.className = 'note-code-lang-option';
        opt.textContent = label;
        opt.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          closeDropdown();
          if (typeof getPos === 'function') {
            const pos = getPos();
            if (pos === undefined) return;
            const lang = value || null;
            editor.chain().command(({ tr }) => {
              tr.setNodeMarkup(pos, undefined, {
                ...currentNode.attrs,
                language: lang,
              });
              return true;
            }).run();
          }
        });
        langDropdown.appendChild(opt);
      });

      header.appendChild(langBtn);
      wrapper.appendChild(header);

      // --- Code area ---
      const pre = document.createElement('pre');
      pre.className = 'hljs';
      const code = document.createElement('code');
      code.className = 'hljs';
      pre.appendChild(code);
      wrapper.appendChild(pre);

      return {
        dom: wrapper,
        contentDOM: code,
        update(updatedNode) {
          if (updatedNode.type !== currentNode.type) return false;
          currentNode = updatedNode;
          langLabel.textContent = getLangLabel(updatedNode.attrs.language || '');
          return true;
        },
        destroy() {
          closeDropdown();
        },
      };
    };
  },
}).configure({ lowlight });
