import React, { useState, useEffect } from 'react';
import { User, LogOut, Upload, FileText, CheckCircle, AlertCircle, Loader2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, doc, getDoc, setDoc, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';
import { SubscriptionModal } from './SubscriptionModal';

import { compressImage } from '../lib/imageUtils';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

interface Props {
  user: any;
  onLogout: () => void;
  onRedirectToGigs: () => void;
}

export function ProfileView({ user, onLogout, onRedirectToGigs }: Props) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [notification, setNotification] = useState<string | null>(null);
  const [showSubscription, setShowSubscription] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    firstName: user?.displayName?.split(' ')[0] || '',
    surname: user?.displayName?.split(' ').slice(1).join(' ') || '',
    middleName: '',
    dob: '',
    profilePictureName: '',
    idDocumentName: '',
    cvName: '',
    certificates: [],
    province: 'Gauteng',
    isOnline: true,
    isAdmin: user?.email?.toLowerCase() === 'timegig2026@gmail.com',
    status: user?.email?.toLowerCase() === 'timegig2026@gmail.com' ? 'reviewed' : 'incomplete',
    updatedAt: null
  });

  const [idFile, setIdFile] = useState<File | null>(null);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [otherFiles, setOtherFiles] = useState<File[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'profiles', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile({
            ...data,
            middleName: data.middleName ?? '',
            profilePictureName: data.profilePictureName ?? '',
            idDocumentName: data.idDocumentName ?? '',
            cvName: data.cvName ?? '',
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile && !profile.idDocumentName) {
      alert("ID Document is required!");
      return;
    }
    if (!profilePicFile && !profile.profilePictureName) {
      alert("Profile picture is required! Face only - admin will reject otherwise.");
      return;
    }

    setSubmitting(true);
    setSubmitStep('submitting');
    try {
      if (idFile && idFile.size > 2 * 1024 * 1024) {
        alert("ID Document is too large. Please choose a file under 2MB.");
        setSubmitting(false);
        setSubmitStep('idle');
        return;
      }
      if (cvFile && cvFile.size > 2 * 1024 * 1024) {
        alert("CV file is too large. Please choose a file under 2MB.");
        setSubmitting(false);
        setSubmitStep('idle');
        return;
      }

      let profilePictureUrl = profile.profilePictureUrl || "";
      let idDocumentUrl = profile.idDocumentUrl || "";
      let cvUrl = profile.cvUrl || "";

      if (profilePicFile) {
        const b64 = await fileToBase64(profilePicFile);
        profilePictureUrl = await compressImage(b64, 400, 0.4); 
      }

      if (idFile) {
        const b64 = await fileToBase64(idFile);
        idDocumentUrl = await compressImage(b64, 600, 0.5); 
      }

      if (cvFile) {
        const b64 = await fileToBase64(cvFile);
        cvUrl = await compressImage(b64, 600, 0.5);
      }

      const profileData: any = {
        firstName: profile.firstName || '',
        surname: profile.surname || '',
        middleName: profile.middleName || '',
        dob: profile.dob || '',
        province: profile.province || 'Gauteng',
        isOnline: Boolean(profile.isOnline),
        isAdmin: Boolean(profile.isAdmin),
        idDocumentName: idFile ? idFile.name : (profile.idDocumentName || ''),
        idDocumentUrl: idDocumentUrl || '',
        profilePictureName: profilePicFile ? profilePicFile.name : (profile.profilePictureName || ''),
        profilePictureUrl: profilePictureUrl || '',
        cvName: cvFile ? cvFile.name : (profile.cvName || ''),
        cvUrl: cvUrl || '',
        certificates: [...(profile.certificates || []), ...otherFiles.map(f => f.name)],
        status: profile.isAdmin ? 'reviewed' : 'pending',
        updatedAt: serverTimestamp()
      };

      if (profile.subscription) {
        profileData.subscription = profile.subscription;
      }

      await setDoc(doc(db, 'profiles', user.uid), profileData, { merge: true });
      
      setSubmitStep('success');
      
      await new Promise(r => setTimeout(r, 1500));

      // If no subscription exists, show the subscription modal
      if (!profile.subscription) {
        setSubmitStep('idle');
        setShowSubscription(true);
      } else {
        setSubmitStep('idle');
        onRedirectToGigs();
      }
    } catch (error) {
      setSubmitStep('idle');
      setSubmitting(false);
      console.error("Submission error:", error);
      alert("Submission failed. Please check your internet connection and make sure files are under 2MB.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50 overflow-y-auto pb-24">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              {profile.profilePictureUrl || user.photoURL ? (
                <img 
                  src={profile.profilePictureUrl || user.photoURL || ''} 
                  alt={user.displayName || 'User'} 
                  className="w-12 h-12 rounded-full shadow-md border-2 border-white object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 text-xl font-bold border-2 border-white">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 tracking-tight">{user.displayName || 'Gig Seeker'}</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-6 mt-4 p-4 bg-teal-50 border border-teal-100 rounded-xl flex items-start gap-3 shadow-sm"
          >
            <CheckCircle className="w-5 h-5 text-teal-600 mt-0.5" />
            <p className="text-sm text-teal-800 font-medium leading-relaxed">
              {notification}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              Personal Information
            </h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">First Name</label>
              <input 
                required
                type="text"
                value={profile.firstName || ''}
                onChange={e => setProfile({...profile, firstName: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="John"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Middle Name (Optional)</label>
              <input 
                type="text"
                value={profile.middleName || ''}
                onChange={e => setProfile({...profile, middleName: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="Quincy"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Surname</label>
              <input 
                required
                type="text"
                value={profile.surname || ''}
                onChange={e => setProfile({...profile, surname: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="Doe"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Date of Birth</label>
              <input 
                required
                type="date"
                value={profile.dob || ''}
                onChange={e => setProfile({...profile, dob: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Province</label>
              <select 
                required
                value={profile.province || 'Gauteng'}
                onChange={e => setProfile({...profile, province: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all appearance-none cursor-pointer"
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Availability</label>
              <div 
                onClick={() => setProfile({...profile, isOnline: !profile.isOnline})}
                className="flex items-center justify-between w-full bg-gray-50 border-none rounded-xl px-4 py-3 cursor-pointer transition-all hover:bg-gray-100"
              >
                <span className="text-sm font-bold text-gray-600">
                  {profile.isOnline ? 'Online & Ready' : 'Offline / Busy'}
                </span>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${profile.isOnline ? 'bg-teal-500' : 'bg-gray-300'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${profile.isOnline ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              Subscription Status
            </h2>
            {profile.subscription ? (
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                profile.subscription.status === 'active' ? 'bg-green-100 text-green-700' :
                profile.subscription.status === 'trial' ? 'bg-teal-100 text-teal-700' :
                profile.subscription.status === 'pending_verification' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
              }`}>
                {profile.subscription.status.replace('_', ' ')}
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                No Active Plan
              </span>
            )}
          </div>
          
          <div className="p-6 space-y-4">
            {profile.subscription ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {profile.subscription.status === 'trial' ? '15-Day Free Trial' : 'Monthly Premium Plan'}
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">
                    {profile.subscription.status === 'pending_verification' 
                      ? "Verifying your proof of payment..." 
                      : `Expires on ${new Date(profile.subscription.expiresAt?.toDate?.() || profile.subscription.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                {(profile.subscription.status === 'trial' || profile.subscription.status === 'expired') && (
                  <button 
                    type="button"
                    onClick={() => setShowSubscription(true)}
                    className="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all"
                  >
                    Upgrade
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="text-sm text-gray-500 font-medium">
                  Submit your profile to activate your <span className="text-teal-600 font-bold">15-day free trial</span> and get access to all premium features.
                </p>
                <button 
                  type="button"
                  onClick={() => setShowSubscription(true)}
                  className="w-full bg-teal-600 text-white py-3 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition-all"
                >
                  View Subscription Options
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Upload className="w-4 h-4 text-teal-600" />
              Document Upload
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Profile Picture */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                  Profile Picture <span className="text-red-500">*</span>
                </label>
                {(profilePicFile || profile.profilePictureName) && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Uploaded</span>
                )}
              </div>
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-2.5 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
                  Face only - please ensure your face is clearly visible. Administrators will reject profiles with unclear or non-facial pictures.
                </p>
              </div>
              <div className="relative group">
                <input 
                  type="file"
                  onChange={e => setProfilePicFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="profile-pic-upload"
                  accept="image/*"
                />
                <label 
                  htmlFor="profile-pic-upload"
                  className="flex items-center gap-3 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl px-4 py-6 cursor-pointer hover:bg-gray-100 hover:border-teal-300 transition-all group"
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform overflow-hidden border border-gray-100">
                    {profilePicFile ? (
                      <img src={URL.createObjectURL(profilePicFile)} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-600">
                      {profilePicFile ? profilePicFile.name : profile.profilePictureName || 'Upload Profile Picture'}
                    </p>
                    <p className="text-[10px] text-gray-400">JPG, PNG or GIF (Max 2MB)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* ID Document */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1 flex items-center gap-2">
                  ID Document <span className="text-red-500">*</span>
                </label>
                {(idFile || profile.idDocumentName) && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Uploaded</span>
                )}
              </div>
              <div className="relative group">
                <input 
                  type="file"
                  onChange={e => setIdFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="id-upload"
                  accept=".pdf,image/*"
                />
                <label 
                  htmlFor="id-upload"
                  className="flex items-center gap-3 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl px-4 py-6 cursor-pointer hover:bg-gray-100 hover:border-teal-300 transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-600">
                      {idFile ? idFile.name : profile.idDocumentName || 'Upload ID Document'}
                    </p>
                    <p className="text-[10px] text-gray-400">PDF or Image (Max 5MB)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* CV */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Curriculum Vitae (CV)</label>
              <div className="relative group">
                <input 
                  type="file"
                  onChange={e => setCvFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="cv-upload"
                  accept=".pdf,.doc,.docx"
                />
                <label 
                  htmlFor="cv-upload"
                  className="flex items-center gap-3 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl px-4 py-4 cursor-pointer hover:bg-gray-100 transition-all"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Upload className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    {cvFile ? cvFile.name : profile.cvName || 'Upload CV'}
                  </p>
                </label>
              </div>
            </div>

            {/* Others */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Certificates & Other Documents</label>
              <div className="relative group">
                <input 
                  type="file"
                  multiple
                  onChange={e => setOtherFiles(Array.from(e.target.files || []))}
                  className="hidden"
                  id="others-upload"
                />
                <label 
                  htmlFor="others-upload"
                  className="flex items-center gap-3 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl px-4 py-4 cursor-pointer hover:bg-gray-100 transition-all"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Upload className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">
                    {otherFiles.length > 0 ? `${otherFiles.length} files selected` : 'Upload Certificates'}
                  </p>
                </label>
              </div>
              {(profile.certificates || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(profile.certificates || []).map((cert, idx) => (
                    <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-lg border border-gray-200">
                      {cert}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={submitting}
          className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting Profile...
            </>
          ) : (
            <>
              Submit for Review
              <CheckCircle className="w-5 h-5" />
            </>
          )}
        </button>
      </form>

      {showSubscription && (
        <SubscriptionModal 
          user={user} 
          profile={profile} 
          onSuccess={() => {
            setShowSubscription(false);
            onRedirectToGigs();
          }} 
          onClose={() => setShowSubscription(false)}
        />
      )}

      {submitStep !== 'idle' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5pax] p-8 max-w-sm w-full mx-auto text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            {submitStep === 'submitting' && (
              <>
                <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto text-teal-600 animate-pulse">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Submitting...</h3>
                  <p className="text-sm text-gray-500 font-medium">Please wait while we upload and secure your credentials.</p>
                </div>
              </>
            )}
            {submitStep === 'success' && (
              <>
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto text-green-600 animate-bounce">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Submitting Successful!</h3>
                  <p className="text-sm text-gray-500 font-medium">Your profile has been successfully sent for admin review.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
