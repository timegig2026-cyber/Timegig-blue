import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  title: string;
}

export function ImageViewer({ isOpen, onClose, imageUrl, title }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 md:p-8"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative max-w-4xl w-full max-h-full flex flex-col items-center gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
              <h3 className="text-white font-bold text-lg">{title}</h3>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Image Container */}
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden rounded-3xl bg-gray-900 shadow-2xl">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={title}
                  className="max-w-full max-h-[80vh] object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-[60vh] flex flex-col items-center justify-center text-gray-700 gap-4">
                  <User className="w-32 h-32 opacity-20" />
                  <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">No Profile Image Provided</p>
                </div>
              )}
            </div>

            {/* Footer / Instructions */}
            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em]">Tap anywhere outside to close</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
