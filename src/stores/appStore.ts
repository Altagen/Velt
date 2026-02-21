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

// Hooks for paneStore integration (set by paneStore during init)
export let onTabAdded: ((tabId: string) => void) | null = null;
export let onTabRemoved: ((tabId: string) => void) | null = null;

export function setOnTabAdded(fn: (tabId: string) => void) {
  onTabAdded = fn;
}

export function setOnTabRemoved(fn: (tabId: string) => void) {
  onTabRemoved = fn;
}

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

export function createPreviewTab(sourceTab: Tab): Tab {
  return {
    id: crypto.randomUUID(),
    filePath: sourceTab.filePath,
    content: '',
    originalContent: '',
    isDirty: false,
    encoding: sourceTab.encoding,
    language: 'markdown',
    isPreview: true,
    sourceTabId: sourceTab.id,
  };
}

export function addTab(tab: Tab) {
  tabs.update(t => [...t, tab]);
  if (onTabAdded) {
    onTabAdded(tab.id);
  } else {
    activeTabId.set(tab.id);
  }
}

export function removeTab(tabId: string) {
  const currentTabs = get(tabs);

  // Find the tab to remove
  const tabToRemove = currentTabs.find(tab => tab.id === tabId);
  if (!tabToRemove) return;

  // Collect IDs to remove: the tab itself + any preview tabs linked to it
  const idsToRemove = new Set<string>([tabId]);
  if (!tabToRemove.isPreview) {
    // Closing a source tab → also close its preview tabs
    for (const t of currentTabs) {
      if (t.isPreview && t.sourceTabId === tabId) {
        idsToRemove.add(t.id);
      }
    }
  }

  // Remove the tabs from global store
  // (paneStore auto-cleanup subscription handles pane removal + active tab fallback)
  tabs.update(t => t.filter(tab => !idsToRemove.has(tab.id)));
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

export function getPreviewTabForSource(sourceTabId: string): Tab | undefined {
  let result: Tab | undefined;
  tabs.subscribe(t => {
    result = t.find(tab => tab.isPreview && tab.sourceTabId === sourceTabId);
  })();
  return result;
}

export function removePreviewTab(sourceTabId: string) {
  const preview = getPreviewTabForSource(sourceTabId);
  if (preview) {
    removeTab(preview.id);
  }
}
