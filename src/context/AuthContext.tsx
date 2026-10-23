'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isDemoUser?: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInAsDemo: () => void;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string>;
  isFirebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: AppUser = {
  uid: 'demo-household-user',
  email: 'cook@pantrypilot.local',
  displayName: 'Pantry Chef',
  photoURL: null,
  isDemoUser: true,
};

const DEMO_STORAGE_KEY = 'pantrypilot_demo_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if demo user is stored in localStorage
    const savedDemo = typeof window !== 'undefined' ? localStorage.getItem(DEMO_STORAGE_KEY) : null;
    if (savedDemo) {
      try {
        setUser(JSON.parse(savedDemo));
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem(DEMO_STORAGE_KEY);
      }
    }

    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, (fbUser: User | null) => {
        if (fbUser) {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName,
            photoURL: fbUser.photoURL,
            isDemoUser: false,
          });
        } else {
          // If no fbUser and no demo user
          const demoStillThere = localStorage.getItem(DEMO_STORAGE_KEY);
          if (demoStillThere) {
            setUser(JSON.parse(demoStillThere));
          } else {
            setUser(null);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  // Protected route enforcement
  useEffect(() => {
    if (!loading) {
      const isAuthPage = pathname === '/login';
      if (!user && !isAuthPage) {
        router.push('/login');
      } else if (user && isAuthPage) {
        router.push('/');
      }
    }
  }, [user, loading, pathname, router]);

  const signInWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error(
        'Firebase is not configured with live credentials. You can use the Quick Demo Sign-In below or configure .env.local.'
      );
    }
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const signInAsDemo = () => {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(DEMO_USER));
    setUser(DEMO_USER);
    router.push('/');
  };

  const signOut = async () => {
    localStorage.removeItem(DEMO_STORAGE_KEY);
    if (isFirebaseConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch (err) {
        console.error('Firebase sign out error:', err);
      }
    }
    setUser(null);
    router.push('/login');
  };

  const getIdToken = async (): Promise<string> => {
    if (user?.isDemoUser) {
      return `demo-${user.uid}`;
    }
    if (isFirebaseConfigured && auth && auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
    return user ? `demo-${user.uid}` : '';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInAsDemo,
        signOut,
        getIdToken,
        isFirebaseConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
