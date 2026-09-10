/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { BottomBar } from './components/BottomBar';
import { GigsView, Gig } from './components/GigsView';
import { NavigationMap } from './components/NavigationMap';
import { useAuth } from './hooks/useAuth';
import { LogOut, LogIn, User, Bell } from 'lucide-react';
import { ProfileView } from './components/ProfileView';
import { SeekersView } from './components/SeekersView';
import { AlertsView } from './components/AlertsView';
import { SettingsView } from './components/SettingsView';
import { useHireRequests } from './hooks/useHireRequests';
import { HireNotification } from './components/HireNotification';
import { AuthFlow } from './components/AuthFlow';
import { SplashScreen } from './components/SplashScreen';
import { JobSlideshow } from './components/JobSlideshow';
import { useEffect } from 'react';
import { useWallpaper } from './hooks/useWallpaper';

// @ts-ignore
const API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function App() {
  const { user, logout, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('gigs');
  const [activeGig, setActiveGig] = useState<Gig | null>(null);
  const [splashPhase, setSplashPhase] = useState<'name' | 'slideshow' | 'done'>('name');
  const { wallpaper } = useWallpaper();

  useEffect(() => {
    if (splashPhase === 'name') {
      const timer = setTimeout(() => {
        setSplashPhase('slideshow');
      }, 3000); // 3s for name
      return () => clearTimeout(timer);
    } else if (splashPhase === 'slideshow') {
      const timer = setTimeout(() => {
        setSplashPhase('done');
      }, 17500); // 17.5s for slideshow (3.5s per job x 5 jobs)
      return () => clearTimeout(timer);
    }
  }, [splashPhase]);

  const { incomingRequest, respondToRequest } = useHireRequests(user?.uid || '');

  if (splashPhase === 'name') {
    return <SplashScreen />;
  }

  if (splashPhase === 'slideshow') {
    return <JobSlideshow />;
  }

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthFlow onSuccess={() => setActiveTab('profile')} />;
  }

  const content = {
    profile: (
      <ProfileView user={user} onLogout={logout} onRedirectToGigs={() => setActiveTab('gigs')} />
    ),
    gigs: (
      <GigsView onGigAccepted={(gig) => setActiveGig(gig)} />
    ),
    seekers: (
      <SeekersView hirerId={user.uid} />
    ),
    alerts: (
      <AlertsView userId={user.uid} />
    ),
    settings: (
      <SettingsView />
    ),
  };

  return (
    <APIProvider apiKey={API_KEY}>
      <div className="h-screen w-full bg-gray-50 flex flex-col font-sans overflow-hidden">
        <div className="w-full h-full relative flex flex-col">
          
          {/* Main Content Area */}
          <main 
            className="flex-1 relative overflow-hidden transition-all duration-700 ease-in-out"
            style={{
              backgroundImage: wallpaper ? `url(${wallpaper})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed'
            }}
          >
            {wallpaper && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] pointer-events-none" />}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute inset-0 pb-16"
              >
                {content[activeTab as keyof typeof content]}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Bottom Navigation */}
          {!activeGig && (
            <BottomBar activeTab={activeTab} onTabChange={setActiveTab} />
          )}

          {/* Navigation Map Overlay */}
          <AnimatePresence>
            {activeGig && (
              <NavigationMap 
                gig={activeGig} 
                onClose={() => setActiveGig(null)} 
              />
            )}
          </AnimatePresence>

          {/* Hire Notifications for Seekers */}
          <AnimatePresence>
            {incomingRequest && (
              <HireNotification 
                request={incomingRequest} 
                onRespond={(status) => respondToRequest(incomingRequest.id, status)} 
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </APIProvider>
  );
}
