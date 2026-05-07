import { ThemeProvider } from 'next-themes';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from '../context/AuthContext';
import '../styles/globals.css';

export default function App({ Component, pageProps, router }) {
  const fullScreenPages = ['/auth/login', '/auth/signup'];
  const isFullScreen = fullScreenPages.includes(router.pathname);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
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
