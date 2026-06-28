import { BaseApp } from '@zeppos/zml/base-app'
import { localStorage } from '@zos/storage'

App(
  BaseApp({
    globalData: {
      pendingTask: null,
      onTasksUpdated: null,
      onSuggestionsUpdated: null,
      onThemeChanged: null,
    },

    onCreate() {
      this._fetchSuggestions()
      this._fetchTasks()
      this._fetchTheme()
    },

    onBleChanged(connected) {
      if (connected) {
        this._fetchSuggestions()
        this._fetchTasks()
        this._fetchTheme()
      }
    },

    _fetchSuggestions() {
      try {
        this.request({ method: 'GET_SUGGESTIONS' })
          .then((res) => {
            if (res && res.suggestions) {
              localStorage.setItem('todo_suggestions', res.suggestions)
              try {
                if (this.globalData.onSuggestionsUpdated) this.globalData.onSuggestionsUpdated()
              } catch(e) {}
            }
          })
          .catch(() => {})
      } catch(e) {}
    },

    _fetchTasks() {
      try {
        this.request({ method: 'GET_TASKS' })
          .then((res) => {
            if (res && res.tasks) {
              localStorage.setItem('todo_tasks', res.tasks)
              try {
                if (this.globalData.onTasksUpdated) this.globalData.onTasksUpdated()
              } catch(e) {}
            }
          })
          .catch(() => {})
      } catch(e) {}
    },

    _fetchTheme() {
      try {
        this.request({ method: 'GET_THEME' })
          .then((res) => {
            if (res && res.theme) {
              try { localStorage.setItem('todo_theme', res.theme) } catch(e) {}
              try {
                if (this.globalData.onThemeChanged) this.globalData.onThemeChanged()
              } catch(e) {}
            }
          })
          .catch(() => {})
      } catch(e) {}
    },

    syncTasksToPhone() {
      try {
        const raw = localStorage.getItem('todo_tasks')
        if (!raw) return
        this.request({ method: 'SAVE_TASKS', tasks: raw }).catch(() => {})
      } catch(e) {}
    },

    onCall(data) {
      if (data && data.suggestions) {
        try { localStorage.setItem('todo_suggestions', data.suggestions) } catch(e) {}
        try {
          if (this.globalData.onSuggestionsUpdated) this.globalData.onSuggestionsUpdated()
        } catch(e) {}
      }
      if (data && data.tasks) {
        const existing = localStorage.getItem('todo_tasks')
        try { localStorage.setItem('todo_tasks', data.tasks) } catch(e) {}
        if (existing !== data.tasks) {
          try {
            if (this.globalData.onTasksUpdated) this.globalData.onTasksUpdated()
          } catch(e) {}
        }
      }
      if (data && data.theme) {
        // Save first — UI callback failure must not lose the persisted value
        try { localStorage.setItem('todo_theme', data.theme) } catch(e) {}
        try {
          if (this.globalData.onThemeChanged) this.globalData.onThemeChanged()
        } catch(e) {}
      }
    },

    onDestroy() {},
  })
)
