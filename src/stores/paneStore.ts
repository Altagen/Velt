import { writable, derived, get } from 'svelte/store';
import { tabs, activeTabId } from './appStore';

export type PaneId = 'left' | 'right';

export interface PaneState {
  tabIds: string[];
  activeTabId: string | null;
}

export interface PaneLayout {
  left: PaneState;
  right: PaneState | null;
  focusedPane: PaneId;
}

// Main layout store
export const paneLayout = writable<PaneLayout>({
  left: { tabIds: [], activeTabId: null },
  right: null,
  focusedPane: 'left',
});

// Tab currently being dragged (for drop zone UI)
export const draggingTabId = writable<string | null>(null);

// Derived stores
export const focusedPaneId = derived(paneLayout, $l => $l.focusedPane);
export const leftPane = derived(paneLayout, $l => $l.left);
export const rightPane = derived(paneLayout, $l => $l.right);
export const hasRightPane = derived(paneLayout, $l => $l.right !== null && $l.right.tabIds.length > 0);

// --- Pane management functions ---

export function addTabToPane(tabId: string, paneId: PaneId = 'left', activate: boolean = true) {
  paneLayout.update(layout => {
    const target = paneId === 'right' ? layout.right : layout.left;

    if (paneId === 'right' && !target) {
      // Create right pane
      layout.right = { tabIds: [tabId], activeTabId: activate ? tabId : null };
    } else if (target) {
      if (!target.tabIds.includes(tabId)) {
        target.tabIds = [...target.tabIds, tabId];
      }
      if (activate) {
        target.activeTabId = tabId;
      }
    }

    if (activate) {
      layout.focusedPane = paneId;
    }

    return { ...layout };
  });

  // Sync global activeTabId
  syncActiveTabId();
}

export function removeTabFromPane(tabId: string) {
  paneLayout.update(layout => {
    for (const side of ['left', 'right'] as PaneId[]) {
      const pane = side === 'right' ? layout.right : layout.left;
      if (!pane) continue;

      const idx = pane.tabIds.indexOf(tabId);
      if (idx === -1) continue;

      pane.tabIds = pane.tabIds.filter(id => id !== tabId);

      // If this was the active tab, pick a neighbor
      if (pane.activeTabId === tabId) {
        if (pane.tabIds.length > 0) {
          // Pick the tab at the same index, or the last one
          const newIdx = Math.min(idx, pane.tabIds.length - 1);
          pane.activeTabId = pane.tabIds[newIdx];
        } else {
          pane.activeTabId = null;
        }
      }

      // Collapse right pane if empty
      if (side === 'right' && pane.tabIds.length === 0) {
        layout.right = null;
        if (layout.focusedPane === 'right') {
          layout.focusedPane = 'left';
        }
      }

      break; // Tab can only be in one pane
    }

    return { ...layout };
  });

  syncActiveTabId();
}

export function setActiveTab(paneId: PaneId, tabId: string) {
  paneLayout.update(layout => {
    const pane = paneId === 'right' ? layout.right : layout.left;
    if (pane && pane.tabIds.includes(tabId)) {
      pane.activeTabId = tabId;
      layout.focusedPane = paneId;
    }
    return { ...layout };
  });

  syncActiveTabId();
}

export function moveTabToPane(tabId: string, targetPaneId: PaneId) {
  const layout = get(paneLayout);
  const currentPane = getPaneForTab(tabId);
  if (!currentPane || currentPane === targetPaneId) return;

  paneLayout.update(layout => {
    // Remove from source pane
    const source = currentPane === 'right' ? layout.right : layout.left;
    if (source) {
      const idx = source.tabIds.indexOf(tabId);
      source.tabIds = source.tabIds.filter(id => id !== tabId);
      if (source.activeTabId === tabId) {
        if (source.tabIds.length > 0) {
          const newIdx = Math.min(idx, source.tabIds.length - 1);
          source.activeTabId = source.tabIds[newIdx];
        } else {
          source.activeTabId = null;
        }
      }
      // Collapse right pane if empty after moving
      if (currentPane === 'right' && source.tabIds.length === 0) {
        layout.right = null;
      }
    }

    // Add to target pane
    if (targetPaneId === 'right') {
      if (!layout.right) {
        layout.right = { tabIds: [tabId], activeTabId: tabId };
      } else {
        layout.right.tabIds = [...layout.right.tabIds, tabId];
        layout.right.activeTabId = tabId;
      }
    } else {
      layout.left.tabIds = [...layout.left.tabIds, tabId];
      layout.left.activeTabId = tabId;
    }

    layout.focusedPane = targetPaneId;
    return { ...layout };
  });

  syncActiveTabId();
}

export function setFocusedPane(paneId: PaneId) {
  const layout = get(paneLayout);
  if (layout.focusedPane === paneId) return;
  if (paneId === 'right' && !layout.right) return;

  paneLayout.update(layout => {
    layout.focusedPane = paneId;
    return { ...layout };
  });

  syncActiveTabId();
}

export function getPaneForTab(tabId: string): PaneId | null {
  const layout = get(paneLayout);
  if (layout.left.tabIds.includes(tabId)) return 'left';
  if (layout.right?.tabIds.includes(tabId)) return 'right';
  return null;
}

export function collapseRightPane() {
  paneLayout.update(layout => {
    if (!layout.right) return layout;

    // Move all right pane tabs back to left
    layout.left.tabIds = [...layout.left.tabIds, ...layout.right.tabIds];
    if (layout.right.activeTabId) {
      layout.left.activeTabId = layout.right.activeTabId;
    }
    layout.right = null;
    layout.focusedPane = 'left';
    return { ...layout };
  });

  syncActiveTabId();
}

// --- Sync activeTabId with focused pane ---

function syncActiveTabId() {
  const layout = get(paneLayout);
  const focusedPane = layout.focusedPane === 'right' && layout.right
    ? layout.right
    : layout.left;
  const current = get(activeTabId);
  if (focusedPane.activeTabId === current) return;
  activeTabId.set(focusedPane.activeTabId);
}

// --- Auto-cleanup: when tabs are removed from global store, remove from panes ---

tabs.subscribe($tabs => {
  const tabIds = new Set($tabs.map(t => t.id));
  const layout = get(paneLayout);

  let changed = false;

  // Check left pane
  const leftFiltered = layout.left.tabIds.filter(id => tabIds.has(id));
  if (leftFiltered.length !== layout.left.tabIds.length) {
    changed = true;
  }

  // Check right pane
  let rightFiltered: string[] | null = null;
  if (layout.right) {
    rightFiltered = layout.right.tabIds.filter(id => tabIds.has(id));
    if (rightFiltered.length !== layout.right.tabIds.length) {
      changed = true;
    }
  }

  if (!changed) return;

  paneLayout.update(layout => {
    // Update left pane
    const removedFromLeft = layout.left.tabIds.filter(id => !tabIds.has(id));
    if (removedFromLeft.length > 0) {
      const oldIdx = layout.left.activeTabId
        ? layout.left.tabIds.indexOf(layout.left.activeTabId)
        : -1;
      layout.left.tabIds = layout.left.tabIds.filter(id => tabIds.has(id));
      if (layout.left.activeTabId && !tabIds.has(layout.left.activeTabId)) {
        if (layout.left.tabIds.length > 0) {
          const newIdx = Math.min(oldIdx, layout.left.tabIds.length - 1);
          layout.left.activeTabId = layout.left.tabIds[Math.max(0, newIdx)];
        } else {
          layout.left.activeTabId = null;
        }
      }
    }

    // Update right pane
    if (layout.right) {
      const removedFromRight = layout.right.tabIds.filter(id => !tabIds.has(id));
      if (removedFromRight.length > 0) {
        const oldIdx = layout.right.activeTabId
          ? layout.right.tabIds.indexOf(layout.right.activeTabId)
          : -1;
        layout.right.tabIds = layout.right.tabIds.filter(id => tabIds.has(id));
        if (layout.right.activeTabId && !tabIds.has(layout.right.activeTabId)) {
          if (layout.right.tabIds.length > 0) {
            const newIdx = Math.min(oldIdx, layout.right.tabIds.length - 1);
            layout.right.activeTabId = layout.right.tabIds[Math.max(0, newIdx)];
          } else {
            layout.right.activeTabId = null;
          }
        }
        // Collapse right pane if empty
        if (layout.right.tabIds.length === 0) {
          layout.right = null;
          if (layout.focusedPane === 'right') {
            layout.focusedPane = 'left';
          }
        }
      }
    }

    return { ...layout };
  });

  syncActiveTabId();
});
