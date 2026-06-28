import { createWidget, widget, align, prop, event } from '@zos/ui'
import { Time } from '@zos/sensor'
import { push, replace } from '@zos/router'
import { localStorage } from '@zos/storage'

let appState = {
  currentFilter: 'all',
  tasks: [],
  nextId: 1,
}

Page({
  build() {
    this.filteredTasks = []
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
    this._loadTasks()
    this._updateStats()
    this._updateTaskList()
    this._registerCallbacks()
  },

  onHide() {
    getApp().globalData.onTasksUpdated = null
  },

  onDestroy() {
    getApp().globalData.onTasksUpdated = null
  },

  _registerCallbacks() {
    getApp().globalData.onTasksUpdated = () => {
      this._loadTasks()
      this._updateStats()
      this._updateTaskList()
    }
  },

  _loadTasks() {
    try {
      const raw = localStorage.getItem('todo_tasks')
      if (raw) {
        const saved = JSON.parse(raw)
        appState.tasks = saved.tasks || []
        appState.nextId = saved.nextId || 1
        return
      }
    } catch (e) {}
    appState.tasks = []
    appState.nextId = 1
  },

  _saveTasks() {
    localStorage.setItem('todo_tasks', JSON.stringify({
      tasks: appState.tasks,
      nextId: appState.nextId,
    }))
    getApp().syncTasksToPhone()
  },

  _buildHeader() {
    this._timeWidget = createWidget(widget.TEXT, {
      x: 0, y: 8, w: 480, h: 40,
      text: '--:--',
      text_size: 34,
      color: 0xE8EFF5,
      align_h: align.CENTER_H,
    })

    this._dateWidget = createWidget(widget.TEXT, {
      x: 0, y: 50, w: 480, h: 20,
      text: '',
      text_size: 13,
      color: 0x7A9AB0,
      align_h: align.CENTER_H,
    })

    const _tick = () => {
      const t = new Time()
      const h = String(t.getHours()).padStart(2, '0')
      const m = String(t.getMinutes()).padStart(2, '0')
      this._timeWidget.setProperty(prop.TEXT, `${h}:${m}`)

      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
                      'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
      const day = days[t.getDay()]
      const date = String(t.getDate()).padStart(2, '0')
      const month = months[t.getMonth()]
      this._dateWidget.setProperty(prop.TEXT, `${day}  ${date} ${month}`)
    }

    _tick()
    setInterval(_tick, 60000)
  },

  _buildStats() {
    this._statsGroup = createWidget(widget.GROUP, {
      x: 90, y: 76, w: 300, h: 28,
    })

    this._statsText = this._statsGroup.createWidget(widget.TEXT, {
      x: 0, y: 3, w: 56, h: 24,
      text: '0/0',
      text_size: 16,
      color: 0x7A9AB0,
      align_h: align.LEFT,
    })

    this._statsGroup.createWidget(widget.FILL_RECT, {
      x: 66, y: 11, w: 166, h: 6,
      radius: 3, color: 0x1A2848,
    })

    this._progressFill = this._statsGroup.createWidget(widget.FILL_RECT, {
      x: 66, y: 11, w: 0, h: 6,
      radius: 3, color: 0x4E8EF7,
    })

    this._statsPercent = this._statsGroup.createWidget(widget.TEXT, {
      x: 242, y: 3, w: 58, h: 24,
      text: '0%',
      text_size: 16,
      color: 0x4E8EF7,
      align_h: align.RIGHT,
    })
  },

  _updateStats() {
    const total = appState.tasks.length
    const done = appState.tasks.filter(t => t.done).length
    const pct = total ? Math.round((done / total) * 100) : 0

    this._statsText.setProperty(prop.TEXT, `${done}/${total}`)
    this._statsPercent.setProperty(prop.TEXT, `${pct}%`)
    this._progressFill.setProperty(prop.MORE, {
      x: 66, y: 11, w: Math.round(166 * pct / 100), h: 6,
      radius: 3, color: 0x4E8EF7,
    })
  },

  _buildTabs() {
    const keys   = ['all', 'active', 'done']
    const labels = ['All', 'Active', 'Done']
    const tabW = 90, tabH = 34, gap = 12
    const totalW = 3 * tabW + 2 * gap
    const startX = Math.round((480 - totalW) / 2)

    const group = createWidget(widget.GROUP, {
      x: startX, y: 110, w: totalW, h: tabH,
    })

    this._tabBtns = keys.map((key, i) => {
      const isActive = appState.currentFilter === key
      return group.createWidget(widget.BUTTON, {
        x: i * (tabW + gap), y: 0,
        w: tabW, h: tabH,
        text: labels[i],
        text_size: 15,
        color:        isActive ? 0x071020 : 0x7A9AB0,
        normal_color: isActive ? 0x4E8EF7 : 0x182436,
        press_color:  0x2A4A8A,
        radius: 17,
        click_func: () => {
          if (appState.currentFilter === key) return
          appState.currentFilter = key
          this._updateTabs()
          this._updateTaskList()
        }
      })
    })
  },

  _updateTabs() {
    const keys = ['all', 'active', 'done']
    this._tabBtns.forEach((btn, i) => {
      const isActive = appState.currentFilter === keys[i]
      btn.setProperty(prop.MORE, {
        color:        isActive ? 0x071020 : 0x7A9AB0,
        normal_color: isActive ? 0x4E8EF7 : 0x182436,
      })
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
          item_bg_color: 0x0D1826,
          item_bg_radius: 12,
          text_view: [{ x: 54, y: 0, w: 266, h: 58, key: 'title', color: 0xE8EFF5, text_size: 17, align_h: align.LEFT, align_v: align.CENTER_V }],
          text_view_count: 1,
          image_view: [
            { x: 8, y: 10, w: 38, h: 38, key: 'icon', action: true },
            { x: 372, y: 9, w: 40, h: 40, key: 'trash', action: true },
          ],
          image_view_count: 2,
          item_height: 58,
        },
        {
          type_id: 2,
          item_bg_color: 0x091018,
          item_bg_radius: 12,
          text_view: [{ x: 54, y: 0, w: 266, h: 58, key: 'title', color: 0x4A6A82, text_size: 17, align_h: align.LEFT, align_v: align.CENTER_V }],
          text_view_count: 1,
          image_view: [
            { x: 8, y: 10, w: 38, h: 38, key: 'icon', action: true },
            { x: 372, y: 9, w: 40, h: 40, key: 'trash', action: true },
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
      }
    })
  },

  _updateTaskList() {
    const filtered = appState.tasks.filter(t => {
      if (appState.currentFilter === 'done')   return t.done
      if (appState.currentFilter === 'active') return !t.done
      return true
    })
    this.filteredTasks = filtered

    const dataList = filtered.map(t => ({
      type_id: t.done ? 2 : 1,
      title: t.title,
      icon: t.done ? 'radio_sky_on.png' : 'radio_sky_off.png',
      trash: 'trash_red.png',
    }))

    this._scrollList.setProperty(prop.UPDATE_DATA, {
      data_array: dataList,
      data_count: dataList.length,
    })
  },

  _buildActionBar() {
    createWidget(widget.FILL_RECT, {
      x: 0, y: 356, w: 480, h: 124,
      color: 0x000000,
    })

    // report(60) + gap(14) + plus(70) + gap(14) + more(60) = 218
    const group = createWidget(widget.GROUP, {
      x: 131, y: 376, w: 218, h: 70,
    })

    const btnReport = group.createWidget(widget.IMG, {
      x: 0, y: 5, w: 60, h: 60,
      src: 'report_sky.png',
    })
    btnReport.addEventListener(event.CLICK_DOWN, () => {
      push({ url: 'page/report' })
    })

    const btnAdd = group.createWidget(widget.IMG, {
      x: 74, y: 0, w: 70, h: 70,
      src: 'plus_sky.png',
    })
    btnAdd.addEventListener(event.CLICK_DOWN, () => {
      push({ url: 'page/addTask' })
    })

    const btnMore = group.createWidget(widget.IMG, {
      x: 158, y: 5, w: 60, h: 60,
      src: 'more_sky.png',
    })
    btnMore.addEventListener(event.CLICK_DOWN, () => {
      push({ url: 'page/settings' })
    })
  }
})
