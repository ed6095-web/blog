// src/components/AuthForm.jsx
import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaGoogle } from "react-icons/fa";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from "firebase/auth";

export default function AuthForm({ onSubmit, isSignup, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  // Handle Google redirect login (for Android/iOS/PWA)
  useEffect(() => {
    const auth = getAuth();
    getRedirectResult(auth)
      .then(result => {
        if (result?.user && onSuccess) onSuccess();
      })
      .catch(e => {
        if (e?.message && !/no pending redirect/i.test(e.message)) {
          setError("Google login failed: " + e.message);
        }
      });
    // eslint-disable-next-line
  }, []);

  const handleGoogleSignIn = () => {
    setError("");
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      // Mobile: use redirect method!
      signInWithRedirect(auth, provider);
    } else {
      // Desktop: use popup method.
      signInWithPopup(auth, provider)
        .then(() => onSuccess && onSuccess())
        .catch(e => setError("Google login failed: " + e.message));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    try {
      await onSubmit(isSignup ? { name, email, password } : { email, password });
      if (onSuccess) onSuccess();
    } catch (e) {
      setError(e.message || "Authentication failed");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md bg-white/90 dark:bg-gray-800/90 rounded-2xl p-7 mx-auto shadow-xl flex flex-col gap-5" autoComplete="off">
      {isSignup && (
        <input
          type="text"
          required
          placeholder="Your Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-3 pl-4 rounded-lg border bg-white/80 dark:bg-gray-900/80 focus:outline-none"
        />
      )}
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        className="w-full p-3 pl-4 rounded-lg border bg-white/80 dark:bg-gray-900/80 focus:outline-none"
        autoComplete="email"
      />
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          required
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-3 pl-4 rounded-lg border bg-white/80 dark:bg-gray-900/80 focus:outline-none"
          autoComplete={isSignup ? "new-password" : "current-password"}
        />
        <button
          type="button"
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-xl text-gray-500 hover:text-blue-600"
          onClick={() => setShowPassword(v => !v)}
          tabIndex={-1}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      <button
        type="submit"
        className="w-full py-3 rounded-lg text-lg font-bold bg-gradient-to-tr from-blue-500 to-fuchsia-500 text-white shadow hover:scale-[1.03] transition-all"
      >
        {isSignup ? "Sign Up" : "Login"}
      </button>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="flex items-center gap-2 justify-center w-full py-3 rounded-lg text-md font-semibold bg-red-500 hover:bg-red-600 text-white mt-1 shadow hover:scale-[1.03] transition-all"
      >
        <FaGoogle /> {isSignup ? "Sign up with Google" : "Login with Google"}
      </button>
      {error && (
        <div className="mt-3 mb-0 p-3 rounded-lg bg-red-100 text-red-800 dark:bg-red-900/80 dark:text-red-200 font-medium text-center shadow">
          {error}
        </div>
      )}
    </form>
  );
}
