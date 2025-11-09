// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDNbMB5K2X_Qg1IpTAwGfKKEa12jFOBLQY",
  authDomain: "agrosphere-zernix.firebaseapp.com",
  databaseURL: "https://agrosphere-zernix-default-rtdb.firebaseio.com",
  projectId: "agrosphere-zernix",
  storageBucket: "agrosphere-zernix.appspot.com",
  messagingSenderId: "869367066239",
  appId: "1:869367066239:web:626544c5ab001e529e994a",
  measurementId: "G-QMN9Q79TY5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the necessary Firebase services
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);