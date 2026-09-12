import React, { useState, useEffect } from 'react';
import { Settings, Shield, Bell, HelpCircle, ChevronRight, LogOut, Moon, Globe, Lock, X, Check, Search, UserX, UserCheck, AlertCircle, Loader2, Volume2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db, doc, getDoc, setDoc, serverTimestamp } from '../lib/firebase';
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
  const { user, logout, isAccountDisabled, toggleAccountStatus } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Settings state
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [alertSounds, setAlertSounds] = useState(() => localStorage.getItem('alertSounds') !== 'false');
  const [notifications, setNotifications] = useState(true);
  const [privacyPublic, setPrivacyPublic] = useState(true);
  const [searchLanguage, setSearchLanguage] = useState('');
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [updatingAccountStatus, setUpdatingAccountStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

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

  const handleToggleAccountStatus = async () => {
    setUpdatingAccountStatus(true);
    setStatusFeedback(null);
    try {
      await toggleAccountStatus();
      setStatusFeedback(`Account ${!isAccountDisabled ? 'disabled' : 'enabled'} successfully`);
    } catch (error) {
      console.error(error);
      setStatusFeedback("Failed to update status");
    } finally {
      setUpdatingAccountStatus(false);
      setTimeout(() => setStatusFeedback(null), 3000);
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
    if (alertSounds) {
      localStorage.setItem('alertSounds', 'true');
    } else {
      localStorage.setItem('alertSounds', 'false');
    }
  }, [alertSounds]);

  useEffect(() => {
    if (!user) return;
    const checkUserStatus = async () => {
      if (user.email?.toLowerCase() === 'timegig2026@gmail.com') {
        setIsAdmin(true);
      }
      
      try {
        const snap = await getDoc(doc(db, 'profiles', user.uid));
        if (snap.exists()) {
          const data = snap.data() as UserProfile;
          if (data.isAdmin) {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error('Error fetching profile in settings:', err);
      }
    };
    checkUserStatus();
  }, [user]);

  const handleAccountStatusClick = () => {
    if (isAccountDisabled) {
      // Re-enabling account is immediate
      executeToggleStatus(true);
    } else {
      // Show confirmation modal before disabling
      setShowDisableModal(true);
    }
  };

  const executeToggleStatus = async (enableState: boolean) => {
    if (!user || updatingAccountStatus) return;
    setUpdatingAccountStatus(true);
    setShowDisableModal(false);
    try {
      await toggleAccountStatus(enableState);
      setStatusFeedback(enableState ? 'Account re-enabled! You are now visible to others.' : 'Account disabled. You are now hidden from searches.');
      setTimeout(() => setStatusFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to update account status:', err);
      setStatusFeedback('Failed to update account status. Please try again.');
      setTimeout(() => setStatusFeedback(null), 3500);
    } finally {
      setUpdatingAccountStatus(false);
    }
  };

  if (showAdmin) return <AdminView onBack={() => setShowAdmin(false)} />;

  const sections = [
    {
      title: 'Account',
      items: [
        { 
          icon: isAccountDisabled ? UserX : UserCheck, 
          iconColor: isAccountDisabled ? 'text-rose-600 bg-rose-50' : 'text-green-800 bg-green-50',
          label: isAccountDisabled ? 'Account Status (Disabled)' : 'Account Status (Active)', 
          value: updatingAccountStatus ? '...' : (isAccountDisabled ? 'Enable Anytime' : 'Disable'),
          badgeColor: isAccountDisabled ? 'text-rose-700 bg-rose-50 border border-rose-200' : 'text-green-900 bg-green-50 border border-green-200',
          onClick: handleAccountStatusClick 
        },
        { icon: Shield, label: 'Privacy & Security', value: privacyPublic ? 'Public' : 'Private', onClick: () => setActiveModal('privacy') },
        { icon: Globe, label: 'Language', value: 'Select', onClick: () => setActiveModal('language') },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', value: notifications ? 'On' : 'Off', onClick: () => setActiveModal('notifications') },
        { icon: Volume2, label: 'Alert Sounds', value: alertSounds ? 'On' : 'Off', onClick: () => setAlertSounds(!alertSounds) },
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
      <div className="bg-white px-4 pt-3 pb-2.5 border-b border-gray-100 shadow-xs z-10">
        <h1 className="text-sm font-black text-gray-900 tracking-tight uppercase">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 px-4 pt-3.5 relative">
        <div className="max-w-2xl mx-auto space-y-3">

          {/* Feedback notification */}
          {statusFeedback && (
            <div className="p-2.5 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-xs text-green-950 font-bold shadow-xs">
              <Check className="w-3.5 h-3.5 text-green-800 flex-shrink-0" />
              <span>{statusFeedback}</span>
            </div>
          )}

          {/* Disabled account banner */}
          {isAccountDisabled && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2.5 text-xs shadow-xs">
              <div className="flex items-center gap-2 text-rose-800 min-w-0">
                <UserX className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-rose-900 text-xs truncate">Your account is disabled</p>
                  <p className="text-[10px] text-rose-700">Hidden from hirers and seekers. You can enable it anytime.</p>
                </div>
              </div>
              <button
                onClick={() => executeToggleStatus(true)}
                disabled={updatingAccountStatus}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-lg font-bold text-[11px] shadow-xs cursor-pointer flex-shrink-0 flex items-center gap-1 transition-all"
              >
                {updatingAccountStatus ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                <span>Enable Now</span>
              </button>
            </div>
          )}

          {sections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <h2 className="text-[9px] font-bold text-gray-400 uppercase tracking-wider px-2">
                {section.title}
              </h2>
              <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
                {section.items.map((item: any, idx) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full flex items-center justify-between p-2.5 hover:bg-gray-50 transition-colors ${
                      idx !== section.items.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${item.iconColor || 'bg-gray-100 text-gray-500'}`}>
                        <item.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-gray-800 text-xs truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.value && (
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${item.badgeColor || 'text-green-800 bg-green-50'}`}>
                          {item.value}
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {user && (
            <button
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
              className="w-full bg-red-50 text-red-600 p-2.5 rounded-xl border border-red-100 flex items-center justify-center hover:bg-red-100 transition-all active:scale-[0.98] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          <div className="text-center py-3">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
              GigSouthAfrica v1.2.4
            </p>
          </div>
        </div>
      </div>

      {/* Settings Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col"
          >
            <div className="px-4 pt-3 pb-2.5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-900 tracking-tight capitalize">
                {activeModal === 'privacy' ? 'Privacy & Security' : 
                 activeModal === 'notifications' ? 'Notifications' : 'Help Center'}
              </h2>
              <button 
                onClick={() => setActiveModal(null)}
                className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
              <div className="max-w-2xl mx-auto space-y-4">
                
                {activeModal === 'privacy' && (
                  <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-xs">Account Active Status</h3>
                        <p className="text-[11px] text-gray-500">
                          {isAccountDisabled ? 'Account is disabled (hidden from searches)' : 'Account is active and visible to hirers'}
                        </p>
                      </div>
                      <button 
                        onClick={handleToggleAccountStatus}
                        disabled={updatingAccountStatus}
                        title={isAccountDisabled ? "Click to enable account" : "Click to disable account"}
                        className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${!isAccountDisabled ? 'bg-green-700' : 'bg-rose-500'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${!isAccountDisabled ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-xs">Public Profile</h3>
                        <p className="text-[11px] text-gray-500">Allow others to see your profile</p>
                      </div>
                      <button 
                        onClick={() => setPrivacyPublic(!privacyPublic)}
                        className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${privacyPublic ? 'bg-green-700' : 'bg-gray-200'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${privacyPublic ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <div className="flex items-center justify-between opacity-50">
                      <div>
                        <h3 className="font-bold text-gray-900 text-xs">Two-Factor Auth</h3>
                        <p className="text-[11px] text-gray-500">Add extra security (Coming soon)</p>
                      </div>
                      <button disabled className="w-10 h-6 rounded-full bg-gray-200 flex items-center px-0.5">
                        <div className="w-5 h-5 bg-white rounded-full shadow-xs" />
                      </button>
                    </div>
                  </div>
                )}

                {activeModal === 'language' && (
                  <div className="space-y-3 flex flex-col h-[70vh]">
                    <div className="bg-white rounded-xl border border-gray-100 p-2.5 sticky top-0 z-10 shadow-xs shrink-0">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search languages..."
                          value={searchLanguage}
                          onChange={(e) => setSearchLanguage(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-green-700 text-xs font-medium"
                        />
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-2 flex-1 overflow-y-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {LANGUAGES.filter(l => 
                          l.name.toLowerCase().includes(searchLanguage.toLowerCase()) || 
                          l.native.toLowerCase().includes(searchLanguage.toLowerCase())
                        ).map((lang) => (
                          <button
                            key={lang.code}
                            onClick={() => handleLanguageSelect(lang.code)}
                            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-green-50 active:scale-[0.98] transition-all text-left group border border-transparent hover:border-green-100"
                          >
                            <div>
                              <div className="font-bold text-gray-900 text-xs group-hover:text-green-950 transition-colors">{lang.name}</div>
                              <div className="text-[11px] text-gray-500 group-hover:text-green-800 transition-colors">{lang.native}</div>
                            </div>
                            <Globe className="w-4 h-4 text-gray-300 group-hover:text-green-700 transition-colors" />
                          </button>
                        ))}
                      </div>
                      {LANGUAGES.filter(l => 
                        l.name.toLowerCase().includes(searchLanguage.toLowerCase()) || 
                        l.native.toLowerCase().includes(searchLanguage.toLowerCase())
                      ).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-400 text-center">
                          <Globe className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-xs font-medium">No languages found matching "{searchLanguage}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeModal === 'notifications' && (
                  <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-xs">Push Notifications</h3>
                        <p className="text-[11px] text-gray-500">Receive alerts on your device</p>
                      </div>
                      <button 
                        onClick={() => setNotifications(!notifications)}
                        className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${notifications ? 'bg-green-700' : 'bg-gray-200'}`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-xs transition-transform ${notifications ? 'translate-x-4' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                )}

                {activeModal === 'help' && (
                  <div className="space-y-2.5">
                    <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-xs">
                      <h3 className="font-bold text-green-800 text-xs mb-1">How to hire a seeker?</h3>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        Navigate to the "Seekers" tab to view available workers. Tap their profile to see more details, and click "Hire" to send them a request. You will be notified once they accept!
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-xs">
                      <h3 className="font-bold text-green-800 text-xs mb-1">How to apply for gigs?</h3>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
                        Go to the "Jobs" tab. Browse through the available listings, click on one that matches your skills, and hit "Apply". The gig owner will review your profile.
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-100 p-3.5 shadow-xs">
                      <h3 className="font-bold text-green-800 text-xs mb-1">Managing your profile</h3>
                      <p className="text-[11px] text-gray-600 leading-relaxed">
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

      {/* Disable Account Confirmation Modal */}
      <AnimatePresence>
        {showDisableModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 12 }}
              className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-100 space-y-3"
            >
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <UserX className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Disable Account?</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Your profile will be hidden from seekers, hirers, and search results. Your posted gigs will also be paused.
                </p>
                <div className="text-xs font-semibold text-green-950 bg-green-50 p-2.5 rounded-xl mt-2 border border-green-100 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-green-800 flex-shrink-0" />
                  <span>You can re-enable your account anytime with one tap.</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeToggleStatus(false)}
                  disabled={updatingAccountStatus}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {updatingAccountStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Disable Now</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
