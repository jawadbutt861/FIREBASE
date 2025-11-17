import {signInWithEmailAndPassword  } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

import {auth,google,github} from "./firebaseconfig.js";

let email = document.querySelector("#email");
let password = document.querySelector("#password");
let form = document.querySelector("#form");
let googleBtn = document.querySelector(".google-btn");
let githubBtn = document.querySelector(".github-btn");

form.addEventListener("submit",(event)=>{
    event.preventDefault();

    signInWithEmailAndPassword(auth, email.value, password.value)
  .then((userCredential) => {
    
    const user = userCredential.user;
    console.log(user);
    window.location = "index.html";
    
  })
  .catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorMessage);
    
  });

})

googleBtn.addEventListener("click",()=>{

    signInWithPopup(auth, google)
  .then((result) => {
 
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;
    console.log(user);
    window.location = "index.html";
    
    
  }).catch((error) => {
 
    const errorCode = error.code;
    const errorMessage = error.message;
    const email = error.customData.email;
    const credential = GoogleAuthProvider.credentialFromError(error);
    console.log(errorMessage);
    
   
  });
})

githubBtn.addEventListener("click",()=>{

    signInWithPopup(auth, github)
  .then((result) => {
   
    const credential = GithubAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    const user = result.user;
    console.log(user);
    window.location = "index.html";
    
    
  }).catch((error) => {
    
    const errorCode = error.code;
    const errorMessage = error.message;
    const email = error.customData.email;
    const credential = GithubAuthProvider.credentialFromError(error);
    console.log(errorMessage);
    

  });


})