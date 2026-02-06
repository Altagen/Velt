/**
 * System Font Detection
 * Returns platform-appropriate font families using Tauri backend
 */

import { invoke } from '@tauri-apps/api/core';

export interface SystemFonts {
  monospace: string;
  sans: string;
  serif: string;
}

export type Platform = 'macos' | 'windows' | 'linux' | 'unknown';

// Cache the platform detection result
let cachedPlatform: Platform | null = null;

/**
 * Detect the operating system using Tauri backend
 * Falls back to browser detection if Tauri is not available
 */
async function detectPlatform(): Promise<Platform> {
  if (cachedPlatform !== null) {
    return cachedPlatform;
  }

  try {
    // Use Tauri backend for accurate platform detection
    const platform = await invoke<string>('get_platform');
    cachedPlatform = platform as Platform;
    return cachedPlatform;
  } catch (error) {
    // Fallback to browser detection (less reliable but works outside Tauri)
    console.warn('Tauri platform detection failed, using browser fallback:', error);
    cachedPlatform = detectPlatformFallback();
    return cachedPlatform;
  }
}

/**
 * Fallback platform detection using browser APIs
 * Only used when Tauri is not available
 */
function detectPlatformFallback(): Platform {
  const platform = navigator.platform?.toLowerCase() || '';
  const userAgent = navigator.userAgent?.toLowerCase() || '';

  if (platform.includes('mac') || userAgent.includes('mac')) {
    return 'macos';
  } else if (platform.includes('win') || userAgent.includes('win')) {
    return 'windows';
  } else if (platform.includes('linux') || userAgent.includes('linux')) {
    return 'linux';
  }
  return 'linux'; // Default to linux for unknown platforms
}

/**
 * Synchronous platform detection (uses cached value or fallback)
 * Use this when async is not possible
 */
export function getPlatformSync(): Platform {
  if (cachedPlatform !== null) {
    return cachedPlatform;
  }
  // Use fallback for sync access
  return detectPlatformFallback();
}

/**
 * Initialize platform detection (call early in app startup)
 */
export async function initPlatformDetection(): Promise<Platform> {
  return detectPlatform();
}

const fontsByPlatform: Record<Platform, SystemFonts> = {
  macos: {
    monospace: 'SF Mono, Monaco, Menlo, Consolas, "Courier New", monospace',
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", Times, serif'
  },
  windows: {
    monospace: 'Consolas, "Cascadia Mono", "Courier New", monospace',
    sans: '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", Times, serif'
  },
  linux: {
    monospace: '"Cascadia Code", "Liberation Mono", "DejaVu Sans Mono", "Ubuntu Mono", Consolas, monospace',
    sans: 'Ubuntu, "Liberation Sans", "DejaVu Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
    serif: '"Liberation Serif", "DejaVu Serif", Georgia, "Times New Roman", Times, serif'
  },
  unknown: {
    monospace: 'monospace',
    sans: 'sans-serif',
    serif: 'serif'
  }
};

/**
 * Get system-appropriate font families (async)
 */
export async function getSystemFontsAsync(): Promise<SystemFonts> {
  const platform = await detectPlatform();
  return fontsByPlatform[platform];
}

/**
 * Get system-appropriate font families (sync - uses cached platform)
 */
export function getSystemFonts(): SystemFonts {
  const platform = getPlatformSync();
  return fontsByPlatform[platform];
}

/**
 * Get the default monospace font for the system
 */
export function getDefaultMonospaceFont(): string {
  return getSystemFonts().monospace;
}

/**
 * Get the default sans-serif font for the system
 */
export function getDefaultSansFont(): string {
  return getSystemFonts().sans;
}

/**
 * Check if current platform is macOS
 */
export function isMacOS(): boolean {
  return getPlatformSync() === 'macos';
}

/**
 * Check if current platform is Windows
 */
export function isWindows(): boolean {
  return getPlatformSync() === 'windows';
}

/**
 * Check if current platform is Linux
 */
export function isLinux(): boolean {
  return getPlatformSync() === 'linux';
}
