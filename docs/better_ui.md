# Better UI — Frameless Window with Custom Window Controls

## Goal

Turn the app into a frameless ("headless") window with **only three buttons in the top-right corner** (minimize, maximize/restore, close) and **remove the native "App" menu entirely**, including its About/Learn More and Shortcuts dialogs.

## Current State

- `electron/main.ts` creates a normal framed `BrowserWindow` (default OS title bar).
- A one-item application menu called **App** is installed via
  `Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate))`, containing:
  - Learn More (About dialog with YouTube / GitHub links)
  - Shortcuts dialog
  - Reload
  - Zoom In / Out / Reset
  - Toggle Fullscreen
  - Quit
- Zoom (`Ctrl +`, `Ctrl -`, `Ctrl 0`) and navigation (`Ctrl+E`, `Ctrl+D`, `Ctrl+H`) are already handled in `webContents.on("before-input-event")`, so they survive menu removal.
- The renderer (`src/app/page.tsx`) has no top bar; content starts at the very top (`px-6 py-7`).
- Preload exposes a typed `electronAPI` via `contextBridge`; types live in `electron/types/electron-api-d.ts`.

## Decisions

- **Window style:** frameless (`frame: false`) with custom-drawn buttons in the app's own visual style.
- **Menu contents:** dropped entirely — no About / Learn More / Shortcuts UI.

## Changes

### 1. `electron/main.ts`

- **Window options** — add `frame: false` to `BrowserWindow` (keep `resizable`, `minimizable`, `maximizable` defaults, `icon`, and `webPreferences` unchanged). Optionally add `backgroundColor: "#f5f8f6"` to avoid a white flash.
- **Remove the menu** — delete the entire `menuTemplate` array and replace

  ```ts
  Menu.setApplicationMenu(Menu.buildFromTemplate(menuTemplate));
  ```

  with

  ```ts
  Menu.setApplicationMenu(null);
  ```

  `Menu` stays imported; `dialog`/`shell` remain used elsewhere, so imports stay valid.

- **Window-control IPC** — add handlers that resolve the sender's window and act only if it is `mainWindow`:

  ```ts
  ipcMain.on("window-minimize", (e) => win(e)?.minimize());
  ipcMain.on("window-toggle-maximize", (e) => {
      const w = win(e);
      if (!w) return;
      w.isMaximized() ? w.unmaximize() : w.maximize();
  });
  ipcMain.on("window-close", (e) => win(e)?.close());
  ipcMain.handle("window-is-maximized", (e) => win(e)?.isMaximized() ?? false);
  ```

- **State sync** — in `createWindow`, forward native changes to the renderer:

  ```ts
  mainWindow.on("maximize",   () => mainWindow?.webContents.send("window-maximized-changed", true));
  mainWindow.on("unmaximize", () => mainWindow?.webContents.send("window-maximized-changed", false));
  ```

- **Keep the existing `before-input-event`** zoom + `Ctrl+E/D/H` logic as-is (unaffected by menu removal).
- **Optional dev niceties** (recommended, since the Reload/DevTools menu roles disappear): in `before-input-event`, add `Ctrl+R` → `webContents.reload()`, `F11` → toggle fullscreen, and `Ctrl+Shift+I` → `openDevTools()` only when `!app.isPackaged`.

### 2. `electron/types/electron-api-d.ts`

Add to `ElectronAPI`:

```ts
export interface WindowControls {
    minimize: () => void;
    toggleMaximize: () => void;
    close: () => void;
    isMaximized: () => Promise<boolean>;
    onMaximizedChange: (callback: (maximized: boolean) => void) => () => void;
}

// ElectronAPI:
windowControls: WindowControls;
```

### 3. `electron/preload.ts`

Expose the API on the existing bridge:

```ts
windowControls: {
    minimize: () => ipcRenderer.send("window-minimize"),
    toggleMaximize: () => ipcRenderer.send("window-toggle-maximize"),
    close: () => ipcRenderer.send("window-close"),
    isMaximized: () => ipcRenderer.invoke("window-is-maximized"),
    onMaximizedChange: (callback) => {
        const listener = (_e: unknown, value: boolean) => callback(value);
        ipcRenderer.on("window-maximized-changed", listener);
        return () => ipcRenderer.removeListener("window-maximized-changed", listener);
    },
},
```

### 4. New `src/app/(components)/TitleBar.tsx` (client component)

- `fixed top-0 inset-x-0 h-10 z-50 flex items-center justify-between` with the app's palette (`bg-[#f5f8f6]`, thin `border-b border-[#e2e9e6]`).
- Left: small app name (e.g. "File Encrypter Decrypter") in muted text, `pointer-events-none` so it stays draggable.
- Right: exactly three `no-drag` buttons, ~46×32, with `aria-label`s:
  - minimize `—` → `windowControls.minimize()`
  - maximize/restore → `toggleMaximize()`, icon swaps via `isMaximized()` on mount + `onMaximizedChange` subscription
  - close `✕` → `close()`, red hover (`hover:bg-[#e81123] hover:text-white`)
- Returns `null` when `window.electronAPI?.windowControls` is missing, so the browser/dev-web build stays clean.
- Double-click-to-maximize is handled natively by the `-webkit-app-region: drag` area — no JS handler (avoids double-toggling).
- Clean up the `onMaximizedChange` subscription in the effect.

### 5. `src/app/globals.css`

```css
.titlebar { -webkit-app-region: drag; user-select: none; }
.titlebar button { -webkit-app-region: no-drag; }
```

If preferred, the same can be done with Tailwind arbitrary properties (`[-webkit-app-region:drag]`), but explicit CSS classes are clearer.

### 6. `src/app/layout.tsx` + `src/app/page.tsx`

- Render `<TitleBar />` inside `<body>` (above the `Suspense` block) — it is client-side, so `layout.tsx` stays a server component.
- In `page.tsx`, change the outer `px-6 py-7` to `px-6 pb-7 pt-14` (or `pt-[3.25rem]`) so the fixed bar does not cover content, and adjust the inner `min-h-[calc(100vh-3.5rem)]` accordingly so no scrollbar appears at normal zoom.

## Verification Checklist

- Drag the top bar, resize from all window edges, and confirm minimize/maximize/close all work.
- Icon flips to "restore" when maximized and back when unmaximized; window still starts maximized (`mainWindow.maximize()`).
- `Ctrl+E/D/H` and `Ctrl +/-/0` still work; `Alt+F4` and Windows snap (`Win+Arrow`) still work.
- No menu bar and no stray native title bar anywhere.
- `npm run build:electron`, then `npm run dev:electron` to check live; `npm test` still passes.

## Notes / Caveats

- The custom maximize button will not show Windows 11 snap layouts on hover (native-only feature); keyboard snap still works.
- On macOS, removing the menu also removes `Cmd+Q`; the app currently targets Windows builds, so this is likely fine — add a macOS fallback if needed.
- "Headless" here means **frameless/undecorated**, not a UI-less process — the window and its content still render.
