const { app, crashReporter } = require('electron');
const path = require('path');
const fs = require('fs');
const { db } = require('../firebase');
const { collection, addDoc, query, orderBy, limit, getDocs, writeBatch, deleteDoc } = require('firebase/firestore');

class CrashReporterService {
    constructor() {
        this.crashesDirectory = path.join(app.getPath('userData'), 'crashes');
        this.ensureCrashesDirectoryExists();
    }

    ensureCrashesDirectoryExists() {
        if (!fs.existsSync(this.crashesDirectory)) {
            fs.mkdirSync(this.crashesDirectory, { recursive: true });
        }
    }

    init() {
        try {
            // Start crash reporter in main process
            crashReporter.start({
                productName: 'Game Launcher',
                uploadToServer: false, // We'll handle the upload ourselves
                compress: true,
                extra: {
                    platform: process.platform,
                    version: app.getVersion()
                }
            });

            // Log where crash reports are being stored
            console.log('Crash reports directory:', this.crashesDirectory);

            // Handle unhandled exceptions in the main process
            process.on('uncaughtException', (error) => {
                this.handleCrash('main', error);
            });

            process.on('unhandledRejection', (error) => {
                this.handleCrash('main', error);
            });

        } catch (error) {
            console.error('Failed to initialize crash reporter:', error);
        }
    }

    async handleCrash(processType, error) {
        try {
            const crashReport = {
                timestamp: new Date().toISOString(),
                processType,
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                },
                systemInfo: {
                    platform: process.platform,
                    arch: process.arch,
                    version: process.version,
                    electronVersion: process.versions.electron,
                    chromeVersion: process.versions.chrome
                },
                appVersion: app.getVersion()
            };

            // Save locally first
            const fileName = `crash-${Date.now()}.json`;
            const filePath = path.join(this.crashesDirectory, fileName);
            fs.writeFileSync(filePath, JSON.stringify(crashReport, null, 2));

            // Store in Firestore
            try {
                const crashReportsRef = collection(db, 'crashReports');
                await addDoc(crashReportsRef, {
                    ...crashReport,
                    created: new Date()
                });
            } catch (firestoreError) {
                console.error('Failed to store crash report in Firestore:', firestoreError);
            }

            return crashReport;
        } catch (error) {
            console.error('Failed to handle crash:', error);
            return null;
        }
    }

    async getCrashReports() {
        try {
            const crashReportsRef = collection(db, 'crashReports');
            const q = query(
                crashReportsRef,
                orderBy('timestamp', 'desc'),
                limit(50)
            );
            const snapshot = await getDocs(q);

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Failed to get crash reports:', error);
            // Fallback to local files if Firestore fails
            return this.getLocalCrashReports();
        }
    }

    getLocalCrashReports() {
        try {
            const files = fs.readdirSync(this.crashesDirectory);
            return files
                .filter(file => file.endsWith('.json'))
                .map(file => {
                    const filePath = path.join(this.crashesDirectory, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    return JSON.parse(content);
                })
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch (error) {
            console.error('Failed to read local crash reports:', error);
            return [];
        }
    }

    async clearCrashReports() {
        try {
            // Clear from Firestore
            const crashReportsRef = collection(db, 'crashReports');
            const q = query(crashReportsRef, limit(100));
            const snapshot = await getDocs(q);

            const batch = writeBatch(db);
            snapshot.docs.forEach(doc => {
                deleteDoc(doc.ref);
            });
            await batch.commit();

            // Clear local files
            const files = fs.readdirSync(this.crashesDirectory);
            files.forEach(file => {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.crashesDirectory, file);
                    fs.unlinkSync(filePath);
                }
            });

            return true;
        } catch (error) {
            console.error('Failed to clear crash reports:', error);
            return false;
        }
    }
}

module.exports = new CrashReporterService(); 