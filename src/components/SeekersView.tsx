import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, User, Clock, CheckCircle, XCircle, Loader2, Zap, ChevronLeft, ChevronRight, Sparkles, Star } from 'lucide-react';
import { useSeekers } from '../hooks/useSeekers';
import { UserProfile, HireRequest } from '../types';
import { db, doc, onSnapshot, updateDoc } from '../lib/firebase';
import { ImageViewer } from './ImageViewer';
import { SafeImage } from './SafeImage';

const PROVINCES = [
  'Gauteng',
  'Western Cape',
  'KwaZulu-Natal',
  'Eastern Cape',
  'Free State',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape'
];

interface Props {
  hirerId: string;
}

export function SeekersView({ hirerId }: Props) {
  const { seekers, loading, initiateHire } = useSeekers();
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [hiringRequestId, setHiringRequestId] = useState<string | null>(null);
  const [hireStatus, setHireStatus] = useState<HireRequest | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [viewerInfo, setViewerInfo] = useState<{ isOpen: boolean; url?: string; title: string }>({
    isOpen: false,
    title: ''
  });


  useEffect(() => {
    if (!hiringRequestId) return;

    const unsub = onSnapshot(doc(db, 'hire_requests', hiringRequestId), (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as HireRequest;
        setHireStatus(data);
        
        if (data.status === 'accepted' || data.status === 'declined') {
          setHiringRequestId(null);
        }
      }
    }, (error) => {
      console.error("Hire Request Detail Listener Error:", error);
    });

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Update status to expired in DB
          updateDoc(doc(db, 'hire_requests', hiringRequestId), { status: 'expired' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [hiringRequestId]);

  const PROVINCE_COORDS: Record<string, { lat: number; lng: number; location: string }> = {
    'Gauteng': { lat: -26.2041, lng: 28.0473, location: 'Johannesburg, Gauteng' },
    'Western Cape': { lat: -33.9249, lng: 18.4241, location: 'Cape Town, Western Cape' },
    'KwaZulu-Natal': { lat: -29.8587, lng: 31.0218, location: 'Durban, KwaZulu-Natal' },
    'Eastern Cape': { lat: -33.9608, lng: 25.6022, location: 'Gqeberha, Eastern Cape' },
    'Free State': { lat: -29.1177, lng: 26.2236, location: 'Bloemfontein, Free State' },
    'Limpopo': { lat: -23.8962, lng: 29.4486, location: 'Polokwane, Limpopo' },
    'Mpumalanga': { lat: -25.4753, lng: 30.9694, location: 'Mbombela, Mpumalanga' },
    'North West': { lat: -25.6545, lng: 27.2423, location: 'Rustenburg, North West' },
    'Northern Cape': { lat: -28.7419, lng: 24.7719, location: 'Kimberley, Northern Cape' },
  };

  const handleHire = async (seeker: UserProfile) => {
    setTimeLeft(60);
    const coords = PROVINCE_COORDS[seeker.province] || { lat: -26.2041, lng: 28.0473, location: 'Johannesburg, Gauteng' };
    const skillName = seeker.skills ? seeker.skills.split(',')[0].trim() : 'Specialist';
    const reqId = await initiateHire(seeker.id!, hirerId, {
      gigTitle: `${skillName} Assignment (${seeker.firstName})`,
      province: seeker.province || 'Gauteng',
      location: coords.location,
      lat: coords.lat,
      lng: coords.lng
    });
    if (reqId) {
      setHiringRequestId(reqId);
    }
  };

  const groupedSeekers = seekers.reduce((acc, seeker) => {
    const province = seeker.province || 'Unspecified';
    if (!acc[province]) acc[province] = [];
    acc[province].push(seeker);
    return acc;
  }, {} as Record<string, UserProfile[]>);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-green-800 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium tracking-tight">Discovering online seekers...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 overflow-hidden">
      {/* Search Header */}
      <div className="bg-white px-4 pt-3 pb-2 border-b border-gray-100 shadow-xs z-10">
        <div className="max-w-2xl mx-auto space-y-1.5">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-black text-gray-900 tracking-tight uppercase">Available Seekers</h1>
            <div className="flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Live</span>
            </div>
          </div>
          
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button 
              onClick={() => setSelectedProvince(null)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                !selectedProvince ? 'bg-green-800 text-white shadow-xs' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              All Regions
            </button>
            {PROVINCES.map(prov => (
              <button 
                key={prov}
                onClick={() => setSelectedProvince(prov)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedProvince === prov ? 'bg-green-800 text-white shadow-xs' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20 px-4 pt-3.5">
        <div className="max-w-2xl mx-auto space-y-4">
          


          {Object.entries(groupedSeekers)
            .filter(([prov]) => !selectedProvince || prov === selectedProvince)
            .map(([province, provinceSeekers]: [string, UserProfile[]]) => (
              <div key={province} className="space-y-2">
                <div className="flex items-center gap-1.5 px-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{province}</h2>
                  <div className="flex-1 h-[1px] bg-gray-200 ml-2" />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {provinceSeekers.map(seeker => (
                    <motion.div 
                      key={seeker.id}
                      layout
                      className="bg-white rounded-xl p-3 border border-gray-100 shadow-xs flex items-center gap-3 relative overflow-hidden"
                    >
                      <button 
                        onClick={() => setViewerInfo({
                          isOpen: true,
                          url: seeker.profilePictureUrl,
                          title: `${seeker.firstName} ${seeker.surname}`
                        })}
                        className="w-11 h-11 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center text-gray-400 border border-white shadow-xs overflow-hidden active:scale-95 transition-transform"
                      >
                        {seeker.profilePictureUrl ? (
                          <SafeImage src={seeker.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" fallbackType="user" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-xs truncate">
                          {seeker.firstName} {seeker.surname}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] bg-green-50 text-green-900 px-1.5 py-0.5 rounded-full font-bold uppercase">Reviewed</span>
                          <span className="text-[9px] flex items-center gap-1 text-gray-400 font-medium">
                            <Clock className="w-2.5 h-2.5" />
                            Active Now
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleHire(seeker)}
                        disabled={!!hiringRequestId}
                        title={`Hire ${seeker.firstName}`}
                        aria-label={`Hire ${seeker.firstName}`}
                        className="bg-gray-900 text-white w-8 h-8 rounded-lg transition-all hover:bg-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer shadow-xs flex-shrink-0"
                      >
                        <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      </button>

                      {seeker.isOnline && (
                        <div className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-white shadow-xs" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}

          {seekers.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2.5">
                <Search className="w-5 h-5 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium text-xs">No online seekers available in this region yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Hiring Overlay */}
      <AnimatePresence>
        {hiringRequestId && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-xl text-center space-y-4"
            >
              <div className="relative w-16 h-16 mx-auto">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#F3F4F6"
                    strokeWidth="5"
                    fill="none"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#0D9488"
                    strokeWidth="5"
                    fill="none"
                    strokeDasharray="176"
                    strokeDashoffset={176 - (176 * timeLeft) / 60}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-black text-xl text-green-800">
                  {timeLeft}
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-base font-bold text-gray-900 tracking-tight">Verifying Seeker...</h2>
                <p className="text-xs text-gray-500 font-medium">
                  Waiting for seeker to accept your hire request.
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</span>
                  <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold uppercase">Pending</span>
                </div>
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 60, ease: "linear" }}
                    className="h-full bg-green-700"
                  />
                </div>
              </div>

              <button 
                onClick={() => setHiringRequestId(null)}
                className="w-full py-2 text-gray-400 font-bold hover:text-gray-600 transition-colors text-xs"
              >
                Cancel Request
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modals */}
      <AnimatePresence>
        {hireStatus && hireStatus.status !== 'pending' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-xl text-center space-y-4"
            >
              {hireStatus.status === 'accepted' ? (
                <>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-gray-900 tracking-tight">Hire Accepted!</h2>
                    <p className="text-xs text-gray-500 font-medium">
                      The seeker accepted. You can now start collaborating.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-base font-bold text-gray-900 tracking-tight">Not Available</h2>
                    <p className="text-xs text-gray-500 font-medium">
                      {hireStatus.status === 'expired' 
                        ? "Request timed out without a response."
                        : "The seeker declined the hire request."}
                    </p>
                  </div>
                </>
              )}

              <button 
                onClick={() => setHireStatus(null)}
                className="w-full bg-gray-900 text-white py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-black transition-all"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageViewer 
        isOpen={viewerInfo.isOpen}
        onClose={() => setViewerInfo(prev => ({ ...prev, isOpen: false }))}
        imageUrl={viewerInfo.url}
        title={viewerInfo.title}
      />
    </div>
  );
}
