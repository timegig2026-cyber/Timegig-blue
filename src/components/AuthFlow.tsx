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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 py-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {step === 'login' && (
            <motion.div 
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5 space-y-4"
            >
              <div className="text-center space-y-1">
                <h1 className="text-lg font-black text-gray-900 tracking-tight">Welcome Back</h1>
                <p className="text-xs text-gray-500 font-medium">Sign in to your GigSouthAfrica account</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-green-700 transition-all outline-none"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      required
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-green-700 transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-red-500 text-[11px] font-bold bg-red-50 p-2.5 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button 
                  disabled={loading}
                  className="w-full bg-green-800 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs hover:bg-green-900 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sign In"}
                </button>
              </form>

              <div className="relative flex items-center gap-3 text-gray-300">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-[9px] font-black uppercase tracking-widest">or</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              <button 
                onClick={login}
                className="w-full bg-white border border-gray-100 py-2.5 rounded-xl font-bold text-xs text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <img src="https://www.google.com/favicon.ico" className="w-3.5 h-3.5" alt="Google" />
                Continue with Google
              </button>

              <p className="text-center text-[11px] text-gray-400 font-bold">
                Don't have an account?{' '}
                <button onClick={() => setStep('register')} className="text-green-800 hover:underline">Register Now</button>
              </p>
            </motion.div>
          )}

          {step === 'register' && (
            <motion.div 
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5 space-y-4"
            >
              <div className="text-center space-y-1">
                <h1 className="text-lg font-black text-gray-900 tracking-tight">Create Account</h1>
                <p className="text-xs text-gray-500 font-medium">Join GigSouthAfrica to start your journey</p>
              </div>

              <form onSubmit={handleRegisterInit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      required
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-green-700 transition-all outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      required
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-green-700 transition-all outline-none"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      required
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-green-700 transition-all outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-1.5 text-red-500 text-[11px] font-bold bg-red-50 p-2.5 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button 
                  className="w-full bg-green-800 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs hover:bg-green-900 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Continue to Terms</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>

              <p className="text-center text-[11px] text-gray-400 font-bold">
                Already have an account?{' '}
                <button onClick={() => setStep('login')} className="text-green-800 hover:underline">Sign In</button>
              </p>
            </motion.div>
          )}

          {step === 'terms' && (
            <motion.div 
              key="terms"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-5 space-y-3.5"
            >
              <div className="text-center space-y-1">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2 text-green-800">
                  <Shield className="w-4 h-4" />
                </div>
                <h1 className="text-lg font-black text-gray-900 tracking-tight">Terms of Service</h1>
                <p className="text-[11px] text-gray-500 font-medium text-left">Please review our community guidelines and terms before continuing.</p>
              </div>

              <div className="max-h-36 overflow-y-auto bg-gray-50 p-3 rounded-xl text-[10px] text-gray-600 leading-relaxed font-medium">
                <p className="mb-2 font-bold">1. Acceptance of Terms</p>
                <p className="mb-3">By using GigSouthAfrica, you agree to comply with all local regulations and community standards. We prioritize safety and professionalism in every interaction.</p>
                
                <p className="mb-2 font-bold">2. User Conduct</p>
                <p className="mb-3">All users must provide accurate information. Misleading profiles or fraudulent behavior will result in immediate termination of account access.</p>

                <p className="mb-2 font-bold">3. Privacy Policy</p>
                <p>Your data is secured using industry-standard encryption. We never share your personal documents with third parties without explicit consent.</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={e => setAcceptedTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-green-800 focus:ring-green-700"
                />
                <span className="text-[11px] font-bold text-gray-600 group-hover:text-gray-900 transition-colors">
                  I accept the terms and conditions
                </span>
              </label>

              <div className="flex gap-2 pt-1">
                <button 
                  onClick={() => setStep('register')}
                  className="flex-1 bg-gray-50 text-gray-500 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition-all"
                >
                  Back
                </button>
                <button 
                  disabled={!acceptedTerms}
                  onClick={() => setStep('agreement')}
                  className="flex-[2] bg-green-800 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs hover:bg-green-900 active:scale-[0.98] transition-all disabled:opacity-50"
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
              className="p-5 space-y-3.5"
            >
              <div className="text-center space-y-1">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-2 text-green-800">
                  <FileText className="w-4 h-4" />
                </div>
                <h1 className="text-lg font-black text-gray-900 tracking-tight">Gig Agreement</h1>
                <p className="text-[11px] text-gray-500 font-medium">Please sign below to finalize your registration.</p>
              </div>

              <div className="bg-gray-50 p-3.5 rounded-xl border border-dashed border-gray-200">
                <div className="space-y-2">
                   <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Digital Signature</p>
                   <div className="h-16 bg-white rounded-xl border border-gray-100 flex items-center justify-center italic text-gray-400 font-serif text-base">
                     {name || "Your Signature"}
                   </div>
                   <p className="text-[9px] text-gray-500 font-medium leading-relaxed">
                     By clicking "Sign & Submit", you electronically sign this agreement and confirm your identity as {name || "the registrant"}.
                   </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button 
                  onClick={() => setStep('terms')}
                  className="flex-1 bg-gray-50 text-gray-500 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-gray-100 transition-all"
                >
                  Back
                </button>
                <button 
                  onClick={handleFinalRegister}
                  disabled={loading}
                  className="flex-[2] bg-green-800 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs hover:bg-green-900 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Sign & Submit"}
                </button>
              </div>
            </motion.div>
          )}

          {step === 'congratulations' && (
            <motion.div 
              key="congratulations"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-6 text-center space-y-4"
            >
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1 text-green-600">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h1 className="text-lg font-black text-gray-900 tracking-tight">Congratulations!</h1>
                <p className="text-xs text-gray-500 font-medium">Your account has been created. Welcome to the GigSouthAfrica community!</p>
              </div>

              <button 
                onClick={onSuccess}
                className="w-full bg-green-800 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs hover:bg-green-900 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <span>Complete Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
