
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-analytics.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
 
  const firebaseConfig = {
    apiKey: "AIzaSyBZgr9BBCYr_Me_uX6u3nuK3K05Kor9b8Y",
    authDomain: "todo-bb9bb.firebaseapp.com",
    projectId: "todo-bb9bb",
    storageBucket: "todo-bb9bb.firebasestorage.app",
    messagingSenderId: "584775344574",
    appId: "1:584775344574:web:f00ced2b3ac395344059ef",
    measurementId: "G-JE74E2PC86"
  };

  
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  export const db = getFirestore(app);
  export const auth = getAuth(app);
  