import { writable } from 'svelte/store';

export interface FindReplaceState {
  isOpen: boolean;
  isExpanded: boolean;
  searchText: string;
  replaceText: string;
  matchCount: number;
  currentMatchIndex: number;
  caseSensitive: boolean;
  useRegex: boolean;
  wholeWord: boolean;
}

const defaultState: FindReplaceState = {
  isOpen: false,
  isExpanded: false,
  searchText: '',
  replaceText: '',
  matchCount: 0,
  currentMatchIndex: 0,
  caseSensitive: false,
  useRegex: false,
  wholeWord: false,
};

export const findReplaceState = writable<FindReplaceState>(defaultState);

export function openFindPanel() {
  findReplaceState.update(state => ({
    ...state,
    isOpen: true,
    isExpanded: false,
  }));
}

export function openReplacePanel() {
  findReplaceState.update(state => ({
    ...state,
    isOpen: true,
    isExpanded: true,
  }));
}

export function toggleExpand() {
  findReplaceState.update(state => ({
    ...state,
    isExpanded: !state.isExpanded,
  }));
}

export function closeFindReplace() {
  findReplaceState.set(defaultState);
}

export function updateSearchText(text: string) {
  findReplaceState.update(state => ({
    ...state,
    searchText: text,
  }));
}

export function updateReplaceText(text: string) {
  findReplaceState.update(state => ({
    ...state,
    replaceText: text,
  }));
}

export function updateMatchInfo(count: number, currentIndex: number) {
  findReplaceState.update(state => ({
    ...state,
    matchCount: count,
    currentMatchIndex: currentIndex,
  }));
}

export function toggleCaseSensitive() {
  findReplaceState.update(state => ({
    ...state,
    caseSensitive: !state.caseSensitive,
  }));
}

export function toggleUseRegex() {
  findReplaceState.update(state => ({
    ...state,
    useRegex: !state.useRegex,
  }));
}

export function toggleWholeWord() {
  findReplaceState.update(state => ({
    ...state,
    wholeWord: !state.wholeWord,
  }));
}
