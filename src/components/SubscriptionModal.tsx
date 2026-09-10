import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CreditCard, Banknote, ShieldCheck, Upload, CheckCircle, Loader2, Zap, ArrowRight, Wallet, ArrowLeft } from 'lucide-react';
import { db, doc, setDoc, collection, addDoc, serverTimestamp } from '../lib/firebase';
import { UserProfile } from '../types';
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
  profile: UserProfile;
  onSuccess: () => void;
  onClose: () => void;
}

export function SubscriptionModal({ user, profile, onSuccess, onClose }: Props) {
  const [step, setStep] = useState<'intro' | 'payment' | 'proof'>('intro');
  const [submitting, setSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const startTrial = async () => {
    setSubmitting(true);
    try {
      const trialStartDate = new Date();
      const expiresAt = new Date(trialStartDate.getTime() + (15 * 24 * 60 * 60 * 1000));
      
      await setDoc(doc(db, 'profiles', user.uid), {
        subscription: {
          status: 'trial',
          trialStartDate: trialStartDate,
          expiresAt: expiresAt
        }
      }, { merge: true });
      onSuccess();
    } catch (error) {
      console.error("Trial start failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProofSubmit = async () => {
    if (!proofFile) return;
    if (proofFile.size > 150 * 1024) {
      alert("Proof of payment file is too large. Please choose a file under 150KB.");
      return;
    }
    setSubmitting(true);
    try {
      const b64 = await fileToBase64(proofFile);
      const receiptUrl = await compressImage(b64, 600, 0.5);

      // 1. Create a payment record
      await addDoc(collection(db, 'subscription_payments'), {
        userId: user.uid,
        amount: 49.99,
        reference: '49Sub',
        timestamp: serverTimestamp(),
        status: 'pending',
        proofOfPaymentName: proofFile.name,
        receiptUrl
      });

      // 2. Update profile subscription status
      await setDoc(doc(db, 'profiles', user.uid), {
        subscription: {
          status: 'pending_verification',
          proofOfPaymentName: proofFile.name,
          proofOfPaymentUrl: receiptUrl
        }
      }, { merge: true });

      setStep('proof'); // This will trigger the success state in UI
      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (error) {
      console.error("Proof submission failed", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-[1.5rem] w-full max-w-[340px] overflow-hidden shadow-2xl"
      >
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="p-5 space-y-4 relative"
            >
              <button 
                onClick={onClose}
                className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex justify-center">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center text-teal-600">
                  <Zap className="w-6 h-6 fill-teal-600" />
                </div>
              </div>

              <div className="text-center space-y-0.5">
                <h2 className="text-lg font-black text-gray-900">15-Day Free Trial</h2>
                <p className="text-[11px] text-gray-500 font-medium">Full access to premium GiGs today.</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 bg-white rounded flex items-center justify-center shadow-sm">
                    <CheckCircle className="w-3 h-3 text-teal-600" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700">Unlimited GiG Applications</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 bg-white rounded flex items-center justify-center shadow-sm">
                    <CheckCircle className="w-3 h-3 text-teal-600" />
                  </div>
                  <span className="text-[11px] font-bold text-gray-700">Priority Seeker Hiring</span>
                </div>
              </div>

              <div className="space-y-2.5 pt-1">
                <button 
                  onClick={startTrial}
                  disabled={submitting}
                  className="w-full bg-teal-600 text-white py-3 rounded-xl font-black shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Free Trial"}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setStep('payment')}
                  className="w-full text-gray-400 font-bold hover:text-gray-600 text-[9px] uppercase tracking-widest"
                >
                  Pay R49.99 Monthly
                </button>
              </div>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div 
              key="payment"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="p-5 space-y-4 relative"
            >
              <button 
                onClick={() => setStep('intro')}
                className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex justify-center">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>

              <div className="text-center space-y-0.5">
                <h2 className="text-lg font-black text-gray-900">Bank Transfer</h2>
                <p className="text-[11px] text-gray-500 font-medium leading-tight">Make a manual payment to activate.</p>
              </div>

              <div className="bg-gray-900 rounded-2xl p-4 text-white space-y-3 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-teal-500/10 blur-3xl -mr-10 -mt-10" />
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Account Holder</p>
                    <p className="font-bold text-sm">Matthews</p>
                  </div>
                  <div className="bg-teal-500 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">Capitec</div>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Account Number</p>
                    <p className="text-lg font-mono tracking-wider font-black">1334067366</p>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Reference</p>
                      <p className="font-black text-xs text-teal-400">49Sub</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Amount</p>
                      <p className="font-black text-xs">R49,99</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Proof of Payment</label>
                   <input 
                     type="file" 
                     className="hidden" 
                     id="pop-upload"
                     onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                   />
                   <label 
                     htmlFor="pop-upload"
                     className="flex items-center gap-2.5 w-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-gray-100 transition-all"
                   >
                     <div className="w-7 h-7 bg-white rounded flex items-center justify-center shadow-sm">
                       <Upload className="w-3.5 h-3.5 text-gray-400" />
                     </div>
                     <span className="text-[10px] font-bold text-gray-600 truncate">
                        {proofFile ? proofFile.name : "Select POP from device"}
                     </span>
                   </label>
                </div>

                <button 
                  onClick={handleProofSubmit}
                  disabled={!proofFile || submitting}
                  className="w-full bg-teal-600 text-white py-3 rounded-xl font-black shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Payment"}
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'proof' && (
            <motion.div 
              key="proof"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-10 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-black text-gray-900">Congratulations!</h2>
              <p className="text-sm text-gray-500 font-medium">
                Your payment proof is uploaded. Review takes 15-25 minutes. 
                Redirecting...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
