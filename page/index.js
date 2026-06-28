import { createWidget, widget, align, prop, event } from '@zos/ui'
import { Time } from '@zos/sensor'
import { push } from '@zos/router'
import { localStorage } from '@zos/storage'
import { C, THEMES, getTheme } from './themeConfig'

let appState = {
  currentFilter: 'all',
  tasks: [],
  nextId: 1,
}

Page({
  build() {
    this.filteredTasks = []
    const theme = getTheme()
    this._themeName = theme.name
    this._accent    = theme.color
    this._loadTasks()
    this._buildHeader()
    this._buildStats()
    this._buildTabs()
    this._buildTaskList()
    this._updateTaskList()
    this._updateStats()
    this._buildActionBar()
    this._registerCallbacks()
  },

  onShow() {
    const theme = getTheme()
    if (theme.name !== this._themeName) {
      this._themeName = theme.name
      this._accent    = theme.color
      this._applyTheme()
    }
    this._loadTasks()
    this._updateStats()
    this._updateTaskList()
    this._registerCallbacks()
  },

  onHide() {
    getApp().globalData.onTasksUpdated = null
    getApp().globalData.onThemeChanged = null
  },

  onDestroy() {
    if (this._clockTimer) clearInterval(this._clockTimer)
    getApp().globalData.onTasksUpdated = null
    getApp().globalData.onThemeChanged = null
  },

  _registerCallbacks() {
    getApp().globalData.onTasksUpdated = () => {
      try { this._loadTasks() }      catch(e) {}
      try { this._updateStats() }    catch(e) {}
      try { this._updateTaskList() } catch(e) {}
    }
    getApp().globalData.onThemeChanged = () => {
      try {
        const theme = getTheme()
        this._themeName = theme.name
        this._accent    = theme.color
      } catch(e) {}
      // Defer UI updates out of BLE callback context so ZeppOS render engine
      // can process BUTTON/FILL_RECT setProperty calls in a proper UI tick
      setTimeout(() => {
        try { this._applyTheme() } catch(e) {}
      }, 0)
    }
  },

  // Update all theme-dependent widgets — each step is independent
  _applyTheme() {
    THEMES.forEach(theme => {
      if (theme.name === this._themeName) return
      try { this._progressFills[theme.name].setProperty(prop.MORE, { x: 66, y: 11, w: 0, h: 6, radius: 3, color: theme.color }) } catch(e) {}
      try { this._statsPercents[theme.name].setProperty(prop.MORE, { x: -300, y: 3, w: 58, h: 24 }) } catch(e) {}
    })
    try { this._updateTabs() }      catch(e) {}
    try { this._updateStats() }     catch(e) {}
    try { this._updateTaskList() }  catch(e) {}
    try { this._actionBtnReport.setProperty(prop.MORE, { src: `report_${this._themeName}.png` }) } catch(e) {}
    try { this._actionBtnAdd.setProperty(prop.MORE,    { src: `plus_${this._themeName}.png`   }) } catch(e) {}
    try { this._actionBtnMore.setProperty(prop.MORE,   { src: `more_${this._themeName}.png`   }) } catch(e) {}
  },

  _loadTasks() {
    try {
      const raw = localStorage.getItem('todo_tasks')
      if (raw) {
        const saved = JSON.parse(raw)
        appState.tasks  = saved.tasks  || []
        appState.nextId = saved.nextId || 1
        return
      }
    } catch(e) {}
    appState.tasks  = []
    appState.nextId = 1
  },

  _saveTasks() {
    localStorage.setItem('todo_tasks', JSON.stringify({
      tasks: appState.tasks, nextId: appState.nextId,
    }))
    getApp().syncTasksToPhone()
  },

  _buildHeader() {
    this._timeWidget = createWidget(widget.TEXT, {
      x: 0, y: 8, w: 480, h: 40,
      text: '--:--', text_size: 34, color: C.TEXT, align_h: align.CENTER_H,
    })
    this._dateWidget = createWidget(widget.TEXT, {
      x: 0, y: 50, w: 480, h: 20,
      text: '', text_size: 13, color: C.TEXT_DIM, align_h: align.CENTER_H,
    })

    const _tick = () => {
      const t = new Time()
      const h = String(t.getHours()).padStart(2, '0')
      const m = String(t.getMinutes()).padStart(2, '0')
      this._timeWidget.setProperty(prop.TEXT, `${h}:${m}`)

      const days   = ['SUN','MON','TUE','WED','THU','FRI','SAT']
      const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
      // ZeppOS Time.getDay() does not exist; Time.getMonth() is 1-indexed (1-12)
      // Use native Date for weekday and month, Time for clock values
      const now   = new Date()
      const day   = days[now.getDay()]
      const date  = String(t.getDate()).padStart(2, '0')
      const month = months[now.getMonth()]
      this._dateWidget.setProperty(prop.TEXT, `${day}  ${date} ${month}`)
    }
    _tick()
    this._clockTimer = setInterval(_tick, 60000)
  },

  _buildStats() {
    const g = createWidget(widget.GROUP, { x: 90, y: 76, w: 300, h: 28 })

    this._statsText = g.createWidget(widget.TEXT, {
      x: 0, y: 3, w: 56, h: 24,
      text: '0/0', text_size: 16, color: C.TEXT_DIM, align_h: align.LEFT,
    })
    g.createWidget(widget.FILL_RECT, {
      x: 66, y: 11, w: 166, h: 6, radius: 3, color: C.TRACK,
    })
    // One FILL_RECT per theme — color baked in at creation, only width changes
    this._progressFills = {}
    THEMES.forEach(theme => {
      this._progressFills[theme.name] = g.createWidget(widget.FILL_RECT, {
        x: 66, y: 11, w: 0, h: 6, radius: 3, color: theme.color,
      })
    })
    // One TEXT per theme — color baked in at creation, shown/hidden by x position
    // prop.VISIBLE on TEXT inside GROUP can throw; off-screen x is the safe alternative
    this._statsPercents = {}
    THEMES.forEach(theme => {
      this._statsPercents[theme.name] = g.createWidget(widget.TEXT, {
        x: theme.name === this._themeName ? 242 : -300,
        y: 3, w: 58, h: 24,
        text: '0%', text_size: 16, color: theme.color, align_h: align.RIGHT,
      })
    })
  },

  _updateStats() {
    const total = appState.tasks.length
    const done  = appState.tasks.filter(t => t.done).length
    const pct   = total ? Math.round((done / total) * 100) : 0
    const fillW = Math.round(166 * pct / 100)
    const pctTxt = `${pct}%`

    this._statsText.setProperty(prop.TEXT, `${done}/${total}`)
    try {
      this._progressFills[this._themeName].setProperty(prop.MORE, {
        x: 66, y: 11, w: fillW, h: 6, radius: 3, color: this._accent,
      })
    } catch(e) {}
    try {
      this._statsPercents[this._themeName].setProperty(prop.TEXT, pctTxt)
      this._statsPercents[this._themeName].setProperty(prop.MORE, {
        x: 242, y: 3, w: 58, h: 24,
      })
    } catch(e) {}
  },

  _buildTabs() {
    const keys   = ['all', 'active', 'done']
    const labels = ['All', 'Active', 'Done']
    const tabW = 90, tabH = 34, gap = 12
    const totalW = 3 * tabW + 2 * gap
    const startX = Math.round((480 - totalW) / 2)

    // Buttons placed directly on the page — not inside GROUP — so that
    // setProperty(prop.MORE) can repaint them from theme-change callbacks
    this._tabBtns = keys.map((key, i) => {
      const isActive = appState.currentFilter === key
      return createWidget(widget.BUTTON, {
        x: startX + i * (tabW + gap), y: 110,
        w: tabW, h: tabH,
        text: labels[i], text_size: 15,
        color:        isActive ? C.BG        : C.TEXT_DIM,
        normal_color: isActive ? this._accent : C.CARD_PRESS,
        press_color:  C.TRACK,
        radius: 17,
        click_func: () => {
          if (appState.currentFilter === key) return
          appState.currentFilter = key
          this._updateTabs()
          this._updateTaskList()
        },
      })
    })
  },

  _updateTabs() {
    const keys   = ['all', 'active', 'done']
    const labels = ['All', 'Active', 'Done']
    const tabW = 90, tabH = 34, gap = 12
    const totalW = 3 * tabW + 2 * gap
    const startX = Math.round((480 - totalW) / 2)

    this._tabBtns.forEach((btn, i) => {
      try {
        const isActive = appState.currentFilter === keys[i]
        // Pass full spec so ZeppOS triggers a complete widget repaint
        btn.setProperty(prop.MORE, {
          x: startX + i * (tabW + gap), y: 110,
          w: tabW, h: tabH,
          text: labels[i], text_size: 15,
          color:        isActive ? C.BG        : C.TEXT_DIM,
          normal_color: isActive ? this._accent : C.CARD_PRESS,
          press_color:  C.TRACK,
          radius: 17,
        })
      } catch(e) {}
    })
  },

  _buildTaskList() {
    this._scrollList = createWidget(widget.SCROLL_LIST, {
      x: 60, y: 152, w: 360, h: 222,
      item_space: 8,
      item_enable_horizon_drag: true,
      item_drag_max_distance: -96,
      item_config: [
        {
          type_id: 1,
          item_bg_color: C.CARD, item_bg_radius: 12,
          text_view: [{ x: 54, y: 0, w: 300, h: 58, key: 'title', color: C.TEXT, text_size: 17, align_h: align.LEFT, align_v: align.CENTER_V }],
          text_view_count: 1,
          image_view: [
            { x: 8,   y: 10, w: 38, h: 38, key: 'icon',  action: true },
            { x: 388, y: 9,  w: 40, h: 40, key: 'trash', action: true },
          ],
          image_view_count: 2,
          item_height: 58,
        },
        {
          type_id: 2,
          item_bg_color: C.CARD_DARK, item_bg_radius: 12,
          text_view: [{ x: 54, y: 0, w: 300, h: 58, key: 'title', color: C.TEXT_MUTED, text_size: 17, align_h: align.LEFT, align_v: align.CENTER_V }],
          text_view_count: 1,
          image_view: [
            { x: 8,   y: 10, w: 38, h: 38, key: 'icon',  action: true },
            { x: 388, y: 9,  w: 40, h: 40, key: 'trash', action: true },
          ],
          image_view_count: 2,
          item_height: 58,
        },
      ],
      item_config_count: 2,
      data_array: [],
      data_count: 0,
      item_click_func: (list, index, data_key) => {
        const task = this.filteredTasks[index]
        if (!task) return

        if (data_key === 'trash') {
          appState.tasks = appState.tasks.filter(t => t.id !== task.id)
          this._saveTasks()
          this._updateStats()
          this._updateTaskList()
          return
        }

        const real = appState.tasks.find(t => t.id === task.id)
        if (!real) return
        real.done = !real.done
        this._saveTasks()
        this._updateStats()
        this._updateTaskList()
      },
    })
  },

  _updateTaskList() {
    const filtered = appState.tasks.filter(t => {
      if (appState.currentFilter === 'done')   return  t.done
      if (appState.currentFilter === 'active') return !t.done
      return true
    })
    this.filteredTasks = filtered

    const dataList = filtered.map(t => ({
      type_id: t.done ? 2 : 1,
      title: t.title,
      icon:  t.done
        ? `radio_${this._themeName}_on.png`
        : `radio_${this._themeName}_off.png`,
      trash: 'trash_red.png',
    }))

    this._scrollList.setProperty(prop.UPDATE_DATA, {
      data_array: dataList,
      data_count: dataList.length,
    })
  },

  _buildActionBar() {
    createWidget(widget.FILL_RECT, {
      x: 0, y: 356, w: 480, h: 124, color: 0x000000,
    })

    const g = createWidget(widget.GROUP, { x: 131, y: 376, w: 218, h: 70 })

    this._actionBtnReport = g.createWidget(widget.IMG, {
      x: 0, y: 5, w: 60, h: 60, src: `report_${this._themeName}.png`,
    })
    this._actionBtnReport.addEventListener(event.CLICK_DOWN, () => push({ url: 'page/report' }))

    this._actionBtnAdd = g.createWidget(widget.IMG, {
      x: 74, y: 0, w: 70, h: 70, src: `plus_${this._themeName}.png`,
    })
    this._actionBtnAdd.addEventListener(event.CLICK_DOWN, () => push({ url: 'page/addTask' }))

    this._actionBtnMore = g.createWidget(widget.IMG, {
      x: 158, y: 5, w: 60, h: 60, src: `more_${this._themeName}.png`,
    })
    this._actionBtnMore.addEventListener(event.CLICK_DOWN, () => push({ url: 'page/settings' }))
  },
})
