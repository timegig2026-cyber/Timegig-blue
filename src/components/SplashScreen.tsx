import React from 'react';
import { motion } from 'motion/react';

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="text-center space-y-4"
      >
        <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter">
          Time<span className="text-teal-600">GiG</span>
        </h1>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "linear", delay: 0.5 }}
          className="h-1.5 bg-teal-600/10 rounded-full overflow-hidden"
        >
          <div className="h-full bg-teal-600 w-full" />
        </motion.div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] pt-4">
          Professional Seekers & Gigs
        </p>
      </motion.div>
    </div>
  );
}
