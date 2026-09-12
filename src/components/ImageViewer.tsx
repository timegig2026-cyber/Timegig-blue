import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'motion/react';
import { X, User, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { SafeImage } from './SafeImage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  imageUris?: string[];
  title: string;
}

export function ImageViewer({ isOpen, onClose, imageUrl, imageUris, title }: Props) {
  const images = imageUris && imageUris.length > 0 ? imageUris : imageUrl ? [imageUrl] : [];
  const [currentIndex, setCurrentIndex] = useState(0);

  const activeImage = images[currentIndex];
  const isPdf = activeImage?.startsWith('data:application/pdf') || activeImage?.toLowerCase().includes('.pdf');

  const handlePrev = (e?: React.MouseEvent | TouchEvent | PointerEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e?: React.MouseEvent | TouchEvent | PointerEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      handleNext(e);
    } else if (info.offset.x > swipeThreshold) {
      handlePrev(e);
    }
  };

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
            className="relative max-w-4xl w-full max-h-full flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="w-full flex items-center justify-between p-2 z-10">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-bold text-lg truncate max-w-md">{title}</h3>
                {images.length > 1 && (
                  <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded-full font-bold">
                    {currentIndex + 1} / {images.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {activeImage && (
                  <a
                    href={activeImage}
                    download="document"
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
                    title="Open / Download Document"
                  >
                    <Download className="w-5 h-5" />
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Container with Swipe/Navigation */}
            <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden rounded-3xl bg-gray-900 shadow-2xl min-h-[50vh] max-h-[80vh]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  drag={images.length > 1 && !isPdf ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={handleDragEnd}
                  className="absolute inset-0 flex items-center justify-center w-full h-full cursor-grab active:cursor-grabbing"
                >
                  {activeImage ? (
                    isPdf ? (
                      <div className="w-full h-[75vh] flex flex-col bg-white rounded-2xl overflow-hidden">
                        <iframe
                          src={activeImage}
                          title={title}
                          className="w-full h-full border-none pointer-events-auto"
                        />
                      </div>
                    ) : (
                      <SafeImage
                        src={activeImage}
                        alt={title}
                        className="max-w-full max-h-[75vh] object-contain pointer-events-none"
                        fallbackType="generic"
                      />
                    )
                  ) : (
                    <div className="w-full h-[60vh] flex flex-col items-center justify-center text-gray-700 gap-4">
                      <User className="w-32 h-32 opacity-20" />
                      <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">No Image Provided</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows for Multiple Images */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer z-20 shadow-lg"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer z-20 shadow-lg"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail selector or instructions */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto max-w-full pb-2 px-1 z-10 relative">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      currentIndex === idx ? 'border-green-600 scale-105 shadow-md' : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover pointer-events-none" />
                  </button>
                ))}
              </div>
            )}

            <p className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] z-10 relative">Swipe or use arrows to view images</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
