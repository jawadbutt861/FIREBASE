// Authentication utilities
import { auth, db, googleProvider } from '../firebaseconfig.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup,
    signOut, 
    onAuthStateChanged,
    updateProfile,
    updatePassword
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Check if user is authenticated
export function checkAuth() {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
            resolve(user);
        });
    });
}

// Sign up with email and password
export async function signUpWithEmail(email, password, firstName, lastName) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update user profile
        await updateProfile(user, {
            displayName: `${firstName} ${lastName}`
        });
        
        // Save user data to Firestore
        await setDoc(doc(db, 'users', user.uid), {
            firstName: firstName,
            lastName: lastName,
            email: email,
            photoURL: user.photoURL || '',
            createdAt: new Date()
        });
        
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Sign in with email and password
export async function signInWithEmail(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Sign in with Google
export async function signInWithGoogle() {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        
        // Check if user document exists, if not create it
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
            const names = user.displayName ? user.displayName.split(' ') : ['', ''];
            await setDoc(doc(db, 'users', user.uid), {
                firstName: names[0] || 'User',
                lastName: names.slice(1).join(' ') || 'Name',
                email: user.email,
                photoURL: user.photoURL || '',
                createdAt: new Date()
            });
        }
        
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Sign out
export async function signOutUser() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get user data from Firestore
export async function getUserData(uid) {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return { success: true, data: userDoc.data() };
        } else {
            return { success: false, error: 'User data not found' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Update user profile
export async function updateUserProfile(uid, userData) {
    try {
        await updateDoc(doc(db, 'users', uid), userData);
        
        // Update Firebase Auth profile if displayName changed
        if (userData.firstName || userData.lastName) {
            const user = auth.currentUser;
            if (user) {
                await updateProfile(user, {
                    displayName: `${userData.firstName} ${userData.lastName}`
                });
            }
        }
        
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Update user password
export async function updateUserPassword(newPassword) {
    try {
        const user = auth.currentUser;
        if (user) {
            await updatePassword(user, newPassword);
            return { success: true };
        } else {
            return { success: false, error: 'No user logged in' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Redirect if not authenticated
export async function requireAuth() {
    const user = await checkAuth();
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    return user;
}

// Redirect if already authenticated
export async function redirectIfAuthenticated() {
    const user = await checkAuth();
    if (user) {
        window.location.href = 'dashboard.html';
        return true;
    }
    return false;
}