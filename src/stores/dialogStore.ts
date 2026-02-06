import { writable } from 'svelte/store';

export interface CloseTabDialog {
  isOpen: boolean;
  tabId: string | null;
  filename: string;
}

const defaultDialogState: CloseTabDialog = {
  isOpen: false,
  tabId: null,
  filename: '',
};

export const closeTabDialog = writable<CloseTabDialog>(defaultDialogState);

export function openCloseTabDialog(tabId: string, filename: string) {
  closeTabDialog.set({
    isOpen: true,
    tabId,
    filename,
  });
}

export function closeCloseTabDialog() {
  closeTabDialog.set(defaultDialogState);
}
