import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Vote, ShieldCheck, Lock } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email.endsWith('@gmail.com')) {
      setError('Please use a @gmail.com email address.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        role: 'voter', // Default role
        constituency: null,
        studentId: null,
        isVerified: false,
        createdAt: new Date().toISOString()
      });

      await sendEmailVerification(userCredential.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      if (!userCredential.user.email || !userCredential.user.email.endsWith('@gmail.com')) {
        setError('Only @gmail.com email addresses are allowed.');
        await auth.signOut();
        setLoading(false);
        return;
      }
      
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await setDoc(userDocRef, {
          email: userCredential.user.email,
          role: 'voter',
          constituency: null,
          studentId: null,
          isVerified: true,
          createdAt: new Date().toISOString()
        });
      }

      navigate('/');
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* Left panel - Branding/Info (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 dark:bg-slate-950 relative overflow-hidden flex-col justify-between p-12 transition-colors">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-8 text-white">
            <Vote className="w-8 h-8 text-indigo-400" />
            <span className="text-2xl font-bold tracking-tight">SecureVote</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Join the future of <br />
            digital democracy.
          </h1>
          <p className="text-slate-300 text-lg max-w-md">
            Register as a voter today. It only takes a few minutes to verify your identity and get ready for the upcoming elections.
          </p>
        </div>
        
        <div className="relative z-10 grid grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700 text-white transition-colors">
            <ShieldCheck className="w-8 h-8 mb-3 text-indigo-400" />
            <h3 className="font-semibold mb-1">Identity Confirmed</h3>
            <p className="text-slate-400 text-sm">Robust verification ensures "One Person, One Vote".</p>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700 text-white transition-colors">
            <Lock className="w-8 h-8 mb-3 text-indigo-400" />
            <h3 className="font-semibold mb-1">Privacy Preserved</h3>
            <p className="text-slate-400 text-sm">Your personal data is managed securely and kept separate from your ballot.</p>
          </div>
        </div>

        {/* Decorative background vectors */}
        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 -mr-20 -mb-20 w-80 h-80 rounded-full bg-emerald-600/20 blur-3xl"></div>
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 dark:bg-slate-900 transition-colors">
        <div className="mx-auto w-full max-w-sm lg:w-96 flex flex-col items-center">
          {/* Mobile header only */}
          <div className="flex items-center gap-2 mb-8 text-indigo-600 dark:text-indigo-400 lg:hidden transition-colors">
            <Vote className="w-8 h-8" />
            <span className="text-2xl font-bold tracking-tight">SecureVote</span>
          </div>
          
          <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-6">Create an account</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-white"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-white"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Sign up'}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between">
              <span className="w-1/5 border-b dark:border-slate-600 lg:w-1/4"></span>
              <p className="text-xs text-center text-slate-500 dark:text-slate-400 uppercase">or sign up with</p>
              <span className="w-1/5 border-b dark:border-slate-600 lg:w-1/4"></span>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
