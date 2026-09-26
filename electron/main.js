const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

const APP_VERSION = "1.0.0";

// In dev (npm start from this folder, nothing copied yet) load the site
// straight from the parent project so there's a single source of truth.
// In a packaged build, electron-builder bundles the site into ./site
// (see the "prepare" script in package.json), so prefer that when present.
function resolveSiteIndex() {
  const bundled = path.join(__dirname, "site", "index.html");
  if (fs.existsSync(bundled)) return bundled;
  return path.join(__dirname, "..", "index.html");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 820,
    minHeight: 600,
    title: `我的英语课 · My English Course  v${APP_VERSION}`,
    backgroundColor: "#00000000",
    vibrancy: "sidebar", // macOS native frosted-glass window background
    visualEffectState: "active",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.loadFile(resolveSiteIndex());

  win.webContents.on("did-finish-load", () => {
    const glassCss = fs.readFileSync(path.join(__dirname, "theme-glass.css"), "utf8");
    win.webContents.insertCSS(glassCss);
    win.webContents.executeJavaScript(
      `window.__ENGCOURSE_APP_VERSION__ = ${JSON.stringify(APP_VERSION)};`
    );
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Make the actual AI provider call from the main process (Node's own
// networking, not a browser context) so it is never subject to CORS,
// regardless of whether the provider supports direct browser calls.
ipcMain.handle("ai-call", async (_event, { url, headers, body }) => {
  try {
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  } catch (err) {
    return { ok: false, status: 0, text: JSON.stringify({ error: { message: String(err && err.message || err) } }) };
  }
});
