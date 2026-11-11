---
inclusion: auto
name: electron-conventions
description: Electron-specific patterns and IPC conventions for Skinwalker
---

# Electron Conventions for Skinwalker

## Architecture

```
┌─────────────────────────────────────────┐
│         Main Process (Node.js)          │
│      src/main/index.ts                  │
│  - Window management                    │
│  - IPC handlers                         │
│  - File system access                   │
│  - Native OS integration                │
└────────────┬────────────────────────────┘
             │ IPC Bridge
             │ (contextBridge)
┌────────────┴────────────────────────────┐
│      Preload Script (Isolated)          │
│     src/preload/index.ts                │
│  - Exposes window.skinwalker API        │
│  - Type-safe IPC wrapper                │
└────────────┬────────────────────────────┘
             │ window.skinwalker
┌────────────┴────────────────────────────┐
│     Renderer Process (Chromium)         │
│      src/renderer/                      │
│  - UI and player logic                  │
│  - Web Audio API                        │
│  - DOM manipulation                     │
└─────────────────────────────────────────┘
```

## IPC Patterns

### Main → Renderer (Send)
```typescript
// src/main/index.ts
win.webContents.send('channel-name', data);
```

### Renderer → Main (Invoke)
```typescript
// src/preload/index.ts
contextBridge.exposeInMainWorld('skinwalker', {
  doSomething: (arg: string) => ipcRenderer.invoke('do-something', arg)
});

// src/main/index.ts
ipcMain.handle('do-something', async (event, arg: string) => {
  // Handle request
  return result;
});

// src/renderer/main.ts
const result = await window.skinwalker.doSomething('value');
```

### Renderer → Main (Fire and Forget)
```typescript
// src/preload/index.ts
contextBridge.exposeInMainWorld('skinwalker', {
  sendMessage: (msg: string) => ipcRenderer.send('message', msg)
});

// src/main/index.ts
ipcMain.on('message', (event, msg: string) => {
  // Handle message
});
```

## Current IPC Channels

### Window Management
```typescript
// Set window size
window.skinwalker.setSize(width, height, minWidth?, minHeight?)

// Set window shape (Windows/Linux)
window.skinwalker.setShape(rects: Rectangle[])

// Clear shape temporarily
window.skinwalker.clearShapeForDrag()
window.skinwalker.restoreShape()

// Drag window
window.skinwalker.startDrag()
window.skinwalker.drag()
window.skinwalker.endDrag()

// Window controls
window.skinwalker.minimize()
window.skinwalker.maximize()
window.skinwalker.close()
```

### File Operations
```typescript
// Read audio file (workaround for file:// fetch restriction)
const arrayBuffer = await window.skinwalker.readAudioFile(filePath: string)

// Open file picker
const filePaths = await window.skinwalker.openFileDialog(options)
```

## Security Rules

### Context Isolation
- **Always** keep `contextIsolation: true` in webPreferences
- **Never** disable nodeIntegration
- **Never** expose raw ipcRenderer to renderer

### Preload Whitelist
Only expose what the renderer needs:

```typescript
// ✅ GOOD
contextBridge.exposeInMainWorld('skinwalker', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  readFile: (path: string) => ipcRenderer.invoke('file:read', path)
});

// ❌ BAD — Too permissive
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: ipcRenderer  // Never expose raw IPC!
});
```

### Input Validation
Always validate IPC arguments in main process:

```typescript
ipcMain.handle('window:set-size', (event, width: number, height: number) => {
  // Validate
  if (typeof width !== 'number' || typeof height !== 'number') {
    throw new Error('Invalid dimensions');
  }
  if (width < 380 || height < 380 || width > 2560 || height > 1440) {
    throw new Error('Dimensions out of range');
  }
  
  // Safe to proceed
  win.setSize(width, height);
});
```

## Window Management Patterns

### Creating Windows
```typescript
const win = new BrowserWindow({
  width: 480,
  height: 720,
  frame: false,           // Frameless
  transparent: true,      // Transparent background
  resizable: false,       // Fixed size
  webPreferences: {
    preload: join(__dirname, '../preload/index.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false        // Needed for some native modules
  }
});
```

### Window Shaping
```typescript
// Main process
ipcMain.handle('window:set-shape', (event, rects: Rectangle[]) => {
  if (process.platform === 'darwin') {
    return; // macOS doesn't support setShape
  }
  
  win.setShape(rects.map(r => ({
    x: Math.round(r.x),
    y: Math.round(r.y),
    width: Math.round(r.width),
    height: Math.round(r.height)
  })));
});
```

### High-DPI Handling
```typescript
// Pin size during operations to prevent growth
win.setBounds({ x, y, width, height });
win.setSize(width, height); // Re-apply immediately

// Or use size locking
const [origWidth, origHeight] = win.getSize();
win.setResizable(false); // During operation
win.setSize(origWidth, origHeight); // Restore after
```

## File Access Patterns

### Reading Files
```typescript
// Main process
ipcMain.handle('file:read', async (event, filePath: string) => {
  // Validate path (prevent directory traversal)
  if (filePath.includes('..') || !path.isAbsolute(filePath)) {
    throw new Error('Invalid path');
  }
  
  // Check file exists
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }
  
  // Read and return
  return fs.readFileSync(filePath);
});
```

### File Picker
```typescript
// Main process
ipcMain.handle('file:open-dialog', async (event, options) => {
  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'ogg'] }
    ],
    ...options
  });
  
  return result.filePaths;
});
```

## Development vs Production

### Different Loading
```typescript
if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
  // Dev: load from Vite dev server
  win.loadURL(process.env['ELECTRON_RENDERER_URL']);
} else {
  // Production: load from file
  win.loadFile(join(__dirname, '../renderer/index.html'));
}
```

### DevTools
```typescript
if (is.dev) {
  win.webContents.openDevTools();
}
```

## Common Pitfalls

### 1. File Protocol Restrictions
Chromium blocks `fetch()` on `file://` URLs:

```typescript
// ❌ DOESN'T WORK
const response = await fetch(`file:///C:/tracks/song.mp3`);

// ✅ USE IPC INSTEAD
const buffer = await window.skinwalker.readAudioFile(filePath);
```

### 2. Async IPC Deadlocks
Don't invoke IPC from within another IPC handler:

```typescript
// ❌ CAN DEADLOCK
ipcMain.handle('action-a', async () => {
  await ipcRenderer.invoke('action-b'); // Deadlock!
});

// ✅ USE EVENTS OR REFACTOR
ipcMain.handle('action-a', async () => {
  mainLogic(); // Keep handlers independent
});
```

### 3. Window Reference Timing
Wait for 'ready-to-show' before IPC:

```typescript
win.once('ready-to-show', () => {
  win.show();
  // Now safe to send IPC
  win.webContents.send('initialize', data);
});
```

### 4. Shape Persistence
Window shape resets on move/resize — must reapply:

```typescript
win.on('move', () => {
  reapplyShape();
});

win.on('resize', () => {
  reapplyShape();
});
```

## Type Safety

### Preload Types
```typescript
// src/preload/index.d.ts
export interface SkinwalkerAPI {
  minimize: () => Promise<void>;
  readAudioFile: (path: string) => Promise<ArrayBuffer>;
  // ... all exposed methods
}

declare global {
  interface Window {
    skinwalker: SkinwalkerAPI;
  }
}
```

### Renderer Usage
```typescript
// src/renderer/main.ts
// TypeScript knows about window.skinwalker
const buffer = await window.skinwalker.readAudioFile(path);
//                        ^-- Autocomplete works
```

## Performance Considerations

- **Batch IPC calls** when possible (one call with array > many calls)
- **Avoid IPC in hot paths** (e.g., every animation frame)
- **Cache results** from IPC when data doesn't change
- **Use events sparingly** — they bypass back-pressure

## Testing IPC

### Unit Testing
```typescript
// Mock window.skinwalker in tests
global.window = {
  skinwalker: {
    minimize: jest.fn(),
    readAudioFile: jest.fn().mockResolvedValue(new ArrayBuffer(100))
  }
} as any;
```

### Integration Testing
Use Spectron or Playwright for Electron to test full IPC flow.
