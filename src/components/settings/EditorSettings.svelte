<script lang="ts">
  import { currentTheme } from '../../stores/themeStore';
  import { settings } from '../../stores/appStore';

  function updateTabSize(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = parseInt(target.value);
    settings.update(s => ({ ...s, tabSize: value }));
  }

  function toggleWordWrap() {
    settings.update(s => ({ ...s, wordWrap: !s.wordWrap }));
  }

  function toggleShowInvisibles() {
    settings.update(s => ({ ...s, showInvisibles: !s.showInvisibles }));
  }
</script>

<!-- Tab Size -->
<div
  class="setting-card"
  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
>
  <div class="setting-card-header">
    <div class="setting-info">
      <h5 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
        Tab Size
      </h5>
      <p style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
        Number of spaces per tab
      </p>
    </div>
    <select
      class="tab-size-select"
      value={$settings.tabSize}
      on:change={updateTabSize}
      style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}"
    >
      <option value={2}>2 spaces</option>
      <option value={4}>4 spaces</option>
      <option value={8}>8 spaces</option>
    </select>
  </div>
</div>

<!-- Word Wrap -->
<div
  class="setting-card"
  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
>
  <div class="setting-card-header">
    <div class="setting-info">
      <h5 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
        Word Wrap
      </h5>
      <p style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
        Wrap long lines to fit within the editor
      </p>
    </div>
    <label class="toggle-switch">
      <input
        type="checkbox"
        checked={$settings.wordWrap}
        on:change={toggleWordWrap}
      />
      <span class="toggle-slider" style="--toggle-bg: {$currentTheme?.ui?.border || '#3e3e42'}; --toggle-active: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"></span>
    </label>
  </div>
</div>

<!-- Show Invisibles -->
<div
  class="setting-card"
  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
>
  <div class="setting-card-header">
    <div class="setting-info">
      <h5 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
        Show Invisibles
      </h5>
      <p style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
        Display whitespace characters (spaces, tabs)
      </p>
    </div>
    <label class="toggle-switch">
      <input
        type="checkbox"
        checked={$settings.showInvisibles}
        on:change={toggleShowInvisibles}
      />
      <span class="toggle-slider" style="--toggle-bg: {$currentTheme?.ui?.border || '#3e3e42'}; --toggle-active: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"></span>
    </label>
  </div>
</div>

<style>
  .setting-card {
    border: 1px solid;
    border-radius: 6px;
    overflow: visible;
    margin-bottom: 16px;
    transition: border-color 0.2s;
  }

  .setting-card:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  .setting-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    gap: 20px;
  }

  .setting-info {
    flex: 1;
  }

  .setting-info h5 {
    margin: 0 0 6px 0;
    font-size: 15px;
    font-weight: 600;
  }

  .setting-info p {
    margin: 0;
    font-size: 13px;
    line-height: 1.4;
  }

  .tab-size-select {
    min-width: 180px;
    height: 32px;
    padding: 4px 12px;
    border: 1px solid;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.2s, background-color 0.2s;
  }

  .tab-size-select:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .tab-size-select:focus {
    outline: none;
    border-color: var(--accent-color, #00d4aa);
  }

  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 26px;
    flex-shrink: 0;
  }

  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--toggle-bg);
    transition: 0.3s;
    border-radius: 26px;
  }

  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }

  input:checked + .toggle-slider {
    background-color: var(--toggle-active);
  }

  input:checked + .toggle-slider:before {
    transform: translateX(22px);
  }

  .toggle-slider:hover {
    opacity: 0.9;
  }
</style>
