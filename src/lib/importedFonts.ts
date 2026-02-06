/**
 * Imported Fonts Management
 * Loads and registers fonts imported by the user
 */

import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';

export interface ImportedFont {
  name: string;
  filename: string;
  format: string;
}

let fontsLoaded = false;

/**
 * Load all imported fonts and inject @font-face rules
 */
export async function loadImportedFonts(): Promise<ImportedFont[]> {
  try {
    // Get list of imported fonts
    const fonts = await invoke<ImportedFont[]>('list_imported_fonts');

    if (fonts.length === 0) {
      console.log('[ImportedFonts] No imported fonts found');
      return [];
    }

    // Get fonts directory path
    const fontsDir = await invoke<string>('get_fonts_dir_path');

    // Create style element for @font-face rules
    const styleId = 'imported-fonts-styles';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    // Generate @font-face rules
    const fontFaceRules = fonts.map(font => {
      // Convert file path to Tauri asset URL
      const fontPath = `${fontsDir}/${font.filename}`;
      const fontUrl = convertFileSrc(fontPath);

      return `
@font-face {
  font-family: "${font.name}";
  src: url("${fontUrl}") format("${font.format}");
  font-weight: normal;
  font-style: normal;
}`;
    }).join('\n');

    styleEl.textContent = fontFaceRules;
    fontsLoaded = true;

    console.log(`[ImportedFonts] Loaded ${fonts.length} imported fonts`);
    return fonts;
  } catch (error) {
    console.error('[ImportedFonts] Failed to load imported fonts:', error);
    return [];
  }
}

/**
 * Reload fonts (useful after importing new ones)
 */
export async function reloadImportedFonts(): Promise<ImportedFont[]> {
  fontsLoaded = false;
  return loadImportedFonts();
}

/**
 * Check if fonts have been loaded
 */
export function areFontsLoaded(): boolean {
  return fontsLoaded;
}
