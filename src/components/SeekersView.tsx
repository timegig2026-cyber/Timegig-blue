import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, User, Clock, CheckCircle, XCircle, Loader2, Zap } from 'lucide-react';
import { useSeekers } from '../hooks/useSeekers';
import { UserProfile, HireRequest } from '../types';
import { db, doc, onSnapshot, updateDoc } from '../lib/firebase';
import { ImageViewer } from './ImageViewer';

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

  const handleHire = async (seekerId: string) => {
    setTimeLeft(60);
    const reqId = await initiateHire(seekerId, hirerId);
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
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium tracking-tight">Discovering online seekers...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 overflow-hidden">
      {/* Search Header */}
      <div className="bg-white px-6 pt-4 pb-3 border-b border-gray-100 shadow-sm z-10">
        <div className="max-w-2xl mx-auto space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-black text-gray-900 tracking-tight uppercase">Available Seekers</h1>
            <div className="flex items-center gap-1.5 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Live</span>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button 
              onClick={() => setSelectedProvince(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                !selectedProvince ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              All Regions
            </button>
            {PROVINCES.map(prov => (
              <button 
                key={prov}
                onClick={() => setSelectedProvince(prov)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                  selectedProvince === prov ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {prov}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-24 px-6 pt-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {Object.entries(groupedSeekers)
            .filter(([prov]) => !selectedProvince || prov === selectedProvince)
            .map(([province, provinceSeekers]: [string, UserProfile[]]) => (
              <div key={province} className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">{province}</h2>
                  <div className="flex-1 h-[1px] bg-gray-200 ml-2" />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {provinceSeekers.map(seeker => (
                    <motion.div 
                      key={seeker.id}
                      layout
                      className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4 relative overflow-hidden"
                    >
                      <button 
                        onClick={() => setViewerInfo({
                          isOpen: true,
                          url: undefined, // In a real app, this would be seeker.profilePictureUrl
                          title: `${seeker.firstName} ${seeker.surname}`
                        })}
                        className="w-14 h-14 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center text-gray-400 border-2 border-white shadow-sm overflow-hidden active:scale-95 transition-transform"
                      >
                        <User className="w-7 h-7" />
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">
                          {seeker.firstName} {seeker.surname}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-black uppercase">Reviewed</span>
                          <span className="text-[10px] flex items-center gap-1 text-gray-400 font-bold">
                            <Clock className="w-3 h-3" />
                            Active Now
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleHire(seeker.id!)}
                        disabled={!!hiringRequestId}
                        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-black transition-all hover:bg-black active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        Hire
                      </button>

                      {seeker.isOnline && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}

          {seekers.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-bold">No online seekers available in this region yet.</p>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6"
            >
              <div className="relative w-24 h-24 mx-auto">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="#F3F4F6"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="#0D9488"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray="276"
                    strokeDashoffset={276 - (276 * timeLeft) / 60}
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-black text-3xl text-teal-600">
                  {timeLeft}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Verifying Seeker...</h2>
                <p className="text-gray-500 font-medium px-4">
                  Waiting for the seeker to accept your hire request.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Current Status</span>
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black uppercase">Pending</span>
                </div>
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 60, ease: "linear" }}
                    className="h-full bg-teal-500"
                  />
                </div>
              </div>

              <button 
                onClick={() => setHiringRequestId(null)}
                className="w-full py-4 text-gray-400 font-bold hover:text-gray-600 transition-colors"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center space-y-6"
            >
              {hireStatus.status === 'accepted' ? (
                <>
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Hire Accepted!</h2>
                    <p className="text-gray-500 font-medium">
                      The seeker has accepted your request. You can now start collaborating.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <XCircle className="w-10 h-10 text-red-600" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Not Available</h2>
                    <p className="text-gray-500 font-medium">
                      {hireStatus.status === 'expired' 
                        ? "The request timed out because the seeker did not respond in time."
                        : "The seeker has declined the hire request at this time."}
                    </p>
                  </div>
                </>
              )}

              <button 
                onClick={() => setHireStatus(null)}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-black transition-all"
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
