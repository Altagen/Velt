import { invoke } from '@tauri-apps/api/core';

export async function addRecentFile(filePath: string): Promise<void> {
  try {
    await invoke('add_recent_file', { filePath });
  } catch (error) {
    console.error('Error adding recent file:', error);
  }
}

export async function getRecentFiles(): Promise<string[]> {
  try {
    return await invoke<string[]>('get_recent_files');
  } catch (error) {
    console.error('Error getting recent files:', error);
    return [];
  }
}

export async function clearRecentFiles(): Promise<void> {
  try {
    await invoke('clear_recent_files');
  } catch (error) {
    console.error('Error clearing recent files:', error);
  }
}
