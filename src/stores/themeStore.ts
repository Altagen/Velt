import { writable, get } from 'svelte/store';
import type { Theme } from '@altagen/velt-core';
import { loadCurrentTheme, getTheme, setCurrentTheme as saveTheme } from '../lib/theme';
import { listen } from '@tauri-apps/api/event';

// Store for the current theme
export const currentTheme = writable<Theme | null>(null);

// Flag to track if theme watcher is initialized
let watcherInitialized = false;

/**
 * Initialize the theme system
 */
export async function initializeTheme(): Promise<void> {
  try {
    console.log('[ThemeStore] Initializing theme...');
    const theme = await loadCurrentTheme();
    console.log('[ThemeStore] Loaded theme:', theme);
    currentTheme.set(theme);
    console.log('[ThemeStore] Theme set successfully');
  } catch (error) {
    console.error('[ThemeStore] Failed to load theme:', error);
  }
}

/**
 * Change the current theme
 */
export async function setCurrentTheme(themeName: string): Promise<void> {
  try {
    const theme = await getTheme(themeName);
    currentTheme.set(theme);
    await saveTheme(themeName);
  } catch (error) {
    console.error('Failed to set theme:', error);
    throw error;
  }
}

/**
 * Reload the current theme (useful for hot-reload)
 */
export async function reloadCurrentTheme(): Promise<void> {
  try {
    const theme = await loadCurrentTheme();
    currentTheme.set(theme);
  } catch (error) {
    console.error('Failed to reload theme:', error);
  }
}

/**
 * Initialize theme file watcher for hot-reload
 * This watches for changes in theme JSON files and automatically reloads
 * NOTE: File watching will be implemented later. For now, hot-reload works via reactive statements.
 */
export async function initializeThemeWatcher(): Promise<void> {
  if (watcherInitialized) {
    return;
  }

  // TODO: Implement file watcher in Rust backend
  // For now, hot-reload works when you manually call reloadCurrentTheme()
  // or when the theme changes via setCurrentTheme()

  watcherInitialized = true;
}
