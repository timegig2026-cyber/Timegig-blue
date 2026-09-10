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
        status: approved ? 'verified' : 'rejected'
      }, { merge: true });
      
      await setDoc(doc(db, 'profiles', userId), {
        subscription: {
          status: approved ? 'active' : 'expired',
          updatedAt: serverTimestamp()
        }
      }, { merge: true });

      // Send notification to user
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        userId,
        title: approved ? 'Subscription Activated' : 'Payment Rejected',
        message: approved 
          ? 'Your proof of payment has been verified. Welcome to TimeGiG Premium!' 
          : 'Your proof of payment was rejected. Please contact support or re-upload a valid document.',
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
      <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-gray-50/50 overflow-y-auto pb-24">
      <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-100 shadow-sm flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-gray-100 rounded-xl text-gray-500">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Admin Control</h1>
      </div>

      <div className="p-6 max-w-4xl mx-auto w-full space-y-12">
        {/* Appearance Management */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900">App Appearance</h2>
              <p className="text-sm text-gray-400 font-medium tracking-tight">Set a global background wallpaper for all users</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex-1 cursor-pointer group">
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-100 group-hover:border-teal-200 group-hover:bg-teal-50/30 transition-all rounded-[2rem] py-10 px-6 text-center space-y-3">
                <div className="w-12 h-12 bg-gray-50 group-hover:bg-white rounded-2xl flex items-center justify-center transition-colors">
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-teal-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-gray-900 group-hover:text-teal-600">
                    {uploading ? 'Uploading...' : 'Upload New Wallpaper'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">JPG, PNG or WEBP from device</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Profit</p>
            <p className="text-2xl font-black text-teal-600">R{totalProfit.toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Users</p>
            <p className="text-2xl font-black text-gray-900">{totalUsersCount}</p>
          </div>
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Online Now</p>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
              <p className="text-2xl font-black text-gray-900">{onlineUsersCount}</p>
            </div>
          </div>
        </div>

        {/* Payment Verifications */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Payments ({pendingPayments.length})
            </h2>
          </div>
          
          <div className="grid gap-4">
            {pendingPayments.map(pay => (
              <div key={pay.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">R{pay.amount}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ref: {pay.reference}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setViewerInfo({ isOpen: true, title: 'Proof of Payment', url: pay.receiptUrl })}
                    className="flex items-center gap-2 text-teal-600 font-bold text-xs bg-teal-50 px-3 py-1.5 rounded-full"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Proof
                  </button>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => pay.id && handleVerifyPayment(pay.id, pay.userId, true)}
                    className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-teal-600/20"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => pay.id && handleVerifyPayment(pay.id, pay.userId, false)}
                    className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingPayments.length === 0 && <p className="text-center text-gray-400 text-sm py-8 font-medium">No pending payments.</p>}
          </div>
        </section>

        {/* Profile Reviews */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4" />
              User Profiles ({userProfiles.length})
            </h2>
          </div>
          <div className="grid gap-4">
            {userProfiles.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div 
                      onClick={() => p.profilePictureUrl && setViewerInfo({ isOpen: true, title: 'Profile Picture', url: p.profilePictureUrl })}
                      className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 overflow-hidden cursor-pointer"
                    >
                      {p.profilePictureUrl ? (
                        <SafeImage src={p.profilePictureUrl} alt="Avatar" className="w-full h-full object-cover" fallbackType="user" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-900">{p.firstName || 'Unnamed'} {p.surname || ''}</p>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          p.status === 'reviewed' ? 'bg-green-50 text-green-600' :
                          p.status === 'rejected' ? 'bg-red-50 text-red-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {p.status || 'pending'}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{p.province || 'No Province'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => p.idDocumentUrl && setViewerInfo({ isOpen: true, title: 'ID Document', url: p.idDocumentUrl })}
                      disabled={!p.idDocumentUrl}
                      className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-teal-600 transition-colors disabled:opacity-30"
                      title="View ID"
                    >
                      <Shield className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => p.cvUrl && setViewerInfo({ isOpen: true, title: 'User CV', url: p.cvUrl })}
                      disabled={!p.cvUrl}
                      className="p-2 bg-gray-100 rounded-lg text-gray-500 hover:text-teal-600 transition-colors disabled:opacity-30"
                      title="View CV"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleReviewProfile(p.id!, true)}
                    className="flex-1 bg-teal-600 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider"
                  >
                    Approve
                  </button>
                  <button 
                    onClick={() => handleReviewProfile(p.id!, false)}
                    className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
            {userProfiles.length === 0 && <p className="text-center text-gray-400 text-sm py-8 font-medium">No user profiles found.</p>}
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
