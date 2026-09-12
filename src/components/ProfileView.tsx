import React, { useState, useEffect } from 'react';
import { 
  User, 
  LogOut, 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Shield, 
  CreditCard, 
  Copy, 
  Check, 
  Calendar, 
  Sparkles, 
  Clock, 
  Eye, 
  Landmark,
  ArrowRight,
  Download,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  db, 
  doc, 
  setDoc, 
  serverTimestamp, 
  onSnapshot, 
  collection,
  query,
  where
} from '../lib/firebase';
import { UserProfile, SubscriptionPayment } from '../types';
import { SafeImage } from './SafeImage';
import { compressImage, fileToDataUrl } from '../lib/imageUtils';
import { ImageViewer } from './ImageViewer';

interface Props {
  user: any;
  onLogout: () => void;
  onRedirectToAlerts: () => void;
}

export function ProfileView({ user, onLogout, onRedirectToAlerts }: Props) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState<'profile' | 'subscription'>('profile');
  const [isEditingProfile, setIsEditingProfile] = useState(true);
  
  const [profile, setProfile] = useState<UserProfile>({
    firstName: user?.displayName?.split(' ')[0] || '',
    surname: user?.displayName?.split(' ').slice(1).join(' ') || '',
    middleName: '',
    dob: '',
    gender: 'Male',
    skills: '',
    province: 'Gauteng',
    isOnline: true,
    isAdmin: user?.email?.toLowerCase() === 'timegig2026@gmail.com',
    status: 'pending',
    certificates: [],
    updatedAt: null
  });

  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [congratsMessage, setCongratsMessage] = useState<string | null>(null);
  
  // Subscription states
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
  const [submittingProof, setSubmittingProof] = useState(false);
  const [copiedField, setCopiedField] = useState<'acc' | 'ref' | null>(null);
  const [userPayments, setUserPayments] = useState<SubscriptionPayment[]>([]);

  // Modals & previews
  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [viewerInfo, setViewerInfo] = useState<{ isOpen: boolean; url?: string; title: string }>({
    isOpen: false,
    title: ''
  });

  // Listen to profile updates
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'profiles', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(prev => ({ ...prev, ...data }));
        if (data.status === 'reviewed') {
          setIsEditingProfile(false);
        } else {
          setIsEditingProfile(true);
        }
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching profile:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Listen to user's subscription payment submissions
  useEffect(() => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'subscription_payments'),
        where('userId', '==', user.uid)
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as SubscriptionPayment));
        list.sort((a, b) => {
          const tA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : (a.timestamp ? new Date(a.timestamp).getTime() : 0);
          const tB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : (b.timestamp ? new Date(b.timestamp).getTime() : 0);
          return tB - tA;
        });
        setUserPayments(list);
      }, (err) => {
        console.warn("Error listening to payments:", err);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Could not query payments:", e);
    }
  }, [user]);

  // 30 Days Trial calculation
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const userCreationMs = user?.metadata?.creationTime ? new Date(user.metadata.creationTime).getTime() : Date.now();
  
  let trialStartMs = userCreationMs;
  if (profile.subscription?.trialStartDate) {
    trialStartMs = profile.subscription.trialStartDate.toDate 
      ? profile.subscription.trialStartDate.toDate().getTime() 
      : new Date(profile.subscription.trialStartDate).getTime();
  }

  let expiresMs = trialStartMs + THIRTY_DAYS_MS;
  if (profile.subscription?.expiresAt) {
    expiresMs = profile.subscription.expiresAt.toDate 
      ? profile.subscription.expiresAt.toDate().getTime() 
      : new Date(profile.subscription.expiresAt).getTime();
  }

  const nowMs = Date.now();
  const remainingDays = Math.max(0, Math.ceil((expiresMs - nowMs) / (1000 * 60 * 60 * 24)));
  const trialDaysPassed = Math.min(30, Math.max(0, 30 - remainingDays));
  const trialProgressPercent = Math.min(100, Math.max(5, (trialDaysPassed / 30) * 100));

  const isSubscriptionActive = profile.subscription?.status === 'active';
  const isPendingVerification = profile.subscription?.status === 'pending_verification';
  const isTrialActive = !isSubscriptionActive && !isPendingVerification && remainingDays > 0;
  const isTrialExpired = !isSubscriptionActive && !isPendingVerification && remainingDays <= 0;

  // Auto-init trial in Firestore if absent
  useEffect(() => {
    if (!user || loading) return;
    if (!profile.subscription) {
      const initialTrialExpires = new Date(Date.now() + THIRTY_DAYS_MS);
      setDoc(doc(db, 'profiles', user.uid), {
        subscription: {
          status: 'trial',
          trialStartDate: serverTimestamp(),
          expiresAt: initialTrialExpires,
          amount: 49.99,
          reference: 'Sub49',
          updatedAt: serverTimestamp()
        }
      }, { merge: true }).catch(err => {
        console.warn("Could not auto-initialize trial:", err);
      });
    }
  }, [user, loading, profile.subscription]);

  // Copy helper
  const handleCopy = (text: string, field: 'acc' | 'ref') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Submit Proof of Payment
  const handleSubmitProofOfPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentProofFile) {
      setAlertModal({
        show: true,
        title: 'Missing Document',
        message: 'Please select your proof of payment document or screenshot from your device before submitting.',
        type: 'error'
      });
      return;
    }

    setSubmittingProof(true);
    try {
      let receiptDataUrl = '';
      if (paymentProofFile.type.startsWith('image/')) {
        const rawB64 = await fileToDataUrl(paymentProofFile);
        receiptDataUrl = await compressImage(rawB64, 1200, 0.8);
      } else {
        receiptDataUrl = await fileToDataUrl(paymentProofFile);
      }

      const userName = `${profile.firstName || ''} ${profile.surname || ''}`.trim() || user.displayName || 'User';

      // 1. Create document in subscription_payments for admin to receive
      const paymentRef = doc(collection(db, 'subscription_payments'));
      await setDoc(paymentRef, {
        userId: user.uid,
        userName,
        userEmail: user.email || '',
        amount: 49.99,
        reference: 'Sub49',
        bankName: 'Capitec',
        accountName: 'Matthews',
        accountNumber: '1334067366',
        status: 'pending',
        proofOfPaymentName: paymentProofFile.name,
        receiptUrl: receiptDataUrl,
        timestamp: serverTimestamp()
      });

      // 2. Update user profile subscription object
      await setDoc(doc(db, 'profiles', user.uid), {
        subscription: {
          status: 'pending_verification',
          proofOfPaymentName: paymentProofFile.name,
          proofOfPaymentUrl: receiptDataUrl,
          amount: 49.99,
          reference: 'Sub49',
          submittedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      }, { merge: true });

      // 3. User notification
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        userId: user.uid,
        title: 'Proof of Payment Submitted',
        message: 'Your R49,99 proof of payment with reference Sub49 was submitted. Admin will verify your documents.',
        type: 'info',
        read: false,
        createdAt: serverTimestamp()
      });

      setPaymentProofFile(null);
      setAlertModal({
        show: true,
        title: 'Proof of Payment Submitted! 🎉',
        message: 'Your proof of payment documents were submitted successfully. Admin will receive your proof of payment documents and verify your subscription.',
        type: 'success'
      });
    } catch (err) {
      console.error("Failed to submit proof of payment:", err);
      setAlertModal({
        show: true,
        title: 'Submission Failed',
        message: 'Failed to upload proof of payment. Please make sure the file is valid and try again.',
        type: 'error'
      });
    } finally {
      setSubmittingProof(false);
    }
  };

  // Save Profile Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile && !profile.idDocumentName) {
      setAlertModal({
        show: true,
        title: 'Missing Document',
        message: 'ID Document is required!',
        type: 'error'
      });
      return;
    }

    setSubmitting(true);
    try {
      let profilePictureUrl = profile.profilePictureUrl || user.photoURL || '';
      let idDocumentUrl = profile.idDocumentUrl || '';
      let cvUrl = profile.cvUrl || '';
      let certificateNames = profile.certificates || [];

      if (profilePicFile) {
        try {
          const base64 = await fileToDataUrl(profilePicFile);
          profilePictureUrl = await compressImage(base64, 800, 0.7);
        } catch (err) {
          console.warn("Profile picture processing error:", err);
        }
      }

      if (idFile) {
        if (idFile.size > 2 * 1024 * 1024) {
          setAlertModal({
            show: true,
            title: 'File Too Large',
            message: 'ID Document must be under 2MB.',
            type: 'error'
          });
          setSubmitting(false);
          return;
        }
        try {
          const base64 = await fileToDataUrl(idFile);
          idDocumentUrl = await compressImage(base64, 1200, 0.8);
        } catch (err) {
          console.warn("ID document processing error:", err);
        }
      }

      if (cvFile) {
        try {
          cvUrl = await fileToDataUrl(cvFile);
        } catch (err) {
          console.warn("CV processing error:", err);
        }
      }

      if (certFiles.length > 0) {
        const newCerts = certFiles.map(f => f.name);
        certificateNames = [...certificateNames, ...newCerts];
      }

      const profileData: any = {
        firstName: profile.firstName || '',
        surname: profile.surname || '',
        middleName: profile.middleName || '',
        dob: profile.dob || '',
        gender: profile.gender || 'Male',
        skills: profile.skills || '',
        province: profile.province || 'Gauteng',
        isOnline: Boolean(profile.isOnline),
        isAdmin: Boolean(profile.isAdmin),
        status: 'pending',
        idDocumentName: idFile ? idFile.name : (profile.idDocumentName || ''),
        idDocumentUrl: idDocumentUrl,
        cvName: cvFile ? cvFile.name : (profile.cvName || ''),
        cvUrl: cvUrl,
        certificates: certificateNames,
        profilePictureName: profilePicFile ? profilePicFile.name : (profile.profilePictureName || ''),
        profilePictureUrl: profilePictureUrl,
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, 'profiles', user.uid), profileData, { merge: true });
      
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        userId: user.uid,
        title: 'Profile Under Review',
        message: 'Your profile has been successfully submitted and is now under review by the admin.',
        type: 'info',
        read: false,
        createdAt: serverTimestamp()
      });

      setCongratsMessage("Congratulations! 🎉 Your profile has been submitted and is now under review.");
      setAlertModal({
        show: true,
        title: 'Profile Submitted',
        message: 'Congratulations! 🎉 Your profile has been submitted and is now under review.',
        type: 'success'
      });
      
    } catch (error) {
      console.error("Error saving profile:", error);
      setAlertModal({
        show: true,
        title: 'Save Failed',
        message: 'Failed to save profile. Please try again.',
        type: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-green-800 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 overflow-hidden relative">
      {/* Loading Overlay */}
      {submitting && (
        <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 border-4 border-green-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-black text-gray-800 tracking-widest uppercase">Submitting Profile...</p>
        </div>
      )}

      {/* TOP BAR - ALWAYS VISIBLE, NEVER HIDDEN */}
      <header className="bg-white px-3 sm:px-4 pt-2.5 pb-2 border-b border-gray-100 shadow-xs z-30 sticky top-0 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2.5">
          {/* User info & avatar */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative group w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-green-700 shadow-xs bg-green-50 flex items-center justify-center flex-shrink-0">
              <SafeImage 
                src={profilePicFile ? URL.createObjectURL(profilePicFile) : (profile.profilePictureUrl || user.photoURL || '')} 
                alt="Face Logo" 
                className="w-full h-full object-cover" 
                fallbackType="user" 
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-gray-900 tracking-tight truncate">
                {profile.firstName ? `${profile.firstName} ${profile.surname}` : (user.displayName || 'Gig Seeker')}
              </h1>
              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider truncate">{user.email}</p>
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                  profile.status === 'reviewed' ? 'bg-green-50 text-green-600 border border-green-200' :
                  profile.status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-200' :
                  'bg-amber-50 text-amber-600 border border-amber-200'
                }`}>
                  {profile.status === 'reviewed' ? 'Approved' : profile.status === 'rejected' ? 'Rejected' : 'Pending'}
                </span>
                {/* Subscription Status Tag */}
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md flex items-center gap-0.5 ${
                  isSubscriptionActive ? 'bg-green-50 text-green-900 border border-green-200' :
                  isPendingVerification ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                  isTrialActive ? 'bg-green-50 text-green-900 border border-green-200' :
                  'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  <Sparkles className="w-2 h-2" />
                  {isSubscriptionActive ? 'Sub Active (R49,99)' :
                   isPendingVerification ? 'Sub Pending' :
                   isTrialActive ? `${remainingDays}d Trial` :
                   'Sub Due (R49,99)'}
                </span>
                {profile.isDisabled && (
                  <span className="text-[8px] font-black uppercase px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-600 border border-rose-200">
                    Disabled
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button 
              onClick={onLogout}
              className="p-1.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher - Icons Only */}
        <div className="max-w-3xl mx-auto mt-2 pt-1.5 border-t border-gray-100 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveProfileTab('profile')}
            title="Profile Information"
            aria-label="Profile Information"
            className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
              activeProfileTab === 'profile'
                ? 'bg-green-800 text-white shadow-xs'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <User className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setActiveProfileTab('subscription')}
            title="Subscription & Trial"
            aria-label="Subscription & Trial"
            className={`p-1.5 rounded-lg transition-all cursor-pointer relative flex items-center justify-center ${
              activeProfileTab === 'subscription'
                ? 'bg-green-800 text-white shadow-xs'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            {isTrialActive && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-gray-900 text-[8px] font-black px-1 rounded-full shadow-xs">
                {remainingDays}d
              </span>
            )}
          </button>
        </div>
      </header>

      {/* SCROLLABLE BODY CONTENT */}
      <div className="flex-1 overflow-y-auto pb-24 px-3 sm:px-4">
        <div className="max-w-3xl mx-auto w-full py-3.5 space-y-3.5">

          {/* Account Disabled Banner */}
          {profile.isDisabled && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-rose-900">Your account is currently disabled</p>
                <p className="text-[11px] text-rose-700">You are hidden from seekers & hirers. You can re-enable your account anytime in Settings.</p>
              </div>
            </div>
          )}

          {/* Status Alerts */}
          {profile.status === 'reviewed' && (
            <div className="p-2.5 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2.5 shadow-xs">
              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-800 font-bold">Congratulations! Your profile has been approved by admin.</p>
            </div>
          )}

          {profile.status === 'rejected' && (
            <div className="p-2.5 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-xs text-red-800 font-bold">Profile rejected. Please ensure your profile logo is a clear face picture and your ID is valid, then save again.</p>
            </div>
          )}

          {congratsMessage && (
            <div className="p-2.5 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2.5 shadow-xs">
              <CheckCircle className="w-4 h-4 text-green-800 flex-shrink-0" />
              <p className="text-xs text-green-950 font-bold">{congratsMessage}</p>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 1: SUBSCRIPTION FEATURE (30-day Trial & R49,99 Monthly) */}
          {/* ========================================================= */}
          {activeProfileTab === 'subscription' && (
            <div className="space-y-3.5">
              
              {/* 1. Trial Status Hero Card */}
              <div className="bg-gradient-to-br from-slate-900 via-green-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-green-700/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 bg-green-700/20 text-green-300 border border-green-700/30 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" />
                      30 Days Free Trial Feature
                    </div>
                    <span className="text-xs font-bold text-green-600">
                      R49,99 / Month
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight">
                      {isSubscriptionActive ? 'Active Monthly Subscription' :
                       isPendingVerification ? 'Proof of Payment Under Admin Verification' :
                       isTrialActive ? `${remainingDays} Days Left on Your Free Trial` :
                       'Your 30-Day Free Trial Has Ended'}
                    </h2>
                    <p className="text-xs text-gray-300 mt-1 max-w-lg leading-relaxed">
                      Every new user receives a full <strong>30-day free trial</strong>.
                      After the trial, continue uninterrupted access for <strong>R49,99 Monthly</strong> via bank transfer.
                    </p>
                  </div>

                  {/* Progress Indicator for Trial */}
                  <div className="bg-white/10 rounded-xl p-2.5 space-y-1.5 border border-white/10">
                    <div className="flex justify-between items-center text-[11px] font-bold text-gray-300">
                      <span>Trial Progress ({trialDaysPassed} of 30 Days used)</span>
                      <span className="text-green-600 font-extrabold">
                        {isSubscriptionActive ? 'Verified Premium' : `${remainingDays} Days Remaining`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          isSubscriptionActive ? 'bg-green-600 w-full' :
                          isTrialExpired ? 'bg-rose-500 w-full' :
                          'bg-gradient-to-r from-green-600 to-green-600'
                        }`}
                        style={{ width: `${isSubscriptionActive || isTrialExpired ? 100 : trialProgressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Capitec Bank Transfer Details Card */}
              <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="px-3.5 py-2 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Landmark className="w-4 h-4 text-green-800" />
                    Capitec Bank Transfer Details
                  </h2>
                  <span className="text-[10px] font-black text-green-900 bg-white px-2 py-0.5 rounded-full border border-green-200 shadow-xs">
                    R49,99 Monthly
                  </span>
                </div>

                <div className="p-3.5 space-y-2.5">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Make a payment of <strong>R49,99</strong> via bank transfer or Capitec app. Use exact reference <strong>Sub49</strong>.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Bank Name */}
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Bank Name</p>
                      <p className="text-xs font-bold text-gray-900 mt-0.5 flex items-center gap-1.5">
                        <span>Capitec</span>
                        <span className="text-[8px] bg-green-100 text-green-950 px-1.5 py-0.2 rounded font-bold">Verified</span>
                      </p>
                    </div>

                    {/* Account Name */}
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Account Name</p>
                      <p className="text-xs font-bold text-gray-900 mt-0.5">Matthews</p>
                    </div>

                    {/* Account Number with Copy */}
                    <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Account Number</p>
                        <p className="text-xs sm:text-sm font-black text-gray-900 tracking-wider mt-0.5 font-mono">1334067366</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('1334067366', 'acc')}
                        title="Copy Account Number"
                        aria-label="Copy Account Number"
                        className="p-1.5 bg-white hover:bg-green-50 text-green-800 border border-green-200 rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center"
                      >
                        {copiedField === 'acc' ? (
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Reference with Copy */}
                    <div className="bg-green-50/70 p-2.5 rounded-xl border border-green-200 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-[9px] font-black text-green-950 uppercase tracking-wider">Reference</p>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-800 animate-pulse" />
                        </div>
                        <p className="text-xs sm:text-sm font-black text-green-950 tracking-wider mt-0.5 font-mono">Sub49</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy('Sub49', 'ref')}
                        title="Copy Reference"
                        aria-label="Copy Reference"
                        className="p-1.5 bg-green-800 hover:bg-green-900 text-white rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center"
                      >
                        {copiedField === 'ref' ? (
                          <Check className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Pricing summary */}
                  <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg text-[11px] text-gray-600">
                    <span className="font-medium">Subscription Fee:</span>
                    <span className="font-bold text-gray-900">R49,99 / Month (Includes 30-Day Trial)</span>
                  </div>
                </div>
              </div>

              {/* 3. Upload Proof of Payment Documents Form */}
              <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                <div className="px-3.5 py-2 bg-gray-50/50 border-b border-gray-100">
                  <h2 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs sm:text-sm">
                    <Upload className="w-4 h-4 text-green-800" />
                    Upload Proof of Payment Documents
                  </h2>
                </div>

                <form onSubmit={handleSubmitProofOfPayment} className="p-3.5 space-y-2.5">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Upload your proof of payment document (PDF, screenshot, or receipt) and click <strong>Submit</strong>.
                  </p>

                  {/* Device File Input */}
                  <div className="space-y-1">
                    <input 
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setPaymentProofFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id="proof-doc-input"
                    />
                    <label 
                      htmlFor="proof-doc-input"
                      className={`flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl p-4 sm:p-5 cursor-pointer transition-all ${
                        paymentProofFile 
                          ? 'bg-green-50/50 border-green-600' 
                          : 'bg-gray-50 hover:bg-gray-100/70 border-gray-200 hover:border-green-600'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-green-100 text-green-900 flex items-center justify-center">
                        {paymentProofFile ? <FileCheck className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                      </div>

                      <div className="text-center">
                        <p className="text-xs font-bold text-gray-800">
                          {paymentProofFile ? paymentProofFile.name : 'Choose Proof of Payment Document'}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Supports PDF, PNG, JPG, or Screenshots (Max 5MB)
                        </p>
                      </div>

                      {paymentProofFile && (
                        <div className="flex items-center gap-1.5 text-[10px] text-green-900 font-bold bg-white px-2.5 py-0.5 rounded-full border border-green-200">
                          <span>{(paymentProofFile.size / 1024).toFixed(1)} KB</span>
                          <span>•</span>
                          <span>Click to change file</span>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Selected File Preview Info */}
                  {paymentProofFile && (
                    <div className="bg-green-50 border border-green-100 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-green-800 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-green-950 truncate">{paymentProofFile.name}</p>
                          <p className="text-[10px] text-green-900">Ready to submit to admin for verification</p>
                        </div>
                      </div>
                      {paymentProofFile.type.startsWith('image/') && (
                        <button
                          type="button"
                          onClick={() => {
                            const url = URL.createObjectURL(paymentProofFile);
                            setViewerInfo({
                              isOpen: true,
                              title: 'Selected Proof of Payment',
                              url
                            });
                          }}
                          className="text-xs font-bold text-green-900 hover:text-green-950 bg-white px-2.5 py-1 rounded-lg border border-green-200 shadow-xs flex-shrink-0 cursor-pointer"
                        >
                          Preview
                        </button>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-1">
                    <button
                      type="submit"
                      disabled={submittingProof || !paymentProofFile}
                      className="w-full max-w-xs mx-auto bg-green-800 hover:bg-green-900 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider py-2.5 rounded-xl shadow-md shadow-green-800/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      {submittingProof ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Proof of Payment</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* 4. Payment Submission History */}
              {userPayments.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-3.5 space-y-2.5">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-green-800" />
                    Payment Submission History ({userPayments.length})
                  </h3>

                  <div className="divide-y divide-gray-100">
                    {userPayments.map(p => {
                      const dateStr = p.timestamp?.toDate 
                        ? p.timestamp.toDate().toLocaleDateString() 
                        : (p.timestamp ? new Date(p.timestamp).toLocaleDateString() : 'Recent');

                      return (
                        <div key={p.id} className="py-2 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 flex-shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 truncate">
                                {p.proofOfPaymentName || 'Proof Document'}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                R{p.amount || 49.99} • Ref: {p.reference || 'Sub49'} • {dateStr}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              p.status === 'verified' ? 'bg-green-50 text-green-700 border border-green-200' :
                              p.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {p.status === 'verified' ? 'Verified' :
                               p.status === 'rejected' ? 'Rejected' :
                               'Reviewing'}
                            </span>

                            {p.receiptUrl && (
                              <button
                                type="button"
                                onClick={() => setViewerInfo({
                                  isOpen: true,
                                  title: `Proof Document (${p.proofOfPaymentName || 'Receipt'})`,
                                  url: p.receiptUrl
                                })}
                                className="p-1 text-green-800 hover:bg-green-50 rounded-md transition-colors cursor-pointer"
                                title="View Document"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PROFILE INFORMATION & DOCUMENT UPLOADS */}
          {/* ========================================================= */}
          {activeProfileTab === 'profile' && (
            <>
              {/* Quick Subscription Banner on Profile Tab */}
              <div className="bg-gradient-to-r from-green-800 to-green-800 text-white rounded-xl p-2.5 shadow-xs flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-green-200" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-wider text-green-200">
                      {isSubscriptionActive ? 'Premium Active' : '30-Day Free Trial'}
                    </p>
                    <p className="text-xs font-bold truncate">
                      {isSubscriptionActive ? 'R49,99 Monthly Subscription Active' :
                       isPendingVerification ? 'Proof of payment under review' :
                       `${remainingDays} days left on trial • Then R49,99/mo`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveProfileTab('subscription')}
                  title="Subscription & Bank Details"
                  aria-label="Subscription & Bank Details"
                  className="bg-white text-green-950 hover:bg-green-50 p-1.5 rounded-lg transition-all shadow-xs flex-shrink-0 cursor-pointer flex items-center justify-center"
                >
                  <CreditCard className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSave} className="flex flex-col gap-3">
                
                {/* Personal Information */}
                <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                  <div className="px-3.5 py-2 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-green-800" />
                      {isEditingProfile ? 'Edit Profile Information' : 'Profile Locked (Approved)'}
                    </h2>
                    {!isEditingProfile && (
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.preventDefault();
                          setIsEditingProfile(true);
                        }} 
                        className="text-[10px] font-bold text-green-800 hover:text-green-900 bg-green-50 hover:bg-green-100 transition-colors px-2 py-1 rounded-md cursor-pointer"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>

                  <fieldset disabled={!isEditingProfile} className="group disabled:opacity-80">
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">First Name</label>
                      <input 
                        required
                        type="text"
                        value={profile.firstName || ''}
                        onChange={e => setProfile({...profile, firstName: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-green-700 outline-none transition-all"
                        placeholder="John"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Middle Name (Optional)</label>
                      <input 
                        type="text"
                        value={profile.middleName || ''}
                        onChange={e => setProfile({...profile, middleName: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-green-700 outline-none transition-all"
                        placeholder="Quincy"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Surname</label>
                      <input 
                        required
                        type="text"
                        value={profile.surname || ''}
                        onChange={e => setProfile({...profile, surname: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-green-700 outline-none transition-all"
                        placeholder="Doe"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Date of Birth</label>
                      <input 
                        required
                        type="date"
                        value={profile.dob || ''}
                        onChange={e => setProfile({...profile, dob: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-green-700 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Gender</label>
                      <select 
                        required
                        value={profile.gender || 'Male'}
                        onChange={e => setProfile({...profile, gender: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-green-700 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Province</label>
                      <select 
                        required
                        value={profile.province || 'Gauteng'}
                        onChange={e => setProfile({...profile, province: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-green-700 outline-none transition-all appearance-none cursor-pointer"
                      >
                        <option value="Gauteng">Gauteng</option>
                        <option value="Western Cape">Western Cape</option>
                        <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                        <option value="Eastern Cape">Eastern Cape</option>
                        <option value="Free State">Free State</option>
                        <option value="Limpopo">Limpopo</option>
                        <option value="Mpumalanga">Mpumalanga</option>
                        <option value="North West">North West</option>
                        <option value="Northern Cape">Northern Cape</option>
                      </select>
                    </div>
                  </div>

                  <div className="px-3 pb-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Skills (Comma Separated)</label>
                      <input 
                        type="text"
                        value={profile.skills || ''}
                        onChange={e => setProfile({...profile, skills: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-lg px-3 py-1.5 text-xs text-gray-700 focus:ring-2 focus:ring-green-700 outline-none transition-all"
                        placeholder="Plumbing, Electrical, Carpentry..."
                      />
                    </div>
                  </div>
                  </fieldset>
                </div>

                {/* Uploads */}
                <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
                  <div className="px-3.5 py-2 bg-gray-50/50 border-b border-gray-100">
                    <h2 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-green-800" />
                      Profile Logo & Document Uploads
                    </h2>
                  </div>

                  <fieldset disabled={!isEditingProfile} className="p-3 space-y-2.5 group disabled:opacity-80">
                    {/* Profile Picture (Face Only) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Profile Face Picture Logo (Face Only)</label>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) setProfilePicFile(e.target.files[0]);
                        }}
                        className="hidden"
                        id="profile-pic-input"
                      />
                      <label 
                        htmlFor="profile-pic-input"
                        className="flex items-center gap-2.5 w-full bg-gray-50 border border-dashed border-gray-200 hover:border-green-600 rounded-xl p-2 cursor-pointer transition-all"
                      >
                        <div 
                          className="w-10 h-10 rounded-lg overflow-hidden bg-green-100 flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-90 relative group"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const url = profilePicFile ? URL.createObjectURL(profilePicFile) : (profile.profilePictureUrl || user.photoURL);
                            if (url) setPreviewImageUrl(url);
                          }}
                          title="Click to view exact uploaded profile picture"
                        >
                          <SafeImage 
                            src={profilePicFile ? URL.createObjectURL(profilePicFile) : (profile.profilePictureUrl || user.photoURL || '')} 
                            alt="Face" 
                            className="w-full h-full object-cover" 
                            fallbackType="user" 
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[8px] font-bold">
                            View
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-700 truncate">
                            {profilePicFile ? profilePicFile.name : profile.profilePictureName || 'Upload Face Picture Only'}
                          </p>
                          <p className="text-[9px] text-amber-600 font-bold">⚠️ Face picture only. Non-face images will be rejected.</p>
                        </div>
                      </label>
                    </div>

                    {/* ID Document (Required) */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">ID Document / Passport (Required)</label>
                      <input 
                        type="file"
                        accept="image/*,.pdf"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) setIdFile(e.target.files[0]);
                        }}
                        className="hidden"
                        id="id-doc-input"
                      />
                      <label 
                        htmlFor="id-doc-input"
                        className="flex items-center gap-2.5 w-full bg-gray-50 border border-dashed border-gray-200 hover:border-green-600 rounded-xl p-2 cursor-pointer transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 text-green-800">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-700 truncate">
                            {idFile ? idFile.name : profile.idDocumentName || 'Upload ID Document (Required)'}
                          </p>
                          <p className="text-[9px] text-gray-400 font-medium">Clear photo or scan required</p>
                        </div>
                      </label>
                    </div>

                    {/* CV Upload */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Upload CV (Optional)</label>
                      <input 
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) setCvFile(e.target.files[0]);
                        }}
                        className="hidden"
                        id="cv-input"
                      />
                      <label 
                        htmlFor="cv-input"
                        className="flex items-center gap-2.5 w-full bg-gray-50 border border-dashed border-gray-200 hover:border-green-600 rounded-xl p-2 cursor-pointer transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 text-green-800">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-700 truncate">
                            {cvFile ? cvFile.name : profile.cvName || 'Upload CV'}
                          </p>
                          <p className="text-[9px] text-gray-400 font-medium">PDF or Document</p>
                        </div>
                      </label>
                    </div>

                    {/* Multiple Certificates Upload */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Upload Certificates (Multiple Selection)</label>
                      <input 
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={e => {
                          if (e.target.files) {
                            setCertFiles(Array.from(e.target.files));
                          }
                        }}
                        className="hidden"
                        id="certs-input"
                      />
                      <label 
                        htmlFor="certs-input"
                        className="flex items-center gap-2.5 w-full bg-gray-50 border border-dashed border-gray-200 hover:border-green-600 rounded-xl p-2 cursor-pointer transition-all"
                      >
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 text-green-800">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-700 truncate">
                            {certFiles.length > 0 ? `${certFiles.length} certificate(s) selected` : 'Select Multiple Certificates'}
                          </p>
                          <p className="text-[9px] text-gray-400 font-medium">You can select multiple files at once</p>
                        </div>
                      </label>
                      {(profile.certificates || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {(profile.certificates || []).map((c, idx) => (
                            <span key={idx} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md border border-gray-200">
                              📄 {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </fieldset>
                </div>

                {/* Save Button */}
                {isEditingProfile && (
                  <div className="pt-1 pb-4 flex flex-col items-center">
                    <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full max-w-xs bg-green-800 hover:bg-green-900 disabled:bg-green-600 text-white font-black uppercase tracking-wider py-2.5 rounded-xl shadow-md shadow-green-800/20 transition-all flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      {submitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Save & Submit Profile'
                      )}
                    </button>
                  </div>
                )}
              </form>
            </>
          )}

        </div>
      </div>

      {/* Alert Modal */}
      {alertModal && alertModal.show && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-xs w-full p-4 shadow-xl border border-gray-100 flex flex-col items-center text-center">
            {alertModal.type === 'success' ? (
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center mb-2.5 text-green-800">
                <CheckCircle className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center mb-2.5 text-red-600">
                <AlertCircle className="w-5 h-5" />
              </div>
            )}
            <h3 className="text-sm font-bold text-gray-900 mb-1">{alertModal.title}</h3>
            <p className="text-xs text-gray-600 mb-3.5 leading-relaxed">{alertModal.message}</p>
            <button
              onClick={() => {
                const isSuccess = alertModal.type === 'success';
                setAlertModal(null);
                if (isSuccess && activeProfileTab === 'profile') {
                  onRedirectToAlerts();
                }
              }}
              className="w-full py-2 bg-green-800 hover:bg-green-900 text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-all shadow-xs cursor-pointer"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Preview Profile Image Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="relative max-w-xs w-full bg-white rounded-2xl p-4 shadow-xl flex flex-col items-center">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-2.5 right-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
            >
              ✕
            </button>
            <h3 className="text-xs font-bold text-gray-900 mb-2.5 mt-1">Uploaded Profile Picture</h3>
            <div className="w-48 h-48 rounded-xl overflow-hidden border border-green-700 shadow-xs bg-gray-50 flex items-center justify-center mb-3">
              <img src={previewImageUrl} alt="Uploaded Profile" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="px-4 py-1.5 bg-green-800 hover:bg-green-900 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Document / Proof of Payment Viewer Modal */}
      <ImageViewer 
        isOpen={viewerInfo.isOpen}
        title={viewerInfo.title}
        imageUrl={viewerInfo.url}
        onClose={() => setViewerInfo({ isOpen: false, title: '' })}
      />
    </div>
  );
}
