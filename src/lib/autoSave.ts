import { debounce } from '@altagen/velt-core';
import { saveFile } from './fileOperations';
import { saveTab } from '../stores/appStore';

export interface AutoSaveOptions {
  delay: number;
  enabled: boolean;
}

export class AutoSaveManager {
  private debouncedSave: (tabId: string, filePath: string, content: string, encoding: string) => void;
  private options: AutoSaveOptions;

  constructor(options: AutoSaveOptions = { delay: 1000, enabled: true }) {
    this.options = options;

    // Create debounced save function
    this.debouncedSave = debounce(
      async (tabId: string, filePath: string, content: string, encoding: string) => {
        try {
          await saveFile(filePath, content, encoding);
          saveTab(tabId);
        } catch (error) {
          console.error('[AutoSave] Failed to save:', error);
        }
      },
      options.delay
    );
  }

  /**
   * Trigger auto-save for a tab
   */
  save(tabId: string, filePath: string | null, content: string, encoding: string): void {
    if (!this.options.enabled) return;
    if (!filePath) return; // Can't auto-save without a file path

    this.debouncedSave(tabId, filePath, content, encoding);
  }

  /**
   * Update auto-save options
   */
  setOptions(options: Partial<AutoSaveOptions>): void {
    this.options = { ...this.options, ...options };

    // Recreate debounced function if delay changed
    if (options.delay !== undefined) {
      this.debouncedSave = debounce(
        async (tabId: string, filePath: string, content: string, encoding: string) => {
          try {
            await saveFile(filePath, content, encoding);
            saveTab(tabId);
            } catch (error) {
            console.error('[AutoSave] Failed to save:', error);
          }
        },
        options.delay
      );
    }
  }

  /**
   * Check if auto-save is enabled
   */
  isEnabled(): boolean {
    return this.options.enabled;
  }
}
