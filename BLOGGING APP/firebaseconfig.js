
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC9XMffm5WnBoSyRDOahjuW6mvQG6f0efs",
  authDomain: "blogging-app-ffae0.firebaseapp.com",
  projectId: "blogging-app-ffae0",
  storageBucket: "blogging-app-ffae0.firebasestorage.app",
  messagingSenderId: "459955947730",
  appId: "1:459955947730:web:e4fde1613a28206167850b",
  measurementId: "G-L9469F3202"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();