import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: any | null;
  role: 'admin' | 'election_officer' | 'candidate' | 'voter' | null;
  constituency: string | null;
  studentId: string | null;
  isVerified: boolean;
  loading: boolean;
  clerkSetupError: string | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<'admin' | 'election_officer' | 'candidate' | 'voter' | null>(null);
  const [constituency, setConstituency] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setConstituency(null);
        setStudentId(null);
        setIsVerified(false);
        setLoading(false);
        return;
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        imageUrl: firebaseUser.photoURL,
        ...firebaseUser
      });
      
      let verifiedStatus = false;

      if (firebaseUser.email === 'admin@gmail.com') {
        setRole('admin');
        setConstituency('Global');
        setStudentId('ADMIN');
        verifiedStatus = true;
      } else {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setRole(userDoc.data().role as any);
            setConstituency(userDoc.data().constituency || null);
            setStudentId(userDoc.data().studentId || null);
            verifiedStatus = userDoc.data().isVerified === true;
          } else {
             setRole('voter');
             setConstituency(null);
             setStudentId(null);
             verifiedStatus = false;
          }
        } catch (error) {
          console.error("Failed to fetch user role", error);
          verifiedStatus = false;
        }
      }
      setIsVerified(verifiedStatus);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch(e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, constituency, studentId, isVerified, loading, clerkSetupError: null, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
