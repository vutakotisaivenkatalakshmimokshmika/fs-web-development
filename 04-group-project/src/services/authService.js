import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function registerUser({ name, email, password, role, department, rollNoOrEmpId }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const profile = { name, email, role, department, rollNoOrEmpId: rollNoOrEmpId || "" };
  await setDoc(doc(db, "users", cred.user.uid), profile);
  return { uid: cred.user.uid, ...profile };
}

export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, "users", cred.user.uid));
  if (!snap.exists()) {
    throw new Error("No profile found for this account. Contact an administrator.");
  }
  return { uid: cred.user.uid, ...snap.data() };
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logoutUser() {
  await signOut(auth);
}

export async function fetchUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}