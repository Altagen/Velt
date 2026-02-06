# Velt

A modern, minimal code editor built with Tauri, Svelte, and TypeScript.

## Features

- **Multi-tab editing** with visual indicator for unsaved changes
- **Syntax highlighting** for 13+ languages:
  - JavaScript, TypeScript, HTML, CSS, JSON, Markdown
  - Python, Rust, C/C++, Java, PHP, XML, SQL
- **Automatic language detection** based on file extension
- **Native file dialogs** for open/save operations
- **Smart auto-save** with configurable debounce delay
- **Multi-encoding support** (UTF-8, UTF-16LE, UTF-16BE with BOM detection)
- **Find & Replace** with regex and case-sensitive options
- **Go to line** navigation
- **Bookmarks** for quick navigation
- **Line operations**: duplicate, delete, move up/down
- **Text transformations**: uppercase, lowercase, title case, sort lines
- **Customizable themes** with hot-reload support
- **Cross-platform**: Linux, macOS, Windows

## Tech Stack

- **Backend**: Rust with Tauri 2.x
- **Frontend**: Svelte 5 + TypeScript
- **Editor**: CodeMirror 6 (via [@altagen/velt-core](https://www.npmjs.com/package/@altagen/velt-core))
- **Build**: Vite

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- [Tauri prerequisites](https://tauri.app/v2/guides/prerequisites/)

### Setup

```bash
# Clone the repository
git clone https://github.com/Altagen/Velt.git
cd Velt

# Install dependencies
npm install
```

## Development

```bash
npm run tauri:dev
```

## Build

```bash
npm run tauri:build
```

Built packages will be available in `src-tauri/target/release/bundle/`.

## Keyboard Shortcuts

### File Operations
| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New file |
| `Ctrl+Shift+N` | New window |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save |
| `Ctrl+Shift+S` | Save as |
| `Ctrl+Alt+S` | Save all |
| `Ctrl+W` | Close tab |
| `F5` | Reload from disk |

### Editing
| Shortcut | Action |
|----------|--------|
| `Ctrl+D` | Duplicate line |
| `Ctrl+Shift+K` | Delete line |
| `Alt+Up/Down` | Move line up/down |
| `Ctrl+/` | Toggle comment |

### Search
| Shortcut | Action |
|----------|--------|
| `Ctrl+F` | Find |
| `Ctrl+H` | Find & Replace |
| `Ctrl+G` | Go to line |
| `F3` / `Shift+F3` | Find next/previous |

### Bookmarks
| Shortcut | Action |
|----------|--------|
| `Ctrl+M` | Toggle bookmark |
| `F2` / `Shift+F2` | Next/previous bookmark |
| `Ctrl+Shift+M` | Clear all bookmarks |

### Text Transform
| Shortcut | Action |
|----------|--------|
| `Alt+U` | UPPERCASE |
| `Alt+L` | lowercase |
| `Alt+T` | Title Case |
| `Alt+I` | iNVERT cASE |
| `F9` / `F10` | Sort lines A-Z / Z-A |
| `Ctrl+Shift+D` | Remove duplicate lines |
| `Alt+W` | Trim trailing spaces |
| `Alt+B` | Remove blank lines |

### View
| Shortcut | Action |
|----------|--------|
| `Ctrl++` / `Ctrl+-` | Zoom in/out |
| `Ctrl+0` | Reset zoom |
| `F11` | Convert to LF |
| `F12` | Convert to CRLF |

## Project Structure

```
velt/
├── src/                    # Frontend (Svelte)
│   ├── components/         # UI components
│   ├── stores/             # Svelte stores
│   ├── lib/                # Utilities
│   └── types/              # TypeScript types
├── src-tauri/              # Backend (Rust)
│   ├── src/
│   │   ├── main.rs         # CLI entry point
│   │   ├── lib.rs          # Tauri commands
│   │   └── config.rs       # Configuration management
│   └── tauri.conf.json     # Tauri configuration
└── package.json
```

## Configuration

Velt stores its configuration in:
- **Linux**: `~/.config/velt/`
- **macOS**: `~/Library/Application Support/com.altagen.velt/`
- **Windows**: `%APPDATA%\com.altagen.velt\`

Configuration includes:
- `config.json` - Application settings
- `current.json` - Current theme
- `themes/` - Custom themes directory
- `fonts/` - Imported fonts

## Environment Variables

Velt binaries are self-contained and work out of the box. All environment variables are **optional**.

| Variable | Description | Default |
|----------|-------------|---------|
| `VELT_CONFIG_HOME` | Custom configuration directory | Platform default (see above) |
| `GDK_BACKEND` | Graphics backend (Linux only) | `x11` on Wayland, native otherwise |

### Examples

**Custom config directory** (portable installation):
```bash
# Linux/macOS
VELT_CONFIG_HOME=~/my-velt-config velt

# Or export for the session
export VELT_CONFIG_HOME=~/my-velt-config
velt
```

**Force native Wayland** (Linux):
```bash
# By default, Velt uses X11 on Wayland for better WebKit compatibility
# To use native Wayland (experimental):
GDK_BACKEND=wayland velt
```

**Persistent environment variable** (Linux):
```bash
# Add to ~/.bashrc or ~/.zshrc
export VELT_CONFIG_HOME="$HOME/.config/velt-custom"
```

### Notes

- On **Wayland**, Velt defaults to X11 backend (`GDK_BACKEND=x11`) for better compatibility with WebKit2GTK. You can override this if native Wayland works on your system.
- The `VELT_CONFIG_HOME` variable is useful for portable installations or testing with different configurations.
- All settings configured via the UI are saved in the config directory and do not require environment variables.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - How Velt is structured
- [Security](docs/SECURITY.md) - Security model and practices
- [Font System](docs/FONTS.md) - Font configuration and import

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on [GitHub](https://github.com/Altagen/Velt).
