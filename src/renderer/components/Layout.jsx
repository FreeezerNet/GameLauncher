import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Flex,
    Heading,
    Button,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    useToast,
    HStack
} from '@chakra-ui/react';
import { SettingsIcon, StarIcon } from '@chakra-ui/icons';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();

    async function handleLogout() {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to log out',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    }

    function handleNavigate(path) {
        if (location.pathname !== path) {
            navigate(path);
        }
    }

    return (
        <Box minH="100vh">
            <Flex
                as="nav"
                align="center"
                justify="space-between"
                wrap="wrap"
                padding="1.5rem"
                bg="blue.500"
                color="white"
            >
                <Heading size="lg" cursor="pointer" onClick={() => handleNavigate('/games')}>
                    Game Launcher
                </Heading>
                <HStack spacing={4}>
                    <Button
                        leftIcon={<StarIcon />}
                        variant="ghost"
                        color="white"
                        _hover={{ bg: 'blue.600' }}
                        onClick={() => handleNavigate('/statistics')}
                    >
                        Statistics
                    </Button>
                    <Button
                        leftIcon={<SettingsIcon />}
                        variant="ghost"
                        color="white"
                        _hover={{ bg: 'blue.600' }}
                        onClick={() => handleNavigate('/settings')}
                    >
                        Settings
                    </Button>
                    {user && (
                        <Menu>
                            <MenuButton as={Button} colorScheme="whiteAlpha">
                                {user.email}
                            </MenuButton>
                            <MenuList color="black">
                                <MenuItem onClick={handleLogout}>Logout</MenuItem>
                            </MenuList>
                        </Menu>
                    )}
                </HStack>
            </Flex>

            <Box p={4}>
                {children}
            </Box>
        </Box>
    );
} 