import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    VStack,
    HStack,
    Text,
    Button,
    Box,
    Badge,
    useToast,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon
} from '@chakra-ui/react';

export default function CrashReports({ isOpen, onClose }) {
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const loadReports = async () => {
        try {
            setIsLoading(true);
            console.log('Loading crash reports...');
            const crashReports = await window.electron.getCrashReports();
            console.log('Loaded crash reports:', crashReports);
            setReports(crashReports || []);
        } catch (error) {
            console.error('Failed to load crash reports:', error);
            toast({
                title: 'Error',
                description: 'Failed to load crash reports: ' + error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const clearReports = async () => {
        try {
            await window.electron.clearCrashReports();
            setReports([]);
            toast({
                title: 'Success',
                description: 'Crash reports cleared successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to clear crash reports: ' + error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadReports();
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    Crash Reports
                    <Button
                        size="sm"
                        colorScheme="red"
                        ml={4}
                        onClick={clearReports}
                        isDisabled={reports.length === 0}
                    >
                        Clear All
                    </Button>
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    {reports.length === 0 ? (
                        <Text>No crash reports found.</Text>
                    ) : (
                        <Accordion allowMultiple>
                            {reports.map((report, index) => (
                                <AccordionItem key={index}>
                                    <AccordionButton>
                                        <Box flex="1">
                                            <HStack spacing={2}>
                                                <Badge colorScheme={report.processType === 'main' ? 'red' : 'orange'}>
                                                    {report.processType}
                                                </Badge>
                                                <Text fontSize="sm">
                                                    {new Date(report.timestamp).toLocaleString()}
                                                </Text>
                                            </HStack>
                                            <Text color="red.500" mt={1}>
                                                {report.error.message}
                                            </Text>
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                    <AccordionPanel>
                                        <VStack align="stretch" spacing={3}>
                                            <Box>
                                                <Text fontWeight="bold">Stack Trace:</Text>
                                                <Box
                                                    bg="gray.100"
                                                    p={2}
                                                    borderRadius="md"
                                                    whiteSpace="pre-wrap"
                                                    fontSize="sm"
                                                >
                                                    {report.error.stack}
                                                </Box>
                                            </Box>
                                            <Box>
                                                <Text fontWeight="bold">System Info:</Text>
                                                <Box bg="gray.100" p={2} borderRadius="md">
                                                    <Text fontSize="sm">Platform: {report.systemInfo.platform}</Text>
                                                    <Text fontSize="sm">Architecture: {report.systemInfo.arch}</Text>
                                                    <Text fontSize="sm">Node Version: {report.systemInfo.version}</Text>
                                                    <Text fontSize="sm">Electron: {report.systemInfo.electronVersion}</Text>
                                                    <Text fontSize="sm">Chrome: {report.systemInfo.chromeVersion}</Text>
                                                </Box>
                                            </Box>
                                        </VStack>
                                    </AccordionPanel>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
} 