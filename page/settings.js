import { createWidget, widget, align, prop } from '@zos/ui'
import { back } from '@zos/router'

const ACCENT  = 0x4E8EF7
const TEXT    = 0xE8EFF5
const SECOND  = 0x7A9AB0
const MUTED   = 0x4A6A82
const CARD_BG = 0x0D1826
const CARD_PR = 0x182436

const ROW_X = 80, ROW_W = 320, ROW_H = 58, ROW_GAP = 10, START_Y = 70

Page({
  build() {
    this._buildTitle()
    this._buildRows()
  },

  _buildTitle() {
    createWidget(widget.BUTTON, {
      x: 18, y: 14, w: 44, h: 44,
      text: '<', text_size: 20,
      color: SECOND, normal_color: CARD_BG, press_color: CARD_PR,
      radius: 22, click_func: () => back(),
    })
    createWidget(widget.TEXT, {
      x: 0, y: 20, w: 480, h: 32,
      text: 'Settings', text_size: 22, color: TEXT,
      align_h: align.CENTER_H,
    })
  },

  _buildRows() {
    this._buildRow(0, 'Theme', 'Sky', ACCENT, null)
    this._buildRow(1, 'About', 'v1.0', MUTED, null)
  },

  _buildRow(i, label, value, valueColor, onTap) {
    const y = START_Y + i * (ROW_H + ROW_GAP)

    createWidget(widget.BUTTON, {
      x: ROW_X, y, w: ROW_W, h: ROW_H,
      text: '', normal_color: CARD_BG,
      press_color: onTap ? CARD_PR : CARD_BG,
      radius: 14,
      click_func: onTap || (() => {}),
    })

    createWidget(widget.TEXT, {
      x: ROW_X + 18, y, w: ROW_W - 110, h: ROW_H,
      text: label, text_size: 16, color: TEXT,
      align_h: align.LEFT, align_v: align.CENTER_V,
    })

    createWidget(widget.TEXT, {
      x: ROW_X + ROW_W - 88, y, w: 76, h: ROW_H,
      text: value, text_size: 15, color: valueColor,
      align_h: align.RIGHT, align_v: align.CENTER_V,
    })
  },
})
