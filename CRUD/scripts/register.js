import {createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import {auth} from "./firebaseconfig.js"


let name = document.querySelector("#username");
let email = document.querySelector("#email");
let password = document.querySelector("#password");
let form = document.querySelector("#sign-up");
let googleBtn = document.querySelector("#google-btn");

form.addEventListener("submit",(event)=>{
    event.preventDefault();

    createUserWithEmailAndPassword(auth, email.value, password.value)
  .then((userCredential) => {
     
    const user = userCredential.user;
    console.log(user);
    
  })
  .catch((error) => {

    const errorCode = error.code;
    const errorMessage = error.message;
    console.log(errorMessage);
    
  });
})