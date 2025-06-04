import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Box,
    Grid,
    Button,
    useDisclosure,
    Text,
    VStack,
    HStack,
    Spacer,
    IconButton,
    Tooltip
} from '@chakra-ui/react';
import { AddIcon, WarningIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';
import { gameService } from '../services/gameService';
import { useNativeFeatures } from './NativeFeatures';
import { GameCard } from './GameCard';
import AddGameModal from './AddGameModal';
import EditGameModal from './EditGameModal';
import GameStats from './GameStats';
import { BatteryStatus } from './BatteryStatus';
import CrashReports from './CrashReports';

export default function GameList() {
    const [games, setGames] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);
    const [selectedStats, setSelectedStats] = useState(null);
    const { user } = useAuth();
    const { updateTrayGames } = useNativeFeatures();
    const loadGamesTimeoutRef = useRef(null);
    const {
        isOpen: isAddOpen,
        onOpen: onAddOpen,
        onClose: onAddClose
    } = useDisclosure();
    const {
        isOpen: isEditOpen,
        onOpen: onEditOpen,
        onClose: onEditClose
    } = useDisclosure();
    const {
        isOpen: isStatsOpen,
        onOpen: onStatsOpen,
        onClose: onStatsClose
    } = useDisclosure();
    const { isOpen: isCrashReportsOpen, onOpen: onCrashReportsOpen, onClose: onCrashReportsClose } = useDisclosure();

    // Debounced games update
    const updateGamesDebounced = useCallback((newGames) => {
        if (loadGamesTimeoutRef.current) {
            clearTimeout(loadGamesTimeoutRef.current);
        }
        loadGamesTimeoutRef.current = setTimeout(() => {
            setGames(newGames);
            updateTrayGames(newGames);
        }, 300);
    }, [updateTrayGames]);

    // Load games and update tray
    const loadGames = useCallback(async () => {
        try {
            const userGames = await gameService.getUserGames(user.uid);
            updateGamesDebounced(userGames);
        } catch (error) {
            console.error('Failed to load games:', error);
            // Report error to crash reporter
            if (window.electron?.reportRendererCrash) {
                window.electron.reportRendererCrash(error);
            }
        }
    }, [user.uid, updateGamesDebounced]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (loadGamesTimeoutRef.current) {
                clearTimeout(loadGamesTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        loadGames();
    }, [loadGames]);

    // Memoize event handlers
    const handleOpenAddGameModal = useCallback(() => {
        onAddOpen();
    }, [onAddOpen]);

    const handleGameLaunchFromTray = useCallback(async (event) => {
        const gameId = event.detail;
        const game = games.find(g => g.id === gameId);
        if (game) {
            // Game will be launched through GameCard component
            window.dispatchEvent(new CustomEvent('launch-game', { detail: game }));
        }
    }, [games]);

    // Event listeners with cleanup
    useEffect(() => {
        window.addEventListener('open-add-game-modal', handleOpenAddGameModal);
        window.addEventListener('launch-game', handleGameLaunchFromTray);

        return () => {
            window.removeEventListener('open-add-game-modal', handleOpenAddGameModal);
            window.removeEventListener('launch-game', handleGameLaunchFromTray);
        };
    }, [handleOpenAddGameModal, handleGameLaunchFromTray]);

    const handleDelete = useCallback(async (gameId) => {
        const updatedGames = games.filter(game => game.id !== gameId);
        updateGamesDebounced(updatedGames);
    }, [games, updateGamesDebounced]);

    // Test crash button (only in development)
    const handleTestCrash = async () => {
        if (process.env.NODE_ENV === 'development') {
            try {
                console.log('Triggering test crash...');
                await window.electron.testCrash();
            } catch (error) {
                console.error('Test crash triggered:', error);
                // Ensure the error is reported to our crash reporter
                if (window.electron?.reportRendererCrash) {
                    await window.electron.reportRendererCrash(error);
                }
                // Refresh crash reports list
                onCrashReportsOpen();
            }
        }
    };

    // Memoize the game cards to prevent unnecessary re-renders
    const gameCards = useMemo(() => {
        return games.map(game => (
            <GameCard
                key={game.id}
                game={game}
                onDelete={handleDelete}
                onUpdate={loadGames}
            />
        ));
    }, [games, handleDelete, loadGames]);

    return (
        <Box p={4}>
            <HStack mb={4} spacing={4}>
                <Spacer />
                <BatteryStatus />
                <Tooltip label="View Crash Reports">
                    <IconButton
                        icon={<WarningIcon />}
                        onClick={onCrashReportsOpen}
                        aria-label="View Crash Reports"
                        variant="ghost"
                    />
                </Tooltip>
                {process.env.NODE_ENV === 'development' && (
                    <Tooltip label="Test Crash (Dev Only)">
                        <IconButton
                            icon={<WarningIcon />}
                            onClick={handleTestCrash}
                            aria-label="Test Crash"
                            colorScheme="red"
                            variant="ghost"
                        />
                    </Tooltip>
                )}
            </HStack>
            <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
                {gameCards}
                <Box
                    borderWidth={1}
                    borderRadius="lg"
                    p={4}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    onClick={onAddOpen}
                    height="100%"
                >
                    <VStack>
                        <AddIcon boxSize={8} />
                        <Text>Add New Game</Text>
                    </VStack>
                </Box>
            </Grid>

            <AddGameModal
                isOpen={isAddOpen}
                onClose={onAddClose}
                onGameAdded={loadGames}
            />

            {selectedGame && (
                <EditGameModal
                    isOpen={isEditOpen}
                    onClose={() => {
                        onEditClose();
                        setSelectedGame(null);
                    }}
                    game={selectedGame}
                    onGameUpdated={loadGames}
                />
            )}

            {selectedStats && selectedGame && (
                <GameStats
                    isOpen={isStatsOpen}
                    onClose={() => {
                        onStatsClose();
                        setSelectedStats(null);
                        setSelectedGame(null);
                    }}
                    stats={selectedStats}
                    game={selectedGame}
                />
            )}

            <CrashReports
                isOpen={isCrashReportsOpen}
                onClose={onCrashReportsClose}
            />
        </Box>
    );
} 