import React, { useState, useEffect } from 'react';
import { Settings, Shield, Bell, HelpCircle, ChevronRight, LogOut, Moon, Globe, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db, doc, getDoc } from '../lib/firebase';
import { AdminView } from './AdminView';
import { UserProfile } from '../types';

export function SettingsView() {
  const { user, logout } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      // Direct email check for immediate access
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
        { icon: Shield, label: 'Privacy & Security', value: 'Protected' },
        { icon: Globe, label: 'Language', value: 'English' },
      ]
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', value: 'On' },
        { icon: Moon, label: 'Dark Mode', value: 'System' },
      ]
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Center', value: null },
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

      <div className="flex-1 overflow-y-auto pb-24 px-6 pt-6">
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
    </div>
  );
}
