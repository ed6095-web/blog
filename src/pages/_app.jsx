import { ThemeProvider } from 'next-themes';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from '../context/AuthContext';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { getAuth, getRedirectResult } from 'firebase/auth';
import '../styles/globals.css';

// Handle the redirect result from Google Sign-In globally
function RedirectResultHandler() {
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // User signed in via Google redirect — send them home
          router.replace('/');
        }
      })
      .catch((err) => {
        // Silently ignore errors that aren't redirect-related
        if (err.code !== 'auth/no-current-user') {
          console.error('Redirect result error:', err.message);
        }
      });
  // Only run on first mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function App({ Component, pageProps, router }) {
  const fullScreenPages = ['/auth/login', '/auth/signup'];
  const isFullScreen = fullScreenPages.includes(router.pathname);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <RedirectResultHandler />
        <AnimatePresence mode="wait">
          <motion.div
            key={router.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Component {...pageProps} />
          </motion.div>
        </AnimatePresence>
      </AuthProvider>
    </ThemeProvider>
  );
}
