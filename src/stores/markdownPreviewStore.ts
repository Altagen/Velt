import { writable, derived, get } from 'svelte/store';
import { tabs, activeTabId, createPreviewTab, getTab, getPreviewTabForSource, removePreviewTab } from './appStore';
import { addTabToPane } from './paneStore';

// Per-tab sets tracking which tabs have markdown mode enabled
const markdownModeTabs = writable<Set<string>>(new Set());

// Per-tab set tracking which tabs have the markdown toolbar visible (independent of preview)
const markdownToolbarTabs = writable<Set<string>>(new Set());

// Check if a tab is a markdown file
function isTabMarkdownFile(tab: { language?: string; filePath: string | null }): boolean {
  if (tab.language === 'markdown') return true;
  if (tab.filePath) {
    const ext = tab.filePath.split('.').pop()?.toLowerCase();
    return ext === 'md' || ext === 'markdown' || ext === 'mdx';
  }
  return false;
}

// Check if current active tab is a markdown file
export const isMarkdownFile = derived(
  [tabs, activeTabId],
  ([$tabs, $activeTabId]) => {
    if (!$activeTabId) return false;
    const tab = $tabs.find(t => t.id === $activeTabId);
    if (!tab || tab.isPreview) return false;
    return isTabMarkdownFile(tab);
  }
);

// Is markdown mode active for the current tab (or its source if it's a preview tab)
export const isMarkdownModeActive = derived(
  [markdownModeTabs, activeTabId, tabs],
  ([$markdownModeTabs, $activeTabId, $tabs]) => {
    if (!$activeTabId) return false;
    const tab = $tabs.find(t => t.id === $activeTabId);
    if (!tab) return false;
    // If viewing a preview tab, check the source tab's markdown mode
    const checkId = tab.isPreview && tab.sourceTabId ? tab.sourceTabId : $activeTabId;
    return $markdownModeTabs.has(checkId);
  }
);

// Readable set of tab IDs with markdown mode enabled (for UI checks)
export const markdownModeSet = derived(markdownModeTabs, $s => $s);

// Is the markdown toolbar active for the current tab
export const isMarkdownToolbarActive = derived(
  [markdownToolbarTabs, activeTabId, tabs],
  ([$markdownToolbarTabs, $activeTabId, $tabs]) => {
    if (!$activeTabId) return false;
    const tab = $tabs.find(t => t.id === $activeTabId);
    if (!tab) return false;
    const checkId = tab.isPreview && tab.sourceTabId ? tab.sourceTabId : $activeTabId;
    return $markdownToolbarTabs.has(checkId);
  }
);

export function toggleMarkdownToolbar(forTabId?: string) {
  const tabId = forTabId || get(activeTabId);
  if (!tabId) return;

  const currentTab = getTab(tabId);
  if (!currentTab) return;
  const sourceId = currentTab.isPreview && currentTab.sourceTabId ? currentTab.sourceTabId : tabId;

  markdownToolbarTabs.update(set => {
    const next = new Set(set);
    if (next.has(sourceId)) {
      next.delete(sourceId);
    } else {
      next.add(sourceId);
    }
    return next;
  });
}

export function toggleMarkdownMode(forTabId?: string) {
  const tabId = forTabId || get(activeTabId);
  if (!tabId) return;

  // If we're on a preview tab, toggle the source tab's mode
  const currentTab = getTab(tabId);
  if (!currentTab) return;
  const sourceId = currentTab.isPreview && currentTab.sourceTabId ? currentTab.sourceTabId : tabId;

  markdownModeTabs.update(set => {
    const next = new Set(set);
    if (next.has(sourceId)) {
      next.delete(sourceId);
      // Remove preview tab (paneStore auto-cleanup handles pane removal)
      removePreviewTab(sourceId);
    } else {
      next.add(sourceId);
      // Auto-create preview tab for markdown files
      const sourceTab = getTab(sourceId);
      if (sourceTab && isTabMarkdownFile(sourceTab)) {
        // Only create if one doesn't already exist
        if (!getPreviewTabForSource(sourceId)) {
          const previewTab = createPreviewTab(sourceTab);
          // Add preview tab to global tabs store
          tabs.update(t => [...t, previewTab]);
          // Add to right pane
          addTabToPane(previewTab.id, 'right', true);
        } else {
          const existing = getPreviewTabForSource(sourceId);
          if (existing) addTabToPane(existing.id, 'right', true);
        }
      }
    }
    return next;
  });
}

// Auto-cleanup: when a tab is removed, purge its markdown mode and toolbar state
tabs.subscribe($tabs => {
  const tabIds = new Set($tabs.map(t => t.id));
  markdownModeTabs.update(set => {
    let changed = false;
    const next = new Set(set);
    for (const id of next) {
      if (!tabIds.has(id)) {
        next.delete(id);
        changed = true;
      }
    }
    return changed ? next : set;
  });
  markdownToolbarTabs.update(set => {
    let changed = false;
    const next = new Set(set);
    for (const id of next) {
      if (!tabIds.has(id)) {
        next.delete(id);
        changed = true;
      }
    }
    return changed ? next : set;
  });
});
