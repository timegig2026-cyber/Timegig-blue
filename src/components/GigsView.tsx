/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, ChevronDown, Check, LogIn, User, Plus, X, Image as ImageIcon, Edit2, Trash2 } from 'lucide-react';
import { useGigs } from '../hooks/useGigs';
import { useAuth } from '../hooks/useAuth';
import { db, doc, getDoc } from '../lib/firebase';
import { UserProfile } from '../types';
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
  status?: 'active' | 'completed';
  imageUrl?: string;
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
  const { gigs, loading: gigsLoading, applyForGig, completeGig, createGig, updateGig, deleteGig } = useGigs();
  
  const [showFilter, setShowFilter] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGigId, setEditingGigId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newProvince, setNewProvince] = useState('Gauteng');
  const [newLocation, setNewLocation] = useState('Johannesburg');
  const [newPrice, setNewPrice] = useState('R350/hr');
  const [newTagsStr, setNewTagsStr] = useState('General, In-Person');
  const [newGigImageFile, setNewGigImageFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [viewerInfo, setViewerInfo] = useState<{ isOpen: boolean; url?: string; title: string }>({
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
      let imageUrl = '';
      if (newGigImageFile) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(newGigImageFile);
        });
        const rawB64 = await base64Promise;
        imageUrl = await compressImage(rawB64, 800, 0.6);
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
          ...(imageUrl ? { imageUrl } : {})
        });
        alert("GiG updated successfully!");
      } else {
        const createData: Omit<Gig, 'id'> = {
          ...gigData,
          ownerId: user.uid,
          status: 'active',
        };
        if (imageUrl) {
          createData.imageUrl = imageUrl;
        }
        await createGig(createData);
        alert("GiG created successfully!");
      }

      setShowCreateModal(false);
      setEditingGigId(null);
      setNewTitle('');
      setNewGigImageFile(null);
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
    setNewGigImageFile(null);
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
             <div className="flex items-center gap-2">
               <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Available GiGs</h3>
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
                   setNewGigImageFile(null);
                   setShowCreateModal(true);
                 }}
                 className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-white bg-teal-600 hover:bg-teal-700 px-3 py-1.5 rounded-full shadow-sm transition-all active:scale-95"
               >
                 <Plus className="w-3.5 h-3.5" /> Post GiG
               </button>
             </div>
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

              {gig.imageUrl && (
                <div 
                  onClick={() => setViewerInfo({ isOpen: true, url: gig.imageUrl, title: gig.title })}
                  className="ml-11 mt-1 w-full max-w-xs h-32 rounded-xl overflow-hidden border border-gray-100 cursor-pointer group/img relative shadow-sm"
                >
                  <SafeImage src={gig.imageUrl} alt={gig.title} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/10 group-hover/img:bg-transparent transition-colors" />
                </div>
              )}

              <div className="flex justify-between items-center mt-1 ml-11">
                <div className="flex flex-wrap gap-1.5">
                  {(gig.tags || []).slice(0, 2).map(tag => (
                    <span key={tag} className="text-[9px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                      {tag}
                    </span>
                  ))}
                </div>
                
                {user && gig.ownerId === user.uid ? (
                  <div className="flex items-center gap-1.5">
                    {gig.status === 'completed' ? (
                      <span className="bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Completed
                      </span>
                    ) : (
                      <button
                        onClick={() => completeGig(gig.id)}
                        className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all shadow-sm flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Done
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(gig)}
                      className="bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-700 text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg transition-all shadow-sm flex items-center"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGig(gig.id)}
                      className="bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 text-[10px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg transition-all shadow-sm flex items-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
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
                )}
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

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
            >
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-black text-gray-900 uppercase tracking-wider text-sm flex items-center gap-2">
                  {editingGigId ? (
                    <><Edit2 className="w-4 h-4 text-teal-600" /> Edit GiG</>
                  ) : (
                    <><Plus className="w-4 h-4 text-teal-600" /> Post a New GiG</>
                  )}
                </h3>
                <button 
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingGigId(null);
                  }}
                  className="p-1 rounded-full text-gray-400 hover:bg-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveGig} className="p-6 space-y-4 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">GiG Title</label>
                  <input 
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Expert Graphic Designer Needed"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-600 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase">Province</label>
                    <select
                      value={newProvince}
                      onChange={e => {
                        setNewProvince(e.target.value);
                        setNewLocation(SA_LOCATIONS[e.target.value]?.[0] || e.target.value);
                      }}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-600 font-medium"
                    >
                      {Object.keys(SA_LOCATIONS).map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-600 uppercase">Location / City</label>
                    <select
                      value={newLocation}
                      onChange={e => setNewLocation(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-600 font-medium"
                    >
                      {(SA_LOCATIONS[newProvince] || [newProvince]).map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-teal-600" /> GiG Image (Optional)
                  </label>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={e => setNewGigImageFile(e.target.files?.[0] || null)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs outline-none focus:border-teal-600 font-medium file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                  {newGigImageFile && (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 mt-1">
                      <img src={URL.createObjectURL(newGigImageFile)} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">Price / Budget</label>
                  <input 
                    type="text"
                    required
                    value={newPrice}
                    onChange={e => setNewPrice(e.target.value)}
                    placeholder="e.g. R450/hr or R2500/job"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-600 font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 uppercase">Tags (comma separated)</label>
                  <input 
                    type="text"
                    value={newTagsStr}
                    onChange={e => setNewTagsStr(e.target.value)}
                    placeholder="Design, Remote, Urgent"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-600 font-medium"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingGigId(null);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creating && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
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
