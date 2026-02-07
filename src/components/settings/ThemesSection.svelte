<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { currentTheme } from '../../stores/themeStore';
  import { listThemes, getTheme, getConfig } from '../../lib/theme';
  import { invoke } from '@tauri-apps/api/core';
  import type { Theme } from '@altagen/velt-core';
  import ThemesList from './ThemesList.svelte';
  import ThemeEditor from './ThemeEditor.svelte';
  import ThemeCreator from './ThemeCreator.svelte';

  const dispatch = createEventDispatcher<{ error: string; success: string }>();

  type ThemeView = 'list' | 'edit' | 'create';

  let themeView: ThemeView = 'list';

  // Themes data
  let availableThemes: string[] = [];
  let defaultThemes = ['default-dark', 'default-light'];
  let customThemes: string[] = [];
  let favoriteThemes: string[] = [];
  let defaultThemeName = 'default-dark';
  let activeThemeName = '';

  // Editor state
  let themeJson = '';
  let editingThemeName = '';
  let isLoading = false;
  let isReadOnly = false;
  let errorMessage = '';
  let successMessage = '';

  $: sortedFavorites = [...favoriteThemes].sort((a, b) => a.localeCompare(b));

  export async function loadThemesList() {
    try {
      availableThemes = await listThemes();
      customThemes = availableThemes
        .filter(name => !defaultThemes.includes(name) && name !== 'current')
        .sort((a, b) => a.localeCompare(b));

      const config = await getConfig();
      defaultThemeName = config.theme || 'default-dark';

      try {
        const currentThemeData = await invoke<Theme>('get_current_theme');
        activeThemeName = currentThemeData.name || '';
      } catch {
        activeThemeName = '';
      }
    } catch (error) {
      console.error('Failed to load themes list:', error);
      dispatch('error', `Failed to load themes: ${error}`);
    }
  }

  export function loadFavorites() {
    try {
      const favorites = localStorage.getItem('velt-favorite-themes');
      if (favorites) {
        favoriteThemes = JSON.parse(favorites);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  }

  async function viewTheme(event: CustomEvent<string>) {
    const themeName = event.detail;
    try {
      isLoading = true;
      editingThemeName = themeName;
      isReadOnly = true;
      const theme = await getTheme(themeName);
      themeJson = JSON.stringify(theme, null, 2);
      themeView = 'edit';
      isLoading = false;
    } catch (error) {
      console.error('Failed to load theme for viewing:', error);
      dispatch('error', `Failed to load theme: ${error}`);
      isLoading = false;
    }
  }

  async function editTheme(event: CustomEvent<string>) {
    const themeName = event.detail;
    try {
      isLoading = true;
      editingThemeName = themeName;
      isReadOnly = false;
      const theme = await getTheme(themeName);
      themeJson = JSON.stringify(theme, null, 2);
      themeView = 'edit';
      isLoading = false;
    } catch (error) {
      console.error('Failed to load theme for editing:', error);
      dispatch('error', `Failed to load theme: ${error}`);
      isLoading = false;
    }
  }

  function createNewTheme() {
    isReadOnly = false;
    themeJson = JSON.stringify({
      name: "New Theme",
      editor: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        lineHighlight: "#2d2d30",
        selection: "rgba(58, 110, 165, 0.3)",
        cursor: "#ffffff",
        selectionMatch: "rgba(100, 200, 100, 0.3)"
      },
      gutter: {
        background: "#1e1e1e",
        foreground: "#858585",
        border: "#3e3e42"
      },
      ui: {
        menuBar: "#2d2d30",
        tabBar: "#2d2d30",
        tabActive: "#1e1e1e",
        tabInactive: "#2d2d30",
        textColor: "#cccccc",
        textHoverColor: "#ffffff",
        textActiveColor: "#ffffff",
        background: "#252526",
        border: "#3e3e42",
        accent: "#4a9eff",
        accentHover: "#6eb4ff",
        accentPrimary: "#00d4aa",
        accentPrimaryHover: "#00ffcc",
        accentDanger: "#f48771",
        accentDangerHover: "#ff9b87",
        iconColor: "#858585",
        iconActiveColor: "#ffd700"
      }
    }, null, 2);
    themeView = 'create';
  }

  function handleBack() {
    themeView = 'list';
    editingThemeName = '';
    isReadOnly = false;
    errorMessage = '';
    successMessage = '';
    loadThemesList();
  }

  function handleError(event: CustomEvent<string>) {
    errorMessage = event.detail;
    dispatch('error', event.detail);
  }

  function handleSuccess(event: CustomEvent<string>) {
    successMessage = event.detail;
    dispatch('success', event.detail);
  }

  function handleListSuccess(event: CustomEvent<string>) {
    dispatch('success', event.detail);
    // Reload the list after delete
    loadThemesList();
  }

  export function resetView() {
    themeView = 'list';
    editingThemeName = '';
    isReadOnly = false;
    errorMessage = '';
    successMessage = '';
  }

  export function isInSubView(): boolean {
    return themeView !== 'list';
  }

  export function goBackToList() {
    handleBack();
  }
</script>

{#if themeView === 'list'}
  <ThemesList
    {defaultThemes}
    bind:customThemes
    bind:favoriteThemes
    {sortedFavorites}
    bind:defaultThemeName
    bind:activeThemeName
    on:view={viewTheme}
    on:edit={editTheme}
    on:create={createNewTheme}
    on:error={handleError}
    on:success={handleListSuccess}
  />
{:else if themeView === 'edit'}
  <ThemeEditor
    {editingThemeName}
    bind:themeJson
    {isReadOnly}
    {isLoading}
    {defaultThemes}
    on:back={handleBack}
    on:error={handleError}
    on:success={handleSuccess}
  />
{:else if themeView === 'create'}
  <ThemeCreator
    bind:themeJson
    {errorMessage}
    {successMessage}
    on:back={handleBack}
    on:error={handleError}
    on:success={handleSuccess}
  />
{/if}
