const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, session, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const AutoLaunch = require('auto-launch');
const Store = require('electron-store');
const crashReporterService = require('./services/crashReporterService');

// Development mode check
const isDev = process.env.NODE_ENV === 'development' || process.defaultApp || /[\\/]electron-prebuilt[\\/]/.test(process.execPath) || /[\\/]electron[\\/]/.test(process.execPath);

const store = new Store();
let mainWindow;
let tray = null;
let isQuitting = false;
let activeGameProcesses = new Map();

// Configure auto-launcher
const autoLauncher = new AutoLaunch({
    name: 'Game Launcher',
    path: process.execPath,
    isHidden: true
});

function setupSecurityPolicy() {
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                'Content-Security-Policy': [
                    "default-src 'self';",
                    isDev
                        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval';"
                        : "script-src 'self';",
                    "style-src 'self' 'unsafe-inline';",
                    "img-src 'self' data: https:;",
                    "connect-src 'self' https://firestore.googleapis.com https://*.firebaseio.com https://*.firebase.com https://*.googleapis.com ws://localhost:* http://localhost:*;",
                    "font-src 'self';",
                    "object-src 'none';",
                    "base-uri 'self';",
                    "form-action 'self';",
                    "frame-ancestors 'none';",
                    isDev ? "" : "upgrade-insecure-requests;"
                ].filter(Boolean).join(' ')
            }
        });
    });
}

// Get tray settings
function getTraySettings() {
    return {
        minimizeToTray: store.get('traySettings.minimizeToTray', true),
        closeToTray: store.get('traySettings.closeToTray', true),
        notificationsEnabled: store.get('traySettings.notifications', true)
    };
}

// Handle tray settings changes
ipcMain.handle('set-tray-settings', async (event, settings) => {
    store.set('traySettings', settings);
    return getTraySettings();
});

ipcMain.handle('get-tray-settings', async () => {
    return getTraySettings();
});

function updateTrayMenu(games = []) {
    if (!tray) return;

    const gameMenuItems = games.slice(0, 5).map(game => ({
        label: game.name,
        click: () => {
            mainWindow.show();
            launchGame(game.executablePath, game.id);
            mainWindow.webContents.send('game-launched', game.id);
        }
    }));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Game Launcher',
            click: () => {
                mainWindow.show();
            }
        },
        { type: 'separator' },
        {
            label: 'Recent Games',
            enabled: false
        },
        ...gameMenuItems,
        { type: 'separator' },
        {
            label: 'Add New Game',
            click: () => {
                mainWindow.show();
                mainWindow.webContents.send('menu-add-game');
            }
        },
        {
            label: 'View Statistics',
            click: () => {
                mainWindow.show();
                mainWindow.webContents.send('menu-view-statistics');
            }
        },
        { type: 'separator' },
        {
            label: 'Settings',
            click: () => {
                mainWindow.show();
                mainWindow.webContents.send('menu-open-settings');
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
}

function createTray() {
    try {
        // Create tray with app icon
        const iconPath = isDev
            ? path.join(process.cwd(), 'public', 'app-icon.png')
            : path.join(process.resourcesPath, 'app-icon.png');

        const icon = nativeImage.createFromPath(iconPath);
        tray = new Tray(icon);
        tray.setToolTip('Game Launcher');

        // Initialize with empty menu
        updateTrayMenu([]);

        tray.on('click', () => {
            if (mainWindow) {
                if (mainWindow.isVisible()) {
                    mainWindow.hide();
                } else {
                    mainWindow.show();
                    mainWindow.focus();
                }
            }
        });

        tray.on('double-click', () => {
            if (mainWindow) {
                mainWindow.show();
                mainWindow.focus();
            }
        });

        return true;
    } catch (error) {
        console.error('Failed to create tray:', error);
        return false;
    }
}

// Handle auto-launch toggle
ipcMain.handle('toggle-auto-launch', async (event, enable) => {
    try {
        if (isDev) {
            return { success: true };
        }

        if (enable) {
            await autoLauncher.enable();
        } else {
            await autoLauncher.disable();
        }
        return { success: true };
    } catch (error) {
        console.error('Auto-launch error:', error);
        return { success: false, error: error.message };
    }
});

// Check auto-launch status
ipcMain.handle('get-auto-launch', async () => {
    try {
        if (isDev) {
            return { success: true, isEnabled: false };
        }

        const isEnabled = await autoLauncher.isEnabled();
        return { success: true, isEnabled };
    } catch (error) {
        console.error('Get auto-launch status error:', error);
        return { success: false, error: error.message };
    }
});

async function monitorGameProcess(gameProcess, gameId) {
    try {
        // Increase monitoring interval to 5 seconds to reduce CPU usage
        const interval = setInterval(() => {
            if (!activeGameProcesses.has(gameId)) {
                clearInterval(interval);
                return;
            }

            try {
                process.kill(gameProcess.pid, 0);
            } catch (e) {
                clearInterval(interval);
                activeGameProcesses.delete(gameId);
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('game-exit', { gameId, code: 0 });
                }
            }
        }, 5000);

        // Cleanup function for the process
        const cleanup = () => {
            clearInterval(interval);
            activeGameProcesses.delete(gameId);
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('game-exit', { gameId, code: 0 });
            }
        };

        // Handle process exit
        gameProcess.once('exit', cleanup);
        gameProcess.once('error', (error) => {
            cleanup();
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('game-crash', {
                    gameId,
                    error: error.message,
                    type: 'launch-error'
                });
            }
        });

        // Ensure process is properly killed when app exits
        app.on('before-quit', () => {
            try {
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/pid', gameProcess.pid, '/f', '/t']);
                } else {
                    gameProcess.kill('SIGTERM');
                }
            } catch (error) {
                console.error('Error killing game process:', error);
            }
        });
    } catch (error) {
        console.error('Error monitoring game process:', error);
    }
}

async function launchGame(executablePath, gameId) {
    try {
        const gameProcess = spawn(executablePath, [], {
            detached: true,
            stdio: 'ignore',
            windowsHide: false
        });

        activeGameProcesses.set(gameId, gameProcess);

        monitorGameProcess(gameProcess, gameId);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Handle game launch request from renderer
ipcMain.handle('launch-game', async (event, { executablePath, gameId, name }) => {
    const result = await launchGame(executablePath, gameId);
    if (result.success) {
        mainWindow.webContents.send('game-launched', gameId);
    }
    return result;
});

// Update tray menu with recent games
ipcMain.handle('update-tray-games', async (event, games) => {
    updateTrayMenu(games);
});

// Handle executable file selection
ipcMain.handle('select-executable', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            { name: 'Executables', extensions: ['exe', 'bat', 'cmd'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        title: 'Select Game Executable'
    });

    if (!result.canceled) {
        return result.filePaths[0];
    }
    return null;
});

function createContextMenu() {
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Game Actions',
            submenu: [
                {
                    label: 'Add New Game',
                    click: () => {
                        mainWindow.webContents.send('menu-add-game');
                    }
                },
                { type: 'separator' },
                {
                    label: 'View Statistics',
                    click: () => {
                        mainWindow.webContents.send('menu-view-statistics');
                    }
                }
            ]
        },
        { type: 'separator' },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Developer',
            submenu: [
                { role: 'toggleDevTools' }
            ]
        },
        { type: 'separator' },
        {
            label: 'Settings',
            click: () => {
                mainWindow.webContents.send('menu-open-settings');
            }
        }
    ]);

    return contextMenu;
}

// Crash Reporter IPC Handlers
ipcMain.handle('get-crash-reports', async () => {
    return crashReporterService.getCrashReports();
});

ipcMain.handle('clear-crash-reports', async () => {
    return crashReporterService.clearCrashReports();
});

ipcMain.handle('report-renderer-crash', async (event, error) => {
    return crashReporterService.handleCrash('renderer', new Error(error.message));
});

// Test crash handler (only in development)
ipcMain.handle('test-crash', async () => {
    console.log('Test crash handler called, isDev:', isDev);
    if (isDev) {
        const error = new Error('Test crash triggered');
        console.log('Triggering test crash with error:', error);
        // Handle the crash with our crash reporter service before throwing
        await crashReporterService.handleCrash('main', error);
        throw error;
    }
    return Promise.reject(new Error('Test crashes only available in development mode'));
});

function createWindow() {
    // Initialize crash reporter
    crashReporterService.init();

    // Setup security policy
    setupSecurityPolicy();

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Set up context menu
    const contextMenu = createContextMenu();
    mainWindow.webContents.on('context-menu', (event) => {
        contextMenu.popup();
    });

    // Handle window minimize
    mainWindow.on('minimize', (event) => {
        const { minimizeToTray } = getTraySettings();
        if (minimizeToTray && tray) {
            event.preventDefault();
            mainWindow.hide();
            if (process.platform === 'win32') {
                tray.displayBalloon({
                    title: 'Game Launcher',
                    content: 'Application minimized to system tray'
                });
            }
        }
    });

    // Handle window close
    mainWindow.on('close', (event) => {
        const { closeToTray } = getTraySettings();
        if (!isQuitting && closeToTray && tray) {
            event.preventDefault();
            mainWindow.hide();
            if (process.platform === 'win32') {
                tray.displayBalloon({
                    title: 'Game Launcher',
                    content: 'Application is still running in the system tray'
                });
            }
            return false;
        }
    });

    // Add cleanup on window close
    mainWindow.on('closed', () => {
        // Clean up all active game processes
        for (const [gameId, process] of activeGameProcesses.entries()) {
            try {
                if (process.platform === 'win32') {
                    spawn('taskkill', ['/pid', process.pid, '/f', '/t']);
                } else {
                    process.kill('SIGTERM');
                }
            } catch (error) {
                console.error(`Error killing process for game ${gameId}:`, error);
            }
        }
        activeGameProcesses.clear();
    });
}

app.whenReady().then(() => {
    // Create window first
    createWindow();

    // Then create tray
    if (!createTray()) {
        console.error('Failed to initialize tray. Some features may not work properly.');
    }

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
