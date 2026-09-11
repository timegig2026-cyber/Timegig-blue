import React, { useState, useEffect } from 'react';
import { User, LogOut, Upload, FileText, CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, storage, ref, uploadBytes, getDownloadURL, doc, getDoc, setDoc, serverTimestamp, onSnapshot } from '../lib/firebase';
import { UserProfile } from '../types';
import { SafeImage } from './SafeImage';
import { compressImage, fileToDataUrl } from '../lib/imageUtils';

interface Props {
  user: any;
  onLogout: () => void;
  onRedirectToGigs: () => void;
}

export function ProfileView({ user, onLogout, onRedirectToGigs }: Props) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'profiles', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setProfile(prev => ({ ...prev, ...data }));
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching profile:", err);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile && !profile.idDocumentName) {
      alert("ID Document is required!");
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
          alert("ID Document must be under 2MB.");
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
      
      setCongratsMessage("Congratulations! 🎉 Your profile has been submitted and is now under review.");
      alert("Congratulations! 🎉 Your profile has been submitted and is now under review.");
      
      setTimeout(() => {
        setCongratsMessage(null);
        onRedirectToGigs();
      }, 2000);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile. Please try again.");
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
    <div className="flex flex-col h-full bg-gray-50/50 overflow-y-auto pb-24 relative">
      {submitting && (
        <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-black text-gray-800 tracking-widest uppercase">Submitting Profile...</p>
        </div>
      )}

      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative group w-14 h-14 rounded-2xl overflow-hidden border-2 border-teal-500 shadow-md bg-teal-50 flex items-center justify-center flex-shrink-0">
              {profilePicFile ? (
                <img src={URL.createObjectURL(profilePicFile)} alt="Face Logo" className="w-full h-full object-cover" />
              ) : profile.profilePictureUrl || user.photoURL ? (
                <SafeImage src={profile.profilePictureUrl || user.photoURL || ''} alt="Face Logo" className="w-full h-full object-cover" fallbackType="user" />
              ) : (
                <User className="w-6 h-6 text-teal-600" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-black text-gray-900 tracking-tight truncate">
                {profile.firstName ? `${profile.firstName} ${profile.surname}` : (user.displayName || 'Gig Seeker')}
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">{user.email}</p>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  profile.status === 'reviewed' ? 'bg-green-50 text-green-600' :
                  profile.status === 'rejected' ? 'bg-red-50 text-red-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  {profile.status === 'reviewed' ? 'Approved' : profile.status === 'rejected' ? 'Rejected' : 'Pending Review'}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl transition-colors flex-shrink-0"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {profile.status === 'reviewed' && (
        <div className="max-w-4xl mx-auto w-full px-6 mt-6">
          <div className="p-4 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-800 font-bold">Congratulations! Your profile has been approved by admin.</p>
          </div>
        </div>
      )}

      {profile.status === 'rejected' && (
        <div className="max-w-4xl mx-auto w-full px-6 mt-6">
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800 font-bold">Profile rejected. Please ensure your profile logo is a clear face picture and your ID is valid, then save again.</p>
          </div>
        </div>
      )}

      {congratsMessage && (
        <div className="max-w-4xl mx-auto w-full px-6 mt-6">
          <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl flex items-center gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <p className="text-sm text-teal-800 font-bold">{congratsMessage}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <User className="w-4 h-4 text-teal-600" />
              Edit Profile Information
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
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Gender</label>
              <select 
                required
                value={profile.gender || 'Male'}
                onChange={e => setProfile({...profile, gender: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
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
          </div>

          <div className="px-6 pb-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Skills (Comma Separated)</label>
              <input 
                type="text"
                value={profile.skills || ''}
                onChange={e => setProfile({...profile, skills: e.target.value})}
                className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                placeholder="Plumbing, Electrical, Carpentry..."
              />
            </div>
          </div>
        </div>

        {/* Uploads */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-teal-600" />
              Profile Logo & Document Uploads
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Profile Picture (Face Only) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Profile Face Picture Logo (Face Only - Admin will reject otherwise)</label>
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
                className="flex items-center gap-4 w-full bg-gray-50 border-2 border-dashed border-gray-200 hover:border-teal-400 rounded-2xl p-4 cursor-pointer transition-all"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-teal-100 flex items-center justify-center flex-shrink-0">
                  {profilePicFile ? (
                    <img src={URL.createObjectURL(profilePicFile)} alt="Face Logo" className="w-full h-full object-cover" />
                  ) : profile.profilePictureUrl || user.photoURL ? (
                    <SafeImage src={profile.profilePictureUrl || user.photoURL || ''} alt="Face" className="w-full h-full object-cover" fallbackType="user" />
                  ) : (
                    <User className="w-6 h-6 text-teal-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-700 truncate">
                    {profilePicFile ? profilePicFile.name : profile.profilePictureName || 'Upload Face Picture Only'}
                  </p>
                  <p className="text-[10px] text-amber-600 font-bold">⚠️ Face picture only. Non-face images will be rejected by admin.</p>
                </div>
              </label>
            </div>

            {/* ID Document (Required) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">ID Document / Passport (Required)</label>
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
                className="flex items-center gap-4 w-full bg-gray-50 border-2 border-dashed border-gray-200 hover:border-teal-400 rounded-2xl p-4 cursor-pointer transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 text-teal-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-700 truncate">
                    {idFile ? idFile.name : profile.idDocumentName || 'Upload ID Document (Required)'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">Clear photo or scan required</p>
                </div>
              </label>
            </div>

            {/* CV Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Upload CV (Optional)</label>
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
                className="flex items-center gap-4 w-full bg-gray-50 border-2 border-dashed border-gray-200 hover:border-teal-400 rounded-2xl p-4 cursor-pointer transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 text-teal-600">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-700 truncate">
                    {cvFile ? cvFile.name : profile.cvName || 'Upload CV'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">PDF or Document</p>
                </div>
              </label>
            </div>

            {/* Multiple Certificates Upload */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Upload Certificates (Multiple Selection)</label>
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
                className="flex items-center gap-4 w-full bg-gray-50 border-2 border-dashed border-gray-200 hover:border-teal-400 rounded-2xl p-4 cursor-pointer transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 text-teal-600">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-700 truncate">
                    {certFiles.length > 0 ? `${certFiles.length} certificate(s) selected` : 'Select Multiple Certificates'}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">You can select multiple files at once</p>
                </div>
              </label>
              {(profile.certificates || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(profile.certificates || []).map((c, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-xl border border-gray-200">
                      📄 {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 pb-8 flex flex-col items-center">
          <button 
            type="submit"
            disabled={submitting}
            className="w-full max-w-md bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-black uppercase tracking-widest py-4 rounded-2xl shadow-xl shadow-teal-600/20 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                Submitting Profile...
              </>
            ) : (
              'Save & Submit Profile'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
