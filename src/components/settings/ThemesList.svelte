<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { currentTheme, reloadCurrentTheme } from '../../stores/themeStore';
  import { getTheme, getConfig, saveConfig } from '../../lib/theme';
  import { invoke } from '@tauri-apps/api/core';
  import type { Theme } from '@altagen/velt-core';

  const dispatch = createEventDispatcher<{
    error: string;
    success: string;
    view: string;
    edit: string;
    create: void;
  }>();

  export let defaultThemes: string[];
  export let customThemes: string[];
  export let favoriteThemes: string[];
  export let sortedFavorites: string[];
  export let defaultThemeName: string;
  export let activeThemeName: string;

  function getDisplayName(themeName: string): string {
    if (themeName === 'default-dark') return 'Default Dark';
    if (themeName === 'default-light') return 'Default Light';
    return themeName.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  function toggleFavorite(themeName: string) {
    if (favoriteThemes.includes(themeName)) {
      favoriteThemes = favoriteThemes.filter(name => name !== themeName);
    } else {
      favoriteThemes = [...favoriteThemes, themeName];
    }
    localStorage.setItem('velt-favorite-themes', JSON.stringify(favoriteThemes));
  }

  async function setAsStartupTheme(themeName: string) {
    try {
      const config = await getConfig();
      config.theme = themeName;
      await saveConfig(config);
      defaultThemeName = themeName;
      dispatch('success', `"${getDisplayName(themeName)}" will load on startup`);
    } catch (error) {
      console.error('Failed to set startup theme:', error);
      dispatch('error', `Failed to set startup theme: ${error}`);
    }
  }

  async function applyTheme(themeName: string) {
    try {
      const theme = await getTheme(themeName);
      await invoke('save_current_theme', { theme });
      currentTheme.set(theme);
      await reloadCurrentTheme();
      activeThemeName = theme.name;
      dispatch('success', `Applied theme: ${themeName}`);
    } catch (error) {
      console.error('Failed to apply theme:', error);
      dispatch('error', `Failed to apply theme: ${error}`);
    }
  }

  async function deleteCustomTheme(themeName: string, event: Event) {
    event.stopPropagation();

    if (!confirm(`Are you sure you want to delete the theme "${themeName}"?`)) {
      return;
    }

    try {
      await invoke('delete_theme', { themeName });
      if (favoriteThemes.includes(themeName)) {
        toggleFavorite(themeName);
      }
      dispatch('success', `Theme "${themeName}" deleted`);
    } catch (error) {
      console.error('Failed to delete theme:', error);
      dispatch('error', `Failed to delete theme: ${error}`);
    }
  }
</script>

<div class="themes-list">
  <div class="section-header">
    <h3 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">Themes</h3>
    <button
      class="btn btn-primary"
      on:click={() => dispatch('create')}
      style="background-color: {$currentTheme?.ui?.accent || '#0e639c'}; color: {$currentTheme?.editor?.background || '#ffffff'}"
    >
      + New Theme
    </button>
  </div>

  <!-- Built-in Themes -->
  <div class="themes-section">
    <h4 style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Built-in Themes</h4>
    <div class="theme-grid">
      {#each defaultThemes as themeName}
        <div
          class="theme-card"
          class:active={activeThemeName.toLowerCase().includes(themeName.split('-')[1])}
          style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
        >
          <div class="theme-card-main">
            <div class="theme-info">
              <span class="theme-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">{getDisplayName(themeName)}</span>
              <div class="theme-badges">
                {#if defaultThemeName === themeName}
                  <span class="theme-badge default">Startup</span>
                {/if}
                <span class="theme-badge builtin">Built-in</span>
              </div>
            </div>
            <button
              class="icon-btn"
              class:active={favoriteThemes.includes(themeName)}
              on:click={(e) => {
                e.stopPropagation();
                toggleFavorite(themeName);
              }}
              title={favoriteThemes.includes(themeName) ? "Remove from favorites" : "Add to favorites"}
              style="--icon-color: {$currentTheme?.ui?.iconColor || '#858585'}; --icon-active-color: {$currentTheme?.ui?.iconActiveColor || '#ffd700'}; color: {favoriteThemes.includes(themeName) ? ($currentTheme?.ui?.iconActiveColor || '#ffd700') : ($currentTheme?.ui?.iconColor || '#858585')}"
            >
              {favoriteThemes.includes(themeName) ? '★' : '☆'}
            </button>
          </div>
          <div
            class="theme-actions-bar"
            style="background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
          >
            <button
              class="action-link primary"
              on:click={(e) => {
                e.stopPropagation();
                applyTheme(themeName);
              }}
              style="--accent-primary: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}; --accent-primary-hover: {$currentTheme?.ui?.accentPrimaryHover || '#00ffcc'}; color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"
            >
              Apply Theme
            </button>
            <button
              class="action-link"
              on:click={(e) => {
                e.stopPropagation();
                dispatch('view', themeName);
              }}
              style="--accent: {$currentTheme?.ui?.accent || '#4a9eff'}; --accent-hover: {$currentTheme?.ui?.accentHover || '#6eb4ff'}; color: {$currentTheme?.ui?.accent || '#4a9eff'}"
            >
              View Theme
            </button>
            {#if themeName !== defaultThemeName}
              <button
                class="action-link"
                on:click={(e) => {
                  e.stopPropagation();
                  setAsStartupTheme(themeName);
                }}
                style="--accent: {$currentTheme?.ui?.accent || '#4a9eff'}; --accent-hover: {$currentTheme?.ui?.accentHover || '#6eb4ff'}; color: {$currentTheme?.ui?.accent || '#4a9eff'}"
              >
                Set Default
              </button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Custom Themes -->
  {#if customThemes.length > 0}
    <div class="themes-section">
      <h4 style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Custom Themes</h4>
      <div class="theme-grid">
        <!-- Favorites first -->
        {#each sortedFavorites.filter(name => customThemes.includes(name)) as themeName}
          <div
            class="theme-card"
            class:active={activeThemeName === themeName}
            style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
          >
            <div class="theme-card-main">
              <div class="theme-info">
                <span class="theme-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">{getDisplayName(themeName)}</span>
                <div class="theme-badges">
                  {#if defaultThemeName === themeName}
                    <span class="theme-badge default">Startup</span>
                  {/if}
                  <span class="theme-badge custom">Custom</span>
                </div>
              </div>
              <button
                class="icon-btn active"
                on:click={(e) => {
                  e.stopPropagation();
                  toggleFavorite(themeName);
                }}
                title="Remove from favorites"
                style="--icon-color: {$currentTheme?.ui?.iconColor || '#858585'}; --icon-active-color: {$currentTheme?.ui?.iconActiveColor || '#ffd700'}; color: {$currentTheme?.ui?.iconActiveColor || '#ffd700'}"
              >
                ★
              </button>
            </div>
            <div
              class="theme-actions-bar"
              style="background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
            >
              <button
                class="action-link primary"
                on:click={(e) => {
                  e.stopPropagation();
                  applyTheme(themeName);
                }}
                style="--accent-primary: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}; --accent-primary-hover: {$currentTheme?.ui?.accentPrimaryHover || '#00ffcc'}; color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"
              >
                Apply Theme
              </button>
              <button
                class="action-link"
                on:click={(e) => {
                  e.stopPropagation();
                  dispatch('edit', themeName);
                }}
                style="--accent: {$currentTheme?.ui?.accent || '#4a9eff'}; --accent-hover: {$currentTheme?.ui?.accentHover || '#6eb4ff'}; color: {$currentTheme?.ui?.accent || '#4a9eff'}"
              >
                Edit
              </button>
              {#if themeName !== defaultThemeName}
                <button
                  class="action-link"
                  on:click={(e) => {
                    e.stopPropagation();
                    setAsStartupTheme(themeName);
                  }}
                  style="--accent: {$currentTheme?.ui?.accent || '#4a9eff'}; --accent-hover: {$currentTheme?.ui?.accentHover || '#6eb4ff'}; color: {$currentTheme?.ui?.accent || '#4a9eff'}"
                >
                  Set Default
                </button>
              {/if}
              <button
                class="action-link danger"
                on:click={(e) => deleteCustomTheme(themeName, e)}
                style="--accent-danger: {$currentTheme?.ui?.accentDanger || '#f48771'}; --accent-danger-hover: {$currentTheme?.ui?.accentDangerHover || '#ff9b87'}; color: {$currentTheme?.ui?.accentDanger || '#f48771'}"
              >
                Delete
              </button>
            </div>
          </div>
        {/each}
        <!-- Non-favorite themes -->
        {#each customThemes.filter(name => !sortedFavorites.includes(name)) as themeName}
          <div
            class="theme-card"
            class:active={activeThemeName === themeName}
            style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
          >
            <div class="theme-card-main">
              <div class="theme-info">
                <span class="theme-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">{getDisplayName(themeName)}</span>
                <div class="theme-badges">
                  {#if defaultThemeName === themeName}
                    <span class="theme-badge default">Startup</span>
                  {/if}
                  <span class="theme-badge custom">Custom</span>
                </div>
              </div>
              <button
                class="icon-btn"
                on:click={(e) => {
                  e.stopPropagation();
                  toggleFavorite(themeName);
                }}
                title="Add to favorites"
                style="--icon-color: {$currentTheme?.ui?.iconColor || '#858585'}; --icon-active-color: {$currentTheme?.ui?.iconActiveColor || '#ffd700'}; color: {$currentTheme?.ui?.iconColor || '#858585'}"
              >
                ☆
              </button>
            </div>
            <div
              class="theme-actions-bar"
              style="background-color: {$currentTheme?.ui?.menuBar || '#2d2d30'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
            >
              <button
                class="action-link primary"
                on:click={(e) => {
                  e.stopPropagation();
                  applyTheme(themeName);
                }}
                style="--accent-primary: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}; --accent-primary-hover: {$currentTheme?.ui?.accentPrimaryHover || '#00ffcc'}; color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}"
              >
                Apply Theme
              </button>
              <button
                class="action-link"
                on:click={(e) => {
                  e.stopPropagation();
                  dispatch('edit', themeName);
                }}
                style="--accent: {$currentTheme?.ui?.accent || '#4a9eff'}; --accent-hover: {$currentTheme?.ui?.accentHover || '#6eb4ff'}; color: {$currentTheme?.ui?.accent || '#4a9eff'}"
              >
                Edit
              </button>
              {#if themeName !== defaultThemeName}
                <button
                  class="action-link"
                  on:click={(e) => {
                    e.stopPropagation();
                    setAsStartupTheme(themeName);
                  }}
                  style="--accent: {$currentTheme?.ui?.accent || '#4a9eff'}; --accent-hover: {$currentTheme?.ui?.accentHover || '#6eb4ff'}; color: {$currentTheme?.ui?.accent || '#4a9eff'}"
                >
                  Set Default
                </button>
              {/if}
              <button
                class="action-link danger"
                on:click={(e) => deleteCustomTheme(themeName, e)}
                style="--accent-danger: {$currentTheme?.ui?.accentDanger || '#f48771'}; --accent-danger-hover: {$currentTheme?.ui?.accentDangerHover || '#ff9b87'}; color: {$currentTheme?.ui?.accentDanger || '#f48771'}"
              >
                Delete
              </button>
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .section-header h3 {
    margin: 0;
    font-size: 16px;
    color: #d4d4d4;
  }

  .themes-section {
    margin-bottom: 32px;
  }

  .themes-section h4 {
    margin: 0 0 12px 0;
    font-size: 13px;
    color: #858585;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .theme-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .theme-card {
    background-color: #1e1e1e;
    border: 2px solid #3e3e42;
    border-radius: 6px;
    padding: 0;
    display: flex;
    flex-direction: column;
    transition: all 0.15s ease;
  }

  .theme-card:hover {
    border-color: #4a4a4a;
  }

  .theme-card.active {
    border-color: #0e639c;
    background-color: #1a3a52;
  }

  .theme-card-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
  }

  .theme-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .theme-name {
    color: #d4d4d4;
    font-size: 14px;
    font-weight: 500;
  }

  .theme-badges {
    display: flex;
    gap: 6px;
  }

  .theme-badge {
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }

  .theme-badge.builtin {
    background-color: #094771;
    color: #87cefa;
  }

  .theme-badge.custom {
    background-color: #7a3e9d;
    color: #e0b0ff;
  }

  .theme-badge.default {
    background-color: #1a5c1a;
    color: #90ee90;
  }

  .icon-btn {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    padding: 4px 8px;
    transition: color 0.1s;
  }

  .icon-btn:hover {
    color: var(--icon-active-color, #ffd700) !important;
  }

  .theme-actions-bar {
    display: flex;
    gap: 16px;
    padding: 10px 16px;
    border-top: 1px solid #3e3e42;
    background-color: rgba(0, 0, 0, 0.2);
  }

  .action-link {
    background: none;
    border: none;
    font-size: 12px;
    cursor: pointer;
    padding: 0;
    text-decoration: none;
    transition: color 0.1s;
  }

  .action-link:hover {
    color: var(--accent-hover, #6eb4ff) !important;
    text-decoration: underline;
  }

  .action-link.primary {
    font-weight: 600;
  }

  .action-link.primary:hover {
    color: var(--accent-primary-hover, #00ffcc) !important;
  }

  .action-link.danger:hover {
    color: var(--accent-danger-hover, #ff9b87) !important;
  }

  .btn {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.1s;
  }

  .btn-primary {
    background-color: #0e639c;
    color: white;
  }

  .btn-primary:hover {
    background-color: #1177bb;
  }
</style>
