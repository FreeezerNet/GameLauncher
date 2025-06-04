// Web API Service for Game Launcher
// Implements Battery Status, Clipboard, and Permissions APIs

class WebApiService {
    constructor() {
        this.batteryManager = null;
        this.setupBatteryAPI();
        this.checkPermissions();
    }

    // 1. Battery Status API
    async setupBatteryAPI() {
        try {
            if ('getBattery' in navigator) {
                this.batteryManager = await navigator.getBattery();
                this.setupBatteryListeners();
            } else {
                console.warn('Battery Status API not supported');
            }
        } catch (error) {
            console.error('Error setting up Battery API:', error);
        }
    }

    setupBatteryListeners() {
        if (!this.batteryManager) return;

        this.batteryManager.addEventListener('chargingchange', () => {
            this.emitBatteryStatus();
        });
        this.batteryManager.addEventListener('levelchange', () => {
            this.emitBatteryStatus();
        });

        // Emit initial status
        this.emitBatteryStatus();
    }

    emitBatteryStatus() {
        if (!this.batteryManager) return null;

        const status = {
            charging: this.batteryManager.charging,
            level: Math.round(this.batteryManager.level * 100),
            chargingTime: this.batteryManager.chargingTime,
            dischargingTime: this.batteryManager.dischargingTime
        };

        // Dispatch event for components to listen to
        window.dispatchEvent(new CustomEvent('battery-status-changed', {
            detail: status
        }));

        return status;
    }

    getBatteryStatus() {
        return this.batteryManager ? {
            charging: this.batteryManager.charging,
            level: Math.round(this.batteryManager.level * 100),
            chargingTime: this.batteryManager.chargingTime,
            dischargingTime: this.batteryManager.dischargingTime
        } : null;
    }

    // 2. Clipboard API for copying game statistics
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }

    formatGameStats(gameStats) {
        return `Game Statistics for ${gameStats.name}
-------------------
Total Launches: ${gameStats.launchCount || 0}
Last Launched: ${gameStats.lastLaunched ? new Date(gameStats.lastLaunched.seconds * 1000).toLocaleString() : 'Never'}
Total Play Time: ${gameStats.totalPlayTime || '0'} minutes
Added to Library: ${gameStats.createdAt ? new Date(gameStats.createdAt.seconds * 1000).toLocaleString() : 'Unknown'}`;
    }

    // 3. Permissions API for managing permissions
    async checkPermissions() {
        if (!navigator.permissions) {
            console.warn('Permissions API not supported');
            return;
        }

        try {
            // Check notifications permission
            const notificationPermission = await navigator.permissions.query({ name: 'notifications' });
            notificationPermission.addEventListener('change', () => {
                console.log('Notification permission changed:', notificationPermission.state);
            });

            return {
                notifications: notificationPermission.state
            };
        } catch (error) {
            console.error('Error checking permissions:', error);
            return null;
        }
    }

    // Request notification permission
    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            return false;
        }
    }
}

export const webApiService = new WebApiService(); 