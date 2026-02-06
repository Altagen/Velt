import { writable } from 'svelte/store';

export interface ReloadDialog {
  isOpen: boolean;
  tabId: string | null;
  filename: string;
}

const defaultDialogState: ReloadDialog = {
  isOpen: false,
  tabId: null,
  filename: '',
};

export const reloadDialog = writable<ReloadDialog>(defaultDialogState);

export function openReloadDialog(tabId: string, filename: string) {
  reloadDialog.set({
    isOpen: true,
    tabId,
    filename,
  });
}

export function closeReloadDialog() {
  reloadDialog.set(defaultDialogState);
}
