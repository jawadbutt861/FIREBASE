import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth,GithubAuthProvider,GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";



const firebaseConfig = {
  apiKey: "AIzaSyCkc3SaQOdHdrFENhN78UCQADaAi4poaZk",
  authDomain: "practice-2e5fc.firebaseapp.com",
  projectId: "practice-2e5fc",
  storageBucket: "practice-2e5fc.firebasestorage.app",
  messagingSenderId: "254262140469",
  appId: "1:254262140469:web:7b7c11ae122b9a28a9db7c",
  measurementId: "G-NPMWTGGPMK"
};


const app = initializeApp(firebaseConfig);
export const google = new GoogleAuthProvider();
export const github = new GithubAuthProvider();
export const auth = getAuth(app)