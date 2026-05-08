import React, { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Vote, Shield, LogOut, Globe, Settings, Eye, Type, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from '../context/AccessibilityContext';

export function Layout() {
  const { user, role, constituency, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { highContrast, toggleHighContrast, largeText, toggleLargeText } = useAccessibility();
  const [showAccessMenu, setShowAccessMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200 flex flex-col">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 group" aria-label="Home, SecureVote">
              <div className="bg-indigo-600 p-2 rounded-lg group-hover:bg-indigo-700 transition" aria-hidden="true">
                <Vote className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">SecureVote</span>
            </Link>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setShowAccessMenu(!showAccessMenu)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-full transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  aria-label="Settings"
                  aria-expanded={showAccessMenu}
                >
                  <Settings className="w-5 h-5" />
                </button>
                
                {showAccessMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-700 mb-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Settings</span>
                      <button onClick={() => setShowAccessMenu(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Close Settings">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="px-3 mb-1 mt-3">
                      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Accessibility</span>
                    </div>

                    <button 
                      onClick={toggleHighContrast}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition"
                      aria-pressed={highContrast}
                    >
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>High Contrast</span>
                      </div>
                      <div className={`w-8 h-4 rounded-full transition-colors relative ${highContrast ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${highContrast ? 'translate-x-4' : ''}`} />
                      </div>
                    </button>

                    <button 
                      onClick={toggleLargeText}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition"
                      aria-pressed={largeText}
                    >
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Large Text</span>
                      </div>
                      <div className={`w-8 h-4 rounded-full transition-colors relative ${largeText ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${largeText ? 'translate-x-4' : ''}`} />
                      </div>
                    </button>
                  </div>
                )}
              </div>

            {user ? (
              <div className="flex items-center gap-6">
                <nav className="flex items-center gap-4" aria-label="Main Navigation">
                  <Link to="/" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1">
                    {t('dashboard')}
                  </Link>
                  <Link to="/nominate" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1">
                    {t('nominate')}
                  </Link>
                  {(role === 'admin' || role === 'election_officer') && (
                    <>
                      <Link to="/admin" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1">
                        <Shield className="w-4 h-4" aria-hidden="true" />
                        {t('admin')}
                      </Link>
                      <Link to="/admin/voters" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1">
                        <Shield className="w-4 h-4" aria-hidden="true" />
                        Verification
                      </Link>
                      <Link to="/admin/booths" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1">
                        <Shield className="w-4 h-4" aria-hidden="true" />
                        Booths
                      </Link>
                    </>
                  )}
                </nav>
                <div className="flex items-center gap-4 border-l pl-6 border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-700">
                     <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                     <select 
                       onChange={(e) => changeLanguage(e.target.value)}
                       value={i18n.language}
                       className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 border-none focus:ring-0 cursor-pointer outline-none p-0 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                       aria-label={t('selectLanguage') || 'Select Language'}
                     >
                       <option value="en" className="dark:bg-slate-800">Eng</option>
                       <option value="ml" className="dark:bg-slate-800">Mal</option>
                       <option value="hi" className="dark:bg-slate-800">Hin</option>
                       <option value="te" className="dark:bg-slate-800">Tel</option>
                     </select>
                  </div>
                  <Link to="/profile" className="hidden sm:block flex flex-col justify-end text-right hover:bg-slate-50 dark:hover:bg-slate-800 px-2 py-1 rounded transition" aria-label="User Info">
                    <span className="text-sm font-medium block text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">{user.email}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block uppercase tracking-wide">Const: {constituency || 'Global'}</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md focus-visible:ring-2 focus-visible:ring-red-500"
                    aria-label={t('signOut')}
                  >
                    <LogOut className="w-4 h-4" aria-hidden="true" />
                    {t('signOut')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 pr-4 border-r border-slate-200 dark:border-slate-700">
                     <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" aria-hidden="true" />
                     <select 
                       onChange={(e) => changeLanguage(e.target.value)}
                       value={i18n.language}
                       className="bg-transparent text-sm font-medium text-slate-600 dark:text-slate-300 border-none focus:ring-0 cursor-pointer outline-none p-0 focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                       aria-label={t('selectLanguage') || 'Select Language'}
                     >
                       <option value="en" className="dark:bg-slate-800">Eng</option>
                       <option value="ml" className="dark:bg-slate-800">Mal</option>
                       <option value="hi" className="dark:bg-slate-800">Hin</option>
                       <option value="te" className="dark:bg-slate-800">Tel</option>
                     </select>
                  </div>
                <Link to="/login" className="text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-2 py-1">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition focus-visible:ring-2 focus-visible:ring-indigo-500"
                >
                  Register
                </Link>
              </div>
            )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" role="main">
        <Outlet />
      </main>
    </div>
  );
}
