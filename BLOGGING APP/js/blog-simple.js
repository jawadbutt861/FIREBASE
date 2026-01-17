// Temporary blog utilities without complex indexes
import { db } from '../firebaseconfig.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where,
    getDoc,
    limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getUserData } from './auth.js';

// Get all blog posts (simple version - no orderBy)
export async function getAllBlogPostsSimple() {
    try {
        const querySnapshot = await getDocs(collection(db, 'blogs'));
        const blogs = [];
        
        for (const docSnap of querySnapshot.docs) {
            const blogData = docSnap.data();
            const userData = await getUserData(blogData.userId);
            
            blogs.push({
                id: docSnap.id,
                ...blogData,
                author: userData.success ? userData.data : { firstName: 'Unknown', lastName: 'User' }
            });
        }
        
        // Sort manually by createdAt
        blogs.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
        
        return { success: true, blogs };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Get user blog posts (simple version - no orderBy)
export async function getUserBlogPostsSimple(userId) {
    try {
        const q = query(collection(db, 'blogs'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const blogs = [];
        
        querySnapshot.forEach((doc) => {
            blogs.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sort manually by createdAt
        blogs.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB - dateA;
        });
        
        return { success: true, blogs };
    } catch (error) {
        return { success: false, error: error.message };
    }
}