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
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl w-full max-w-[300px] overflow-hidden shadow-xl"
      >
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ x: 15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -15, opacity: 0 }}
              className="p-3.5 space-y-2.5 relative"
            >
              <button 
                onClick={onClose}
                title="Close"
                aria-label="Close"
                className="absolute top-2.5 left-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex justify-center pt-1">
                <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center text-green-800">
                  <Zap className="w-4 h-4 fill-green-800" />
                </div>
              </div>

              <div className="text-center space-y-0.5">
                <h2 className="text-sm font-bold text-gray-900">15-Day Free Trial</h2>
                <p className="text-[10px] text-gray-500 font-medium">Full access to premium GiGs today.</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white rounded flex items-center justify-center shadow-xs">
                    <CheckCircle className="w-2.5 h-2.5 text-green-800" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-700">Unlimited GiG Applications</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white rounded flex items-center justify-center shadow-xs">
                    <CheckCircle className="w-2.5 h-2.5 text-green-800" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-700">Priority Seeker Hiring</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-0.5">
                <button 
                  onClick={startTrial}
                  disabled={submitting}
                  className="w-full bg-green-800 text-white py-2 rounded-lg font-bold text-xs shadow-xs hover:bg-green-900 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Start Free Trial"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => setStep('payment')}
                  className="w-full text-gray-400 font-bold hover:text-gray-600 text-[8px] uppercase tracking-wider py-0.5"
                >
                  Pay R49.99 Monthly
                </button>
              </div>
            </motion.div>
          )}

          {step === 'payment' && (
            <motion.div 
              key="payment"
              initial={{ x: 15, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -15, opacity: 0 }}
              className="p-3.5 space-y-2.5 relative"
            >
              <button 
                onClick={() => setStep('intro')}
                title="Back"
                aria-label="Back"
                className="absolute top-2.5 left-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-md transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex justify-center pt-1">
                <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>

              <div className="text-center space-y-0.5">
                <h2 className="text-sm font-bold text-gray-900">Bank Transfer</h2>
                <p className="text-[10px] text-gray-500 font-medium leading-tight">Make a manual payment to activate.</p>
              </div>

              <div className="bg-gray-900 rounded-xl p-2.5 text-white space-y-2 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-green-700/10 blur-2xl -mr-8 -mt-8" />
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Account Holder</p>
                    <p className="font-bold text-xs">Matthews</p>
                  </div>
                  <div className="bg-green-700 px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider">Capitec</div>
                </div>

                <div className="space-y-1">
                  <div>
                    <p className="text-[7px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Account Number</p>
                    <p className="text-sm font-mono tracking-wider font-bold">1334067366</p>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-[7px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Reference</p>
                      <p className="font-bold text-[11px] text-green-600">49Sub</p>
                    </div>
                    <div>
                      <p className="text-[7px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Amount</p>
                      <p className="font-bold text-[11px]">R49,99</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                   <label className="text-[8px] font-bold text-gray-400 uppercase tracking-wider ml-0.5">Proof of Payment</label>
                   <input 
                     type="file" 
                     className="hidden" 
                     id="pop-upload"
                     onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                   />
                   <label 
                     htmlFor="pop-upload"
                     className="flex items-center gap-2 w-full bg-gray-50 border border-dashed border-gray-200 rounded-lg px-2.5 py-1.5 cursor-pointer hover:bg-gray-100 transition-all"
                   >
                     <div className="w-5 h-5 bg-white rounded flex items-center justify-center shadow-xs">
                       <Upload className="w-3 h-3 text-gray-400" />
                     </div>
                     <span className="text-[10px] font-bold text-gray-600 truncate">
                        {proofFile ? proofFile.name : "Select POP from device"}
                     </span>
                   </label>
                </div>

                <button 
                  onClick={handleProofSubmit}
                  disabled={!proofFile || submitting}
                  className="w-full bg-green-800 text-white py-2 rounded-lg font-bold text-xs shadow-xs hover:bg-green-900 active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Submit Payment"}
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'proof' && (
            <motion.div 
              key="proof"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 text-center space-y-2"
            >
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-sm font-bold text-gray-900">Congratulations!</h2>
              <p className="text-[11px] text-gray-500 font-medium">
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
