const { Notification, Menu, dialog } = require('electron');
const path = require('path');

class NativeFeatures {
    constructor(mainWindow, tray) {
        this.mainWindow = mainWindow;
        this.tray = tray;
        this.setupContextMenu();
    }

    setupContextMenu() {
        const contextMenu = Menu.buildFromTemplate([
            {
                label: 'File',
                submenu: [
                    {
                        label: 'Add Game',
                        click: () => {
                            this.mainWindow.show();
                            this.mainWindow.webContents.send('menu-add-game');
                        }
                    },
                    { type: 'separator' },
                    { role: 'quit' }
                ]
            },
            {
                label: 'View',
                submenu: [
                    { role: 'reload' },
                    { role: 'forceReload' },
                    { role: 'toggleDevTools' },
                    { type: 'separator' },
                    { role: 'resetZoom' },
                    { role: 'zoomIn' },
                    { role: 'zoomOut' },
                    { type: 'separator' },
                    { role: 'togglefullscreen' }
                ]
            },
            {
                label: 'Window',
                submenu: [
                    { role: 'minimize' },
                    { role: 'zoom' },
                    { role: 'close' }
                ]
            }
        ]);

        Menu.setApplicationMenu(contextMenu);
    }

    showNotification(title, body, onClick = null) {
        if (!Notification.isSupported()) {
            console.warn('Notifications are not supported on this system');
            return;
        }

        const notification = new Notification({
            title,
            body,
            icon: path.join(__dirname, '../../public/app-icon.png')
        });

        if (onClick) {
            notification.on('click', onClick);
        }

        notification.show();
    }

    async showGameLaunchDialog(game) {
        const result = await dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'Launch Game',
            message: `Do you want to launch ${game.name}?`,
            buttons: ['Launch', 'Cancel'],
            defaultId: 0,
            cancelId: 1
        });

        return result.response === 0;
    }

    updateTrayMenu(games = []) {
        if (!this.tray) return;

        const gameMenuItems = games.slice(0, 5).map(game => ({
            label: game.name,
            click: () => {
                this.mainWindow.show();
                this.mainWindow.webContents.send('launch-game', game.id);
            }
        }));

        const trayMenu = Menu.buildFromTemplate([
            {
                label: 'Open Game Launcher',
                click: () => this.mainWindow.show()
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
                    this.mainWindow.show();
                    this.mainWindow.webContents.send('menu-add-game');
                }
            },
            { type: 'separator' },
            {
                label: 'Quit',
                click: () => {
                    this.mainWindow.destroy();
                    app.quit();
                }
            }
        ]);

        this.tray.setContextMenu(trayMenu);
    }
}

module.exports = NativeFeatures; 