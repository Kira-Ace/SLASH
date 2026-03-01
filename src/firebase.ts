import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCTij2ZzIVEDLdHr1GKsr_lTlqB1sHbvt0",
    authDomain: "slash-f8089.firebaseapp.com",
    projectId: "slash-f8089",
    storageBucket: "slash-f8089.firebasestorage.app",
    messagingSenderId: "690013156442",
    appId: "1:690013156442:web:f5deb02d5ed85a18569463",
};

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();