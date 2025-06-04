const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');

// Your web app's Firebase configuration
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
const db = getFirestore(app);

module.exports = { db }; 