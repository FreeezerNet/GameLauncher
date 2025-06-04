import React, { useState, useEffect } from 'react';
import {
    Box,
    VStack,
    Text,
    Progress,
    Badge,
    useToast,
    Button,
    Tooltip
} from '@chakra-ui/react';
import { webApiService } from '../services/webApiService';

export function SystemStatus() {
    const [batteryStatus, setBatteryStatus] = useState(null);
    const [location, setLocation] = useState(null);
    const [apiAvailability, setApiAvailability] = useState({});
    const toast = useToast();

    useEffect(() => {
        // Check API availability
        const availability = webApiService.checkApiAvailability();
        setApiAvailability(availability);

        // Set up battery status updates
        const updateBatteryStatus = () => {
            const status = webApiService.getBatteryStatus();
            setBatteryStatus(status);
        };

        updateBatteryStatus();
        const batteryInterval = setInterval(updateBatteryStatus, 60000); // Update every minute

        return () => clearInterval(batteryInterval);
    }, []);

    const handleGetLocation = async () => {
        try {
            const position = await webApiService.getCurrentLocation();
            setLocation(position);
        } catch (error) {
            toast({
                title: 'Location Error',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleTestNotification = async () => {
        try {
            await webApiService.showNotification('Test Notification', {
                body: 'This is a test notification from Game Launcher',
                tag: 'test'
            });
        } catch (error) {
            toast({
                title: 'Notification Error',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <Box p={4} borderWidth="1px" borderRadius="lg">
            <VStack spacing={4} align="stretch">
                <Text fontSize="xl" fontWeight="bold">System Status</Text>

                {/* API Availability */}
                <Box>
                    <Text fontWeight="semibold">API Availability:</Text>
                    <Badge colorScheme={apiAvailability.notifications ? 'green' : 'red'} mr={2}>
                        Notifications
                    </Badge>
                    <Badge colorScheme={apiAvailability.geolocation ? 'green' : 'red'} mr={2}>
                        Geolocation
                    </Badge>
                    <Badge colorScheme={apiAvailability.battery ? 'green' : 'red'}>
                        Battery
                    </Badge>
                </Box>

                {/* Battery Status */}
                {batteryStatus && (
                    <Box>
                        <Text fontWeight="semibold">Battery Status:</Text>
                        <Progress
                            value={batteryStatus.level}
                            colorScheme={batteryStatus.level > 20 ? 'green' : 'red'}
                            size="sm"
                            mb={2}
                        />
                        <Text fontSize="sm">
                            {batteryStatus.level}% - {batteryStatus.charging ? 'Charging' : 'Not Charging'}
                        </Text>
                    </Box>
                )}

                {/* Location */}
                <Box>
                    <Button size="sm" onClick={handleGetLocation} mb={2}>
                        Get Location
                    </Button>
                    {location && (
                        <Tooltip label="Click to copy coordinates">
                            <Text fontSize="sm" cursor="pointer" onClick={() => {
                                navigator.clipboard.writeText(`${location.latitude}, ${location.longitude}`);
                                toast({
                                    title: 'Copied',
                                    description: 'Coordinates copied to clipboard',
                                    status: 'success',
                                    duration: 2000,
                                });
                            }}>
                                Lat: {location.latitude.toFixed(6)}, Long: {location.longitude.toFixed(6)}
                                <br />
                                Accuracy: ±{Math.round(location.accuracy)}m
                            </Text>
                        </Tooltip>
                    )}
                </Box>

                {/* Test Notification */}
                <Button size="sm" onClick={handleTestNotification}>
                    Test Notification
                </Button>
            </VStack>
        </Box>
    );
} 