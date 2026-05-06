'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  HomeIcon,
  BookmarkIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';

export default function Navbar({ onSearch }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (onSearch) onSearch(val);
    }, 350);
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    router.push('/');
  };

  const isDark = mounted && theme === 'dark';

  return (
    <>
      {/* Main Navbar */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'py-2 bg-white/80 dark:bg-slate-900/80 shadow-glass backdrop-blur-xl border-b border-gray-200/40 dark:border-white/[0.06]'
            : 'py-4 bg-white/60 dark:bg-transparent backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-xl bg-wavvy-gradient flex items-center justify-center shadow-glow">
                <span className="text-white font-black text-sm font-grotesk">W</span>
              </div>
              <span className="font-grotesk font-bold text-xl gradient-text-static hidden sm:block">
                Wavvy
              </span>
            </Link>

            {/* Search Bar (desktop) */}
            <div ref={searchRef} className="hidden md:flex flex-1 max-w-md relative">
              <div className={`flex items-center w-full rounded-xl transition-all duration-200 ${
                searchOpen
                  ? 'ring-2 ring-wavvy-primary2/50 bg-white dark:bg-slate-800 shadow-glow'
                  : 'bg-gray-100/80 dark:bg-slate-800/60'
              } px-3 gap-2`}>
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Search posts, topics, people..."
                  className="flex-1 bg-transparent py-2.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); if (onSearch) onSearch(''); }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Search icon mobile */}
              <button
                className="md:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search"
              >
                <MagnifyingGlassIcon className="w-5 h-5" />
              </button>

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Toggle theme"
                >
                  {isDark
                    ? <SunIcon className="w-5 h-5 text-yellow-400" />
                    : <MoonIcon className="w-5 h-5" />}
                </button>
              )}

              {user && (
                <button className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors relative" aria-label="Notifications">
                  <BellIcon className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-wavvy-accent rounded-full" />
                </button>
              )}

              {/* Write CTA */}
              <Link href="/create" className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm text-white shadow-glow btn-primary">
                <PencilSquareIcon className="w-4 h-4" />
                Write
              </Link>

              {/* Auth Area */}
              {!user ? (
                <div className="hidden sm:flex items-center gap-2">
                  <Link href="/auth/login">
                    <button className="btn-ghost text-sm py-2 px-4">Login</button>
                  </Link>
                  <Link href="/auth/signup">
                    <button className="btn-primary text-sm py-2 px-4">Sign Up</button>
                  </Link>
                </div>
              ) : (
                /* Profile Dropdown */
                <div ref={profileRef} className="relative hidden sm:block">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {user.photoURL
                      ? <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-wavvy-primary2/30" />
                      : <div className="w-8 h-8 rounded-full bg-wavvy-gradient flex items-center justify-center text-white text-sm font-bold">
                          {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                    }
                    <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 glass-card dark:glass-card py-2 overflow-hidden"
                        style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}
                      >
                        <div className="px-4 py-3 border-b border-white/10">
                          <p className="text-sm font-semibold text-white truncate">{user.displayName || 'Wavvy User'}</p>
                          <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        </div>
                        <Link href="/profile" onClick={() => setProfileOpen(false)}>
                          <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer">
                            <UserCircleIcon className="w-4 h-4" />
                            My Profile
                          </div>
                        </Link>
                        <Link href="/create" onClick={() => setProfileOpen(false)}>
                          <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer">
                            <PencilSquareIcon className="w-4 h-4" />
                            Write a post
                          </div>
                        </Link>
                        <Link href="/bookmarks" onClick={() => setProfileOpen(false)}>
                          <div className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer">
                            <BookmarkIcon className="w-4 h-4" />
                            Bookmarks
                          </div>
                        </Link>
                        <div className="border-t border-white/10 mt-1">
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors">
                            <ArrowRightOnRectangleIcon className="w-4 h-4" />
                            Sign out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Hamburger (mobile) */}
              <button
                className="sm:hidden p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                {mobileMenuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="md:hidden overflow-hidden pt-3 pb-1"
              >
                <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-xl px-3 gap-2">
                  <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Search posts, topics, people..."
                    className="flex-1 bg-transparent py-2.5 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 outline-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Mobile Slide-in Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 w-72 z-50 bg-slate-900 border-l border-white/10 flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <span className="font-grotesk font-bold text-xl gradient-text-static">Wavvy</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-lg hover:bg-white/10">
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4 flex-1">
              {user && (
                <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-xl bg-white/5">
                  {user.photoURL
                    ? <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                    : <div className="w-10 h-10 rounded-full bg-wavvy-gradient flex items-center justify-center text-white font-bold">
                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                      </div>
                  }
                  <div>
                    <p className="text-sm font-semibold text-white">{user.displayName || 'Wavvy User'}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              )}
              {[
                { href: '/', label: 'Home', icon: HomeIcon },
                { href: '/create', label: 'Write', icon: PencilSquareIcon },
                ...(user ? [
                  { href: '/profile', label: 'Profile', icon: UserCircleIcon },
                  { href: '/bookmarks', label: 'Bookmarks', icon: BookmarkIcon },
                ] : []),
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMobileMenuOpen(false)}>
                  <div className="flex items-center gap-3 px-3 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{label}</span>
                  </div>
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-white/10">
              {!user ? (
                <div className="flex flex-col gap-2">
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full btn-ghost text-center">Login</button>
                  </Link>
                  <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full btn-primary text-center">Sign Up</button>
                  </Link>
                </div>
              ) : (
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Sign out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 sm:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Mobile Nav */}
      <div className="mobile-nav items-center justify-around">
        {[
          { href: '/', label: 'Home', icon: HomeIcon },
          { href: '/create', label: 'Write', icon: PencilSquareIcon },
          ...(user ? [{ href: '/profile', label: 'Profile', icon: UserCircleIcon }] : [{ href: '/auth/login', label: 'Login', icon: UserCircleIcon }]),
          { href: '/bookmarks', label: 'Saved', icon: BookmarkIcon },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className="flex flex-col items-center gap-1">
            <Icon className={`w-6 h-6 ${router.pathname === href ? 'text-wavvy-primary2' : 'text-gray-500'}`} />
            <span className={`text-[10px] font-medium ${router.pathname === href ? 'text-wavvy-primary2' : 'text-gray-500'}`}>{label}</span>
          </Link>
        ))}
      </div>

      {/* Spacer for fixed navbar */}
      <div className="h-16 md:h-[72px]" />
    </>
  );
}
