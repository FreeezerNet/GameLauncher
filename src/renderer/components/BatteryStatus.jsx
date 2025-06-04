import React, { useState, useEffect } from 'react';
import {
    Box,
    HStack,
    Text,
    Badge,
    Tooltip
} from '@chakra-ui/react';
import { webApiService } from '../services/webApiService';

export function BatteryStatus() {
    const [batteryStatus, setBatteryStatus] = useState(null);

    useEffect(() => {
        // Get initial battery status
        const status = webApiService.getBatteryStatus();
        setBatteryStatus(status);

        // Listen for battery status changes
        const handleBatteryChange = (event) => {
            setBatteryStatus(event.detail);
        };

        window.addEventListener('battery-status-changed', handleBatteryChange);

        return () => {
            window.removeEventListener('battery-status-changed', handleBatteryChange);
        };
    }, []);

    if (!batteryStatus) return null;

    return (
        <Tooltip label={`Battery ${batteryStatus.charging ? 'charging' : 'discharging'}`}>
            <Box
                px={3}
                py={2}
                borderRadius="md"
                bg="whiteAlpha.200"
                _hover={{ bg: 'whiteAlpha.300' }}
            >
                <HStack spacing={2}>
                    <Badge
                        colorScheme={batteryStatus.charging ? 'green' : batteryStatus.level > 20 ? 'blue' : 'red'}
                        variant="solid"
                    >
                        {batteryStatus.level}%
                    </Badge>
                    <Text fontSize="sm" color="gray.300">
                        {batteryStatus.charging ? '⚡' : '🔋'}
                    </Text>
                </HStack>
            </Box>
        </Tooltip>
    );
} 