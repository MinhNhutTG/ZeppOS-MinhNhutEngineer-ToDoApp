import { createWidget, widget, align, prop } from '@zos/ui'
import { back } from '@zos/router'
import { C, THEMES, getTheme } from './themeConfig'

const ROW_X = 80, ROW_W = 320, ROW_H = 58, ROW_GAP = 10, START_Y = 70

Page({
  build() {
    const theme     = getTheme()
    this._themeName = theme.name
    this._buildTitle()
    this._buildRows()
    this._registerCallbacks()
  },

  onHide()    { getApp().globalData.onThemeChanged = null },
  onDestroy() { getApp().globalData.onThemeChanged = null },

  _registerCallbacks() {
    getApp().globalData.onThemeChanged = () => {
      this._themeName = getTheme().name
      setTimeout(() => {
        try { this._applyTheme() } catch(e) {}
      }, 0)
    }
  },

  _applyTheme() {
    THEMES.forEach(theme => {
      try {
        this._themeValueTexts[theme.name].setProperty(prop.VISIBLE, theme.name === this._themeName)
      } catch(e) {}
    })
  },

  _buildTitle() {
    createWidget(widget.BUTTON, {
      x: 18, y: 14, w: 44, h: 44,
      text: '<', text_size: 20,
      color: C.TEXT_DIM, normal_color: C.CARD, press_color: C.CARD_PRESS,
      radius: 22, click_func: () => back(),
    })
    createWidget(widget.TEXT, {
      x: 0, y: 20, w: 480, h: 32,
      text: 'Settings', text_size: 22, color: C.TEXT, align_h: align.CENTER_H,
    })
  },

  _buildRows() {
    this._buildThemeRow()
    this._buildRow(1, 'About', 'v1.0', C.TEXT_MUTED, null)
  },

  _buildThemeRow() {
    const y = START_Y  // row index 0
    createWidget(widget.BUTTON, {
      x: ROW_X, y, w: ROW_W, h: ROW_H,
      text: '', normal_color: C.CARD, press_color: C.CARD,
      radius: 14, click_func: () => {},
    })
    createWidget(widget.TEXT, {
      x: ROW_X + 18, y, w: ROW_W - 110, h: ROW_H,
      text: 'Theme', text_size: 16, color: C.TEXT,
      align_h: align.LEFT, align_v: align.CENTER_V,
    })
    // One value TEXT per theme — label and color baked in, VISIBLE toggled
    this._themeValueTexts = {}
    THEMES.forEach(theme => {
      const t = createWidget(widget.TEXT, {
        x: ROW_X + ROW_W - 88, y, w: 76, h: ROW_H,
        text: theme.label, text_size: 15, color: theme.color,
        align_h: align.RIGHT, align_v: align.CENTER_V,
      })
      t.setProperty(prop.VISIBLE, theme.name === this._themeName)
      this._themeValueTexts[theme.name] = t
    })
  },

  _buildRow(i, label, value, valueColor, onTap) {
    const y = START_Y + i * (ROW_H + ROW_GAP)
    createWidget(widget.BUTTON, {
      x: ROW_X, y, w: ROW_W, h: ROW_H,
      text: '', normal_color: C.CARD,
      press_color: onTap ? C.CARD_PRESS : C.CARD,
      radius: 14, click_func: onTap || (() => {}),
    })
    createWidget(widget.TEXT, {
      x: ROW_X + 18, y, w: ROW_W - 110, h: ROW_H,
      text: label, text_size: 16, color: C.TEXT,
      align_h: align.LEFT, align_v: align.CENTER_V,
    })
    createWidget(widget.TEXT, {
      x: ROW_X + ROW_W - 88, y, w: 76, h: ROW_H,
      text: value, text_size: 15, color: valueColor,
      align_h: align.RIGHT, align_v: align.CENTER_V,
    })
  },
})
