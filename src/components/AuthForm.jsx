import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

// Password strength checker
function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8)  score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const map = [
    { level: 0, label: '',         color: '' },
    { level: 1, label: 'Weak',     color: 'bg-red-500' },
    { level: 2, label: 'Fair',     color: 'bg-yellow-400' },
    { level: 3, label: 'Good',     color: 'bg-blue-400' },
    { level: 4, label: 'Strong',   color: 'bg-green-400' },
  ];
  return map[score];
}

export default function AuthForm({ onSubmit, isSignup, onSuccess }) {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [name, setName]                 = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const router = useRouter();

  const strength = isSignup ? getPasswordStrength(password) : null;

  useEffect(() => {
    const auth = getAuth();
    getRedirectResult(auth)
      .then(result => {
        if (result?.user && onSuccess) onSuccess();
      })
      .catch(e => {
        if (e?.message && !/no pending redirect/i.test(e.message)) {
          setError('Google sign-in failed: ' + e.message);
        }
      });
  }, []); // eslint-disable-line

  const handleGoogleSignIn = () => {
    setError('');
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      signInWithRedirect(auth, provider);
    } else {
      signInWithPopup(auth, provider)
        .then(() => onSuccess && onSuccess())
        .catch(e => setError('Google sign-in failed: ' + e.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSubmit(isSignup ? { name, email, password } : { email, password });
      if (onSuccess) onSuccess();
    } catch (e) {
      setError(mapFirebaseError(e.code || e.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full flex flex-col gap-4"
      autoComplete="off"
      noValidate
    >
      {/* Name (signup only) */}
      {isSignup && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Your name</label>
          <input
            type="text"
            required
            placeholder="Alex Johnson"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input-base"
          />
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="input-base"
          autoComplete="email"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            placeholder={isSignup ? 'Min 8 characters' : 'Your password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-base pr-12"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200 transition-colors"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword
              ? <EyeSlashIcon className="w-5 h-5" />
              : <EyeIcon className="w-5 h-5" />}
          </button>
        </div>

        {/* Password strength bar (signup only) */}
        {isSignup && password.length > 0 && (
          <div className="mt-2">
            <div className="flex gap-1 h-1">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`flex-1 rounded-full transition-all duration-300 ${
                    i <= strength.level ? strength.color : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            {strength.label && (
              <p className={`text-xs mt-1 ${
                strength.level <= 1 ? 'text-red-400' :
                strength.level === 2 ? 'text-yellow-400' :
                strength.level === 3 ? 'text-blue-400' : 'text-green-400'
              }`}>
                {strength.label} password
              </p>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={loading}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="btn-primary py-3.5 text-base mt-1 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading
          ? <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {isSignup ? 'Creating account...' : 'Signing in...'}
            </span>
          : (isSignup ? 'Create account' : 'Sign in')
        }
      </motion.button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-xs text-gray-500">or continue with</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Google Button */}
      <motion.button
        type="button"
        onClick={handleGoogleSignIn}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-center gap-3 w-full py-3 rounded-xl font-medium text-sm
                   bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-white/20
                   text-gray-200 transition-all duration-200"
      >
        {/* Google SVG icon */}
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Google
      </motion.button>
    </motion.form>
  );
}

function mapFirebaseError(code) {
  const map = {
    'auth/user-not-found':       'No account found with this email.',
    'auth/wrong-password':       'Incorrect password. Try again.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password':        'Password should be at least 6 characters.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/too-many-requests':    'Too many attempts. Please wait and try again.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] || code || 'Authentication failed. Please try again.';
}
