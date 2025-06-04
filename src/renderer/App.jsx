import React from 'react';
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { AuthProvider } from './contexts/AuthContext';
import { NativeFeaturesProvider } from './components/NativeFeatures';
import theme from './theme';
import Login from './components/Login';
import Signup from './components/Signup';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import GameList from './components/GameList';
import Settings from './components/Settings';
import StatisticsPage from './components/StatisticsPage';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD79o4_v5JCCX-osGNkfykpJNwYQBXpvxM",
    authDomain: "game-launcher-757e7.firebaseapp.com",
    projectId: "game-launcher-757e7",
    storageBucket: "game-launcher-757e7.firebasestorage.app",
    messagingSenderId: "648347020005",
    appId: "1:648347020005:web:5c1767326e37b26500020c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

function App() {
    return (
        <ChakraProvider theme={theme}>
            <ColorModeScript initialColorMode={theme.config.initialColorMode} />
            <Router>
                <AuthProvider>
                    <NativeFeaturesProvider>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route
                                path="/games"
                                element={
                                    <PrivateRoute>
                                        <Layout>
                                            <GameList />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/statistics"
                                element={
                                    <PrivateRoute>
                                        <Layout>
                                            <StatisticsPage />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="/settings"
                                element={
                                    <PrivateRoute>
                                        <Layout>
                                            <Settings />
                                        </Layout>
                                    </PrivateRoute>
                                }
                            />
                            <Route path="/" element={<Navigate to="/games" />} />
                        </Routes>
                    </NativeFeaturesProvider>
                </AuthProvider>
            </Router>
        </ChakraProvider>
    );
}

export default App; 