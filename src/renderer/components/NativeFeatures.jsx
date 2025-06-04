import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { gameService } from '../services/gameService';

const NativeFeaturesContext = createContext();

export function NativeFeaturesProvider({ children }) {
    const toast = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [traySettings, setTraySettings] = useState({
        minimizeToTray: true,
        closeToTray: true
    });
    const [autoLaunchEnabled, setAutoLaunchEnabled] = useState(false);

    useEffect(() => {
        // Load initial settings
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const trayConfig = await window.electron.getTraySettings();
            setTraySettings(trayConfig);

            const autoLaunchConfig = await window.electron.getAutoLaunch();
            setAutoLaunchEnabled(autoLaunchConfig.isEnabled);
        } catch (error) {
            console.error('Failed to load native settings:', error);
        }
    };

    const updateTraySettings = async (newSettings) => {
        try {
            const updatedSettings = await window.electron.setTraySettings(newSettings);
            setTraySettings(updatedSettings);
            return true;
        } catch (error) {
            console.error('Failed to update tray settings:', error);
            return false;
        }
    };

    const toggleAutoLaunch = async (enable) => {
        try {
            const result = await window.electron.toggleAutoLaunch(enable);
            if (result.success) {
                setAutoLaunchEnabled(enable);
            }
            return result.success;
        } catch (error) {
            console.error('Failed to toggle auto-launch:', error);
            return false;
        }
    };

    const launchGame = async (game) => {
        try {
            return await window.electron.launchGame({
                executablePath: game.executablePath,
                gameId: game.id,
                name: game.name
            });
        } catch (error) {
            console.error('Failed to launch game:', error);
            return { success: false, error: error.message };
        }
    };

    const updateTrayGames = async (games) => {
        try {
            await window.electron.updateTrayGames(games);
        } catch (error) {
            console.error('Failed to update tray games:', error);
        }
    };

    const value = {
        traySettings,
        autoLaunchEnabled,
        updateTraySettings,
        toggleAutoLaunch,
        launchGame,
        updateTrayGames
    };

    return (
        <NativeFeaturesContext.Provider value={value}>
            {children}
        </NativeFeaturesContext.Provider>
    );
}

export function useNativeFeatures() {
    const context = useContext(NativeFeaturesContext);
    if (!context) {
        throw new Error('useNativeFeatures must be used within a NativeFeaturesProvider');
    }
    return context;
} 