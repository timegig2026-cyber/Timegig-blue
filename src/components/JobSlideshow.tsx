import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Leaf, Truck, Book, Wrench, Dog, Music } from 'lucide-react';
import { SafeImage } from './SafeImage';

const JOBS = [
  {
    title: "Home Cleaning",
    description: "Professional cleaning services for every home.",
    icon: Sparkles,
    color: "text-green-800",
    bg: "bg-green-50",
    image: "https://picsum.photos/seed/cleaning/1000/600"
  },
  {
    title: "Gardening",
    description: "Keeping gardens beautiful and healthy.",
    icon: Leaf,
    color: "text-green-600",
    bg: "bg-green-50",
    image: "https://picsum.photos/seed/garden/1000/600"
  },
  {
    title: "Delivery",
    description: "Fast and reliable local delivery services.",
    icon: Truck,
    color: "text-blue-600",
    bg: "bg-blue-50",
    image: "https://picsum.photos/seed/delivery/1000/600"
  },
  {
    title: "Handyman",
    description: "Expert repairs and home maintenance.",
    icon: Wrench,
    color: "text-orange-600",
    bg: "bg-orange-50",
    image: "https://picsum.photos/seed/handyman/1000/600"
  },
  {
    title: "Tutoring",
    description: "Empowering students through knowledge.",
    icon: Book,
    color: "text-purple-600",
    bg: "bg-purple-50",
    image: "https://picsum.photos/seed/tutor/1000/600"
  }
];

export function JobSlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % JOBS.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const Job = JOBS[current];

  return (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-3"
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg">
              <SafeImage 
                src={Job.image} 
                alt={Job.title}
                className="w-full h-full object-cover"
                fallbackType="gig"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-4">
                <div className={`${Job.bg} ${Job.color} w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 shadow-xs`}>
                  <Job.icon className="w-4 h-4" />
                </div>
                <h2 className="text-lg font-black text-white tracking-tight">{Job.title}</h2>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs font-medium text-gray-600">{Job.description}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-1.5">
          {JOBS.map((_, i) => (
            <div 
              key={i}
              className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-5 bg-green-800' : 'w-1.5 bg-gray-100'}`}
            />
          ))}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 text-center"
      >
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
          Time<span className="text-green-800">GiG</span> Gateway
        </p>
      </motion.div>
    </div>
  );
}
