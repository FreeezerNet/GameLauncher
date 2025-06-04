import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    serverTimestamp,
    orderBy,
    limit
} from 'firebase/firestore';
import { db } from '../App';

export const crashReportService = {
    async addCrashReport(userId, gameId, error) {
        try {
            const crashReportsRef = collection(db, 'crashReports');
            const report = {
                userId,
                gameId,
                error: {
                    message: error.message,
                    stack: error.stack,
                    timestamp: serverTimestamp()
                },
                systemInfo: {
                    platform: process.platform,
                    arch: process.arch,
                    version: process.version,
                    memory: process.memoryUsage()
                },
                status: 'new',
                created: serverTimestamp()
            };

            const docRef = await addDoc(crashReportsRef, report);
            return { id: docRef.id, ...report };
        } catch (error) {
            throw new Error('Error adding crash report: ' + error.message);
        }
    },

    async getGameCrashReports(gameId) {
        try {
            const crashReportsRef = collection(db, 'crashReports');
            const q = query(
                crashReportsRef,
                where('gameId', '==', gameId),
                orderBy('created', 'desc'),
                limit(10)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            throw new Error('Error fetching crash reports: ' + error.message);
        }
    },

    async getUserCrashReports(userId) {
        try {
            const crashReportsRef = collection(db, 'crashReports');
            const q = query(
                crashReportsRef,
                where('userId', '==', userId),
                orderBy('created', 'desc'),
                limit(20)
            );

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            throw new Error('Error fetching user crash reports: ' + error.message);
        }
    }
};