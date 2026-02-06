import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

export interface FileContent {
  content: string;
  path: string;
  encoding: string;
}

export async function openFile(): Promise<FileContent | null> {
  try {
    // Open native file dialog
    const filePath = await open({
      multiple: false,
      directory: false,
    });

    if (!filePath) {
      return null;
    }

    // Read file content
    const fileContent = await invoke<FileContent>('read_file_content', {
      path: filePath,
    });

    return fileContent;
  } catch (error) {
    console.error('Error opening file:', error);
    throw error;
  }
}

export async function saveFile(
  path: string,
  content: string,
  encoding?: string
): Promise<void> {
  try {
    await invoke('write_file_content', {
      path,
      content,
      encoding: encoding || 'UTF-8',
    });
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
}

export async function saveFileAs(
  content: string,
  encoding?: string
): Promise<string | null> {
  try {
    // Open native save dialog
    const filePath = await save({
      defaultPath: 'untitled.txt',
    });

    if (!filePath) {
      return null;
    }

    await invoke('write_file_content', {
      path: filePath,
      content,
      encoding: encoding || 'UTF-8',
    });

    return filePath;
  } catch (error) {
    console.error('Error saving file as:', error);
    throw error;
  }
}
