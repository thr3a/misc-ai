// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_KEY,
  authDomain: 'thr3a-misc-ai.firebaseapp.com',
  projectId: 'thr3a-misc-ai',
  storageBucket: 'thr3a-misc-ai.appspot.com',
  messagingSenderId: '73985886477',
  appId: '1:73985886477:web:12e2bdbb429fba7214c844'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
