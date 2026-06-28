import { localStorage } from '@zos/storage'

// Base palette — non-accent colors shared across all themes
export const C = {
  BG:         0x071020,
  CARD:       0x0D1826,
  CARD_DARK:  0x091018,
  CARD_PRESS: 0x182436,
  TRACK:      0x1A2848,
  INPUT_BG:   0x081220,
  TEXT:       0xE8EFF5,
  TEXT_DIM:   0x7A9AB0,
  TEXT_MUTED: 0x4A6A82,
  TEXT_HINT:  0x5A7A9A,
  TEXT_LIGHT: 0xC8D4E8,
}

// To add a theme: add an entry here + create 6 image files:
//   radio_{name}_on.png  radio_{name}_off.png  check_{name}.png
//   plus_{name}.png  report_{name}.png  more_{name}.png
export const THEMES = [
  { name: 'sky',    label: 'Sky',    color: 0x4FA8FF },
  { name: 'aqua',   label: 'Aqua',   color: 0x37D4DF },
  { name: 'mint',   label: 'Mint',   color: 0x3FE0A8 },
  { name: 'lime',   label: 'Lime',   color: 0xA6E22E },
  { name: 'gold',   label: 'Gold',   color: 0xFFD24A },
  { name: 'ember',  label: 'Ember',  color: 0xF2A24A },
  { name: 'coral',  label: 'Coral',  color: 0xFF7A59 },
  { name: 'rose',   label: 'Rose',   color: 0xFF6B8A },
  { name: 'violet', label: 'Violet', color: 0xC56BFF },
  { name: 'iris',   label: 'Iris',   color: 0xA695F8 },
]

export function getThemeName() {
  try { const r = localStorage.getItem('todo_theme'); if (r) return r } catch(e) {}
  return 'sky'
}

export function getTheme() {
  const name = getThemeName()
  return THEMES.find(t => t.name === name) || THEMES[0]
}

export function saveThemeName(name) {
  localStorage.setItem('todo_theme', name)
}
