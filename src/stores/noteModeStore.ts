import { writable, derived } from 'svelte/store';
import { tabs } from './appStore';

const noteModeTabs = writable<Set<string>>(new Set());

// Readable set of tab IDs in note mode (for template checks)
export const noteModeSet = derived(noteModeTabs, $s => $s);

export function addNoteTab(tabId: string) {
  noteModeTabs.update(set => {
    const next = new Set(set);
    next.add(tabId);
    return next;
  });
}

export function removeNoteTab(tabId: string) {
  noteModeTabs.update(set => {
    const next = new Set(set);
    next.delete(tabId);
    return next;
  });
}

// Auto-cleanup: when a tab is removed, purge its note mode state
tabs.subscribe($tabs => {
  const tabIds = new Set($tabs.map(t => t.id));
  noteModeTabs.update(set => {
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
