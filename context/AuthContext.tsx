import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { signIn, signUp } from '../services/firebaseService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  logout: () => void;
  login: typeof signIn;
  register: typeof signUp;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const logout = () => {
    signOut(auth);
  };

  const value: AuthContextType = {
    currentUser,
    loading,
    // Expose Firebase signIn and signUp through the context for the LoginScreen
    login: signIn,
    register: signUp,
    logout,
  };

  // Render children only after the initial auth state check is complete
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};