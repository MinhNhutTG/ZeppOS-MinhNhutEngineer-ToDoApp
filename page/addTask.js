import { createWidget, widget, align, prop } from '@zos/ui'
import { back, replace } from '@zos/router'
import { localStorage } from '@zos/storage'
import { showToast } from '@zos/interaction'
import { C, THEMES, getTheme } from './themeConfig'

const DEFAULT_SUGGESTIONS = [
  'Buy groceries', 'Pay bills',
  'Call doctor',   'Do laundry',
  'Clean house',   'Exercise',
  'Read book',
]

Page({
  build() {
    const theme   = getTheme()
    this._accent   = theme.color
    this._themeName = theme.name
    this.inputText = ''
    this._suggestionBtns = []
    this._loadSuggestions()
    this._buildHeader()
    this._buildInputDisplay()
    this._buildSuggestions()
    this._buildConfirmButton()
    this._registerCallbacks()
  },

  onShow() {
    const prev = JSON.stringify(this.suggestions)
    this._loadSuggestions()
    if (JSON.stringify(this.suggestions) !== prev) {
      this._refreshSuggestionBtns()
    }
    this._registerCallbacks()
  },

  onHide() {
    getApp().globalData.onSuggestionsUpdated = null
    getApp().globalData.onThemeChanged       = null
  },
  onDestroy() {
    getApp().globalData.onSuggestionsUpdated = null
    getApp().globalData.onThemeChanged       = null
  },

  _registerCallbacks() {
    getApp().globalData.onSuggestionsUpdated = () => {
      this._loadSuggestions()
      this._refreshSuggestionBtns()
    }
    getApp().globalData.onThemeChanged = () => {
      const theme = getTheme()
      this._accent    = theme.color
      this._themeName = theme.name
      setTimeout(() => {
        try { this._applyTheme() } catch(e) {}
      }, 0)
    }
  },

  _applyTheme() {
    THEMES.forEach(theme => {
      try {
        this._accentBorders[theme.name].setProperty(prop.VISIBLE, theme.name === this._themeName)
      } catch(e) {}
    })
    try {
      this._confirmBtn.setProperty(prop.MORE, {
        x: 140, y: 376, w: 200, h: 52,
        text: 'Add Task', text_size: 18,
        color: C.BG, normal_color: this._accent, press_color: C.CARD_PRESS, radius: 26,
      })
    } catch(e) {}
  },

  _loadSuggestions() {
    try {
      const raw = localStorage.getItem('todo_suggestions')
      if (raw) { this.suggestions = JSON.parse(raw); return }
    } catch(e) {}
    this.suggestions = DEFAULT_SUGGESTIONS
    localStorage.setItem('todo_suggestions', JSON.stringify(DEFAULT_SUGGESTIONS))
  },

  _refreshSuggestionBtns() {
    this._suggestionBtns.forEach((btn, i) => {
      const label = this.suggestions[i]
      if (label) {
        btn.setProperty(prop.MORE, { text: label })
        btn.setProperty(prop.VISIBLE, true)
      } else {
        btn.setProperty(prop.VISIBLE, false)
      }
    })
    this.inputText = ''
    this._inputLabel.setProperty(prop.MORE, { text: 'Pick a suggestion below...', color: C.TEXT_HINT })
  },

  _buildHeader() {
    createWidget(widget.BUTTON, {
      x: 18, y: 14, w: 44, h: 44,
      text: '<', text_size: 20,
      color: C.TEXT_DIM, normal_color: C.CARD, press_color: C.CARD_PRESS,
      radius: 22, click_func: () => back(),
    })
    createWidget(widget.TEXT, {
      x: 0, y: 16, w: 480, h: 38,
      text: 'Add Task', text_size: 24, color: C.TEXT, align_h: align.CENTER_H,
    })
  },

  _buildInputDisplay() {
    // One accent border FILL_RECT per theme — color baked in, VISIBLE toggled
    this._accentBorders = {}
    THEMES.forEach(theme => {
      const r = createWidget(widget.FILL_RECT, {
        x: 78, y: 66, w: 324, h: 66, radius: 17, color: theme.color,
      })
      r.setProperty(prop.VISIBLE, theme.name === this._themeName)
      this._accentBorders[theme.name] = r
    })
    createWidget(widget.FILL_RECT, {
      x: 80, y: 68, w: 320, h: 62, radius: 16, color: C.INPUT_BG,
    })
    this._inputLabel = createWidget(widget.TEXT, {
      x: 100, y: 82, w: 264, h: 34,
      text: 'Pick a suggestion below...',
      text_size: 16, color: C.TEXT_HINT,
      align_h: align.LEFT, align_v: align.CENTER_V,
    })
  },

  _buildSuggestions() {
    createWidget(widget.TEXT, {
      x: 0, y: 144, w: 480, h: 20,
      text: 'QUICK PICK', text_size: 13, color: C.TEXT_HINT, align_h: align.CENTER_H,
    })

    const col1 = 56, col2 = 256
    const btnW = 168, btnH = 42, startY = 172, rowGap = 50

    this.suggestions.slice(0, 7).forEach((label, i) => {
      const btn = createWidget(widget.BUTTON, {
        x: (i % 2 === 0) ? col1 : col2,
        y: startY + Math.floor(i / 2) * rowGap,
        w: btnW, h: btnH,
        text: label, text_size: 15,
        color: C.TEXT_LIGHT,
        normal_color: C.CARD, press_color: C.CARD_PRESS,
        radius: 21,
        click_func: () => {
          this.inputText = this.suggestions[i]
          this._inputLabel.setProperty(prop.MORE, { text: this.suggestions[i], color: this._accent })
        },
      })
      this._suggestionBtns.push(btn)
    })

    createWidget(widget.BUTTON, {
      x: col2, y: startY + 3 * rowGap,
      w: btnW, h: btnH,
      text: '+', text_size: 24,
      color: this._accent, normal_color: C.CARD, press_color: C.CARD_PRESS,
      radius: 21,
      click_func: () => showToast({ content: 'To add more tasks, use the Zepp app' }),
    })
  },

  _buildConfirmButton() {
    this._confirmBtn = createWidget(widget.BUTTON, {
      x: 140, y: 376, w: 200, h: 52,
      text: 'Add Task', text_size: 18,
      color: C.BG, normal_color: this._accent, press_color: C.CARD_PRESS,
      radius: 26,
      click_func: () => {
        if (!this.inputText.trim()) return
        let tasks = [], nextId = 1
        try {
          const raw = localStorage.getItem('todo_tasks')
          if (raw) { const s = JSON.parse(raw); tasks = s.tasks || []; nextId = s.nextId || 1 }
        } catch(e) {}
        tasks.push({ id: nextId++, title: this.inputText, done: false })
        localStorage.setItem('todo_tasks', JSON.stringify({ tasks, nextId }))
        getApp().syncTasksToPhone()
        showToast({ content: 'Task added!' })
        setTimeout(() => replace({ url: 'page/index' }), 1200)
      },
    })
  },
})
