 import { onAuthStateChanged  } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import { collection, addDoc,Timestamp, getDocs,query, where,orderBy,deleteDoc ,updateDoc } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";
 
import {auth,db} from "./firebaseconfig.js"

let form = document.querySelector("#todo-form");
let title = document.querySelector("#title-input");
let description = document.querySelector("#desc-input");
let container = document.querySelector("#todo-list");

let allTodo = [];
let userId;

onAuthStateChanged(auth, (user) => {
  if (user) {
   
    const uid = user.uid;
    userId = uid;
    getTodos(uid)
    
  } else {
   
  }
});


form.addEventListener("submit",async(event)=>{
  event.preventDefault();

  let todos = {
    title: title.value,
    description: description.value,
    time: Timestamp.fromDate(new Date()),
    uid: userId
  }

  try {
  const docRef = await addDoc(collection(db, "todos"), todos)
  allTodo.unshift({...todos, docid: docRef.id});
  render(allTodo);
  console.log("Document written with ID: ", docRef.id);
} catch (e) {
  console.error("Error adding document: ", e);
}
})

async function getTodos(uid){
  const q = query(
    collection(db, "todos"), 
    where("uid", "==", uid),
    orderBy("time", "desc"));

const querySnapshot = await getDocs(q);
querySnapshot.forEach((doc) => {
  allTodo.push({...doc.data(), docid: doc.id});
  
  // console.log(doc.id, " => ", doc.data());
});
render(allTodo);
}

function render(arr){
  container.innerHTML = "";
  arr.map((item)=>{
    container.innerHTML +=`
    <li>
                <div class="task-title">${item.title}</div>
                <div class="task-desc">${item.description}</div>
                <div class="task-actions">
                <button class="edit-btn" data-id = "${item.docid}">Edit</button>
                <button class="delete-btn" data-id =" ${item.docid}">Delete</button>
                </div>
            </li>
    `;
  })

}

const deleteButtons = document.querySelectorAll(".delete-btn");
const editButtons = document.querySelectorAll(".edit-btn");
  
deleteButtons.forEach((items)=>{
  items.addEventListener("click",async (event)=>{
    console.log("clicked");
    
    let clickedTodo = event.target.dataset.id;
    try {
      await deleteDoc(doc(db, "todos", clickedTodo));
      let itemIndex = allTodo.findIndex((item)=>{
        return item.docid === clickedTodo;
      });
      allTodo.splice(itemIndex, 1);
      render(allTodo);
      console.log(allTodo);
      
    } catch (error) {
      console.log(error);
      
    }
  })
})


editButtons.forEach((item) => {
    item.addEventListener("click", async (event) => {
      let clickedDocId = event.target.dataset.id;
      let itemIndex = allTodo.findIndex((item) => item.docid === clickedDocId);
      let updatedTitle = prompt(
        "enter updated title",
        allTodo[itemIndex].title
      );
      let updatedDesc = prompt(
        "enter updated description",
        allTodo[itemIndex].description
      );

      const todoRef = doc(db, "todos", clickedDocId);
      await updateDoc(todoRef, {
        title: updatedTitle,
        description: updatedDesc
      });

      allTodo[itemIndex].title = updatedTitle
      allTodo[itemIndex].description = updatedDesc

      render(allTodo)
    });
  });
