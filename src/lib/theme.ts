import { invoke } from '@tauri-apps/api/core';
import type { Theme } from '@altagen/velt-core';

export interface AppConfig {
  theme: string;
  themesDir: string | null;
  autoSave: boolean;
  autoSaveDelay: number;
  recentFiles: string[];
}

/**
 * Get the application configuration
 */
export async function getConfig(): Promise<AppConfig> {
  return await invoke<AppConfig>('get_config');
}

/**
 * Save the application configuration
 */
export async function saveConfig(config: AppConfig): Promise<void> {
  await invoke('save_app_config', { configData: config });
}

/**
 * Get a theme by name
 */
export async function getTheme(themeName: string): Promise<Theme> {
  return await invoke<Theme>('get_theme', { themeName });
}

/**
 * List all available themes
 */
export async function listThemes(): Promise<string[]> {
  return await invoke<string[]>('list_available_themes');
}

/**
 * Get the config directory path
 */
export async function getConfigDir(): Promise<string> {
  return await invoke<string>('get_config_dir');
}

/**
 * Load the current active theme (from current.json or fallback to startup theme)
 */
export async function loadCurrentTheme(): Promise<Theme> {
  return await invoke<Theme>('get_current_theme');
}

/**
 * Set the current theme and save config
 */
export async function setCurrentTheme(themeName: string): Promise<void> {
  const config = await getConfig();
  config.theme = themeName;
  await saveConfig(config);
}
