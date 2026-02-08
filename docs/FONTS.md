# Font System

Velt implements a hybrid font system that works in all scenarios.

## Overview

The application automatically detects your operating system and selects the best native monospace fonts.

### Platform-Specific Fonts

**macOS**
```
SF Mono, Monaco, Menlo, Consolas, "Courier New", monospace
```

**Windows**
```
Consolas, "Cascadia Mono", "Courier New", monospace
```

**Linux**
```
"Cascadia Code", "Liberation Mono", "DejaVu Sans Mono", "Ubuntu Mono", Consolas, monospace
```

## Font Sources

### 1. Bundled Fonts

Popular coding fonts are bundled via `@fontsource`:
- Fira Code
- JetBrains Mono
- Source Code Pro
- Cascadia Code
- Ubuntu Mono

### 2. System Fonts

Detected via platform commands:
- **Linux**: `fc-list`
- **macOS**: `system_profiler SPFontsDataType`
- **Windows**: PowerShell font enumeration

### 3. Imported Fonts

Users can import custom fonts:

1. **Settings > General > Import Fonts**
2. Select `.ttf`, `.otf`, `.woff`, or `.woff2` files
3. Fonts are stored in `~/.config/velt/fonts/`
4. `@font-face` rules are generated automatically

## Configuration

### Settings Location

- **Linux**: `~/.config/velt/fonts/`
- **macOS**: `~/Library/Application Support/velt/fonts/`
- **Windows**: `%APPDATA%\velt\fonts\`

### Custom Font Format

```
"Font Name", "Fallback 1", "Fallback 2", monospace
```

Examples:
- `"Fira Code", monospace`
- `"JetBrains Mono", "Consolas", monospace`

## Sandbox Support (Flatpak)

When running in a sandboxed environment where system font detection fails:

1. Import fonts manually via Settings
2. Fonts are stored in the app's config directory
3. No system-level permissions required

## API

### Rust Commands

```rust
list_system_fonts() -> Result<Vec<String>, String>
import_font(source_path: String) -> Result<ImportedFont, String>
list_imported_fonts() -> Result<Vec<ImportedFont>, String>
delete_imported_font(filename: String) -> Result<(), String>
```

### TypeScript Functions

```typescript
loadImportedFonts(): Promise<ImportedFont[]>
reloadImportedFonts(): Promise<ImportedFont[]>
getDefaultMonospaceFont(): string
```
