<script lang="ts">
  import { currentTheme } from '../../stores/themeStore';
  import { settings } from '../../stores/appStore';

  function toggleAutoSave() {
    settings.update(s => ({ ...s, autoSave: !s.autoSave }));
  }

  function updateAutoSaveDelay(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value);
    if (!isNaN(value) && value >= 100) {
      settings.update(s => ({ ...s, autoSaveDelay: value }));
    }
  }

  function incrementDelay() {
    settings.update(s => ({ ...s, autoSaveDelay: s.autoSaveDelay + 100 }));
  }

  function decrementDelay() {
    settings.update(s => ({ ...s, autoSaveDelay: Math.max(100, s.autoSaveDelay - 100) }));
  }
</script>

<div
  class="setting-card"
  style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
>
  <div class="setting-card-header">
    <div class="setting-info">
      <h5 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
        Enable Auto-Save
      </h5>
      <p style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
        Automatically save changes to files after a delay
      </p>
    </div>
    <label class="toggle-switch">
      <input
        type="checkbox"
        checked={$settings.autoSave}
        on:change={toggleAutoSave}
      />
      <span class="toggle-slider" style="--toggle-bg: {$currentTheme?.ui?.border || '#3e3e42'}; --toggle-active: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"></span>
    </label>
  </div>

  {#if $settings.autoSave}
    <div
      class="setting-card-footer"
      style="background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
    >
      <label style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
        Delay (ms):
      </label>
      <div class="number-control">
        <button
          class="number-btn"
          on:click={decrementDelay}
          style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}"
          title="Decrease delay"
        >
          −
        </button>
        <input
          type="text"
          inputmode="numeric"
          value={$settings.autoSaveDelay}
          on:input={updateAutoSaveDelay}
          class="number-input"
          style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}"
          readonly
        />
        <button
          class="number-btn"
          on:click={incrementDelay}
          style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}"
          title="Increase delay"
        >
          +
        </button>
      </div>
    </div>
  {/if}
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

  .setting-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    border-top: 1px solid;
    gap: 12px;
  }

  .setting-card-footer label {
    font-size: 13px;
    font-weight: 500;
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

  .number-control {
    display: flex;
    align-items: center;
    gap: 0;
  }

  .number-btn {
    width: 32px;
    height: 32px;
    border: 1px solid;
    background-color: transparent;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .number-btn:first-child {
    border-radius: 4px 0 0 4px;
    border-right: none;
  }

  .number-btn:last-child {
    border-radius: 0 4px 4px 0;
    border-left: none;
  }

  .number-btn:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .number-btn:active {
    background-color: rgba(255, 255, 255, 0.1);
    transform: scale(0.95);
  }

  .number-input {
    width: 80px;
    height: 32px;
    padding: 0;
    border: 1px solid;
    border-left: none;
    border-right: none;
    font-size: 13px;
    font-family: 'Consolas', 'Monaco', monospace;
    text-align: center;
    transition: border-color 0.2s;
    cursor: default;
  }

  .number-input:focus {
    outline: none;
  }

  .number-input::-webkit-inner-spin-button,
  .number-input::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
</style>
