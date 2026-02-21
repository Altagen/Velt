# Theme System

Velt uses a single JSON theme file to control the entire appearance of the application, including the editor, UI chrome, syntax highlighting, and markdown preview.

## Theme Location

Themes are stored in the Velt configuration directory:

| Platform | Path |
|----------|------|
| Linux | `~/.config/velt/themes/` |
| macOS | `~/Library/Application Support/velt/themes/` |
| Windows | `%APPDATA%\velt\themes\` |

### Files

- `default-dark.json` - Built-in dark theme (regenerated if deleted)
- `default-light.json` - Built-in light theme (regenerated if deleted)
- `current.json` - Currently active theme (written when you switch themes)
- `*.json` - Any custom theme you create

## Switching Themes

Open **Settings** and select a theme from the dropdown. The selected theme is copied to `current.json` and applied immediately.

## Creating a Custom Theme

1. Copy `default-dark.json` (or `default-light.json`) to a new file, e.g. `my-theme.json`
2. Change the `"name"` field
3. Edit the colors you want to customize
4. Restart Velt or switch to your theme in Settings

All properties inside `markdownPreview`, `icons`, and `syntax` are **optional**. If you omit a property, the built-in default is used. You only need to specify what you want to change.

## Theme Structure

```jsonc
{
  "name": "My Theme",
  "editor": { ... },          // Editor area colors (required)
  "gutter": { ... },          // Line number gutter (required)
  "ui": { ... },              // Application chrome (required)
  "icons": { ... },           // Status bar icon colors (optional)
  "syntax": { ... },          // Editor syntax highlighting (optional)
  "markdownPreview": { ... }  // Markdown preview styling (optional)
}
```

---

## `editor`

Controls the main code editing area.

| Property | Description | Example |
|----------|-------------|---------|
| `background` | Editor background color | `"#1e1e1e"` |
| `foreground` | Default text color | `"#d4d4d4"` |
| `lineHighlight` | Current line highlight | `"#2d2d30"` |
| `selection` | Text selection background | `"rgba(58, 110, 165, 0.3)"` |
| `cursor` | Cursor color | `"#ffffff"` |
| `selectionMatch` | Matching selection highlights | `"rgba(100, 200, 100, 0.3)"` |

## `gutter`

Controls the line number area on the left.

| Property | Description | Example |
|----------|-------------|---------|
| `background` | Gutter background | `"#1e1e1e"` |
| `foreground` | Line number color | `"#858585"` |
| `border` | Right border color | `"#3e3e42"` |

## `ui`

Controls the application chrome (menu bar, tab bar, status bar, dialogs).

| Property | Description | Example |
|----------|-------------|---------|
| `menuBar` | Menu bar background | `"#2d2d30"` |
| `tabBar` | Tab bar background | `"#2d2d30"` |
| `tabActive` | Active tab background | `"#1e1e1e"` |
| `tabInactive` | Inactive tab background | `"#2d2d30"` |
| `textColor` | Primary text color | `"#cccccc"` |
| `textSecondary` | Secondary/muted text | `"#858585"` |
| `textHoverColor` | Text hover color | `"#ffffff"` |
| `textActiveColor` | Active text color | `"#ffffff"` |
| `background` | General UI background (status bar, dialogs) | `"#252526"` |
| `border` | UI borders | `"#3e3e42"` |
| `accent` | Primary accent (buttons) | `"#4a9eff"` |
| `accentHover` | Accent hover state | `"#6eb4ff"` |
| `accentPrimary` | Focus indicator, highlights | `"#00d4aa"` |
| `accentPrimaryHover` | Primary accent hover | `"#00ffcc"` |
| `accentDanger` | Danger/destructive actions | `"#f48771"` |
| `accentDangerHover` | Danger hover state | `"#ff9b87"` |
| `iconColor` | Default icon color | `"#858585"` |
| `iconActiveColor` | Active icon color | `"#ffd700"` |
| `dirtyIndicator` | Unsaved changes indicator | `"#4ec9b0"` |

## `icons` (optional)

Per-icon color overrides in the status bar and menu bar.

| Property | Description |
|----------|-------------|
| `file` | File icon |
| `folder` | Folder icon |
| `save` | Save icon |
| `reload` | Reload icon |
| `settings` | Settings icon |
| `search` | Search icon |
| `replace` | Replace icon |
| `close` | Close icon |
| `warning` | Warning icon |
| `cursor` | Cursor position icon |
| `selection` | Selection icon |
| `wrap` | Word wrap icon |
| `whitespace` | Show invisibles icon |
| `zoom` | Zoom level icon |
| `eol` | Line endings icon |
| `encoding` | File encoding icon |
| `language` | Language mode icon |

## `syntax` (optional)

Controls syntax highlighting colors in the code editor.

| Property | Description | Example |
|----------|-------------|---------|
| `keyword` | `if`, `else`, `return`, etc. | `"#c678dd"` |
| `string` | String literals | `"#98c379"` |
| `number` | Numeric literals | `"#d19a66"` |
| `comment` | Comments | `"#5c6370"` |
| `function` | Function names | `"#61afef"` |
| `variable` | Variable names | `"#e06c75"` |
| `type` | Type names | `"#e6c07b"` |
| `operator` | Operators (`+`, `-`, `=`) | `"#56b6c2"` |
| `punctuation` | Brackets, commas, etc. | `"#abb2bf"` |
| `attribute` | HTML/JSX attributes | `"#d19a66"` |
| `tag` | HTML/XML tags | `"#e06c75"` |
| `regexp` | Regular expressions | `"#56b6c2"` |
| `builtin` | Built-in types/functions | `"#e6c07b"` |
| `meta` | Meta/preprocessor directives | `"#5c6370"` |
| `property` | Object properties | `"#61afef"` |
| `constant` | Constants | `"#d19a66"` |

---

## `markdownPreview` (optional)

Controls the appearance of the markdown preview panel. Every property is optional and falls back to a sensible default.

### General

| Property | Description | Default |
|----------|-------------|---------|
| `background` | Preview background (overrides `editor.background`) | Editor background |
| `foreground` | Preview text color (overrides `editor.foreground`) | Editor foreground |
| `fontFamily` | Body font family | `inherit` |
| `fontSize` | Body font size | `inherit` |
| `lineHeight` | Body line height | `1.7` |
| `maxWidth` | Content max width | `900px` |
| `padding` | Container padding | `24px` |

### Links

| Property | Description | Default |
|----------|-------------|---------|
| `linkColor` | Link color | `#58a6ff` |
| `linkHoverColor` | Link hover color | Same as `linkColor` |
| `linkDecoration` | Link text decoration | `none` |

### Headings

Shared heading properties apply to all levels (h1-h6). Per-level overrides take priority.

| Property | Description | Default |
|----------|-------------|---------|
| `headingColor` | Default heading color | Editor foreground |
| `headingFontFamily` | Heading font family | `inherit` |
| `headingFontWeight` | Heading font weight | `600` |

#### Per-level overrides (`h1` through `h6`)

Each heading level can be individually customized with a nested object:

```json
"h1": {
  "color": "#ff6b6b",
  "fontSize": "2.5em",
  "fontWeight": "700",
  "borderBottom": "2px solid #ff6b6b"
},
"h2": {
  "color": "#ffd93d",
  "fontSize": "1.8em"
}
```

| Property | Description | Default (h1/h2/h3/h4/h5/h6) |
|----------|-------------|------|
| `color` | Text color | Inherits from `headingColor` |
| `fontSize` | Font size | `2em` / `1.5em` / `1.25em` / `1em` / `0.875em` / `0.85em` |
| `fontWeight` | Font weight | Inherits from `headingFontWeight` |
| `borderBottom` | Bottom border | `1px solid ...` (h1, h2 only) |
| `opacity` | Opacity | `1` (h6 defaults to `0.8`) |

### Blockquotes

| Property | Description | Default |
|----------|-------------|---------|
| `blockquoteBorder` | Left border color | `rgba(255, 255, 255, 0.2)` |
| `blockquoteBackground` | Background color | `rgba(255, 255, 255, 0.03)` |
| `blockquoteTextColor` | Text color | `inherit` |
| `blockquoteBorderWidth` | Left border width | `4px` |

### Code

#### Inline code

| Property | Description | Default |
|----------|-------------|---------|
| `codeInlineBg` | Background color | `rgba(255, 255, 255, 0.08)` |
| `codeInlineColor` | Text color | `inherit` |
| `codeInlineFontFamily` | Font family | `Consolas, Courier New, monospace` |

#### Code blocks

| Property | Description | Default |
|----------|-------------|---------|
| `codeBlockBg` | Background color | `rgba(0, 0, 0, 0.3)` |
| `codeBlockColor` | Default text color | `#abb2bf` |
| `codeBlockFontFamily` | Font family | `Consolas, Courier New, monospace` |
| `codeBlockBorderRadius` | Border radius | `6px` |

#### Code syntax highlighting (`codeSyntax`)

Controls syntax colors specifically in the markdown preview code blocks. Independent from the editor's `syntax` theme.

```json
"codeSyntax": {
  "keyword": "#c678dd",
  "string": "#98c379",
  "comment": "#5c6370",
  "number": "#d19a66",
  "function": "#61afef",
  "type": "#e6c07b",
  "attribute": "#d19a66",
  "builtin": "#e6c07b",
  "regexp": "#56b6c2",
  "variable": "#e06c75",
  "meta": "#5c6370",
  "tag": "#e06c75",
  "operator": "#56b6c2",
  "punctuation": "#abb2bf"
}
```

### Tables

| Property | Description | Default |
|----------|-------------|---------|
| `tableBorder` | Cell border color | `rgba(255, 255, 255, 0.12)` |
| `tableHeaderBackground` | Header row background | `rgba(255, 255, 255, 0.06)` |
| `tableHeaderColor` | Header text color | `inherit` |
| `tableRowEvenBg` | Even row background | `rgba(255, 255, 255, 0.02)` |
| `tableRowHoverBg` | Row hover background | `transparent` |

### Horizontal Rule

| Property | Description | Default |
|----------|-------------|---------|
| `hrColor` | Line color | `rgba(255, 255, 255, 0.15)` |
| `hrStyle` | Line style (`solid`, `dashed`, `dotted`) | `solid` |

### Lists

| Property | Description | Default |
|----------|-------------|---------|
| `listMarkerColor` | Bullet/number color | `inherit` |
| `taskListCheckColor` | Checkbox accent color | `#58a6ff` |

### Images

| Property | Description | Default |
|----------|-------------|---------|
| `imageBorderRadius` | Border radius | `4px` |
| `imageBorder` | Image border | `none` |

### KaTeX (Math)

| Property | Description | Default |
|----------|-------------|---------|
| `katexColor` | Math formula color | `inherit` |
| `katexFontSize` | Math formula size | `1.1em` |

### Emphasis

| Property | Description | Default |
|----------|-------------|---------|
| `strongColor` | **Bold** text color | `inherit` |
| `emphasisColor` | *Italic* text color | `inherit` |
| `strikethroughOpacity` | ~~Strikethrough~~ opacity | `0.6` |

### Admonitions

Admonitions are callout boxes used in markdown with the `::: type` syntax. See [Markdown](MARKDOWN.md) for usage.

#### Shared properties

```json
"admonitions": {
  "borderRadius": "6px",
  "borderWidth": "4px",
  "titleFontWeight": "600"
}
```

#### Built-in types

Five admonition types are available by default: `info`, `warning`, `danger`, `tip`, `note`.

Each can be customized:

```json
"admonitions": {
  "info": {
    "background": "rgba(33, 150, 243, 0.15)",
    "borderColor": "#2196f3",
    "titleColor": "#64b5f6",
    "textColor": "#bbdefb",
    "icon": "ℹ️"
  },
  "warning": {
    "background": "rgba(230, 167, 0, 0.15)",
    "borderColor": "#e6a700",
    "icon": "⚠️"
  }
}
```

| Property | Description |
|----------|-------------|
| `background` | Box background color |
| `borderColor` | Left border color |
| `titleColor` | Title text color |
| `textColor` | Body text color |
| `icon` | Icon (emoji or inline SVG string) |

#### Custom admonition types

You can define as many custom admonition types as you want using the `custom` key:

```json
"admonitions": {
  "custom": {
    "success": {
      "icon": "✅",
      "background": "rgba(0, 200, 83, 0.15)",
      "borderColor": "#00c853",
      "titleColor": "#69f0ae"
    },
    "example": {
      "icon": "📋",
      "background": "rgba(156, 39, 176, 0.15)",
      "borderColor": "#9c27b0"
    },
    "todo": {
      "icon": "📌",
      "background": "rgba(255, 152, 0, 0.15)",
      "borderColor": "#ff9800"
    }
  }
}
```

Custom admonitions work exactly like built-in ones in your markdown:

```markdown
::: success Deployment Complete
The application was deployed successfully.
:::

::: todo Sprint 12
- [ ] Fix login bug
- [ ] Add dark mode
:::
```

The `icon` property accepts:
- **Emoji**: `"icon": "🔨"` (simplest)
- **Inline SVG**: `"icon": "<svg viewBox='0 0 16 16' ...>...</svg>"` (for precise control)

---

## Full Example

A minimal custom theme overriding only markdown preview colors:

```json
{
  "name": "My Custom Theme",
  "editor": {
    "background": "#1a1b26",
    "foreground": "#c0caf5",
    "lineHighlight": "#292e42",
    "selection": "rgba(51, 59, 91, 0.5)",
    "cursor": "#c0caf5",
    "selectionMatch": "rgba(61, 89, 161, 0.4)"
  },
  "gutter": {
    "background": "#1a1b26",
    "foreground": "#3b4261",
    "border": "#292e42"
  },
  "ui": {
    "menuBar": "#1f2335",
    "tabBar": "#1f2335",
    "tabActive": "#1a1b26",
    "tabInactive": "#1f2335",
    "textColor": "#a9b1d6",
    "textSecondary": "#565f89",
    "textHoverColor": "#c0caf5",
    "textActiveColor": "#c0caf5",
    "background": "#1f2335",
    "border": "#292e42",
    "accent": "#7aa2f7",
    "accentHover": "#89b4fa",
    "accentPrimary": "#9ece6a",
    "accentPrimaryHover": "#b4e88d",
    "accentDanger": "#f7768e",
    "accentDangerHover": "#ff9e9e",
    "iconColor": "#565f89",
    "iconActiveColor": "#e0af68",
    "dirtyIndicator": "#9ece6a",
    "sidebarActive": "#1a1b26",
    "sidebarActiveBorder": "#7aa2f7"
  },
  "markdownPreview": {
    "linkColor": "#7aa2f7",
    "headingColor": "#c0caf5",
    "h1": { "color": "#bb9af7", "borderBottom": "1px solid rgba(187, 154, 247, 0.3)" },
    "codeBlockBg": "rgba(0, 0, 0, 0.4)",
    "codeSyntax": {
      "keyword": "#bb9af7",
      "string": "#9ece6a",
      "comment": "#565f89",
      "function": "#7aa2f7"
    },
    "admonitions": {
      "custom": {
        "example": {
          "icon": "📋",
          "background": "rgba(187, 154, 247, 0.12)",
          "borderColor": "#bb9af7"
        }
      }
    }
  }
}
```
