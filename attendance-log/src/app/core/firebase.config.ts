// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyDMwd5Nhar76_SfCEIbcxFgmTSG6eJPz-g',
  authDomain: 'attendance-log-3a673.firebaseapp.com',
  projectId: 'attendance-log-3a673',
  storageBucket: 'attendance-log-3a673.firebasestorage.app',
  messagingSenderId: '1070989838472',
  appId: '1:1070989838472:web:4b374fce1d7cad3fbcf73d',
  measurementId: 'G-92ELJ8XRR3',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
