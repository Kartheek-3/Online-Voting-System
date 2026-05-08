import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, MapPin, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInitProfile: () => void;
  }
}

export function Profile() {
  const { user, role, constituency } = useAuth();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    // Inject the Google Translate script specifically for the profile page
    const addScript = () => {
      window.googleTranslateElementInitProfile = function() {
        if (window.google && window.google.translate) {
          // Clear if already exists to prevent duplicates
          const el = document.getElementById('google_translate_element_profile');
          if (el) el.innerHTML = '';
          
          new window.google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: 'en,ml,hi,te,ta,kn,mr,bn,gu',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
          }, 'google_translate_element_profile');
        }
      };

      if (!document.getElementById('google-translate-script')) {
        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInitProfile";
        document.body.appendChild(script);
      } else {
        // If script is already there, just initialize
        if (typeof window.googleTranslateElementInitProfile === 'function') {
          window.googleTranslateElementInitProfile();
        }
      }
    };
    addScript();
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  if (!user) return <div className="p-8 text-center text-slate-500">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center overflow-hidden">
             {user.imageUrl ? <img src={user.imageUrl} alt="Profile avatar" className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">User Profile</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400">{user.email || user.primaryEmailAddress?.emailAddress}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors">
            <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Role</p>
              <p className="font-bold text-slate-900 dark:text-white capitalize">{role ? role.replace('_', ' ') : 'Voter'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700 transition-colors">
            <MapPin className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Constituency</p>
              <p className="font-bold text-slate-900 dark:text-white capitalize">{constituency || 'Global (Admin)'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
               <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/> 
               App Language (Built-in)
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Change the primary interface language.</p>
            
            <select 
              onChange={(e) => changeLanguage(e.target.value)}
              value={i18n.language}
              className="w-full sm:max-w-xs px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              aria-label={t('selectLanguage') || 'Select Language'}
            >
              <option value="en">English (Eng)</option>
              <option value="ml">Malayalam (Mal)</option>
              <option value="hi">Hindi (Hin)</option>
              <option value="te">Telugu (Tel)</option>
            </select>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-700 mb-10">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
               <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/> 
               Full Website Translation
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Use Google Translate to automatically translate any missing content across the entire website.</p>
            <div id="google_translate_element_profile" className="min-h-[40px] px-2 text-slate-900 dark:text-white"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
