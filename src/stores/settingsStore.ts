import { writable } from 'svelte/store';

// Store to control the settings modal visibility
export const showSettingsModal = writable(false);

// Store for the currently active settings tab
export const activeSettingsTab = writable<'theme' | 'general'>('theme');
