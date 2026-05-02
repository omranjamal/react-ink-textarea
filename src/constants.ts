import type { TKeybinding } from "./types.js";

export const DEFAULT_CURSOR_INTERVAL = 500;
export const DEFAULT_TYPING_PAUSE = 450;
export const DEFAULT_MAX_UNDO = 128;
export const DEFAULT_UNDO_GROUP_DELAY = 2500;
export const DEFAULT_AUTO_NEW_LINE_LIMIT = 3;
export const DEFAULT_INITIAL_LINE_COUNT = 2;
export const DEFAULT_TAB_WIDTH = 4;

export const DEFAULT_KEYBINDINGS: Readonly<Record<TKeybinding, boolean>> = {
  Enter: true,
  "Ctrl+J": true,
  "Ctrl+Enter": true,
  "Shift+Enter": true,
  "Alt+Enter": true,
  Up: true,
  Down: true,
  Left: true,
  Right: true,
  "Alt+B": true,
  "Alt+F": true,
  "Ctrl+A": true,
  "Ctrl+E": true,
  "Ctrl+W": true,
  "Ctrl+U": true,
  "Ctrl+K": true,
  Backspace: true,
  Delete: true,
  "Alt+Backspace": true,
  "Ctrl+Z": true,
};

export const NAV_KEYBINDINGS: readonly TKeybinding[] = [
  "Up",
  "Down",
  "Left",
  "Right",
  "Alt+B",
  "Alt+F",
  "Ctrl+A",
  "Ctrl+E",
];
