<script lang="ts">
  import { goToLineState, closeGoToLine, updateLineNumber, setErrorMessage } from '../stores/goToLineStore';
  import { currentTheme } from '../stores/themeStore';
  import X from 'phosphor-svelte/lib/X';

  export let onGoToLine: (lineNumber: number) => void;

  let inputElement: HTMLInputElement;

  $: if ($goToLineState.isOpen && inputElement) {
    setTimeout(() => {
      inputElement?.focus();
      inputElement?.select();
    }, 50);
  }

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    updateLineNumber(target.value);
  }

  function handleSubmit() {
    const lineNum = parseInt($goToLineState.lineNumber, 10);

    if (!$goToLineState.lineNumber.trim()) {
      setErrorMessage('Please enter a line number');
      return;
    }

    if (isNaN(lineNum) || lineNum < 1) {
      setErrorMessage('Please enter a valid line number (1 or greater)');
      return;
    }

    if (lineNum > $goToLineState.totalLines) {
      setErrorMessage(`Line number must be between 1 and ${$goToLineState.totalLines}`);
      return;
    }

    onGoToLine(lineNum);
    closeGoToLine();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleSubmit();
    } else if (event.key === 'Escape') {
      closeGoToLine();
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeGoToLine();
    }
  }
</script>

{#if $goToLineState.isOpen}
  <div class="backdrop" on:click={handleBackdropClick}>
    <div
      class="dialog"
      style="
        background-color: {$currentTheme?.ui?.background || '#252526'};
        border-color: {$currentTheme?.ui?.border || '#3e3e42'};
      "
      on:keydown={handleKeyDown}
    >
      <div class="header">
        <span class="title" style="color: {$currentTheme?.ui?.textColor || '#cccccc'}">
          Go to Line
        </span>
        <button
          class="close-button"
          on:click={closeGoToLine}
          style="color: {$currentTheme?.ui?.textColor || '#cccccc'}"
        >
          <X size={16} weight="bold" color={$currentTheme?.icons?.close || '#9E9E9E'} />
        </button>
      </div>

      <div class="content">
        <div class="input-group">
          <label
            for="line-number-input"
            style="color: {$currentTheme?.ui?.textSecondary || '#858585'}"
          >
            Line number (1-{$goToLineState.totalLines}):
          </label>
          <input
            id="line-number-input"
            bind:this={inputElement}
            type="text"
            class="line-input"
            placeholder="Enter line number..."
            value={$goToLineState.lineNumber}
            on:input={handleInput}
            style="
              background-color: {$currentTheme?.editor?.background || '#1e1e1e'};
              border-color: {$goToLineState.errorMessage ? ($currentTheme?.ui?.accentDanger || '#f48771') : ($currentTheme?.ui?.border || '#3e3e42')};
              color: {$currentTheme?.editor?.foreground || '#d4d4d4'};
            "
          />
          {#if $goToLineState.errorMessage}
            <span
              class="error-message"
              style="color: {$currentTheme?.ui?.accentDanger || '#f48771'}"
            >
              {$goToLineState.errorMessage}
            </span>
          {/if}
        </div>
      </div>

      <div class="actions">
        <button
          class="cancel-button"
          on:click={closeGoToLine}
          style="
            color: {$currentTheme?.ui?.textColor || '#cccccc'};
            border-color: {$currentTheme?.ui?.border || '#3e3e42'};
          "
        >
          Cancel
        </button>
        <button
          class="go-button"
          on:click={handleSubmit}
          style="
            background-color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'};
            color: {$currentTheme?.editor?.background || '#1e1e1e'};
          "
        >
          Go
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
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
    min-width: 400px;
    max-width: 500px;
    border: 1px solid;
    border-radius: 6px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .title {
    font-size: 16px;
    font-weight: 600;
  }

  .close-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.15s;
  }

  .close-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .content {
    padding: 20px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  label {
    font-size: 13px;
    font-weight: 500;
  }

  .line-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid;
    border-radius: 4px;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
  }

  .line-input:focus {
    border-color: rgba(0, 212, 170, 0.6);
    box-shadow: 0 0 0 2px rgba(0, 212, 170, 0.1);
  }

  .error-message {
    font-size: 12px;
    margin-top: 4px;
  }

  .actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .cancel-button,
  .go-button {
    padding: 8px 20px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .cancel-button {
    background: transparent;
    border: 1px solid;
  }

  .cancel-button:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  .go-button {
    border: none;
  }

  .go-button:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  .go-button:active {
    transform: translateY(0);
  }
</style>
