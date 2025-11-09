import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type UserCredential,
} from 'firebase/auth';
import { ref as dbRef, get, set, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebaseConfig';
import type { ProfileData } from '../types';

// --- Authentication ---
export const signUp = async (email: string, name: string, pass: string): Promise<UserCredential> => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  // Create a user profile node in Realtime Database upon signup
  await set(dbRef(db, 'users/' + user.uid), {
    uid: user.uid,
    name: name,
    email: user.email,
    createdAt: new Date().toISOString(),
    farmSize: '',
    scriptUrl: '',
    farmLocation: null,
    profileImage: '',
    language: 'en', // Default to English on signup
  });

  return userCredential;
};

export const signIn = async (email: string, pass: string): Promise<UserCredential> => {
  return signInWithEmailAndPassword(auth, email, pass);
};


// --- Realtime Database Data Management ---
export const getUserData = async (userId: string): Promise<ProfileData | null> => {
  const userRef = dbRef(db, 'users/' + userId);
  const snapshot = await get(userRef);

  if (snapshot.exists()) {
    return snapshot.val() as ProfileData;
  } else {
    console.warn(`No user data found for UID: ${userId}`);
    return null;
  }
};

export const updateUserData = async (userId: string, data: Partial<ProfileData>): Promise<void> => {
  const userRef = dbRef(db, 'users/' + userId);
  // Using update() is better than set() for partial updates as it won't overwrite the entire object
  await update(userRef, data);
};


// --- Firebase Storage Management ---
export const uploadProfileImage = async (userId: string, file: File): Promise<string> => {
  // Create a reference with a more robust path to avoid file name collisions
  const fileRef = storageRef(storage, `profile_images/${userId}/${Date.now()}_${file.name}`);

  // Upload the file
  const snapshot = await uploadBytes(fileRef, file);

  // Get the download URL to store in the Realtime Database
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
};