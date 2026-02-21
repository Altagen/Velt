import MarkdownIt from 'markdown-it';
import markdownItContainer from 'markdown-it-container';
import texmath from 'markdown-it-texmath';
import katex from 'katex';
import hljs from 'highlight.js/lib/core';
import DOMPurify from 'dompurify';
import type { MarkdownPreviewTheme } from '@altagen/velt-core';

// Import languages selectively
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
import markdown from 'highlight.js/lib/languages/markdown';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('css', css);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);

// Default admonition configuration
const DEFAULT_ADMONITIONS: Record<string, { icon: string; borderColor: string }> = {
  warning: { icon: '\u26a0\ufe0f', borderColor: '#e6a700' },
  danger: { icon: '\ud83d\udd34', borderColor: '#e53935' },
  info: { icon: '\u2139\ufe0f', borderColor: '#2196f3' },
  tip: { icon: '\ud83d\udca1', borderColor: '#4caf50' },
  note: { icon: '\ud83d\udcdd', borderColor: '#9e9e9e' },
};

interface AdmonitionConfig {
  icon: string;
  borderColor: string;
  background?: string;
  titleColor?: string;
  textColor?: string;
}

function getAdmonitionConfig(
  name: string,
  theme?: MarkdownPreviewTheme | null
): AdmonitionConfig {
  const defaults = DEFAULT_ADMONITIONS[name];
  const admonitions = theme?.admonitions;

  if (!admonitions) {
    return defaults || { icon: '\u2139\ufe0f', borderColor: '#9e9e9e' };
  }

  // Check built-in types
  const typeStyle = (admonitions as any)[name];
  if (typeStyle) {
    return {
      icon: typeStyle.icon || defaults?.icon || '\u2139\ufe0f',
      borderColor: typeStyle.borderColor || defaults?.borderColor || '#9e9e9e',
      background: typeStyle.background,
      titleColor: typeStyle.titleColor,
      textColor: typeStyle.textColor,
    };
  }

  // Check custom types
  if (admonitions.custom?.[name]) {
    const custom = admonitions.custom[name];
    return {
      icon: custom.icon || '\u2139\ufe0f',
      borderColor: custom.borderColor || '#9e9e9e',
      background: custom.background,
      titleColor: custom.titleColor,
      textColor: custom.textColor,
    };
  }

  return defaults || { icon: '\u2139\ufe0f', borderColor: '#9e9e9e' };
}

function renderAdmonitionIcon(icon: string): string {
  // If the icon looks like SVG, inject it inline
  if (icon.trim().startsWith('<svg')) {
    return `<span class="admonition-icon">${icon}</span>`;
  }
  // Otherwise treat as text/emoji
  return icon;
}

export function createMarkdownRenderer(theme?: MarkdownPreviewTheme | null): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight(str: string, lang: string): string {
      // Mermaid blocks → rendered as <pre class="mermaid"> for post-processing
      if (lang === 'mermaid') {
        return `<pre class="mermaid">${md.utils.escapeHtml(str)}</pre>`;
      }

      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`;
        } catch {
          // fallthrough
        }
      }

      // Auto-detect fallback
      try {
        return `<pre class="hljs"><code>${hljs.highlightAuto(str).value}</code></pre>`;
      } catch {
        return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
      }
    },
  });

  // KaTeX math support
  md.use(texmath, {
    engine: katex,
    delimiters: 'dollars',
    katexOptions: { throwOnError: false },
  });

  // Collect all admonition type names: built-in + custom from theme
  const admonitionNames = new Set(Object.keys(DEFAULT_ADMONITIONS));
  if (theme?.admonitions?.custom) {
    for (const name of Object.keys(theme.admonitions.custom)) {
      admonitionNames.add(name);
    }
  }

  // Register admonition containers
  for (const name of admonitionNames) {
    const config = getAdmonitionConfig(name, theme);

    md.use(markdownItContainer, name, {
      validate(params: string) {
        return params.trim().split(/\s+/)[0] === name;
      },
      render(tokens: any[], idx: number) {
        if (tokens[idx].nesting === 1) {
          const title = tokens[idx].info.trim().slice(name.length).trim() || name.charAt(0).toUpperCase() + name.slice(1);
          const iconHtml = renderAdmonitionIcon(config.icon);
          // Build inline styles — always set border-left-color, add bg/text for custom or themed admonitions
          let styles = `border-left-color: ${config.borderColor}`;
          if (config.background) styles += `; background-color: ${config.background}`;
          if (config.textColor) styles += `; color: ${config.textColor}`;
          const titleStyle = config.titleColor ? ` style="color: ${config.titleColor}"` : '';
          return `<div class="admonition admonition-${md.utils.escapeHtml(name)}" style="${styles}">
  <p class="admonition-title"${titleStyle}>${iconHtml} ${md.utils.escapeHtml(title)}</p>\n`;
        }
        return '</div>\n';
      },
    });
  }

  return md;
}

// SVG tags that mermaid uses and DOMPurify should allow
const SVG_TAGS = [
  'svg', 'g', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline',
  'polygon', 'text', 'tspan', 'defs', 'clipPath', 'marker', 'use',
  'foreignObject', 'style', 'desc', 'title', 'image', 'pattern',
  'linearGradient', 'radialGradient', 'stop', 'animate', 'animateTransform',
];

const SVG_ATTRS = [
  'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-dasharray',
  'stroke-linecap', 'stroke-linejoin', 'transform', 'd', 'cx', 'cy', 'r',
  'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height',
  'points', 'font-size', 'font-family', 'font-weight', 'text-anchor',
  'dominant-baseline', 'clip-path', 'marker-end', 'marker-start', 'id',
  'class', 'style', 'opacity', 'dx', 'dy', 'offset', 'stop-color',
  'stop-opacity', 'gradientTransform', 'gradientUnits', 'patternUnits',
  'href', 'xlink:href', 'preserveAspectRatio', 'aria-roledescription',
  'role', 'aria-label', 'tabindex',
];

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: SVG_TAGS,
    ADD_ATTR: [...SVG_ATTRS, 'style'],
    ALLOW_DATA_ATTR: true,
  });
}
