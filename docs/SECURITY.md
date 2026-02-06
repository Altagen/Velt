# Security

This document describes Velt's security model and best practices.

## Security Model

### Tauri Permissions (Minimal)

```json
{
  "permissions": [
    "dialog:default",
    "dialog:allow-save",
    "dialog:allow-open",
    "dialog:allow-message",
    "core:default",
    "core:window:allow-set-title"
  ]
}
```

- No network access
- No uncontrolled shell execution
- No global file system access
- Only what's strictly necessary

### Rust Backend

- No `unsafe` blocks
- `std::fs` handles path validation
- `encoding_rs` is a safe library
- No system command execution
- No unvalidated deserialization

### Frontend

- No `eval()` or `new Function()`
- No `innerHTML` with user content
- CodeMirror handles escaping
- Svelte auto-escapes by default
- No XSS vulnerabilities

### Content Security Policy

```
default-src 'self';
script-src 'self' 'wasm-unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'none'
```

- Blocks all external network access
- Prevents script injection
- Compatible with Tauri + CodeMirror

## Encoding Safety

- `encoding_rs` validates all bytes
- Explicit error handling (`had_errors`)
- No buffer overflow possible

## Dependency Management

Security audits are automated via GitHub Actions:

- **npm audit**: Weekly checks for npm vulnerabilities
- **cargo audit**: Weekly checks for Rust vulnerabilities
- **cargo deny**: License and advisory checks
- **CodeQL**: Static analysis for TypeScript

## Reporting Vulnerabilities

Please report security vulnerabilities by opening an issue on [GitHub](https://github.com/Altagen/Velt/issues).
