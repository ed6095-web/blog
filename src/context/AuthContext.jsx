// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChangedHelper, logout } from "../lib/auth";
import { auth, storage } from "../lib/firebase";
import { updateProfile as fbUpdateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedHelper((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const updateProfile = async ({ displayName, photoFile }) => {
    if (!auth.currentUser) throw new Error("No authenticated user");

    let updates = {};
    if (displayName) updates.displayName = displayName;

    // Handle profile image
    if (photoFile) {
      const imageRef = ref(storage, `avatars/${auth.currentUser.uid}/${photoFile.name}`);
      await uploadBytes(imageRef, photoFile);
      const photoURL = await getDownloadURL(imageRef);
      updates.photoURL = photoURL;
    }

    await fbUpdateProfile(auth.currentUser, updates);

    // Refresh user
    setUser({ ...auth.currentUser, ...updates });
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout: handleLogout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
