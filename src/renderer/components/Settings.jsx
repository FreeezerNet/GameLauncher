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
import { useNativeFeatures } from './NativeFeatures';

export default function Settings() {
    const { autoLaunchEnabled, toggleAutoLaunch, traySettings, updateTraySettings } = useNativeFeatures();
    const [minimizeToTray, setMinimizeToTray] = useState(true);
    const [closeToTray, setCloseToTray] = useState(true);
    const toast = useToast();

    useEffect(() => {
        setMinimizeToTray(traySettings.minimizeToTray);
        setCloseToTray(traySettings.closeToTray);
    }, [traySettings]);

    async function handleAutoLaunchChange(event) {
        const newValue = event.target.checked;
        try {
            const success = await toggleAutoLaunch(newValue);
            if (success) {
                toast({
                    title: 'Success',
                    description: `Auto-launch ${newValue ? 'enabled' : 'disabled'}`,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                throw new Error('Failed to update auto-launch setting');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: `Failed to ${newValue ? 'enable' : 'disable'} auto-launch`,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    }

    async function handleTraySettingsChange(minimizeToTray, closeToTray) {
        try {
            const success = await updateTraySettings({
                minimizeToTray,
                closeToTray
            });

            if (success) {
                toast({
                    title: 'Success',
                    description: 'Tray settings updated',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                throw new Error('Failed to update tray settings');
            }
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
                            isChecked={autoLaunchEnabled}
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