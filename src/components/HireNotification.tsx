import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Bell, Zap, Clock } from 'lucide-react';
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
      <div className="bg-gray-900 text-white p-6 rounded-[2rem] shadow-2xl border border-white/10 pointer-events-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-teal-400">New Hire Offer</h3>
              <p className="text-xs text-gray-400 font-bold">Priority request received</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
            <Clock className="w-3 h-3 text-teal-400" />
            <span className="text-xs font-black text-white">{timeLeft}s</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => onRespond('accepted')}
            className="flex-1 bg-white text-black py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-all active:scale-95"
          >
            <Check className="w-4 h-4" />
            Accept Hire
          </button>
          <button 
            onClick={() => onRespond('declined')}
            className="bg-white/10 text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-white/20 transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
