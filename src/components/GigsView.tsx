/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, ChevronDown, Check, LogIn, User, Plus, X, Image as ImageIcon, Edit2, Trash2, Zap } from 'lucide-react';
import { useGigs } from '../hooks/useGigs';
import { useAuth } from '../hooks/useAuth';
import { db, doc, getDoc } from '../lib/firebase';
import { UserProfile, Gig } from '../types';
import { ImageViewer } from './ImageViewer';
import { SafeImage } from './SafeImage';
import { compressImage } from '../lib/imageUtils';

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

  if (loading) return <div className="w-7 h-7 rounded-full bg-gray-100 animate-pulse" />;

  return (
    <button 
      onClick={(e) => {
        e.stopPropagation();
        onClick(profile);
      }}
      className="w-7 h-7 rounded-full bg-green-50 border border-green-100 flex items-center justify-center overflow-hidden shadow-xs active:scale-95 transition-transform flex-shrink-0"
    >
      {profile?.profilePictureName ? (
        <User className="w-3.5 h-3.5 text-green-800" />
      ) : (
        <User className="w-3.5 h-3.5 text-green-600" />
      )}
    </button>
  );
}

function GigImageCarousel({ images, title, onClick }: { images: string[]; title: string; onClick: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleDragEnd = (e: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    } else if (info.offset.x > swipeThreshold) {
      setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  if (!images || images.length === 0) {
    return (
      <div 
        onClick={onClick}
        className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-100 group-hover:scale-105 transition-transform duration-500 cursor-pointer z-0"
      >
        <Zap className="w-10 h-10 text-gray-300" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full cursor-pointer z-0 overflow-hidden" onClick={onClick}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
          drag={images.length > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 w-full h-full"
        >
          <SafeImage src={images[currentIndex]} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none" />
        </motion.div>
      </AnimatePresence>
      
      {images.length > 1 && (
        <div className="absolute top-2 right-2 flex gap-1 z-10 pointer-events-none">
          {images.map((_, idx) => (
            <div key={idx} className={`w-1.5 h-1.5 rounded-full backdrop-blur-md shadow-sm transition-colors ${idx === currentIndex ? 'bg-white scale-125' : 'bg-black/40 border border-white/40'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function GigsView({ onGigAccepted }: GigsViewProps) {
  const { user, login } = useAuth();
  const { gigs, loading: gigsLoading, applyForGig, completeGig, cancelGig, createGig, updateGig, deleteGig } = useGigs();
  
  const [showFilter, setShowFilter] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGigId, setEditingGigId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newProvince, setNewProvince] = useState('Gauteng');
  const [newLocation, setNewLocation] = useState('Johannesburg');
  const [newPrice, setNewPrice] = useState('R350/hr');
  const [newTagsStr, setNewTagsStr] = useState('General, In-Person');
  const [newGigImageFiles, setNewGigImageFiles] = useState<File[]>([]);
  const [creating, setCreating] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [viewerInfo, setViewerInfo] = useState<{ isOpen: boolean; url?: string; imageUris?: string[]; title: string }>({
    isOpen: false,
    title: ''
  });

  const handleSaveGig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      login();
      return;
    }
    if (!newTitle.trim()) {
      alert("Please enter a gig title.");
      return;
    }
    setCreating(true);
    try {
      const imageUris: string[] = [];
      for (const file of newGigImageFiles) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const rawB64 = await base64Promise;
        const compressed = await compressImage(rawB64, 800, 0.6);
        imageUris.push(compressed);
      }

      const gigData = {
        title: newTitle.trim(),
        province: newProvince,
        location: newLocation.trim() || newProvince,
        price: newPrice.trim() || 'R300/hr',
        tags: newTagsStr.split(',').map(t => t.trim()).filter(Boolean),
        lat: -26.2041,
        lng: 28.0473,
      };

      if (editingGigId) {
        await updateGig(editingGigId, {
          ...gigData,
          ...(imageUris.length > 0 ? { imageUris, imageUrl: imageUris[0] } : {})
        });
        alert("GiG updated successfully!");
      } else {
        const createData: Omit<Gig, 'id'> = {
          ...gigData,
          ownerId: user.uid,
          status: 'active',
        };
        if (imageUris.length > 0) {
          createData.imageUris = imageUris;
          createData.imageUrl = imageUris[0];
        }
        await createGig(createData);
        alert("GiG created successfully!");
      }

      setShowCreateModal(false);
      setEditingGigId(null);
      setNewTitle('');
      setNewGigImageFiles([]);
    } catch (error) {
      console.error("Failed to save gig", error);
      alert("Failed to save gig. Please check your connection.");
    } finally {
      setCreating(false);
    }
  };

  const openEditModal = (gig: Gig) => {
    setEditingGigId(gig.id);
    setNewTitle(gig.title);
    setNewProvince(gig.province);
    setNewLocation(gig.location);
    setNewPrice(gig.price);
    setNewTagsStr((gig.tags || []).join(', '));
    setNewGigImageFiles([]);
    setShowCreateModal(true);
  };

  const handleDeleteGig = async (gigId: string) => {
    if (!window.confirm("Are you sure you want to delete this gig?")) return;
    try {
      await deleteGig(gigId);
    } catch (error) {
      alert("Failed to delete gig.");
    }
  };

  const handleApply = async (gig: Gig) => {
    if (!user) {
      login();
      return;
    }
    
    setApplyingTo(gig.id);
    try {
      await applyForGig(gig.id, user.uid, gig.ownerId, gig.title);
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
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="w-full px-3 pt-3 pb-2 z-20 bg-white/60 backdrop-blur-xs border-b border-gray-100 relative">
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-1.5 relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 bg-white rounded-full shadow-xs border border-gray-200 p-0.5 flex items-center transition-all">
              <div className="flex-1 flex items-center px-2.5 gap-1.5 w-full">
                <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search GiGs in South Africa..." 
                  className="w-full bg-transparent outline-none text-gray-700 text-xs font-medium placeholder-gray-400 py-1" 
                />
              </div>
              <div className="pr-1">
                <button className="bg-green-700 hover:bg-green-800 text-white p-1 rounded-full transition-colors shadow-xs">
                   <Search className="w-3 h-3" />
                </button>
              </div>
            </div>
            {!user && (
              <button 
                onClick={login}
                title="Login"
                aria-label="Login"
                className="bg-white text-green-800 border border-green-100 w-7 h-7 rounded-full shadow-xs hover:bg-green-50 transition-colors flex items-center justify-center cursor-pointer flex-shrink-0"
              >
                <LogIn className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between px-0.5">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Available GiGs</h3>
              <button 
                onClick={() => {
                  if (!user) {
                    login();
                    return;
                  }
                  setEditingGigId(null);
                  setNewTitle('');
                  setNewProvince('Gauteng');
                  setNewLocation('Johannesburg');
                  setNewPrice('R350/hr');
                  setNewTagsStr('General, In-Person');
                  setNewGigImageFiles([]);
                  setShowCreateModal(true);
                }}
                title="Post GiG"
                aria-label="Post GiG"
                className="w-7 h-7 flex items-center justify-center text-white bg-green-800 hover:bg-green-900 rounded-full shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <button 
              onClick={() => setShowFilter(!showFilter)}
              title={`Filter Location: ${displayFilterText}`}
              aria-label={`Filter Location: ${displayFilterText}`}
              className={`w-7 h-7 flex items-center justify-center rounded-full border transition-colors cursor-pointer relative ${
                selectedProvince || selectedLocation 
                  ? 'bg-green-800 text-white border-green-800 shadow-xs' 
                  : 'bg-green-50 text-green-800 border-green-100 hover:bg-green-100'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              {(selectedProvince || selectedLocation) && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full border border-white" />
              )}
            </button>
          </div>

          <AnimatePresence>
            {showFilter && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute top-full mt-1.5 right-0 w-[90vw] max-w-xs bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-30"
              >
                <div className="p-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <h4 className="font-bold text-gray-800 text-xs">Filter Location</h4>
                  <button 
                    onClick={() => { setSelectedProvince(null); setSelectedLocation(null); setShowFilter(false); }}
                    className="text-[10px] text-green-800 font-bold hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                <div className="max-h-[45vh] overflow-y-auto p-1.5">
                  {Object.entries(SA_LOCATIONS).map(([province, locations]) => (
                    <div key={province} className="mb-1">
                      <button 
                        onClick={() => {
                          setSelectedProvince(province);
                          setSelectedLocation(null);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${selectedProvince === province ? 'bg-green-50 text-green-900' : 'hover:bg-gray-50 text-gray-700'}`}
                      >
                        {province}
                        {selectedProvince === province && !selectedLocation && <Check className="w-3.5 h-3.5" />}
                      </button>
                      
                      {selectedProvince === province && (
                        <div className="pl-3 pr-1 mt-0.5 space-y-0.5 border-l-2 border-green-100 ml-3">
                          {locations.map(loc => (
                            <button
                              key={loc}
                              onClick={() => {
                                setSelectedLocation(loc);
                                setShowFilter(false);
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between transition-colors ${selectedLocation === loc ? 'bg-green-700 text-white font-bold' : 'hover:bg-gray-50 text-gray-600 font-medium'}`}
                            >
                              {loc}
                              {selectedLocation === loc && <Check className="w-3.5 h-3.5" />}
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

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 pb-20 z-0">
        <div className="w-full max-w-4xl mx-auto grid gap-2 grid-cols-2 md:grid-cols-3">
          {filteredGigs.length > 0 ? filteredGigs.map((gig) => (
            <div key={gig.id} className="relative aspect-[4/5] rounded-xl shadow-xs border border-gray-100 hover:border-green-200 transition-all flex flex-col group overflow-hidden bg-gray-100">
              
              {/* Background Image filling the card */}
              <GigImageCarousel 
                images={gig.imageUris || (gig.imageUrl ? [gig.imageUrl] : [])} 
                title={gig.title} 
                onClick={() => setViewerInfo({ isOpen: true, url: gig.imageUrl || gig.imageUris?.[0], imageUris: gig.imageUris || (gig.imageUrl ? [gig.imageUrl] : []), title: gig.title })} 
              />

              {/* Gradient Overlay for bottom text */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 pointer-events-none z-10" />

              {/* Top Left: Owner Avatar */}
              <div className="absolute top-2 left-2 z-20 pointer-events-auto">
                <OwnerAvatar 
                  ownerId={gig.ownerId} 
                  onClick={(p) => setViewerInfo({
                    isOpen: true,
                    url: undefined,
                    title: p ? `${p.firstName} ${p.surname}` : 'Gig Owner'
                  })} 
                />
              </div>

              {/* Bottom Content */}
              <div className="absolute bottom-0 left-0 right-0 p-2 flex flex-col gap-1 z-20 pointer-events-none">
                <div className="flex justify-between items-end gap-1">
                  <h4 className="font-bold text-white text-xs leading-tight line-clamp-2 drop-shadow-md">{gig.title}</h4>
                  <span className="font-black text-white bg-green-800/90 backdrop-blur-md px-1.5 py-0.5 rounded-md text-[10px] whitespace-nowrap border border-green-700/30 flex-shrink-0 shadow-lg">{gig.price}</span>
                </div>
                
                <div className="flex items-center text-gray-300 text-[9px] gap-1 font-medium">
                  <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                  <span className="truncate drop-shadow-md">{gig.location}, {gig.province}</span>
                </div>

                {/* Actions Row */}
                <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/20 pointer-events-auto">
                  <div className="flex items-center gap-1 pointer-events-none">
                    {/* Tags */}
                    {(gig.tags || []).slice(0, 1).map(tag => (
                      <span key={tag} className="text-[8px] font-bold uppercase tracking-wider text-white/90 bg-white/20 px-1 py-0.5 rounded-md backdrop-blur-md">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {user && gig.ownerId === user.uid ? (
                    <div className="flex items-center gap-1 z-30">
                      {gig.status === 'completed' ? (
                        <span className="bg-green-500/90 text-white w-6 h-6 rounded-md flex items-center justify-center backdrop-blur-md pointer-events-none">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : gig.status === 'cancelled' ? (
                        <span className="bg-red-500/90 text-white px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider backdrop-blur-md pointer-events-none">
                          Cancelled
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); cancelGig(gig.id); }}
                            title="Cancel GiG"
                            className="bg-amber-500/90 hover:bg-amber-500 active:scale-95 text-white w-6 h-6 rounded-md flex items-center justify-center backdrop-blur-md cursor-pointer transition-transform"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); completeGig(gig.id); }}
                            title="Mark Done"
                            className="bg-green-700/90 hover:bg-green-700 active:scale-95 text-white w-6 h-6 rounded-md flex items-center justify-center backdrop-blur-md cursor-pointer transition-transform"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditModal(gig); }}
                        title="Edit GiG"
                        className="bg-white/20 hover:bg-white/30 active:scale-95 text-white w-6 h-6 rounded-md flex items-center justify-center backdrop-blur-md cursor-pointer transition-transform"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteGig(gig.id); }}
                        title="Delete GiG"
                        className="bg-red-500/90 hover:bg-red-500 active:scale-95 text-white w-6 h-6 rounded-md flex items-center justify-center backdrop-blur-md cursor-pointer transition-transform"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleApply(gig); }}
                      disabled={applyingTo === gig.id || gig.status === 'cancelled'}
                      title={gig.status === 'cancelled' ? "Gig Cancelled" : "Apply for GiG"}
                      className={`flex items-center justify-center px-2 py-1 h-6 rounded-md transition-all font-bold text-[9px] shadow-sm backdrop-blur-md z-30 ${
                        gig.status === 'cancelled' 
                          ? 'bg-gray-500/50 text-white/50 cursor-not-allowed' 
                          : 'bg-green-700/90 hover:bg-green-700 active:scale-95 text-white cursor-pointer'
                      }`}
                    >
                      {gig.status === 'cancelled' ? 'Cancelled' : (applyingTo === gig.id ? (
                        <div className="w-2.5 h-2.5 border border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Apply'
                      ))}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-12 text-center flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                <MapPin className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-bold text-gray-700">No GiGs found</h3>
              <p className="text-xs text-gray-500 mt-0.5">Try selecting a different province or location.</p>
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
                <div className="w-8 h-8 border-4 border-green-200 border-t-green-800 rounded-full animate-spin" />
                <span className="text-base font-bold text-green-950">Waiting for gig owner...</span>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageViewer 
        isOpen={viewerInfo.isOpen}
        onClose={() => setViewerInfo(prev => ({ ...prev, isOpen: false }))}
        imageUrl={viewerInfo.url}
        imageUris={viewerInfo.imageUris}
        title={viewerInfo.title}
      />

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100 flex flex-col max-h-[85vh]"
            >
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                  {editingGigId ? (
                    <><Edit2 className="w-3.5 h-3.5 text-green-800" /> Edit GiG</>
                  ) : (
                    <><Plus className="w-3.5 h-3.5 text-green-800" /> Post a New GiG</>
                  )}
                </h3>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingGigId(null);
                  }}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveGig} className="p-4 space-y-3 overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">GiG Title</label>
                  <input 
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Expert Graphic Designer Needed"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-green-800 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Province</label>
                    <select
                      value={newProvince}
                      onChange={e => {
                        setNewProvince(e.target.value);
                        setNewLocation(SA_LOCATIONS[e.target.value]?.[0] || e.target.value);
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-green-800 font-medium"
                    >
                      {Object.keys(SA_LOCATIONS).map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Location / City</label>
                    <select
                      value={newLocation}
                      onChange={e => setNewLocation(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs outline-none focus:border-green-800 font-medium"
                    >
                      {(SA_LOCATIONS[newProvince] || [newProvince]).map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-green-800" /> GiG Images (Multiple Allowed)
                  </label>
                  <input 
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => {
                      if (e.target.files) {
                        setNewGigImageFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-green-800 font-medium file:mr-2 file:py-0.5 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-green-50 file:text-green-900 hover:file:bg-green-100"
                  />
                  {newGigImageFiles.length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto py-1">
                      {newGigImageFiles.map((file, idx) => (
                        <div key={idx} className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 group">
                          <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setNewGigImageFiles(prev => prev.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 bg-red-500/80 text-white p-0.5 rounded-bl-lg backdrop-blur-sm shadow-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Price / Budget</label>
                  <input 
                    type="text"
                    required
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    placeholder="e.g. R450/hr or R2500/job"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-green-800 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Tags (comma separated)</label>
                  <input 
                    type="text"
                    value={newTagsStr}
                    onChange={e => setNewTagsStr(e.target.value)}
                    placeholder="Design, Remote, Urgent"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-green-800 font-medium"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingGigId(null);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-green-800 hover:bg-green-900 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {creating && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {editingGigId ? 'Save Changes' : 'Publish GiG'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
