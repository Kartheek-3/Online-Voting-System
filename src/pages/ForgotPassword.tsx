import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Vote, ArrowLeft } from 'lucide-react';
import { auth } from '../lib/firebase';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-xl mb-4">
            <Vote className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-2 text-center">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg text-sm mb-6">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
