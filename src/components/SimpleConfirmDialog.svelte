<script lang="ts">
  import { currentTheme } from '../stores/themeStore';
  import Warning from 'phosphor-svelte/lib/Warning';

  export let isOpen = false;
  export let title = 'Confirm';
  export let message = '';
  export let filename = '';
  export let confirmLabel = 'Confirm';
  export let cancelLabel = 'Cancel';
  export let onConfirm: () => void;
  export let onCancel: () => void;

  function handleKeyDown(event: KeyboardEvent) {
    if (!isOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      onConfirm();
    }
  }

  function handleOverlayClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      onCancel();
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

{#if isOpen}
  <div class="dialog-overlay" on:click={handleOverlayClick}>
    <div
      class="dialog"
      style="background-color: {$currentTheme?.ui?.background || '#252526'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
    >
      <div class="dialog-header">
        <div class="warning-icon">
          <Warning size={24} weight="duotone" color={$currentTheme?.icons?.warning || '#FFB74D'} />
        </div>
        <h3 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
          {title}
        </h3>
      </div>

      <div class="dialog-body">
        <p style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">
          {message} <strong style="color: {$currentTheme?.ui?.textActiveColor || '#ffffff'}">{filename}</strong>?
        </p>
        <p class="dialog-hint" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
          Your unsaved changes will be lost.
        </p>
      </div>

      <div class="dialog-actions">
        <button
          class="dialog-btn dialog-btn-secondary"
          style="background-color: {$currentTheme?.ui?.background || '#3e3e42'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}; color: {$currentTheme?.ui?.textColor || '#d4d4d4'}"
          on:click={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          class="dialog-btn dialog-btn-primary"
          style="background-color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}; color: {$currentTheme?.editor?.background || '#1e1e1e'}"
          on:click={onConfirm}
          autofocus
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .dialog-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .dialog {
    min-width: 450px;
    max-width: 500px;
    border: 1px solid;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px 16px 24px;
  }

  .warning-icon {
    font-size: 24px;
    line-height: 1;
  }

  .dialog-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
  }

  .dialog-body {
    padding: 0 24px 24px 24px;
  }

  .dialog-body p {
    margin: 0 0 8px 0;
    font-size: 14px;
    line-height: 1.5;
  }

  .dialog-hint {
    font-size: 13px;
    margin: 0;
  }

  .dialog-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 16px 24px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .dialog-btn {
    padding: 8px 20px;
    border: 1px solid transparent;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
    min-width: 90px;
  }

  .dialog-btn:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  .dialog-btn:active {
    transform: translateY(0);
  }

  .dialog-btn-primary {
    font-weight: 600;
  }

  .dialog-btn:focus {
    outline: 2px solid rgba(255, 255, 255, 0.3);
    outline-offset: 2px;
  }
</style>
