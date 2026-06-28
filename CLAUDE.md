# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A ZeppOS mini app (smartwatch app) for managing a TODO list. Runs on Zepp-branded watches via the ZeppOS 3.0 API. Built with the Zeus CLI toolchain.

## Development commands

```bash
# Start simulator / live preview on connected watch
zeus dev

# Build for production / store submission
zeus build

# Preview on simulator only
zeus preview
```

There is no test runner configured (`npm test` exits with an error by default).

## Three execution contexts

ZeppOS apps run code in three separate sandboxes — **do not import across them**:

| Context | Entry point | Where it runs | API access |
|---|---|---|---|
| Device | `page/*.js`, `app.js` | On the watch | `@zos/ui`, `@zos/sensor`, `@zos/router`, etc. |
| App-side | `app-side/index.js` | On the phone (companion) | Network, BLE bridge to device |
| Settings | `setting/index.js` | In ZeppLife app on phone | Settings UI only |

Communication between device and app-side goes through the ZeppOS messaging API, not direct imports.

## Screen shape variants

Assets live in `assets/default.{b,r,s}/` where `b` = band, `r` = round, `s` = square. The active target in `app.json` under `targets.default.platforms` controls which shape is used (`"st": "r"` = round, `"dw": 480` = display width).

Layout files follow the same convention: `page/index.r.layout.js` contains constants for round screens. Import these in the page file when pixel values must differ by shape.

## UI model

All UI is imperative — there are no templates or JSX. Every element is created with `createWidget(widget.TYPE, { x, y, w, h, ... })` and positioned absolutely. Widgets cannot be removed once created; hide them with `setProperty(prop.VISIBLE, false)` and replace by creating new ones (see `updateStats()` pattern in `page/index.js`).

## State management

`appState` in `page/index.js` is a module-level object (not `App.globalData`). It persists for the lifetime of the index page but is **not shared** with `page/addTask.js`. To pass data from addTask back to index, use `App.globalData` or ZeppOS's `router` param APIs. Currently, tasks added in `addTask.js` are never saved — the confirm button's click handler is commented out.

## Navigation

```js
import { push, pop } from '@zos/router'
push({ url: 'page/addTask' })   // navigate forward
pop()                            // go back
```

## App manifest (`app.json`)

- `targets.default.pages` — list of page paths (without `.js`), order matters (first = home page)
- `targets.default.platforms` — device targets by shape type and screen width
- `runtime.apiVersion` — ZeppOS API version compatibility range
- `i18n` keys for app name localisation

## i18n

Each context has its own `.po` file (`page/i18n/en-US.po`, `app-side/i18n/en-US.po`, `setting/i18n/en-US.po`). Use `gettext('key')` from `'i18n'` to look up strings. Strings used directly in widget `text:` fields are not automatically localised.

## TypeScript / type checking

`global.d.ts` references `@zeppos/device-types` to provide types for ZeppOS APIs. `jsconfig.json` enables `checkJs: true`, so JS files are type-checked. Run VS Code's JS language server or `tsc --noEmit` to surface type errors without building.
