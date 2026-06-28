import { BaseApp } from '@zeppos/zml/base-app'
import { localStorage } from '@zos/storage'

App(
  BaseApp({
    globalData: {
      pendingTask: null,
      onTasksUpdated: null,
      onSuggestionsUpdated: null,
    },

    onCreate() {
      this._fetchSuggestions()
      this._fetchTasks()
    },

    onBleChanged(connected) {
      if (connected) {
        this._fetchSuggestions()
        this._fetchTasks()
      }
    },

    _fetchSuggestions() {
      try {
        this.request({ method: 'GET_SUGGESTIONS' })
          .then((res) => {
            if (res && res.suggestions) {
              localStorage.setItem('todo_suggestions', res.suggestions)
            }
          })
          .catch(() => {})
      } catch (e) {}
    },

    _fetchTasks() {
      try {
        this.request({ method: 'GET_TASKS' })
          .then((res) => {
            if (res && res.tasks) {
              localStorage.setItem('todo_tasks', res.tasks)
            }
          })
          .catch(() => {})
      } catch (e) {}
    },

    syncTasksToPhone() {
      try {
        const raw = localStorage.getItem('todo_tasks')
        if (!raw) return
        this.request({ method: 'SAVE_TASKS', tasks: raw }).catch(() => {})
      } catch (e) {}
    },

    onCall(data) {
      if (data && data.suggestions) {
        try {
          localStorage.setItem('todo_suggestions', data.suggestions)
          if (this.globalData.onSuggestionsUpdated) {
            this.globalData.onSuggestionsUpdated()
          }
        } catch (e) {}
      }
      if (data && data.tasks) {
        try {
          localStorage.setItem('todo_tasks', data.tasks)
          if (this.globalData.onTasksUpdated) {
            this.globalData.onTasksUpdated()
          }
        } catch (e) {}
      }
    },

    onDestroy() {},
  })
)
