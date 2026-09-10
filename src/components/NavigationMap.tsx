/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { X, Navigation, CheckCircle2 } from 'lucide-react';
import { Gig } from './GigsView';

interface NavigationMapProps {
  gig: Gig;
  onClose: () => void;
}

export function NavigationMap({ gig, onClose }: NavigationMapProps) {
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [arrived, setArrived] = useState(false);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  
  const map = useMap();
  const routesLib = useMapsLibrary('routes');

  // Speech synthesis for lady voice
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Try to find a female voice
    const femaleVoice = voices.find(v => v.name.includes('female') || v.name.includes('Google UK English Female') || v.name.includes('Samantha'));
    if (femaleVoice) utterance.voice = femaleVoice;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    // Get user's exact location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          speak("Gig accepted. Starting navigation to " + gig.title);
        },
        () => {
          // Fallback if geolocation fails
          const fallback = { lat: gig.lat - 0.05, lng: gig.lng - 0.05 };
          setUserLocation(fallback);
          speak("Location access denied. Using simulated start point. Starting navigation to " + gig.title);
        }
      );
    }
  }, [gig]);

  useEffect(() => {
    if (!routesLib || !map || !userLocation || arrived) return;

    const computeRoute = async () => {
      // In a real app, we'd use Route.computeRoutes if available in the JS SDK
      // or fetch the Routes API directly. For this template, we'll simulate 
      // the route line using the core Polyline since the legacy renderer is disabled.
      
      const path = [
        userLocation,
        { lat: (userLocation.lat + gig.lat) / 2, lng: (userLocation.lng + gig.lng) / 2 + 0.01 }, // Mid point
        { lat: gig.lat, lng: gig.lng }
      ];

      const polyline = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: '#0d9488',
        strokeOpacity: 1.0,
        strokeWeight: 6,
        map: map
      });

      // Fit bounds to show both
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(userLocation);
      bounds.extend({ lat: gig.lat, lng: gig.lng });
      map.fitBounds(bounds, 100);

      // Simulate arrival after 10 seconds for the demo
      const timer = setTimeout(() => {
        setArrived(true);
        speak("You have arrived at your destination.");
      }, 10000);

      return () => {
        polyline.setMap(null);
        clearTimeout(timer);
      };
    };

    computeRoute();
  }, [routesLib, map, userLocation, arrived, gig]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
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
          {userLocation && (
            <AdvancedMarker position={userLocation}>
              <div className="bg-blue-500 w-6 h-6 rounded-full border-4 border-white shadow-lg animate-pulse" />
            </AdvancedMarker>
          )}
          <AdvancedMarker position={{ lat: gig.lat, lng: gig.lng }}>
            <Pin background={'#0d9488'} borderColor={'#ffffff'} glyphColor={'#ffffff'} />
          </AdvancedMarker>
        </Map>

        {/* HUD Overlay */}
        <div className="absolute top-6 left-4 right-4 z-10 flex flex-col gap-3">
          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-teal-100 p-2 rounded-xl text-teal-600">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-sm">Navigating to GiG</h3>
                <p className="text-xs text-gray-500 font-medium">{gig.title}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          
          <div className="bg-teal-600 p-3 rounded-xl shadow-lg flex items-center justify-between text-white animate-fade-in">
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-white rounded-full animate-ping" />
               <span className="text-sm font-bold">Voice Guidance Active</span>
            </div>
            <span className="text-xs font-medium opacity-80">ETA: 10m</span>
          </div>
        </div>

        {/* Arrival Success Screen */}
        {arrived && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-0 bg-teal-600/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-white z-20 text-center"
          >
            <CheckCircle2 className="w-24 h-24 mb-6 animate-bounce" />
            <h2 className="text-3xl font-black mb-2">Arrived!</h2>
            <p className="text-teal-50 mb-8 max-w-xs">You have reached the destination for "{gig.title}".</p>
            <button 
              onClick={onClose}
              className="bg-white text-teal-600 font-bold px-12 py-4 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-transform"
            >
              Complete GiG
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
