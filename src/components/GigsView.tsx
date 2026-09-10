/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, ChevronDown, Check, LogIn, User } from 'lucide-react';
import { useGigs } from '../hooks/useGigs';
import { useAuth } from '../hooks/useAuth';
import { db, doc, getDoc } from '../lib/firebase';
import { UserProfile } from '../types';
import { ImageViewer } from './ImageViewer';

const SA_LOCATIONS: Record<string, string[]> = {
  'Gauteng': ['Johannesburg', 'Pretoria', 'Midrand', 'Sandton', 'Centurion', 'Soweto', 'Kempton Park', 'Randburg'],
  'Western Cape': ['Cape Town', 'Stellenbosch', 'George', 'Paarl', 'Somerset West', 'Hermanus', 'Knysna', 'Worcester'],
  'KwaZulu-Natal': ['Durban', 'Pietermaritzburg', 'Umhlanga', 'Ballito', 'Pinetown'],
  'Eastern Cape': ['Gqeberha', 'East London', 'Makhanda', 'Mthatha'],
  'Free State': ['Bloemfontein', 'Welkom', 'Bethlehem'],
  'Limpopo': ['Polokwane', 'Tzaneen', 'Mokopane'],
  'Mpumalanga': ['Mbombela', 'Witbank', 'Secunda'],
  'North West': ['Rustenburg', 'Mahikeng', 'Potchefstroom'],
  'Northern Cape': ['Kimberley', 'Upington'],
};

export interface Gig {
  id: string;
  title: string;
  province: string;
  location: string;
  price: string;
  tags: string[];
  lat: number;
  lng: number;
  ownerId: string;
}

interface GigsViewProps {
  onGigAccepted: (gig: Gig) => void;
}

function OwnerAvatar({ ownerId, onClick }: { ownerId: string; onClick: (profile: UserProfile | null) => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ownerId || ownerId === 'system') {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, 'profiles', ownerId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching owner profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [ownerId]);

  if (loading) return <div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" />;

  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onClick(profile);
      }}
      className="w-8 h-8 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center overflow-hidden shadow-sm active:scale-95 transition-transform"
    >
      {profile?.profilePictureName ? (
        <User className="w-4 h-4 text-teal-600" />
      ) : (
        <User className="w-4 h-4 text-teal-400" />
      )}
    </button>
  );
}

export function GigsView({ onGigAccepted }: GigsViewProps) {
  const { user, login } = useAuth();
  const { gigs, loading: gigsLoading, applyForGig } = useGigs();
  
  const [showFilter, setShowFilter] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [viewerInfo, setViewerInfo] = useState<{ isOpen: boolean; url?: string; title: string }>({
    isOpen: false,
    title: ''
  });

  const handleApply = async (gig: Gig) => {
    if (!user) {
      login();
      return;
    }
    
    setApplyingTo(gig.id);
    try {
      await applyForGig(gig.id, user.uid);
      // Simulate owner acceptance for demo purposes after 3 seconds
      setTimeout(() => {
        setApplyingTo(null);
        onGigAccepted(gig);
      }, 3000); 
    } catch (error) {
      console.error("Application failed", error);
      setApplyingTo(null);
    }
  };

  const filteredGigs = gigs.filter(gig => {
    if (selectedProvince && gig.province !== selectedProvince) return false;
    if (selectedLocation && gig.location !== selectedLocation) return false;
    return true;
  });

  const displayFilterText = selectedLocation 
    ? `${selectedLocation}, ${selectedProvince}` 
    : selectedProvince 
      ? `${selectedProvince} (All Locations)` 
      : 'All Provinces & Locations';

  if (gigsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="w-full px-4 pt-4 pb-2 z-20 bg-white/50 backdrop-blur-sm border-b border-gray-100 relative">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-2 relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 bg-white rounded-full shadow-sm border border-gray-200 p-1 flex items-center transition-all">
              <div className="flex-1 flex items-center px-3 gap-2 w-full">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search GiGs in South Africa..." 
                  className="w-full bg-transparent outline-none text-gray-700 text-xs font-medium placeholder-gray-400" 
                />
              </div>
              <div className="pr-1 pl-1">
                <button className="bg-teal-500 hover:bg-teal-600 text-white p-1.5 rounded-full transition-colors shadow-sm">
                   <Search className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {!user && (
              <button 
                onClick={login}
                className="bg-white text-teal-600 border border-teal-100 px-3 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-teal-50 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                Login
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between px-1">
             <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Available GiGs</h3>
             <button 
               onClick={() => setShowFilter(!showFilter)}
               className="flex items-center gap-1 text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-100 hover:bg-teal-100 transition-colors max-w-[200px] sm:max-w-xs truncate"
             >
               <MapPin className="w-3 h-3 flex-shrink-0" />
               <span className="truncate">{displayFilterText}</span>
               <ChevronDown className={`w-3 h-3 ml-1 flex-shrink-0 transition-transform ${showFilter ? 'rotate-180' : ''}`} />
             </button>
          </div>

          <AnimatePresence>
            {showFilter && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 right-0 w-[90vw] max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-30"
              >
                <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <h4 className="font-bold text-gray-800 text-sm">Filter Location</h4>
                  <button 
                    onClick={() => { setSelectedProvince(null); setSelectedLocation(null); setShowFilter(false); }}
                    className="text-xs text-teal-600 font-semibold hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-[50vh] overflow-y-auto p-2">
                  {Object.entries(SA_LOCATIONS).map(([province, locations]) => (
                    <div key={province} className="mb-2">
                      <button 
                        onClick={() => {
                          setSelectedProvince(province);
                          setSelectedLocation(null);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-between transition-colors ${selectedProvince === province ? 'bg-teal-50 text-teal-700' : 'hover:bg-gray-50 text-gray-700'}`}
                      >
                        {province}
                        {selectedProvince === province && !selectedLocation && <Check className="w-4 h-4" />}
                      </button>
                      
                      {selectedProvince === province && (
                        <div className="pl-4 pr-2 mt-1 space-y-1 border-l-2 border-teal-100 ml-4">
                          {locations.map(loc => (
                            <button
                              key={loc}
                              onClick={() => {
                                setSelectedLocation(loc);
                                setShowFilter(false);
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm flex items-center justify-between transition-colors ${selectedLocation === loc ? 'bg-teal-500 text-white font-bold' : 'hover:bg-gray-50 text-gray-600 font-medium'}`}
                            >
                              {loc}
                              {selectedLocation === loc && <Check className="w-4 h-4" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24 z-0">
        <div className="w-full max-w-4xl mx-auto grid gap-3 md:grid-cols-2">
          {filteredGigs.length > 0 ? filteredGigs.map((gig) => (
            <div key={gig.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-teal-200 hover:shadow-md transition-all flex flex-col gap-2 group relative overflow-hidden">
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <OwnerAvatar 
                    ownerId={gig.ownerId} 
                    onClick={(p) => setViewerInfo({
                      isOpen: true,
                      url: undefined, // profilePictureUrl
                      title: p ? `${p.firstName} ${p.surname}` : 'Gig Owner'
                    })} 
                  />
                  <h4 className="font-bold text-gray-800 text-sm truncate group-hover:text-teal-700 transition-colors">{gig.title}</h4>
                </div>
                <span className="font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg text-[11px] whitespace-nowrap border border-teal-100">{gig.price}</span>
              </div>
              
              <div className="flex items-center text-gray-500 text-[11px] gap-1.5 font-bold ml-11">
                <MapPin className="w-3 h-3" />
                <span>{gig.location}, {gig.province}</span>
              </div>

              <div className="flex justify-between items-center mt-1 ml-11">
                <div className="flex flex-wrap gap-1.5">
                  {(gig.tags || []).slice(0, 2).map(tag => (
                    <span key={tag} className="text-[9px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <button
                  onClick={() => handleApply(gig)}
                  disabled={applyingTo === gig.id}
                  className="flex items-center justify-center min-w-[70px] h-7 bg-gray-900 hover:bg-black active:scale-95 text-white text-[10px] font-black uppercase tracking-widest px-3 rounded-lg transition-all disabled:opacity-50"
                >
                  {applyingTo === gig.id ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-700">No GiGs found</h3>
              <p className="text-sm text-gray-500 mt-1">Try selecting a different province or location.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {applyingTo !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
             <div className="bg-white px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                <span className="text-base font-bold text-teal-800">Waiting for gig owner...</span>
             </div>
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
