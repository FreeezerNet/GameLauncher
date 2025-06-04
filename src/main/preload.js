const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Game management
    selectExecutable: () => ipcRenderer.invoke('select-executable'),
    launchGame: (game) => ipcRenderer.invoke('launch-game', game),
    forceStopGame: (gameId) => ipcRenderer.invoke('force-stop-game', gameId),
    updateTrayGames: (games) => ipcRenderer.invoke('update-tray-games', games),
    minimizeToTray: () => ipcRenderer.invoke('minimize-to-tray'),

    // Settings
    getTraySettings: () => ipcRenderer.invoke('get-tray-settings'),
    setTraySettings: (settings) => ipcRenderer.invoke('set-tray-settings', settings),
    getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),
    toggleAutoLaunch: (enable) => ipcRenderer.invoke('toggle-auto-launch', enable),

    // Crash reporter methods
    getCrashReports: () => ipcRenderer.invoke('get-crash-reports'),
    clearCrashReports: () => ipcRenderer.invoke('clear-crash-reports'),
    reportRendererCrash: (error) => ipcRenderer.invoke('report-renderer-crash', {
        name: error.name,
        message: error.message,
        stack: error.stack
    }),

    // Menu event listeners
    onMenuAddGame: (callback) => ipcRenderer.on('menu-add-game', callback),
    onMenuViewStatistics: (callback) => ipcRenderer.on('menu-view-statistics', callback),
    onMenuOpenSettings: (callback) => ipcRenderer.on('menu-open-settings', callback),

    // Event listeners
    onGameExit: (callback) => ipcRenderer.on('game-exit', callback),
    onGameCrash: (callback) => ipcRenderer.on('game-crash', callback),
    onGameLaunched: (callback) => ipcRenderer.on('game-launched', callback),

    // Development only
    testCrash: () => process.env.NODE_ENV === 'development' ?
        ipcRenderer.invoke('test-crash') :
        Promise.reject(new Error('Test crashes only available in development mode'))
}); 