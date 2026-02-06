import { writable } from 'svelte/store';

export interface GoToLineState {
  isOpen: boolean;
  lineNumber: string;
  totalLines: number;
  errorMessage: string;
}

const defaultState: GoToLineState = {
  isOpen: false,
  lineNumber: '',
  totalLines: 0,
  errorMessage: '',
};

export const goToLineState = writable<GoToLineState>(defaultState);

export function openGoToLine(totalLines: number) {
  goToLineState.update(state => ({
    ...state,
    isOpen: true,
    totalLines,
    lineNumber: '',
    errorMessage: '',
  }));
}

export function closeGoToLine() {
  goToLineState.set(defaultState);
}

export function updateLineNumber(lineNumber: string) {
  goToLineState.update(state => ({
    ...state,
    lineNumber,
    errorMessage: '',
  }));
}

export function setErrorMessage(message: string) {
  goToLineState.update(state => ({
    ...state,
    errorMessage: message,
  }));
}
