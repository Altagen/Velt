# Architecture

## Overview

Velt is built with a clear separation between the reusable editor library and the desktop application.

```
┌─────────────────────────────────────────────────────────┐
│                    Velt Application                      │
│  ┌─────────────────┐  ┌─────────────────────────────┐   │
│  │   Frontend      │  │      Backend (Rust)         │   │
│  │   (Svelte 5)    │  │      (Tauri 2.x)            │   │
│  │                 │  │                             │   │
│  │  - Components   │  │  - File I/O                 │   │
│  │  - Stores       │  │  - Encoding detection       │   │
│  │  - UI/UX        │  │  - Config management        │   │
│  │                 │  │  - Font enumeration         │   │
│  └────────┬────────┘  └─────────────────────────────┘   │
│           │                                              │
│           ▼                                              │
│  ┌─────────────────┐                                     │
│  │   @altagen/     │                                     │
│  │   velt-core     │  ← npm package (framework-agnostic) │
│  │                 │                                     │
│  │  - VeltEditor   │                                     │
│  │  - Languages    │                                     │
│  │  - Themes       │                                     │
│  │  - Utilities    │                                     │
│  └─────────────────┘                                     │
└─────────────────────────────────────────────────────────┘
```

## Components

### @altagen/velt-core

A framework-agnostic CodeMirror 6 wrapper published on npm. Contains:

- **VeltEditor**: Main editor class with all text operations
- **Languages**: Syntax highlighting for 13+ languages
- **Themes**: Dynamic theming system
- **Utilities**: debounce, throttle, file helpers

No Tauri dependencies - can be used in any web project.

### Frontend (Svelte 5)

- **App.svelte**: Main application shell
- **Editor.svelte**: Editor wrapper with tab management
- **MenuBar.svelte**: File operations menu
- **TabBar.svelte**: Multi-tab interface
- **StatusBar.svelte**: File info display
- **SettingsModal.svelte**: Configuration UI

State is managed via Svelte stores in `src/stores/`.

### Backend (Rust)

- **lib.rs**: Tauri commands for file operations
- **config.rs**: Configuration and theme management
- **main.rs**: CLI entry point with argument parsing

## Key Features

### Multi-Encoding Support

The Rust backend uses `encoding_rs` to handle:
- UTF-8 (default)
- UTF-8 with BOM
- UTF-16LE/BE
- Windows-1252 (ANSI)

BOM detection is automatic on file open.

### Theme System

Themes are stored as JSON in the config directory:
- `~/.config/velt/current.json` - Active theme
- `~/.config/velt/themes/` - Custom themes

Hot-reload is supported via the Settings modal.

### Auto-Save

Configurable debounced auto-save (default: 1 second) prevents data loss while avoiding excessive disk writes.

## Build System

The project uses [Task](https://taskfile.dev/) for consistent builds:

```bash
task dev        # Start development server
task build      # Production build
task lint       # Run all linters
task fmt        # Format code
```

See `Taskfile.yaml` for all available tasks.
