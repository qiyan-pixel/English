const { contextBridge, ipcRenderer } = require("electron");

// Exposed to the page as window.electronAI. js/chat.js checks for this and,
// when present, routes AI provider calls through the main process instead
// of the page's own fetch() -- see main.js's "ai-call" handler for why.
contextBridge.exposeInMainWorld("electronAI", {
  call: (url, headers, body) => ipcRenderer.invoke("ai-call", { url, headers, body }),
});
