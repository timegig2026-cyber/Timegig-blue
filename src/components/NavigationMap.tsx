/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { CheckCircle2, Crosshair, MapPin, Compass, Trash2, X, Navigation } from 'lucide-react';
import { useGigs } from '../hooks/useGigs';
import { useAuth } from '../hooks/useAuth';
import { Gig } from '../types';

interface NavigationMapProps {
  gig: Gig;
  onClose: () => void;
}

export function NavigationMap({ gig, onClose }: NavigationMapProps) {
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [isExact, setIsExact] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const { cancelGig } = useGigs();
  const { user } = useAuth();
  
  const map = useMap();
  const routesLib = useMapsLibrary('routes');

  // Speech synthesis for lady voice
  const speak = (text: string) => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(v => 
        v.name.toLowerCase().includes('female') || 
        v.name.includes('Google UK English Female') || 
        v.name.includes('Samantha') || 
        v.name.includes('Victoria')
      );
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis unavailable:", e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let watchId: number | null = null;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) return;
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          setIsExact(true);
          speak(`Gig accepted. Starting navigation from your exact location to ${gig.title}`);
        },
        (error) => {
          console.warn("Exact GPS access unavailable, using proximity origin:", error);
          if (!isMounted) return;
          const fallback = { lat: gig.lat - 0.035, lng: gig.lng - 0.025 };
          setUserLocation(fallback);
          setIsExact(false);
          speak(`Gig accepted. Starting navigation to ${gig.title}`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      try {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            if (!isMounted) return;
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setIsExact(true);
          },
          (err) => console.warn("GPS watch warning:", err),
          { enableHighAccuracy: true, maximumAge: 3000 }
        );
      } catch (e) {
        console.warn("Could not start watchPosition:", e);
      }
    } else {
      const fallback = { lat: gig.lat - 0.035, lng: gig.lng - 0.025 };
      setUserLocation(fallback);
      setIsExact(false);
      speak(`Starting navigation to ${gig.title}`);
    }

    return () => {
      isMounted = false;
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [gig]);

  // Route drawing & auto-fit
  useEffect(() => {
    if (!map || !userLocation || arrived) return;

    // Draw route polyline from user exact location to gig destination
    const path = [
      userLocation,
      { lat: userLocation.lat * 0.66 + gig.lat * 0.34, lng: userLocation.lng * 0.66 + gig.lng * 0.34 },
      { lat: userLocation.lat * 0.34 + gig.lat * 0.66, lng: userLocation.lng * 0.34 + gig.lng * 0.66 },
      { lat: gig.lat, lng: gig.lng }
    ];

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#0d9488',
      strokeOpacity: 0.95,
      strokeWeight: 6,
      map: map
    });

    // Fit bounds to display both user's exact location and the gig destination
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(userLocation);
    bounds.extend({ lat: gig.lat, lng: gig.lng });
    map.fitBounds(bounds, { top: 140, right: 60, bottom: 140, left: 60 });

    // Simulate arrival after 15 seconds for demonstration
    const timer = setTimeout(() => {
      setArrived(true);
      speak("You have arrived at the gig destination.");
    }, 15000);

    return () => {
      polyline.setMap(null);
      clearTimeout(timer);
    };
  }, [map, userLocation, arrived, gig]);

  // Re-center handler
  const handleRecenter = () => {
    if (!map || !userLocation) return;
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(userLocation);
    bounds.extend({ lat: gig.lat, lng: gig.lng });
    map.fitBounds(bounds, { top: 140, right: 60, bottom: 140, left: 60 });
  };

  // Distance in km
  const distanceKm = userLocation ? (() => {
    const R = 6371; // km
    const dLat = (gig.lat - userLocation.lat) * (Math.PI / 180);
    const dLon = (gig.lng - userLocation.lng) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(userLocation.lat * (Math.PI / 180)) * Math.cos(gig.lat * (Math.PI / 180)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  })() : null;

  const etaMinutes = distanceKm !== null ? Math.max(1, Math.round((distanceKm / 40) * 60)) : 8;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col"
    >
      <div className="flex-1 relative">
        <Map
          defaultCenter={userLocation || { lat: gig.lat, lng: gig.lng }}
          defaultZoom={14}
          mapId="DEMO_MAP_ID"
          className="w-full h-full"
          disableDefaultUI
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          {/* User Exact Location Marker */}
          {userLocation && (
            <AdvancedMarker position={userLocation} title="Your Exact Location">
              <div className="relative flex items-center justify-center">
                <div className="w-8 h-8 bg-blue-500/30 rounded-full animate-ping absolute" />
                <div className="w-6 h-6 bg-blue-600 rounded-full border-3 border-white shadow-xl flex items-center justify-center relative z-10">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* Gig Destination Marker */}
          <AdvancedMarker position={{ lat: gig.lat, lng: gig.lng }} title={`Destination: ${gig.title}`}>
            <Pin background={'#0d9488'} borderColor={'#ffffff'} glyphColor={'#ffffff'} scale={1.2} />
          </AdvancedMarker>
        </Map>

        {/* Top HUD Overlay */}
        <div className="absolute top-6 left-4 right-4 z-10 flex flex-col gap-2.5 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 bg-green-800 rounded-xl text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-green-800/30">
                <Navigation className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-900 px-2 py-0.5 rounded-full">
                    Route Active
                  </span>
                  {isExact && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      GPS Exact
                    </span>
                  )}
                </div>
                <h3 className="font-black text-gray-900 text-sm truncate mt-0.5">{gig.title}</h3>
                <p className="text-xs text-gray-500 font-medium truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  {gig.location}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2.5 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 text-gray-400 hover:text-gray-700 cursor-pointer"
              title="Close Navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="bg-green-900/95 backdrop-blur-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center justify-between text-white pointer-events-auto">
            <div className="flex items-center gap-2.5">
              <Compass className="w-4 h-4 text-green-200 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-xs font-bold">Voice & Turn Guidance Active</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              {distanceKm !== null && (
                <span className="text-green-100">{distanceKm} km</span>
              )}
              <span className="bg-white/20 px-2 py-0.5 rounded-md">ETA: {etaMinutes}m</span>
            </div>
          </div>
        </div>

        {/* Floating Re-center Button */}
        <div className="absolute right-4 bottom-24 z-10 flex flex-col gap-2">
          <button
            onClick={handleRecenter}
            className="w-12 h-12 bg-white rounded-2xl shadow-xl border border-gray-200 flex items-center justify-center text-gray-700 hover:text-green-800 hover:bg-green-50 active:scale-95 transition-all cursor-pointer"
            title="Recenter Map"
          >
            <Crosshair className="w-5 h-5" />
          </button>
        </div>

        {/* Destination Footer Card */}
        <div className="absolute bottom-6 left-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={() => setShowCancelModal(true)}
            title="Cancel GiG"
            aria-label="Cancel GiG"
            className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 cursor-pointer shadow-xl backdrop-blur-md"
          >
            <Trash2 className="w-5 h-5" />
          </button>

          <div className="flex-1 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center justify-between">
            <div className="min-w-0 pr-3">
              <div className="text-[10px] uppercase font-black tracking-widest text-gray-400">Destination Point</div>
              <div className="text-sm font-black text-gray-900 truncate">{gig.location || gig.title}</div>
              <div className="text-xs text-gray-500 font-medium">GPS: {gig.lat.toFixed(4)}, {gig.lng.toFixed(4)}</div>
            </div>
            <button
              onClick={() => {
                setArrived(true);
                speak("Arrived at destination.");
              }}
              title="I've Arrived"
              aria-label="I've Arrived"
              className="bg-gray-900 hover:bg-black text-white w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </button>
          </div>
        </div>

        {/* Arrival Success Screen */}
        {arrived && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 bg-green-800/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-white z-30 text-center"
          >
            <CheckCircle2 className="w-24 h-24 mb-6 animate-bounce" />
            <h2 className="text-3xl font-black mb-2">You Have Arrived!</h2>
            <p className="text-green-100 mb-2 max-w-xs font-medium">
              You reached the destination for <span className="font-bold text-white">"{gig.title}"</span>.
            </p>
            <p className="text-xs text-green-200 mb-8 max-w-xs">
              Location: {gig.location}
            </p>
            <button 
              onClick={onClose}
              title="Complete GiG"
              aria-label="Complete GiG"
              className="bg-white text-green-900 w-16 h-16 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center cursor-pointer"
            >
              <CheckCircle2 className="w-8 h-8 text-green-900" />
            </button>
          </motion.div>
        )}
        {/* Cancel Gig Modal */}
        {showCancelModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-40"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 flex flex-col gap-4"
            >
              <h3 className="font-bold text-gray-900 text-lg">Cancel GiG</h3>
              <p className="text-sm text-gray-600">Please provide a reason for cancelling this gig.</p>
              
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="E.g., Unexpected emergency, no longer available..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none resize-none h-24"
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Go Back
                </button>
                <button
                  disabled={!cancelReason.trim()}
                  onClick={async () => {
                    if (cancelReason.trim()) {
                      await cancelGig(gig.id, cancelReason.trim(), user?.uid, gig.title, gig.ownerId);
                      speak("Gig has been cancelled.");
                      onClose();
                    }
                  }}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Submit & Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
