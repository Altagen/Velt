<script lang="ts">
  import { currentTheme } from '../../stores/themeStore';

  const shortcuts = [
    { category: 'File', items: [
      { keys: 'Ctrl+N', action: 'New file' },
      { keys: 'Ctrl+O', action: 'Open file' },
      { keys: 'Ctrl+S', action: 'Save file' },
      { keys: 'Ctrl+Shift+S', action: 'Save as' },
      { keys: 'Ctrl+W', action: 'Close tab' },
      { keys: 'Ctrl+Shift+N', action: 'New window' },
    ]},
    { category: 'Edit', items: [
      { keys: 'Ctrl+Z', action: 'Undo' },
      { keys: 'Ctrl+Y', action: 'Redo' },
      { keys: 'Ctrl+X', action: 'Cut' },
      { keys: 'Ctrl+C', action: 'Copy' },
      { keys: 'Ctrl+V', action: 'Paste' },
      { keys: 'Ctrl+A', action: 'Select all' },
      { keys: 'Ctrl+D', action: 'Duplicate line' },
      { keys: 'Ctrl+Shift+K', action: 'Delete line' },
      { keys: 'Alt+↑', action: 'Move line up' },
      { keys: 'Alt+↓', action: 'Move line down' },
      { keys: 'Ctrl+/', action: 'Toggle comment' },
      { keys: 'Tab', action: 'Indent' },
      { keys: 'Shift+Tab', action: 'Outdent' },
    ]},
    { category: 'Search', items: [
      { keys: 'Ctrl+F', action: 'Find' },
      { keys: 'Ctrl+H', action: 'Find & Replace' },
      { keys: 'F3', action: 'Find next' },
      { keys: 'Shift+F3', action: 'Find previous' },
      { keys: 'Ctrl+G', action: 'Go to line' },
    ]},
    { category: 'Text Transform', items: [
      { keys: 'Alt+U', action: 'UPPERCASE' },
      { keys: 'Alt+L', action: 'lowercase' },
      { keys: 'Alt+T', action: 'Title Case' },
      { keys: 'Alt+I', action: 'iNVERT cASE' },
      { keys: 'F9', action: 'Sort lines A→Z' },
      { keys: 'F10', action: 'Sort lines Z→A' },
      { keys: 'Ctrl+Shift+D', action: 'Remove duplicate lines' },
      { keys: 'Alt+W', action: 'Trim trailing spaces' },
      { keys: 'Alt+B', action: 'Remove blank lines' },
    ]},
    { category: 'Bookmarks', items: [
      { keys: 'Ctrl+M', action: 'Toggle bookmark' },
      { keys: 'F2', action: 'Next bookmark' },
      { keys: 'Shift+F2', action: 'Previous bookmark' },
      { keys: 'Ctrl+Shift+M', action: 'Clear all bookmarks' },
    ]},
    { category: 'View', items: [
      { keys: 'Ctrl++', action: 'Zoom in' },
      { keys: 'Ctrl+-', action: 'Zoom out' },
      { keys: 'Ctrl+0', action: 'Reset zoom' },
      { keys: 'F11', action: 'Convert to LF' },
      { keys: 'F12', action: 'Convert to CRLF' },
    ]},
  ];
</script>

<div class="shortcuts-section">
  <h3 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">Keyboard Shortcuts</h3>
  <p class="shortcuts-intro" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
    Quick reference for all available keyboard shortcuts.
  </p>

  <div class="shortcuts-grid">
    {#each shortcuts as category}
      <div
        class="shortcuts-category"
        style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
      >
        <h4 style="color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}">{category.category}</h4>
        <table class="shortcuts-table">
          <tbody>
            {#each category.items as shortcut}
              <tr>
                <td class="shortcut-keys" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
                  <kbd style="background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}">{shortcut.keys}</kbd>
                </td>
                <td class="shortcut-action" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">{shortcut.action}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/each}
  </div>
</div>

<style>
  .shortcuts-section {
    padding: 24px;
  }

  .shortcuts-section h3 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
  }

  .shortcuts-intro {
    margin: 0 0 24px 0;
    font-size: 14px;
  }

  .shortcuts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }

  .shortcuts-category {
    border: 1px solid;
    border-radius: 8px;
    padding: 16px;
  }

  .shortcuts-category h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .shortcuts-table {
    width: 100%;
    border-collapse: collapse;
  }

  .shortcuts-table tr {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  .shortcuts-table tr:last-child {
    border-bottom: none;
  }

  .shortcuts-table td {
    padding: 8px 0;
    vertical-align: middle;
  }

  .shortcut-keys {
    width: 120px;
  }

  .shortcut-keys kbd {
    display: inline-block;
    padding: 4px 8px;
    font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    border: 1px solid;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  }

  .shortcut-action {
    font-size: 13px;
    padding-left: 12px;
  }
</style>
