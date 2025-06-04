import React, { useState } from 'react';
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
import { useAuth } from '../contexts/AuthContext';
import { gameService } from '../services/gameService';

export default function AddGameModal({ isOpen, onClose, onGameAdded }) {
    const [name, setName] = useState('');
    const [executablePath, setExecutablePath] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const toast = useToast();

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
            await gameService.addGame(user.uid, {
                name,
                executablePath
            });

            toast({
                title: 'Success',
                description: 'Game added successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });

            onGameAdded();
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
                    <ModalHeader>Add New Game</ModalHeader>
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
                            Add Game
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    );
} 