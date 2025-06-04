import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Heading,
    VStack,
    HStack,
    Text,
    Checkbox,
    Flex,
    Select,
    useColorModeValue,
    Card,
    CardBody,
    Stack,
    Stat,
    StatLabel,
    StatNumber,
    StatGroup,
} from '@chakra-ui/react';
import { useAuth } from '../contexts/AuthContext';
import { gameService } from '../services/gameService';

export default function StatisticsPage() {
    const [games, setGames] = useState([]);
    const [selectedGames, setSelectedGames] = useState(new Set());
    const [timeRange, setTimeRange] = useState('week'); // week, month, year
    const { user } = useAuth();
    const chartBg = useColorModeValue('white', 'gray.700');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // Load games and their stats
    useEffect(() => {
        const loadGamesAndStats = async () => {
            try {
                const userGames = await gameService.getUserGames(user.uid);
                const gamesWithStats = await Promise.all(
                    userGames.map(async (game) => {
                        const stats = await gameService.getGameStats(game.id);
                        return { ...game, stats };
                    })
                );
                setGames(gamesWithStats);
                // Initially select all games
                setSelectedGames(new Set(gamesWithStats.map(g => g.id)));
            } catch (error) {
                console.error('Error loading games and stats:', error);
            }
        };

        loadGamesAndStats();
    }, [user.uid]);

    // Process data for the chart based on selected time range and games
    const chartData = useMemo(() => {
        const now = new Date();
        let dates = [];
        let dateFormat = {};

        switch (timeRange) {
            case 'week':
                dates = Array.from({ length: 7 }, (_, i) => {
                    const date = new Date(now);
                    date.setDate(date.getDate() - i);
                    return date;
                }).reverse();
                dateFormat = { weekday: 'short' };
                break;
            case 'month':
                dates = Array.from({ length: 30 }, (_, i) => {
                    const date = new Date(now);
                    date.setDate(date.getDate() - i);
                    return date;
                }).reverse();
                dateFormat = { month: 'short', day: 'numeric' };
                break;
            case 'year':
                dates = Array.from({ length: 12 }, (_, i) => {
                    const date = new Date(now);
                    date.setMonth(date.getMonth() - i);
                    return date;
                }).reverse();
                dateFormat = { month: 'short' };
                break;
        }

        const data = dates.map(date => {
            const dayStart = new Date(date);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(date);
            dayEnd.setHours(23, 59, 59, 999);

            const gameLaunches = {};
            games.forEach(game => {
                if (selectedGames.has(game.id)) {
                    gameLaunches[game.id] = (game.stats?.launchHistory || []).filter(launch => {
                        const launchDate = new Date(launch.timestamp.seconds * 1000);
                        return launchDate >= dayStart && launchDate <= dayEnd;
                    }).length;
                }
            });

            return {
                date: date.toLocaleDateString(undefined, dateFormat),
                ...gameLaunches
            };
        });

        return data;
    }, [games, selectedGames, timeRange]);

    // Calculate total launches for each selected game
    const gameTotals = useMemo(() => {
        return games.reduce((acc, game) => {
            if (selectedGames.has(game.id)) {
                acc[game.id] = game.stats?.launchCount || 0;
            }
            return acc;
        }, {});
    }, [games, selectedGames]);

    // Handle game selection
    const handleGameToggle = (gameId) => {
        const newSelected = new Set(selectedGames);
        if (newSelected.has(gameId)) {
            newSelected.delete(gameId);
        } else {
            newSelected.add(gameId);
        }
        setSelectedGames(newSelected);
    };

    // Generate random colors for games
    const gameColors = useMemo(() => {
        return games.reduce((acc, game) => {
            acc[game.id] = `hsl(${Math.random() * 360}, 70%, 50%)`;
            return acc;
        }, {});
    }, [games]);

    return (
        <Box p={6}>
            <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center">
                    <Heading size="lg">Game Launch Statistics</Heading>
                    <Select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        width="200px"
                    >
                        <option value="week">Last 7 Days</option>
                        <option value="month">Last 30 Days</option>
                        <option value="year">Last 12 Months</option>
                    </Select>
                </Flex>

                <HStack spacing={8} align="flex-start">
                    {/* Chart Area */}
                    <Box
                        flex={1}
                        p={4}
                        borderRadius="lg"
                        bg={chartBg}
                        borderWidth={1}
                        borderColor={borderColor}
                        h="400px"
                    >
                        <svg width="100%" height="100%" viewBox="0 0 800 400">
                            {/* X-axis */}
                            <line x1="50" y1="350" x2="750" y2="350" stroke="currentColor" />
                            {/* Y-axis */}
                            <line x1="50" y1="50" x2="50" y2="350" stroke="currentColor" />

                            {/* Plot the data */}
                            {games.map((game) => {
                                if (!selectedGames.has(game.id)) return null;

                                const maxLaunches = Math.max(...chartData.map(d => d[game.id] || 0));
                                const points = chartData.map((d, i) => {
                                    const x = 50 + (700 / (chartData.length - 1)) * i;
                                    const y = 350 - (d[game.id] || 0) * (300 / maxLaunches);
                                    return `${x},${y}`;
                                });

                                return (
                                    <g key={game.id}>
                                        <polyline
                                            points={points.join(' ')}
                                            fill="none"
                                            stroke={gameColors[game.id]}
                                            strokeWidth="2"
                                        />
                                    </g>
                                );
                            })}

                            {/* X-axis labels */}
                            {chartData.map((d, i) => (
                                <text
                                    key={i}
                                    x={50 + (700 / (chartData.length - 1)) * i}
                                    y="370"
                                    textAnchor="middle"
                                    fontSize="12"
                                >
                                    {d.date}
                                </text>
                            ))}
                        </svg>
                    </Box>

                    {/* Game Selection and Stats */}
                    <Card minW="300px">
                        <CardBody>
                            <VStack align="stretch" spacing={4}>
                                <Heading size="sm">Games</Heading>
                                {games.map(game => (
                                    <HStack key={game.id} justify="space-between">
                                        <Checkbox
                                            isChecked={selectedGames.has(game.id)}
                                            onChange={() => handleGameToggle(game.id)}
                                            colorScheme="blue"
                                        >
                                            <HStack>
                                                <Box
                                                    w="3"
                                                    h="3"
                                                    borderRadius="full"
                                                    bg={gameColors[game.id]}
                                                />
                                                <Text>{game.name}</Text>
                                            </HStack>
                                        </Checkbox>
                                        <Text fontSize="sm" color="gray.500">
                                            {gameTotals[game.id] || 0} launches
                                        </Text>
                                    </HStack>
                                ))}
                            </VStack>
                        </CardBody>
                    </Card>
                </HStack>

                {/* Summary Statistics */}
                <StatGroup>
                    <Stat>
                        <StatLabel>Total Games</StatLabel>
                        <StatNumber>{games.length}</StatNumber>
                    </Stat>
                    <Stat>
                        <StatLabel>Total Launches</StatLabel>
                        <StatNumber>
                            {Object.values(gameTotals).reduce((a, b) => a + b, 0)}
                        </StatNumber>
                    </Stat>
                    <Stat>
                        <StatLabel>Selected Games</StatLabel>
                        <StatNumber>{selectedGames.size}</StatNumber>
                    </Stat>
                </StatGroup>
            </VStack>
        </Box>
    );
} 