import {signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {auth} from "./firebaseconfig.js"


let email = document.querySelector("#email");
let password = document.querySelector("#password");
let form = document.querySelector("#sign-in");
let googleBtn = document.querySelector("#google-btn");

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