// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBBFSH-TiJxiIsE2KDdXNlBLsYVZa3gpwU",
  authDomain: "mytravel-c8362.firebaseapp.com",
  projectId: "mytravel-c8362",
  storageBucket: "mytravel-c8362.firebasestorage.app",
  messagingSenderId: "530592061475",
  appId: "1:530592061475:web:5756bb0aef9a69ea7f7996"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };




