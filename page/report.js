import { createWidget, widget, align, prop } from '@zos/ui'
import { back } from '@zos/router'
import { localStorage } from '@zos/storage'
import { C, THEMES, getTheme } from './themeConfig'

const RING_SIZE = 176, LINE_W = 18
const RING_X = (480 - RING_SIZE) / 2, RING_Y = 72
const RING_RADIUS = RING_SIZE / 2 - LINE_W / 2
const ARC_START = -240, ARC_RANGE = 300

Page({
  build() {
    const theme = getTheme()
    this._accent    = theme.color
    this._themeName = theme.name
    this._loadData()
    this._buildBack()
    this._buildTitle()
    this._buildRing()
    this._buildCards()
    this._buildWeekChart()
    this._registerCallbacks()
  },

  onHide()    { getApp().globalData.onThemeChanged = null },
  onDestroy() { getApp().globalData.onThemeChanged = null },

  _registerCallbacks() {
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
      const isActive = theme.name === this._themeName
      try { this._ringArcs[theme.name].setProperty(prop.VISIBLE,     isActive && this.pct > 0) } catch(e) {}
      try { this._doneLabels[theme.name].setProperty(prop.VISIBLE,   isActive) } catch(e) {}
      try { this._cardDoneVals[theme.name].setProperty(prop.VISIBLE, isActive) } catch(e) {}
      try { this._todayBars[theme.name].setProperty(prop.VISIBLE,    isActive) } catch(e) {}
    })
  },

  _loadData() {
    this.total = 0; this.done = 0; this.left = 0; this.pct = 0
    try {
      const raw = localStorage.getItem('todo_tasks')
      if (raw) {
        const tasks = JSON.parse(raw).tasks || []
        this.total = tasks.length
        this.done  = tasks.filter(t => t.done).length
        this.left  = this.total - this.done
        this.pct   = this.total ? Math.round(this.done / this.total * 100) : 0
      }
    } catch(e) {}
  },

  _buildBack() {
    createWidget(widget.BUTTON, {
      x: 18, y: 14, w: 44, h: 44,
      text: '<', text_size: 20,
      color: C.TEXT_DIM, normal_color: C.CARD, press_color: C.CARD_PRESS,
      radius: 22, click_func: () => back(),
    })
  },

  _buildTitle() {
    createWidget(widget.TEXT, {
      x: 0, y: 20, w: 480, h: 30,
      text: 'Stats', text_size: 22, color: C.TEXT, align_h: align.CENTER_H,
    })
  },

  _buildRing() {
    const cx = 240, cy = RING_Y + RING_SIZE / 2

    createWidget(widget.ARC, {
      x: RING_X, y: RING_Y, w: RING_SIZE, h: RING_SIZE,
      radius: RING_RADIUS,
      start_angle: ARC_START, end_angle: ARC_START + ARC_RANGE,
      color: C.TRACK, line_width: LINE_W,
    })

    // One ARC per theme — color baked in, VISIBLE toggled on theme change
    this._ringArcs = {}
    THEMES.forEach(theme => {
      const arc = createWidget(widget.ARC, {
        x: RING_X, y: RING_Y, w: RING_SIZE, h: RING_SIZE,
        radius: RING_RADIUS,
        start_angle: ARC_START,
        end_angle: ARC_START + Math.round(ARC_RANGE * this.pct / 100),
        color: theme.color, line_width: LINE_W,
      })
      arc.setProperty(prop.VISIBLE, theme.name === this._themeName && this.pct > 0)
      this._ringArcs[theme.name] = arc
    })

    createWidget(widget.TEXT, {
      x: cx - 60, y: cy - 26, w: 120, h: 40,
      text: `${this.pct}%`, text_size: 34, color: C.TEXT, align_h: align.CENTER_H,
    })

    this._doneLabels = {}
    THEMES.forEach(theme => {
      const t = createWidget(widget.TEXT, {
        x: cx - 50, y: cy + 16, w: 100, h: 20,
        text: 'DONE', text_size: 12, color: theme.color, align_h: align.CENTER_H,
      })
      t.setProperty(prop.VISIBLE, theme.name === this._themeName)
      this._doneLabels[theme.name] = t
    })
  },

  _buildCards() {
    const cards = [
      { label: 'TOTAL', value: `${this.total}`, accent: false },
      { label: 'DONE',  value: `${this.done}`,  accent: true  },
      { label: 'LEFT',  value: `${this.left}`,  accent: false },
    ]
    const cardW = 108, cardH = 70, gap = 14
    const startX = Math.round((480 - (3 * cardW + 2 * gap)) / 2)
    const y = 264

    this._cardDoneVals = {}
    cards.forEach((card, i) => {
      const x = startX + i * (cardW + gap)
      createWidget(widget.FILL_RECT, { x, y, w: cardW, h: cardH, radius: 14, color: C.CARD })

      if (card.accent) {
        THEMES.forEach(theme => {
          const t = createWidget(widget.TEXT, {
            x, y: y + 10, w: cardW, h: 32,
            text: card.value, text_size: 26, color: theme.color, align_h: align.CENTER_H,
          })
          t.setProperty(prop.VISIBLE, theme.name === this._themeName)
          this._cardDoneVals[theme.name] = t
        })
      } else {
        createWidget(widget.TEXT, {
          x, y: y + 10, w: cardW, h: 32,
          text: card.value, text_size: 26, color: C.TEXT, align_h: align.CENTER_H,
        })
      }

      createWidget(widget.TEXT, {
        x, y: y + 44, w: cardW, h: 20,
        text: card.label, text_size: 11, color: C.TEXT_DIM, align_h: align.CENTER_H,
      })
    })
  },

  _buildWeekChart() {
    createWidget(widget.TEXT, {
      x: 0, y: 348, w: 480, h: 18,
      text: 'THIS WEEK', text_size: 11, color: C.TEXT_MUTED, align_h: align.CENTER_H,
    })
    const today = new Date().getDay()
    const maxH = 32, barW = 14, gap = 12
    const totalW = 7 * barW + 6 * gap
    const startX = Math.round((480 - totalW) / 2)
    const baseY = 424

    this._todayBars = {}
    for (let i = 0; i < 7; i++) {
      const isToday = i === today
      const h = isToday ? Math.max(8, Math.round(maxH * this.pct / 100)) : Math.round(maxH * 0.3)
      if (isToday) {
        THEMES.forEach(theme => {
          const bar = createWidget(widget.FILL_RECT, {
            x: startX + i * (barW + gap), y: baseY - h,
            w: barW, h, radius: 4, color: theme.color,
          })
          bar.setProperty(prop.VISIBLE, theme.name === this._themeName)
          this._todayBars[theme.name] = bar
        })
      } else {
        createWidget(widget.FILL_RECT, {
          x: startX + i * (barW + gap), y: baseY - h,
          w: barW, h, radius: 4, color: C.TRACK,
        })
      }
    }
  },
})
