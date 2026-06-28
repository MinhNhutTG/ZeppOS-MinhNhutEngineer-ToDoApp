const DEFAULT_SUGGESTIONS = [
  'Buy groceries', 'Pay bills',
  'Call doctor',   'Do laundry',
  'Clean house',   'Exercise',
  'Read book',
]

AppSettingsPage({
  state: {
    suggestions: [],
    tasks: [],
    nextId: 1,
    props: {},
  },

  setState(props) {
    this.state.props = props

    const rawSugg = props.settingsStorage.getItem('todo_suggestions')
    this.state.suggestions = rawSugg ? JSON.parse(rawSugg) : [...DEFAULT_SUGGESTIONS]

    const rawTasks = props.settingsStorage.getItem('todo_tasks')
    if (rawTasks) {
      const parsed = JSON.parse(rawTasks)
      this.state.tasks = parsed.tasks || []
      this.state.nextId = parsed.nextId || 1
    } else {
      this.state.tasks = []
      this.state.nextId = 1
    }

  },

  saveSuggestions() {
    this.state.props.settingsStorage.setItem(
      'todo_suggestions',
      JSON.stringify(this.state.suggestions)
    )
  },

  saveTasks() {
    this.state.props.settingsStorage.setItem(
      'todo_tasks',
      JSON.stringify({ tasks: this.state.tasks, nextId: this.state.nextId })
    )
  },

  toggleTask(id) {
    this.state.tasks = this.state.tasks.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    )
    this.saveTasks()
  },

  deleteTask(id) {
    this.state.tasks = this.state.tasks.filter(t => t.id !== id)
    this.saveTasks()
  },

  addTask(val) {
    const title = val.trim()
    if (!title) return
    this.state.tasks = [...this.state.tasks, {
      id: this.state.nextId++,
      title,
      done: false,
    }]
    this.saveTasks()
  },

  editSuggestion(index, val) {
    const label = val.trim()
    if (!label) return
    this.state.suggestions = this.state.suggestions.map((s, i) => i === index ? label : s)
    this.saveSuggestions()
  },

  addSuggestion(val) {
    const label = val.trim()
    if (!label || this.state.suggestions.length >= 7) return
    this.state.suggestions = [...this.state.suggestions, label]
    this.saveSuggestions()
  },

  removeSuggestion(index) {
    this.state.suggestions = this.state.suggestions.filter((_, i) => i !== index)
    this.saveSuggestions()
  },

  build(props) {
    this.setState(props)

    const done  = this.state.tasks.filter(t => t.done).length
    const total = this.state.tasks.length

    const taskRows = this.state.tasks.map((task) =>
      View(
        {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            borderBottom: '1px solid #eaeaea',
            padding: '8px 0',
          },
        },
        [
          Button({
            label: task.done ? '✓' : '○',
            style: {
              fontSize: '16px',
              minWidth: '36px',
              height: '36px',
              borderRadius: '18px',
              background: task.done ? '#4E8EF7' : '#e0e0e0',
              color: task.done ? 'white' : '#555',
              marginRight: '10px',
              border: 'none',
            },
            onClick: () => this.toggleTask(task.id),
          }),
          View(
            { style: { flex: 1 } },
            [
              TextInput({
                label: '',
                value: task.title,
                subStyle: {
                  color: task.done ? '#aaa' : '#222',
                  fontSize: '14px',
                  textDecoration: task.done ? 'line-through' : 'none',
                },
                maxLength: 50,
                onChange: () => {},
              }),
            ]
          ),
          Button({
            label: 'Del',
            style: {
              fontSize: '12px',
              borderRadius: '20px',
              background: '#D85E33',
              color: 'white',
              marginLeft: '8px',
              border: 'none',
            },
            onClick: () => this.deleteTask(task.id),
          }),
        ]
      )
    )

    const suggestionRows = this.state.suggestions.map((item, i) =>
      View(
        {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            borderBottom: '1px solid #eaeaea',
            padding: '6px 0',
          },
        },
        [
          View({ style: { flex: 1 } }, [
            TextInput({
              label: '',
              value: item,
              subStyle: { color: '#333', fontSize: '14px' },
              maxLength: 30,
              onChange: (val) => this.editSuggestion(i, val),
            }),
          ]),
          Button({
            label: 'Delete',
            style: {
              fontSize: '12px',
              borderRadius: '30px',
              background: '#D85E33',
              color: 'white',
              marginLeft: '8px',
              border: 'none',
            },
            onClick: () => this.removeSuggestion(i),
          }),
        ]
      )
    )

    return View(
      { style: { padding: '16px 20px' } },
      [
        // ── Tasks section ──
        View(
          { style: { marginBottom: '8px' } },
          [
            View(
              {
                style: {
                  fontSize: '17px',
                  fontWeight: 'bold',
                  color: '#222',
                  marginBottom: '4px',
                },
              },
              [`Tasks  ${done}/${total} done`]
            ),
          ]
        ),

        View(
          { style: { marginBottom: '10px' } },
          [
            TextInput({
              label: 'Add new task (confirm to save)',
              onChange: (val) => this.addTask(val),
            }),
          ]
        ),

        taskRows.length > 0
          ? View(
              {
                style: {
                  border: '1px solid #eaeaea',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  background: 'white',
                  marginBottom: '24px',
                },
              },
              taskRows
            )
          : View(
              {
                style: {
                  padding: '14px 0',
                  color: '#aaa',
                  fontSize: '13px',
                  textAlign: 'center',
                  marginBottom: '24px',
                },
              },
              ['No tasks yet. Add from here or from your watch.']
            ),

        // ── Divider ──
        View(
          { style: { borderTop: '2px solid #ddd', marginBottom: '20px' } },
          []
        ),

        // ── Suggestions section ──
        View(
          { style: { marginBottom: '8px', fontSize: '17px', fontWeight: 'bold', color: '#222' } },
          ['Quick Pick Suggestions']
        ),

        View(
          { style: { marginBottom: '12px' } },
          [
            TextInput({
              label: this.state.suggestions.length < 7
                ? 'Add suggestion (tap to confirm)'
                : 'Max 7 suggestions reached',
              onChange: (val) => this.addSuggestion(val),
            }),
          ]
        ),

        suggestionRows.length > 0 &&
          View(
            {
              style: {
                border: '1px solid #eaeaea',
                borderRadius: '6px',
                padding: '4px 10px',
                background: 'white',
              },
            },
            suggestionRows
          ),
      ]
    )
  },
})
