import { writable, get } from 'svelte/store';
import type { Tab, AppSettings } from '../types';
import { getDefaultMonospaceFont } from '../lib/systemFonts';

// Default settings
export const defaultSettings: AppSettings = {
  showMenuIcons: true,
  currentTheme: 'Dark',
  autoSave: true,
  autoSaveDelay: 1000,
  fontSize: 14,
  fontFamily: getDefaultMonospaceFont(), // Use system-appropriate monospace font
  tabSize: 2,
  wordWrap: false,
  showInvisibles: false,
  autoIndent: true,
  zoomLevel: 100,
};

// Stores
export const tabs = writable<Tab[]>([]);
export const activeTabId = writable<string | null>(null);
export const settings = writable<AppSettings>(defaultSettings);

// Helper functions
export function createTab(filePath: string | null = null, content: string = ''): Tab {
  return {
    id: crypto.randomUUID(),
    filePath,
    content,
    originalContent: content, // Store original content for dirty check
    isDirty: false,
    encoding: 'utf-8',
  };
}

export function addTab(tab: Tab) {
  tabs.update(t => [...t, tab]);
  activeTabId.set(tab.id);
}

export function removeTab(tabId: string) {
  const currentTabs = get(tabs);
  const currentActiveId = get(activeTabId);

  // Find the index of the tab to remove
  const index = currentTabs.findIndex(tab => tab.id === tabId);
  if (index === -1) return; // Tab not found

  let newActiveTabId: string | null = null;

  // If we're removing the active tab, determine which tab to activate next
  if (currentActiveId === tabId && currentTabs.length > 1) {
    // Try to activate the tab to the right
    if (index < currentTabs.length - 1) {
      newActiveTabId = currentTabs[index + 1].id;
    }
    // If it's the last tab, activate the one to the left
    else if (index > 0) {
      newActiveTabId = currentTabs[index - 1].id;
    }
  }

  // Remove the tab
  tabs.update(t => t.filter(tab => tab.id !== tabId));

  // Update active tab if needed
  if (currentActiveId === tabId) {
    activeTabId.set(newActiveTabId);
  }
}

export function updateTabContent(tabId: string, content: string) {
  tabs.update(t =>
    t.map(tab =>
      tab.id === tabId
        ? { ...tab, content, isDirty: content !== tab.originalContent }
        : tab
    )
  );
}

export function saveTab(tabId: string) {
  tabs.update(t =>
    t.map(tab =>
      tab.id === tabId
        ? { ...tab, originalContent: tab.content, isDirty: false }
        : tab
    )
  );
}

export function updateTabFile(tabId: string, filePath: string, content: string, encoding: string) {
  tabs.update(t =>
    t.map(tab =>
      tab.id === tabId
        ? { ...tab, filePath, content, originalContent: content, encoding, isDirty: false }
        : tab
    )
  );
}

export function updateTabEncoding(tabId: string, encoding: string) {
  tabs.update(t =>
    t.map(tab =>
      tab.id === tabId
        ? { ...tab, encoding }
        : tab
    )
  );
}

export function getTab(tabId: string): Tab | undefined {
  let result: Tab | undefined;
  tabs.subscribe(t => {
    result = t.find(tab => tab.id === tabId);
  })();
  return result;
}
