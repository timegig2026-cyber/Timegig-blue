import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, Eye, User, FileText, Loader2, ArrowLeft, Upload, Sparkles } from 'lucide-react';
import { db, collection, query, onSnapshot, setDoc, doc, getDocs, where, serverTimestamp } from '../lib/firebase';
import { UserProfile, SubscriptionPayment } from '../types';
import { ImageViewer } from './ImageViewer';
import { SafeImage } from './SafeImage';
import { compressImage } from '../lib/imageUtils';

interface Props {
  onBack: () => void;
}

export function AdminView({ onBack }: Props) {
  const [allPayments, setAllPayments] = useState<SubscriptionPayment[]>([]);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewerInfo, setViewerInfo] = useState<{ isOpen: boolean; url?: string; title: string }>({
    isOpen: false,
    title: ''
  });

  useEffect(() => {
    const qPayments = collection(db, 'subscription_payments');
    const qProfiles = collection(db, 'profiles');

    const unsubPayments = onSnapshot(qPayments, (snap) => {
      setAllPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as SubscriptionPayment)));
    }, (error) => {
      console.error("Admin Payments Listener Error:", error);
    });

    const unsubProfiles = onSnapshot(qProfiles, (snap) => {
      setAllProfiles(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
      setLoading(false);
    }, (error) => {
      console.error("Admin Profiles Listener Error:", error);
      setLoading(false);
    });

    return () => {
      unsubPayments();
      unsubProfiles();
    };
  }, []);

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const compressedString = await compressImage(base64String);
        
        await setDoc(doc(db, 'settings', 'appearance'), {
          wallpaper: compressedString,
          updatedAt: serverTimestamp(),
          updatedBy: 'admin'
        }, { merge: true });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Wallpaper upload error:", error);
      setUploading(false);
    }
  };

  const totalProfit = allPayments
    .filter(p => p.status === 'verified')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const totalUsersCount = allProfiles.length;
  const onlineUsersCount = allProfiles.filter(p => p.isOnline).length;
  const pendingPayments = allPayments.filter(p => p.status === 'pending');
  const userProfiles = allProfiles;

  const handleVerifyPayment = async (paymentId: string, userId: string, approved: boolean) => {
    try {
      await setDoc(doc(db, 'subscription_payments', paymentId), {
        status: approved ? 'verified' : 'rejected',
        verifiedAt: serverTimestamp()
      }, { merge: true });
      
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      await setDoc(doc(db, 'profiles', userId), {
        subscription: {
          status: approved ? 'active' : 'expired',
          expiresAt: approved ? new Date(Date.now() + thirtyDaysMs) : null,
          updatedAt: serverTimestamp()
        }
      }, { merge: true });

      // Send notification to user
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        userId,
        title: approved ? 'Subscription Activated' : 'Payment Rejected',
        message: approved 
          ? 'Your proof of payment (R49,99 - Ref: Sub49) has been verified. Your TimeGiG monthly subscription is now active for 30 days!' 
          : 'Your proof of payment was rejected. Please ensure you transferred R49,99 to Capitec (Account: Matthews, 1334067366, Ref: Sub49) and re-upload.',
        type: approved ? 'success' : 'error',
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Payment verification failed", error);
    }
  };

  const handleReviewProfile = async (userId: string, approved: boolean) => {
    try {
      await setDoc(doc(db, 'profiles', userId), {
        status: approved ? 'reviewed' : 'rejected'
      }, { merge: true });

      // Send notification to user
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        userId,
        title: approved ? 'Profile Verified' : 'Profile Rejected',
        message: approved 
          ? 'Congratulations! Your profile has been reviewed and verified. You are now live on TimeGiG.' 
          : 'Your profile information or documents were rejected. Please review your details and re-submit.',
        type: approved ? 'success' : 'error',
        read: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Profile review failed", error);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full">
      <Loader2 className="w-8 h-8 text-green-800 animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50/50 overflow-y-auto pb-20">
      <div className="bg-white px-4 pt-3 pb-2.5 border-b border-gray-100 shadow-xs flex items-center gap-2.5">
        <button onClick={onBack} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <h1 className="text-sm font-black text-gray-900 tracking-tight uppercase">Admin Control</h1>
      </div>

      <div className="p-4 max-w-3xl mx-auto w-full space-y-4">
        {/* Appearance Management */}
        <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-green-800" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-900">App Appearance</h2>
              <p className="text-[10px] text-gray-400 font-medium">Set a global background wallpaper for all users</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="flex-1 cursor-pointer group">
              <div className="flex flex-col items-center justify-center border border-dashed border-gray-200 group-hover:border-green-300 group-hover:bg-green-50/30 transition-all rounded-xl py-3 px-4 text-center space-y-1">
                <div className="w-7 h-7 bg-gray-50 group-hover:bg-white rounded-lg flex items-center justify-center transition-colors">
                  <Upload className="w-3.5 h-3.5 text-gray-400 group-hover:text-green-800" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-900 group-hover:text-green-800">
                    {uploading ? 'Uploading...' : 'Upload New Wallpaper'}
                  </p>
                  <p className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">JPG, PNG or WEBP from device</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleWallpaperUpload}
                  disabled={uploading}
                />
              </div>
            </label>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs space-y-0.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Profit</p>
            <p className="text-base font-black text-green-800">R{totalProfit.toLocaleString()}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs space-y-0.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Total Users</p>
            <p className="text-base font-black text-gray-900">{totalUsersCount}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs space-y-0.5">
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Online Now</p>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-base font-black text-gray-900">{onlineUsersCount}</p>
            </div>
          </div>
        </div>

        {/* Payment Verifications */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Pending Payments ({pendingPayments.length})
            </h2>
          </div>
          
          <div className="grid gap-2">
            {pendingPayments.map(pay => {
              const userProf = allProfiles.find(p => p.id === pay.userId);
              const displayName = pay.userName || (userProf ? `${userProf.firstName || ''} ${userProf.surname || ''}`.trim() : '') || 'Gig User';
              const displayEmail = pay.userEmail || userProf?.email || '';

              return (
                <div key={pay.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-gray-900 text-xs truncate">{displayName}</p>
                          <span className="text-[8px] bg-green-50 text-green-900 font-bold px-1.5 py-0.5 rounded-full">
                            Capitec Transfer
                          </span>
                        </div>
                        {displayEmail && <p className="text-[10px] text-gray-400 font-medium truncate">{displayEmail}</p>}
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-extrabold text-green-800 text-xs">R{pay.amount || 49.99}</span>
                          <span className="text-gray-300 text-[10px]">•</span>
                          <span className="text-[10px] font-bold text-gray-600">Ref: {pay.reference || 'Sub49'}</span>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5 truncate max-w-xs">
                          📄 {pay.proofOfPaymentName || 'Proof Document'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setViewerInfo({ isOpen: true, title: `Proof of Payment - ${displayName}`, url: pay.receiptUrl })}
                      title="View Document"
                      aria-label="View Document"
                      className="p-1.5 text-green-800 bg-green-50 hover:bg-green-100 rounded-lg transition-colors flex-shrink-0 cursor-pointer flex items-center justify-center"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => pay.id && handleVerifyPayment(pay.id, pay.userId, true)}
                      title="Approve & Activate (30 Days)"
                      aria-label="Approve & Activate (30 Days)"
                      className="flex-1 bg-green-800 hover:bg-green-900 text-white py-1.5 rounded-lg shadow-xs transition-all cursor-pointer flex items-center justify-center"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => pay.id && handleVerifyPayment(pay.id, pay.userId, false)}
                      title="Reject Payment"
                      aria-label="Reject Payment"
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {pendingPayments.length === 0 && <p className="text-center text-gray-400 text-xs py-4 font-medium">No pending payments.</p>}
          </div>
        </section>

        {/* Profile Reviews */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              User Profiles ({userProfiles.length})
            </h2>
          </div>
          <div className="grid gap-2">
            {userProfiles.map(p => (
              <div key={p.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div 
                      onClick={() => p.profilePictureUrl && setViewerInfo({ isOpen: true, title: 'Profile Picture', url: p.profilePictureUrl })}
                      className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-800 overflow-hidden cursor-pointer flex-shrink-0"
                    >
                      {p.profilePictureUrl ? (
                        <SafeImage src={p.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" fallbackType="user" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-gray-900 text-xs truncate">{p.firstName || 'Unnamed'} {p.surname || ''}</p>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                          p.status === 'reviewed' ? 'bg-green-50 text-green-600' :
                          p.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {p.status || 'pending'}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{p.province || 'No Province'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => p.idDocumentUrl && setViewerInfo({ isOpen: true, title: 'ID Document', url: p.idDocumentUrl })}
                      disabled={!p.idDocumentUrl}
                      className="p-1.5 bg-gray-100 rounded-md text-gray-500 hover:text-green-800 transition-colors disabled:opacity-30"
                      title="View ID"
                    >
                      <Shield className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => p.cvUrl && setViewerInfo({ isOpen: true, title: 'User CV', url: p.cvUrl })}
                      disabled={!p.cvUrl}
                      className="p-1.5 bg-gray-100 rounded-md text-gray-500 hover:text-green-800 transition-colors disabled:opacity-30"
                      title="View CV"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => handleReviewProfile(p.id!, true)}
                    title="Approve Profile"
                    aria-label="Approve Profile"
                    className="flex-1 bg-green-800 text-white py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleReviewProfile(p.id!, false)}
                    title="Reject Profile"
                    aria-label="Reject Profile"
                    className="flex-1 bg-red-50 text-red-600 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {userProfiles.length === 0 && <p className="text-center text-gray-400 text-xs py-4 font-medium">No user profiles found.</p>}
          </div>
        </section>
      </div>

      <ImageViewer 
        isOpen={viewerInfo.isOpen}
        onClose={() => setViewerInfo(v => ({ ...v, isOpen: false }))}
        imageUrl={viewerInfo.url}
        title={viewerInfo.title}
      />
    </div>
  );
}
