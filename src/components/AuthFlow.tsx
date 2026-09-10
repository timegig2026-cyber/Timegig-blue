import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, CheckCircle, Shield, FileText, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface Props {
  onSuccess: () => void;
}

type AuthStep = 'login' | 'register' | 'terms' | 'agreement' | 'congratulations';

export function AuthFlow({ onSuccess }: Props) {
  const { loginWithEmail, registerWithEmail, login } = useAuth();
  const [step, setStep] = useState<AuthStep>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterInit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('All fields are required');
      return;
    }
    setStep('terms');
  };

  const handleFinalRegister = async () => {
    setLoading(true);
    setError(null);
    try {
      const newUser = await registerWithEmail(email, password, name);
      
      // Auto-set admin for the specific email
      if (email.toLowerCase() === 'timegig2026@gmail.com') {
        const { db, doc, setDoc, serverTimestamp } = await import('../lib/firebase');
        await setDoc(doc(db, 'profiles', newUser.uid), {
          firstName: name.split(' ')[0],
          surname: name.split(' ').slice(1).join(' '),
          isAdmin: true,
          status: 'reviewed',
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      setStep('congratulations');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      setStep('register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {step === 'login' && (
            <motion.div 
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Welcome Back</h1>
                <p className="text-sm text-gray-500 font-medium">Sign in to your GigSouthAfrica account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-6 py-4 text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      required
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-6 py-4 text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button 
                  disabled={loading}
                  className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                </button>
              </form>

              <div className="relative flex items-center gap-4 text-gray-300">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[10px] font-black uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <button 
                onClick={login}
                className="w-full bg-white border border-gray-100 py-4 rounded-2xl font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                Continue with Google
              </button>

              <p className="text-center text-xs text-gray-400 font-bold">
                Don't have an account?{' '}
                <button onClick={() => setStep('register')} className="text-teal-600 hover:underline">Register Now</button>
              </p>
            </motion.div>
          )}

          {step === 'register' && (
            <motion.div 
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Create Account</h1>
                <p className="text-sm text-gray-500 font-medium">Join GigSouthAfrica to start your journey</p>
              </div>

              <form onSubmit={handleRegisterInit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      required
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-6 py-4 text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-6 py-4 text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      required
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-6 py-4 text-sm focus:ring-2 focus:ring-teal-500 transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button 
                  className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Continue to Terms
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 font-bold">
                Already have an account?{' '}
                <button onClick={() => setStep('login')} className="text-teal-600 hover:underline">Sign In</button>
              </p>
            </motion.div>
          )}

          {step === 'terms' && (
            <motion.div 
              key="terms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-teal-600">
                  <Shield className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Terms of Service</h1>
                <p className="text-sm text-gray-500 font-medium text-left">Please review our community guidelines and terms before continuing.</p>
              </div>

              <div className="max-h-48 overflow-y-auto bg-gray-50 p-4 rounded-2xl text-[11px] text-gray-600 leading-relaxed font-medium">
                <p className="mb-3 font-bold">1. Acceptance of Terms</p>
                <p className="mb-4">By using GigSouthAfrica, you agree to comply with all local regulations and community standards. We prioritize safety and professionalism in every interaction.</p>
                
                <p className="mb-3 font-bold">2. User Conduct</p>
                <p className="mb-4">All users must provide accurate information. Misleading profiles or fraudulent behavior will result in immediate termination of account access.</p>

                <p className="mb-3 font-bold">3. Privacy Policy</p>
                <p>Your data is secured using industry-standard encryption. We never share your personal documents with third parties without explicit consent.</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-xs font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                  I have read and accept the terms and conditions
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setStep('register')}
                  className="flex-1 bg-gray-50 text-gray-500 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all"
                >
                  Back
                </button>
                <button 
                  disabled={!acceptedTerms}
                  onClick={() => setStep('agreement')}
                  className="flex-[2] bg-teal-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          )}

          {step === 'agreement' && (
            <motion.div 
              key="agreement"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8 space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-teal-600">
                  <FileText className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Gig Agreement</h1>
                <p className="text-sm text-gray-500 font-medium">Please sign below to finalize your registration.</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-[2rem] border border-dashed border-gray-200">
                <div className="space-y-4">
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Digital Signature</p>
                   <div className="h-24 bg-white rounded-2xl border border-gray-100 flex items-center justify-center italic text-gray-300 font-serif text-xl">
                     {name || "Your Signature"}
                   </div>
                   <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                     By clicking "Sign & Submit", you electronically sign this agreement and confirm your identity as {name || "the registrant"}.
                   </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setStep('terms')}
                  className="flex-1 bg-gray-50 text-gray-500 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-100 transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleFinalRegister}
                  disabled={loading}
                  className="flex-[2] bg-teal-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign & Submit"}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'congratulations' && (
            <motion.div 
              key="congratulations"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-10 text-center space-y-6"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 text-green-600">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Congratulations!</h1>
                <p className="text-sm text-gray-500 font-medium">Your account has been successfully created. Welcome to the GigSouthAfrica community!</p>
              </div>

              <button 
                onClick={onSuccess}
                className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                Complete Your Profile
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
