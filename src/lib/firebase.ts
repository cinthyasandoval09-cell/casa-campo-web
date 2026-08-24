import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence, onSnapshot, collection, doc, updateDoc, increment, addDoc, setDoc, deleteDoc, getDoc, query, where, orderBy } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDiwQa5Nx3tzs6mDCcgeM45yGGv6lmMS24",
  authDomain: "casa-campo-web.firebaseapp.com",
  projectId: "casa-campo-web",
  storageBucket: "casa-campo-web.firebasestorage.app",
  messagingSenderId: "421341956008",
  appId: "1:421341956008:web:0ee0fa2b30024168d2bf9d",
  measurementId: "G-9GVCGYTBZZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
  } else if (err.code == 'unimplemented') {
    console.warn("The current browser does not support all of the features required to enable persistence");
  }
});

export { db, auth, onSnapshot, collection, doc, updateDoc, increment, addDoc, setDoc, deleteDoc, getDoc, query, where, orderBy, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged };
