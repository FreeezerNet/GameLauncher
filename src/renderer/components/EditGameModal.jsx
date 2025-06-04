import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    FormControl,
    FormLabel,
    Input,
    useToast,
    VStack
} from '@chakra-ui/react';
import { gameService } from '../services/gameService';
import { useAuth } from '../contexts/AuthContext';

export default function EditGameModal({ isOpen, onClose, game, onGameUpdated }) {
    const [name, setName] = useState('');
    const [executablePath, setExecutablePath] = useState('');
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const { user } = useAuth();

    useEffect(() => {
        if (game) {
            setName(game.name);
            setExecutablePath(game.executablePath);
        }
    }, [game]);

    async function handleSubmit(e) {
        e.preventDefault();

        if (!name || !executablePath) {
            return toast({
                title: 'Error',
                description: 'Please fill in all required fields',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }

        try {
            setLoading(true);
            await gameService.updateGame(game.id, {
                name,
                executablePath,
                userId: user.uid
            });

            toast({
                title: 'Success',
                description: 'Game updated successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onGameUpdated();
            handleClose();
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    }

    function handleClose() {
        setName('');
        setExecutablePath('');
        onClose();
    }

    async function handleFileSelect() {
        try {
            const filePath = await window.electron.selectExecutable();
            if (filePath) {
                setExecutablePath(filePath);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to select file',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose}>
            <ModalOverlay />
            <ModalContent>
                <form onSubmit={handleSubmit}>
                    <ModalHeader>Edit Game</ModalHeader>
                    <ModalCloseButton />

                    <ModalBody>
                        <VStack spacing={4}>
                            <FormControl isRequired>
                                <FormLabel>Game Name</FormLabel>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter game name"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel>Executable Path</FormLabel>
                                <Input
                                    value={executablePath}
                                    placeholder="Select game executable"
                                    onClick={handleFileSelect}
                                    readOnly
                                    cursor="pointer"
                                />
                            </FormControl>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <Button variant="ghost" mr={3} onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            colorScheme="blue"
                            type="submit"
                            isLoading={loading}
                        >
                            Save Changes
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
} 