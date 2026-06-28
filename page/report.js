import { createWidget, widget, align, prop } from '@zos/ui'
import { back } from '@zos/router'
import { localStorage } from '@zos/storage'

const ACCENT  = 0x4E8EF7
const TEXT    = 0xE8EFF5
const SECOND  = 0x7A9AB0
const CARD_BG = 0x0D1826
const TRACK   = 0x1A2848

const RING_SIZE = 176, LINE_W = 18
const RING_X = (480 - RING_SIZE) / 2, RING_Y = 72
const RING_RADIUS = RING_SIZE / 2 - LINE_W / 2
const ARC_START = -240, ARC_RANGE = 300

Page({
  build() {
    this._loadData()
    this._buildBack()
    this._buildTitle()
    this._buildRing()
    this._buildCards()
    this._buildWeekChart()
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
    } catch (e) {}
  },

  _buildBack() {
    createWidget(widget.BUTTON, {
      x: 18, y: 14, w: 44, h: 44,
      text: '<', text_size: 20,
      color: SECOND, normal_color: CARD_BG, press_color: 0x1A2E48,
      radius: 22, click_func: () => back(),
    })
  },

  _buildTitle() {
    createWidget(widget.TEXT, {
      x: 0, y: 20, w: 480, h: 30,
      text: 'Stats', text_size: 22, color: TEXT, align_h: align.CENTER_H,
    })
  },

  _buildRing() {
    const cx = 240, cy = RING_Y + RING_SIZE / 2

    createWidget(widget.ARC, {
      x: RING_X, y: RING_Y, w: RING_SIZE, h: RING_SIZE,
      radius: RING_RADIUS,
      start_angle: ARC_START, end_angle: ARC_START + ARC_RANGE,
      color: TRACK, line_width: LINE_W,
    })

    if (this.pct > 0) {
      createWidget(widget.ARC, {
        x: RING_X, y: RING_Y, w: RING_SIZE, h: RING_SIZE,
        radius: RING_RADIUS,
        start_angle: ARC_START,
        end_angle: ARC_START + Math.round(ARC_RANGE * this.pct / 100),
        color: ACCENT, line_width: LINE_W,
      })
    }

    createWidget(widget.TEXT, {
      x: cx - 60, y: cy - 26, w: 120, h: 40,
      text: `${this.pct}%`, text_size: 34, color: TEXT, align_h: align.CENTER_H,
    })
    createWidget(widget.TEXT, {
      x: cx - 50, y: cy + 16, w: 100, h: 20,
      text: 'DONE', text_size: 12, color: ACCENT, align_h: align.CENTER_H,
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

    cards.forEach((card, i) => {
      const x = startX + i * (cardW + gap)
      createWidget(widget.FILL_RECT, { x, y, w: cardW, h: cardH, radius: 14, color: CARD_BG })
      createWidget(widget.TEXT, {
        x, y: y + 10, w: cardW, h: 32,
        text: card.value, text_size: 26,
        color: card.accent ? ACCENT : TEXT,
        align_h: align.CENTER_H,
      })
      createWidget(widget.TEXT, {
        x, y: y + 44, w: cardW, h: 20,
        text: card.label, text_size: 11, color: SECOND, align_h: align.CENTER_H,
      })
    })
  },

  _buildWeekChart() {
    createWidget(widget.TEXT, {
      x: 0, y: 348, w: 480, h: 18,
      text: 'THIS WEEK', text_size: 11, color: 0x4A6A82, align_h: align.CENTER_H,
    })

    const today = new Date().getDay()
    const maxH = 32, barW = 14, gap = 12
    const totalW = 7 * barW + 6 * gap
    const startX = Math.round((480 - totalW) / 2)
    const baseY = 424

    for (let i = 0; i < 7; i++) {
      const isToday = i === today
      const h = isToday ? Math.max(8, Math.round(maxH * this.pct / 100)) : Math.round(maxH * 0.3)
      createWidget(widget.FILL_RECT, {
        x: startX + i * (barW + gap), y: baseY - h,
        w: barW, h, radius: 4,
        color: isToday ? ACCENT : TRACK,
      })
    }
  },
})
