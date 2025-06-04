import React, { useEffect, useState } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    Box,
    Text,
    VStack,
    HStack,
    Progress,
    Heading,
    Divider,
    IconButton,
    useToast,
    Tooltip,
    Flex
} from '@chakra-ui/react';
import { FaCopy } from 'react-icons/fa';
import { webApiService } from '../services/webApiService';

export default function GameStats({ isOpen, onClose, stats, game }) {
    const toast = useToast();
    const [weeklyStats, setWeeklyStats] = useState([]);
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        if (stats && stats.launchHistory) {
            // Get the last 7 days
            const today = new Date();
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                return date;
            }).reverse();

            // Calculate launches per day
            const dailyLaunches = last7Days.map(date => {
                const dayStart = new Date(date);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(date);
                dayEnd.setHours(23, 59, 59, 999);

                return {
                    day: daysOfWeek[date.getDay()],
                    date: date.toLocaleDateString(),
                    launches: (stats.launchHistory || []).filter(launch => {
                        const launchDate = new Date(launch.timestamp.seconds * 1000);
                        return launchDate >= dayStart && launchDate <= dayEnd;
                    }).length
                };
            });

            // Find maximum launches for progress bar scaling
            const maxLaunches = Math.max(...dailyLaunches.map(day => day.launches), 1);

            setWeeklyStats(dailyLaunches.map(day => ({
                ...day,
                percentage: (day.launches / maxLaunches) * 100
            })));
        }
    }, [stats]);

    const handleCopy = async () => {
        const formattedStats = webApiService.formatGameStats({ ...stats, name: game.name });
        const success = await webApiService.copyToClipboard(formattedStats);

        toast({
            title: success ? 'Statistics Copied' : 'Failed to Copy',
            description: success ? 'Game statistics have been copied to your clipboard' : 'Could not copy statistics to clipboard',
            status: success ? 'success' : 'error',
            duration: 3000,
            isClosable: true,
        });
    };

    if (!stats || !game) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    <Text mb={2}>{game.name} Statistics</Text>
                    <Flex justify="flex-end" mt={-8}>
                        <Tooltip label="Copy Statistics">
                            <IconButton
                                icon={<FaCopy />}
                                onClick={handleCopy}
                                aria-label="Copy Statistics"
                                size="sm"
                                mr={8}
                            />
                        </Tooltip>
                    </Flex>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <VStack spacing={4} align="stretch">
                        <Box>
                            <Heading size="sm" mb={2}>Overview</Heading>
                            <HStack justify="space-between">
                                <Text>Total Launches:</Text>
                                <Text fontWeight="bold">{stats.launchCount || 0}</Text>
                            </HStack>
                            <HStack justify="space-between">
                                <Text>Last Launched:</Text>
                                <Text fontWeight="bold">
                                    {stats.lastLaunched
                                        ? new Date(stats.lastLaunched.seconds * 1000).toLocaleString()
                                        : 'Never'}
                                </Text>
                            </HStack>
                        </Box>

                        <Divider />

                        <Box>
                            <Heading size="sm" mb={4}>Weekly Activity</Heading>
                            <VStack spacing={3} align="stretch">
                                {weeklyStats.map((day) => (
                                    <Box key={day.date}>
                                        <HStack justify="space-between" mb={1}>
                                            <Text fontSize="sm">{day.day}</Text>
                                            <Text fontSize="sm" fontWeight="bold">
                                                {day.launches} launch{day.launches !== 1 ? 'es' : ''}
                                            </Text>
                                        </HStack>
                                        <Progress
                                            value={day.percentage}
                                            size="sm"
                                            colorScheme="blue"
                                            borderRadius="full"
                                        />
                                    </Box>
                                ))}
                            </VStack>
                        </Box>
                    </VStack>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
} 