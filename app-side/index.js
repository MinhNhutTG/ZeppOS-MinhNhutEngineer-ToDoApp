import { BaseSideService } from '@zeppos/zml/base-side'

AppSideService(
  BaseSideService({
    onInit() {},

    onRequest(req, res) {
      if (req.method === 'GET_SUGGESTIONS') {
        const raw = this.settings.getItem('todo_suggestions')
        res(null, { suggestions: raw || null })
      } else if (req.method === 'GET_TASKS') {
        const raw = this.settings.getItem('todo_tasks')
        res(null, { tasks: raw || null })
      } else if (req.method === 'SAVE_TASKS') {
        if (req.tasks) {
          this.settings.setItem('todo_tasks', req.tasks)
        }
        res(null, { ok: true })
      }
    },

    onSettingsChange({ key, newValue }) {
      if (key === 'todo_suggestions') {
        this.call({ suggestions: newValue })
      } else if (key === 'todo_tasks') {
        this.call({ tasks: newValue })
      }
    },

    onRun() {},
    onDestroy() {},
  })
)
