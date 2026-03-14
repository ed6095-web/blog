// src/lib/auth.js
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from "firebase/auth";
import { auth } from "./firebase";

// Sign up new user
export const signup = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

// Sign in existing user
export const login = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// Sign out current user
export const logout = async () => {
  return signOut(auth);
};

// Get current user (observer pattern for React Context)
export const onAuthStateChangedHelper = (callback) => {
  return auth.onAuthStateChanged(callback);
};
