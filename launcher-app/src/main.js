const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let mainWindow;
let backendProcess = null;
let gmProcess = null;
let playerProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 420,
    title: 'Dragontail Launcher',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    resizable: false,
    autoHideMenuBar: true,
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  killAll();
  app.quit();
});

function killAll() {
  [backendProcess, gmProcess, playerProcess].forEach(p => {
    if (p) { p.kill(); }
  });
}

function startService(name, cwd, command, args) {
  const proc = spawn(command, args, { cwd, stdio: 'pipe' });
  proc.stdout.on('data', (data) => {
    mainWindow?.webContents.send('log', { service: name, text: data.toString().trim() });
  });
  proc.stderr.on('data', (data) => {
    mainWindow?.webContents.send('log', { service: name, text: data.toString().trim() });
  });
  return proc;
}

ipcMain.on('start-backend', () => {
  if (!backendProcess) {
    backendProcess = startService('Backend', path.join(__dirname, '..', 'backend'), 'npx', ['tsx', 'src/server.ts']);
    mainWindow?.webContents.send('status', { service: 'backend', running: true });
  }
});

ipcMain.on('start-gm', () => {
  if (!gmProcess) {
    gmProcess = startService('GM Client', path.join(__dirname, '..', 'gm-client'), 'npx', ['vite', '--port', '5173']);
    mainWindow?.webContents.send('status', { service: 'gm', running: true });
  }
});

ipcMain.on('start-player', () => {
  if (!playerProcess) {
    playerProcess = startService('Player Client', path.join(__dirname, '..', 'player-client'), 'npx', ['vite', '--port', '5174']);
    mainWindow?.webContents.send('status', { service: 'player', running: true });
  }
});

ipcMain.on('stop-all', () => {
  killAll();
  backendProcess = gmProcess = playerProcess = null;
  mainWindow?.webContents.send('status', { service: 'all', running: false });
});
