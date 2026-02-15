// Re-export types from velt-core
export type { Tab, Theme } from '@altagen/velt-core';

// Velt-specific types
export interface AppSettings {
  showMenuIcons: boolean;
  currentTheme: string;
  autoSave: boolean;
  autoSaveDelay: number;
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  showInvisibles: boolean;
  autoIndent: boolean;
  zoomLevel: number; // 100 = 100%
}
