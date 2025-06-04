import { extendTheme } from '@chakra-ui/react';

const config = {
    initialColorMode: 'dark',
    useSystemColorMode: false,
};

const theme = extendTheme({
    config,
    styles: {
        global: {
            body: {
                bg: 'gray.900',
                color: 'white',
            }
        },
    },
    colors: {
        brand: {
            50: '#f7fafc',
            100: '#edf2f7',
            200: '#e2e8f0',
            300: '#cbd5e0',
            400: '#a0aec0',
            500: '#718096',
            600: '#4a5568',
            700: '#2d3748',
            800: '#1a202c',
            900: '#171923',
        },
    },
    components: {
        Modal: {
            baseStyle: {
                dialog: {
                    bg: 'gray.800',
                },
                header: {
                    color: 'white',
                },
                body: {
                    color: 'white',
                },
                footer: {
                    color: 'white',
                }
            }
        },
        Popover: {
            baseStyle: {
                content: {
                    bg: 'gray.800',
                    color: 'white',
                },
                header: {
                    color: 'white',
                },
                body: {
                    color: 'white',
                },
                footer: {
                    color: 'white',
                }
            }
        },
        Button: {
            defaultProps: {
                colorScheme: 'blue',
            },
        },
        Card: {
            baseStyle: {
                container: {
                    bg: 'gray.800',
                    color: 'white',
                    borderRadius: 'lg',
                },
            },
        },
        FormLabel: {
            baseStyle: {
                color: 'white',
            },
        },
        Input: {
            defaultProps: {
                focusBorderColor: 'blue.400',
            },
            variants: {
                outline: {
                    field: {
                        bg: 'gray.700',
                        borderColor: 'gray.600',
                        color: 'white',
                        _hover: {
                            borderColor: 'gray.500',
                        },
                        _focus: {
                            borderColor: 'blue.400',
                            boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
                        },
                    },
                },
            },
        },
        Heading: {
            baseStyle: {
                color: 'white',
            },
        },
        Text: {
            baseStyle: {
                color: 'white',
            },
        },
    },
});

export default theme; 