/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { BottomBar } from './components/BottomBar';
import { GigsView } from './components/GigsView';
import { NavigationMap } from './components/NavigationMap';
import { useAuth } from './hooks/useAuth';
import { LogOut, LogIn, User, Bell, UserX, CheckCircle, Loader2 } from 'lucide-react';
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
import { Gig } from './types';

// @ts-ignore
const API_KEY = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function App() {
  const { user, logout, loading: authLoading, isAccountDisabled, toggleAccountStatus } = useAuth();
  const [activeTab, setActiveTab] = useState('gigs');
  const [activeGig, setActiveGig] = useState<Gig | null>(null);
  const [splashPhase, setSplashPhase] = useState<'name' | 'slideshow' | 'done'>('name');
  const { wallpaper } = useWallpaper();
  const [enablingAccount, setEnablingAccount] = useState(false);

  const handleEnableAccount = async () => {
    setEnablingAccount(true);
    try {
      await toggleAccountStatus(true);
    } catch (e) {
      console.error("Failed to enable account:", e);
    } finally {
      setEnablingAccount(false);
    }
  };

  useEffect(() => {
    if (splashPhase === 'name') {
      const timer = setTimeout(() => {
        // If auth check is done and user is logged in, skip slideshow
        if (!authLoading && user) {
          setSplashPhase('done');
        } else {
          setSplashPhase('slideshow');
        }
      }, 3000); // 3s for name
      return () => clearTimeout(timer);
    } else if (splashPhase === 'slideshow') {
      // If user logs in during slideshow, immediately skip
      if (!authLoading && user) {
        setSplashPhase('done');
        return;
      }
      const timer = setTimeout(() => {
        setSplashPhase('done');
      }, 17500); // 17.5s for slideshow (3.5s per job x 5 jobs)
      return () => clearTimeout(timer);
    }
  }, [splashPhase, user, authLoading]);

  const { incomingRequest, respondToRequest } = useHireRequests(user?.uid || '');

  const handleHireResponse = async (request: any, status: 'accepted' | 'declined') => {
    await respondToRequest(request.id, status);

    if (status === 'accepted') {
      const targetGig: Gig = {
        id: request.gigId || request.id || 'hired-gig',
        title: request.gigTitle || 'Priority On-Site Job Assignment',
        province: 'Gauteng',
        location: request.destination?.location || 'Job Site Destination',
        price: 'R 650',
        tags: ['Hired', 'Priority', 'On-Site'],
        lat: request.destination?.lat ?? -26.2041,
        lng: request.destination?.lng ?? 28.0473,
        ownerId: request.hirerId
      };

      // Direct user to map and set user exact location to gig destination
      setActiveGig(targetGig);
    }
  };

  if (splashPhase === 'name') {
    return <SplashScreen />;
  }

  if (splashPhase === 'slideshow') {
    return <JobSlideshow />;
  }

  if (authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-green-800 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthFlow onSuccess={() => setActiveTab('profile')} />;
  }

  const content = {
    profile: (
      <ProfileView user={user} onLogout={logout} onRedirectToAlerts={() => setActiveTab('alerts')} />
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

          {/* Account Disabled Banner - user can enable anytime */}
          {user && isAccountDisabled && (
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-3.5 py-2 flex items-center justify-between text-xs z-30 shadow-md border-b border-amber-800/20">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <UserX className="w-4 h-4 flex-shrink-0 text-amber-200" />
                <span className="truncate font-medium">Your account is currently disabled and hidden from other users.</span>
              </div>
              <button
                onClick={handleEnableAccount}
                disabled={enablingAccount}
                className="bg-white text-amber-900 hover:bg-amber-50 active:scale-95 px-3 py-1 rounded-lg text-[11px] font-bold transition-all shadow-xs flex-shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-1"
              >
                {enablingAccount ? <Loader2 className="w-3 h-3 animate-spin text-amber-800" /> : null}
                <span>Enable Anytime</span>
              </button>
            </div>
          )}
          
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="h-full w-full relative"
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
                onRespond={(status) => handleHireResponse(incomingRequest, status)} 
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </APIProvider>
  );
}
