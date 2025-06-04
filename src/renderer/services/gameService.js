import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    getDoc,
    query,
    where,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    Timestamp
} from 'firebase/firestore';
import { db, auth } from '../App';

// Cache management
const CACHE_DURATION = 15 * 60 * 1000; // Increased to 15 minutes
const CACHE_KEY_GAMES = 'cached_games';
const CACHE_KEY_STATS = 'cached_stats';

// Request tracking
let requestCount = 0;
let lastRequestTime = Date.now();
const requestLog = [];

function trackRequest(type) {
    requestCount++;
    const now = Date.now();
    requestLog.push({ type, timestamp: now });

    // Keep only last 5 minutes of logs
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    while (requestLog.length > 0 && requestLog[0].timestamp < fiveMinutesAgo) {
        requestLog.shift();
    }

    // Log request rate every minute
    if (now - lastRequestTime >= 60000) {
        const requestsPerMinute = requestLog.length;
        console.log(`Firebase requests per minute: ${requestsPerMinute}`);
        console.log('Request types:', requestLog.reduce((acc, req) => {
            acc[req.type] = (acc[req.type] || 0) + 1;
            return acc;
        }, {}));
        lastRequestTime = now;
    }
}

function getCache(key) {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(key);
        return null;
    }
    return data;
}

function setCache(key, data) {
    localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
    }));
}

// Batch updates queue
let updateQueue = new Map();
let updateTimeout = null;

async function processBatchUpdates() {
    if (updateQueue.size === 0) return;

    const updates = new Map(updateQueue);
    updateQueue.clear();
    clearTimeout(updateTimeout);
    updateTimeout = null;

    try {
        for (const [gameId, data] of updates) {
            const gameRef = doc(db, 'users', data.userId, 'games', gameId);
            await updateDoc(gameRef, data.updates);
            trackRequest('batch_update');
        }
    } catch (error) {
        console.error('Error processing batch updates:', error);
    }
}

export const gameService = {
    async addGame(userId, gameData) {
        try {
            const gamesCollection = collection(db, 'users', userId, 'games');
            const docRef = await addDoc(gamesCollection, {
                ...gameData,
                launchCount: 0,
                lastLaunched: null,
                createdAt: serverTimestamp()
            });
            trackRequest('add_game');
            localStorage.removeItem(`${CACHE_KEY_GAMES}_${userId}`);
            return docRef.id;
        } catch (error) {
            console.error('Error adding game:', error);
            throw error;
        }
    },

    async updateGame(gameId, gameData) {
        try {
            const { userId, ...updates } = gameData;
            if (!userId) {
                throw new Error('userId is required for updating a game');
            }

            const gameRef = doc(db, 'users', userId, 'games', gameId);
            await updateDoc(gameRef, updates);
            trackRequest('update_game');
            localStorage.removeItem(`${CACHE_KEY_GAMES}_${userId}`);
            localStorage.removeItem(`${CACHE_KEY_STATS}_${gameId}`);
        } catch (error) {
            console.error('Error updating game:', error);
            throw error;
        }
    },

    async deleteGame(gameId) {
        try {
            const userId = auth.currentUser.uid;
            const gameRef = doc(db, 'users', userId, 'games', gameId);
            await deleteDoc(gameRef);
            trackRequest('delete_game');
            localStorage.removeItem(`${CACHE_KEY_GAMES}_${userId}`);
            localStorage.removeItem(`${CACHE_KEY_STATS}_${gameId}`);
        } catch (error) {
            console.error('Error deleting game:', error);
            throw error;
        }
    },

    async getUserGames(userId) {
        try {
            const cacheKey = `${CACHE_KEY_GAMES}_${userId}`;
            const cachedGames = getCache(cacheKey);
            if (cachedGames) {
                return cachedGames;
            }

            trackRequest('get_games');
            const gamesCollection = collection(db, 'users', userId, 'games');
            const snapshot = await getDocs(gamesCollection);
            const games = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setCache(cacheKey, games);
            return games;
        } catch (error) {
            console.error('Error getting user games:', error);
            throw error;
        }
    },

    async recordGameLaunch(gameId) {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) {
                throw new Error('User must be logged in to record game launch');
            }

            const gameRef = doc(db, 'users', userId, 'games', gameId);
            const gameDoc = await getDoc(gameRef);

            if (!gameDoc.exists()) {
                throw new Error('Game not found');
            }

            await updateDoc(gameRef, {
                launchCount: increment(1),
                lastLaunched: serverTimestamp(),
                launchHistory: arrayUnion({
                    timestamp: Timestamp.now(),
                    userId: userId
                })
            });

            trackRequest('record_launch');
            // Clear relevant caches
            localStorage.removeItem(`${CACHE_KEY_GAMES}_${userId}`);
            localStorage.removeItem(`${CACHE_KEY_STATS}_${gameId}`);
        } catch (error) {
            console.error('Error recording game launch:', error);
            throw error;
        }
    },

    async getGameStats(gameId) {
        try {
            const cacheKey = `${CACHE_KEY_STATS}_${gameId}`;
            const cachedStats = getCache(cacheKey);
            if (cachedStats) {
                return cachedStats;
            }

            const userId = auth.currentUser.uid;
            trackRequest('get_stats');
            const gameRef = doc(db, 'users', userId, 'games', gameId);
            const gameDoc = await getDoc(gameRef);

            if (gameDoc.exists()) {
                const data = gameDoc.data();
                const stats = {
                    launchCount: data.launchCount || 0,
                    lastLaunched: data.lastLaunched,
                    createdAt: data.createdAt,
                    launchHistory: data.launchHistory || []
                };

                setCache(cacheKey, stats);
                return stats;
            }
            return null;
        } catch (error) {
            console.error('Error getting game stats:', error);
            throw error;
        }
    },

    // Utility function to get current request rate
    getRequestRate() {
        const now = Date.now();
        const requestsInLastMinute = requestLog.filter(r => r.timestamp > now - 60000).length;
        return {
            requestsPerMinute: requestsInLastMinute,
            totalRequests: requestCount,
            requestTypes: requestLog.reduce((acc, req) => {
                acc[req.type] = (acc[req.type] || 0) + 1;
                return acc;
            }, {})
        };
    }
}; 