import React from 'react';
import {
    Box,
    Text,
    VStack,
    HStack,
    IconButton,
    useToast,
    Tooltip,
    useDisclosure
} from '@chakra-ui/react';
import { DeleteIcon, EditIcon, InfoIcon } from '@chakra-ui/icons';
import { FaPlay } from 'react-icons/fa';
import { gameService } from '../services/gameService';
import { webApiService } from '../services/webApiService';
import { useNativeFeatures } from './NativeFeatures';
import EditGameModal from './EditGameModal';
import GameStats from './GameStats';

export function GameCard({ game, onDelete, onUpdate }) {
    const toast = useToast();
    const { launchGame } = useNativeFeatures();
    const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
    const { isOpen: isStatsOpen, onOpen: onStatsOpen, onClose: onStatsClose } = useDisclosure();
    const [stats, setStats] = React.useState(null);

    const handleDelete = async () => {
        try {
            // Use standard confirm API
            if (!window.confirm(`Are you sure you want to delete "${game.name}"? This action cannot be undone.`)) {
                return;
            }

            await gameService.deleteGame(game.id);
            onDelete(game.id);
            toast({
                title: 'Game Deleted',
                description: `${game.name} has been removed from your library`,
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleLaunch = async () => {
        // Check if we have notification permission before launching
        const hasPermission = await webApiService.requestNotificationPermission();
        if (hasPermission) {
            const result = await launchGame(game);
            if (result.success) {
                try {
                    await gameService.recordGameLaunch(game.id);
                } catch (error) {
                    console.error('Failed to record game launch:', error);
                }
            } else {
                toast({
                    title: 'Launch Failed',
                    description: result.error || 'Failed to launch game',
                    status: 'error',
                    duration: 5000,
                    isClosable: true,
                });
            }
        } else {
            toast({
                title: 'Permission Required',
                description: 'Notification permission is required to receive game status updates',
                status: 'warning',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    const handleViewStats = async () => {
        try {
            const gameStats = await gameService.getGameStats(game.id);
            setStats(gameStats);
            onStatsOpen();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load game statistics: ' + error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    return (
        <>
            <Box
                p={4}
                borderWidth="1px"
                borderRadius="lg"
                overflow="hidden"
                _hover={{ shadow: 'md' }}
            >
                <VStack spacing={4} align="stretch">
                    <Text fontSize="xl" fontWeight="bold" textAlign="center">
                        {game.name}
                    </Text>
                    <HStack spacing={2} justify="center">
                        <Tooltip label="Launch Game">
                            <IconButton
                                icon={<FaPlay />}
                                colorScheme="green"
                                onClick={handleLaunch}
                                aria-label="Launch Game"
                            />
                        </Tooltip>
                        <Tooltip label="View Statistics">
                            <IconButton
                                icon={<InfoIcon />}
                                onClick={handleViewStats}
                                aria-label="View Statistics"
                            />
                        </Tooltip>
                        <Tooltip label="Edit Game">
                            <IconButton
                                icon={<EditIcon />}
                                onClick={onEditOpen}
                                aria-label="Edit Game"
                            />
                        </Tooltip>
                        <Tooltip label="Delete Game">
                            <IconButton
                                icon={<DeleteIcon />}
                                colorScheme="red"
                                onClick={handleDelete}
                                aria-label="Delete Game"
                            />
                        </Tooltip>
                    </HStack>
                </VStack>
            </Box>

            {/* Edit Modal */}
            <EditGameModal
                isOpen={isEditOpen}
                onClose={onEditClose}
                game={game}
                onGameUpdated={onUpdate}
            />

            {/* Stats Modal */}
            {stats && (
                <GameStats
                    isOpen={isStatsOpen}
                    onClose={() => {
                        onStatsClose();
                        setStats(null);
                    }}
                    stats={stats}
                    game={game}
                />
            )}
        </>
    );
} 