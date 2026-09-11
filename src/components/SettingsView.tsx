import React, { useState, useEffect } from 'react';
import { Settings, Shield, Bell, HelpCircle, ChevronRight, LogOut, Moon, Globe, Lock, X, Check, Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db, doc, getDoc } from '../lib/firebase';
import { AdminView } from './AdminView';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'af', name: 'Afrikaans', native: 'Afrikaans' },
  { code: 'zu', name: 'Zulu', native: 'isiZulu' },
  { code: 'xh', name: 'Xhosa', native: 'isiXhosa' },
  { code: 'st', name: 'Sesotho', native: 'Sesotho' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', native: '中文(简体)' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'nl', name: 'Dutch', native: 'Nederlands' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська' },
  { code: 'el', name: 'Greek', native: 'Ελληνικά' },
  { code: 'iw', name: 'Hebrew', native: 'עברית' }, 
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'fa', name: 'Persian', native: 'فارسی' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'ro', name: 'Romanian', native: 'Română' },
  { code: 'hu', name: 'Hungarian', native: 'Magyar' },
  { code: 'cs', name: 'Czech', native: 'Čeština' },
  { code: 'sv', name: 'Swedish', native: 'Svenska' },
  { code: 'da', name: 'Danish', native: 'Dansk' },
  { code: 'fi', name: 'Finnish', native: 'Suomi' },
  { code: 'no', name: 'Norwegian', native: 'Norsk' }
].sort((a, b) => a.name.localeCompare(b.name));

export function SettingsView() {
  const { user, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Settings state
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [notifications, setNotifications] = useState(true);
  const [privacyPublic, setPrivacyPublic] = useState(true);
  const [searchLanguage, setSearchLanguage] = useState('');

  const handleLanguageSelect = (code: string) => {
    // Set the cookie for google translate
    document.cookie = `googtrans=/en/${code}; path=/`;
    document.cookie = `googtrans=/en/${code}; path=/; domain=${window.location.hostname}`;
    
    // Try to trigger the select if it exists
    const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
      setActiveModal(null);
    } else {
      window.location.reload();
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      if (user.email?.toLowerCase() === 'timegig2026@gmail.com') {
        setIsAdmin(true);
        return;
      }
      
      const snap = await getDoc(doc(db, 'profiles', user.uid));
      if (snap.exists() && (snap.data() as UserProfile).isAdmin) {
        setIsAdmin(true);
      }
    };
    checkAdmin();
  }, [user]);

  if (showAdmin) return <AdminView onBack={() => setShowAdmin(false)} />;

  const sections = [
    {
      title: 'Account',
      items: [
        { icon: Shield, label: 'Privacy & Security', value: privacyPublic ? 'Public' : 'Private', onClick: () => setActiveModal('privacy') },
        { icon: Globe, label: 'Language', value: 'Select', onClick: () => setActiveModal('language') },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', value: notifications ? 'On' : 'Off', onClick: () => setActiveModal('notifications') },
        { icon: Moon, label: 'Dark Mode', value: darkMode ? 'On' : 'Off', onClick: () => setDarkMode(!darkMode) },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', value: null, onClick: () => setActiveModal('help') },
      ]
    },
    ...(isAdmin ? [{
      title: 'Management',
      items: [
        { icon: Lock, label: 'Admin Dashboard', value: 'Live', onClick: () => setShowAdmin(true) },
      ]
    }] : [])
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-100 shadow-sm z-10">
        <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-6 pt-6 relative">
        <div className="max-w-2xl mx-auto space-y-8">
          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-4">
                {section.title}
              </h2>
              <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                {section.items.map((item, idx) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors ${
                      idx !== section.items.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-500">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-gray-800 text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {item.value && (
                        <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full uppercase">
                          {item.value}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {user && (
            <button
              onClick={logout}
              className="w-full bg-red-50 text-red-600 p-5 rounded-[2rem] border border-red-100 flex items-center justify-center gap-3 hover:bg-red-100 transition-all active:scale-[0.98]"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-black uppercase tracking-widest text-xs">Sign Out</span>
            </button>
          )}

          <div className="text-center py-6">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              GigSouthAfrica v1.2.4
            </p>
          </div>
        </div>
      </div>

      {/* Settings Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-black text-gray-900 tracking-tight capitalize">
                {activeModal === 'privacy' ? 'Privacy & Security' : 
                 activeModal === 'notifications' ? 'Notifications' : 'Help Center'}
              </h2>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
              <div className="max-w-2xl mx-auto space-y-6">
                
                {activeModal === 'privacy' && (
                  <div className="bg-white rounded-[2rem] border border-gray-100 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">Public Profile</h3>
                        <p className="text-sm text-gray-500">Allow others to see your profile</p>
                      </div>
                      <button 
                        onClick={() => setPrivacyPublic(!privacyPublic)}
                        className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 ${privacyPublic ? 'bg-teal-500' : 'bg-gray-200'}`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${privacyPublic ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between opacity-50">
                      <div>
                        <h3 className="font-bold text-gray-900">Two-Factor Auth</h3>
                        <p className="text-sm text-gray-500">Add extra security (Coming soon)</p>
                      </div>
                      <button disabled className="w-14 h-8 rounded-full bg-gray-200 flex items-center px-1">
                        <div className="w-6 h-6 bg-white rounded-full shadow-sm" />
                      </button>
                    </div>
                  </div>
                )}

                {activeModal === 'language' && (
                  <div className="space-y-4 flex flex-col h-[70vh]">
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-4 sticky top-0 z-10 shadow-sm shrink-0">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search languages..."
                          value={searchLanguage}
                          onChange={(e) => setSearchLanguage(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-teal-500 font-medium"
                        />
                      </div>
                    </div>
                    <div className="bg-white rounded-[2rem] border border-gray-100 p-3 flex-1 overflow-y-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {LANGUAGES.filter(l => 
                          l.name.toLowerCase().includes(searchLanguage.toLowerCase()) || 
                          l.native.toLowerCase().includes(searchLanguage.toLowerCase())
                        ).map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            className="flex items-center justify-between p-4 rounded-xl hover:bg-teal-50 active:scale-[0.98] transition-all text-left group border border-transparent hover:border-teal-100"
                          >
                            <div>
                              <div className="font-bold text-gray-900 group-hover:text-teal-900 transition-colors">{lang.name}</div>
                              <div className="text-sm text-gray-500 group-hover:text-teal-600 transition-colors">{lang.native}</div>
                            </div>
                            <Globe className="w-5 h-5 text-gray-300 group-hover:text-teal-500 transition-colors" />
                          </button>
                        ))}
                      </div>
                      {LANGUAGES.filter(l => 
                        l.name.toLowerCase().includes(searchLanguage.toLowerCase()) || 
                        l.native.toLowerCase().includes(searchLanguage.toLowerCase())
                      ).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-center">
                          <Globe className="w-12 h-12 mb-3 opacity-20" />
                          <p className="font-medium">No languages found matching "{searchLanguage}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeModal === 'notifications' && (
                  <div className="bg-white rounded-[2rem] border border-gray-100 p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">Push Notifications</h3>
                        <p className="text-sm text-gray-500">Receive alerts on your device</p>
                      </div>
                      <button 
                        onClick={() => setNotifications(!notifications)}
                        className={`w-14 h-8 rounded-full transition-colors flex items-center px-1 ${notifications ? 'bg-teal-500' : 'bg-gray-200'}`}
                      >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                )}

                {activeModal === 'help' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <h3 className="font-bold text-teal-600 mb-2">How to hire a seeker?</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Navigate to the "Seekers" tab to view available workers. Tap their profile to see more details, and click "Hire" to send them a request. You will be notified once they accept!
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <h3 className="font-bold text-teal-600 mb-2">How to apply for gigs?</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Go to the "Jobs" tab. Browse through the available listings, click on one that matches your skills, and hit "Apply". The gig owner will review your profile.
                      </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <h3 className="font-bold text-teal-600 mb-2">Managing your profile</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Keep your profile up to date to increase your chances of being hired. Note that for security reasons, profile updates are limited to once every 5 days.
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
