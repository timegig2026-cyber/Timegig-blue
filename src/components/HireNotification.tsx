import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Bell, Zap, Clock, MapPin, Navigation } from 'lucide-react';
import { HireRequest } from '../types';

interface Props {
  request: HireRequest;
  onRespond: (status: 'accepted' | 'declined') => void;
}

export function HireNotification({ request, onRespond }: Props) {
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-24 left-6 right-6 z-[100] pointer-events-none"
    >
      <div className="bg-gray-900 text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 pointer-events-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-700 rounded-full flex items-center justify-center shadow-lg shadow-green-700/30">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-green-600">
                {request.gigTitle || 'New Hire Offer'}
              </h3>
              <p className="text-xs text-gray-300 font-bold flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                <span className="truncate">{request.destination?.location || 'Job Site Destination'}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full flex-shrink-0">
            <Clock className="w-3 h-3 text-green-600" />
            <span className="text-xs font-black text-white">{timeLeft}s</span>
          </div>
        </div>

        <div className="bg-green-950/60 border border-green-700/30 rounded-xl px-3.5 py-2 flex items-center justify-between text-[11px] text-green-200">
          <span className="flex items-center gap-1.5 font-bold">
            <Navigation className="w-3.5 h-3.5 text-green-600 animate-pulse" />
            Direct GPS Route to Gig
          </span>
          <span className="font-semibold text-green-300">Live Navigation</span>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => onRespond('accepted')}
            title="Accept & Start Navigation"
            aria-label="Accept & Start Navigation"
            className="flex-1 bg-green-700 hover:bg-green-600 text-gray-950 py-3 rounded-2xl font-black text-sm flex items-center justify-center shadow-lg shadow-green-700/25 transition-all active:scale-95 cursor-pointer"
          >
            <Check className="w-6 h-6 text-gray-950 stroke-[3]" />
          </button>
          <button 
            onClick={() => onRespond('declined')}
            title="Decline Offer"
            aria-label="Decline Offer"
            className="flex-1 bg-white/10 text-white py-3 rounded-2xl font-black text-sm hover:bg-red-500/20 hover:text-red-400 transition-all active:scale-95 cursor-pointer flex items-center justify-center"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
