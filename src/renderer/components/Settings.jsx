import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    FormControl,
    FormLabel,
    Switch,
    Heading,
    Divider,
    useToast
} from '@chakra-ui/react';

export default function Settings() {
    const [autoLaunch, setAutoLaunch] = useState(false);
    const [minimizeToTray, setMinimizeToTray] = useState(true);
    const [closeToTray, setCloseToTray] = useState(true);
    const toast = useToast();

    useEffect(() => {
        loadSettings();
    }, []);

    async function loadSettings() {
        try {
            // Load auto-launch setting
            const autoLaunchResult = await window.electron.getAutoLaunch();
            if (autoLaunchResult.success) {
                setAutoLaunch(autoLaunchResult.isEnabled);
            }

            // Load tray settings
            const traySettings = await window.electron.getTraySettings();
            setMinimizeToTray(traySettings.minimizeToTray);
            setCloseToTray(traySettings.closeToTray);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load settings',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    }

    async function handleAutoLaunchChange(event) {
        try {
            const result = await window.electron.toggleAutoLaunch(event.target.checked);
            if (result.success) {
                setAutoLaunch(event.target.checked);
                toast({
                    title: 'Success',
                    description: `Auto-launch ${event.target.checked ? 'enabled' : 'disabled'}`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: `Failed to ${event.target.checked ? 'enable' : 'disable'} auto-launch`,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    }

    async function handleTraySettingsChange(minimizeToTray, closeToTray) {
        try {
            const settings = await window.electron.setTraySettings({
                minimizeToTray,
                closeToTray
            });

            setMinimizeToTray(settings.minimizeToTray);
            setCloseToTray(settings.closeToTray);

            toast({
                title: 'Success',
                description: 'Tray settings updated',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update tray settings',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    }

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                <Heading size="lg">Settings</Heading>

                <Box>
                    <Heading size="md" mb={4}>Startup</Heading>
                    <FormControl display="flex" alignItems="center">
                        <FormLabel mb="0">
                            Launch on system startup
                        </FormLabel>
                        <Switch
                            isChecked={autoLaunch}
                            onChange={handleAutoLaunchChange}
                        />
                    </FormControl>
                </Box>

                <Divider />

                <Box>
                    <Heading size="md" mb={4}>System Tray</Heading>
                    <VStack spacing={4} align="stretch">
                        <FormControl display="flex" alignItems="center">
                            <FormLabel mb="0">
                                Minimize to system tray
                            </FormLabel>
                            <Switch
                                isChecked={minimizeToTray}
                                onChange={(e) => handleTraySettingsChange(e.target.checked, closeToTray)}
                            />
                        </FormControl>

                        <FormControl display="flex" alignItems="center">
                            <FormLabel mb="0">
                                Close to system tray
                            </FormLabel>
                            <Switch
                                isChecked={closeToTray}
                                onChange={(e) => handleTraySettingsChange(minimizeToTray, e.target.checked)}
                            />
                        </FormControl>
                    </VStack>
                </Box>
            </VStack>
        </Box>
    );
} 