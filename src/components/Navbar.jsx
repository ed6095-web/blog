import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { useState } from "react";
import { FiMoreVertical } from "react-icons/fi";
import SearchBar from "./SearchBar";
import { useRouter } from "next/router";
import Avatar from "./Avatar";

export default function Navbar({ onSearch }) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const isProfilePage = router.pathname === "/profile";

  return (
    <nav className="w-full z-50 py-3 px-2 sm:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white/60 dark:bg-gray-900/60 shadow-2xl backdrop-blur-lg border-b border-gray-300/40 dark:border-gray-800/40 relative">
      {/* Top row: Logo and create */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-[2rem] font-black bg-gradient-to-tr from-fuchsia-600 to-blue-600 bg-clip-text text-transparent drop-shadow tracking-tight select-none">
            Wavvy
          </Link>
          <Link href="/create">
            <button className="ml-2 px-5 py-2 rounded-xl font-semibold text-base bg-gradient-to-tr from-fuchsia-400 to-blue-400 text-white shadow transition-all hover:scale-105 hover:shadow-lg">
              + Create Post
            </button>
          </Link>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          <ThemeToggle />
          {/* Small screens: 3-dot menu */}
          <div className="relative sm:hidden">
            <button
              className="p-2 rounded-full bg-white/70 dark:bg-gray-700 shadow border border-gray-200 dark:border-gray-800"
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Open menu"
            >
              <FiMoreVertical size={24} />
            </button>
            {menuOpen && (
              <div className="absolute top-11 right-0 min-w-[138px] bg-white dark:bg-gray-900 rounded-xl shadow-lg py-2 flex flex-col gap-0 text-base border border-gray-200 dark:border-gray-800 z-50 animate-fade-in">
                {!user && (
                  <>
                    <Link href="/auth/login" className="px-5 py-2 hover:bg-blue-50 dark:hover:bg-gray-800" onClick={() => setMenuOpen(false)}>
                      Login
                    </Link>
                    <Link href="/auth/signup" className="px-5 py-2 hover:bg-blue-50 dark:hover:bg-gray-800" onClick={() => setMenuOpen(false)}>
                      Signup
                    </Link>
                  </>
                )}
                {user && (
                  <Link href="/profile" onClick={() => setMenuOpen(false)}>
                    <div className="flex items-center gap-3 px-5 py-2 hover:bg-blue-50 dark:hover:bg-gray-800">
                      <Avatar url={user.photoURL} name={user.displayName || user.email} size={36} />
                      <span className="font-medium">{user.displayName || "Profile"}</span>
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>
          {/* Larger screens: login/profile right section */}
          <div className="hidden sm:flex items-center gap-2">
            {!user ? (
              <>
                <Link href="/auth/login">
                  <button className="px-4 py-1.5 font-medium rounded-lg text-blue-600 dark:text-fuchsia-400 border-2 border-blue-300/50 dark:border-fuchsia-900/50 bg-white/60 dark:bg-gray-900/60 shadow transition-all hover:bg-blue-100/60 dark:hover:bg-fuchsia-900/20">
                    Login
                  </button>
                </Link>
                <Link href="/auth/signup">
                  <button className="px-4 py-1.5 font-semibold rounded-lg bg-blue-600 text-white shadow transition-all hover:scale-105 hover:bg-fuchsia-700">
                    Signup
                  </button>
                </Link>
              </>
            ) : (
              <Link href="/profile">
                <Avatar url={user.photoURL} name={user.displayName || user.email} size={44} />
              </Link>
            )}
          </div>
        </div>
      </div>
      {/* Responsive SearchBar: always visible and fits on phone */}
      <div className="sm:ml-5 sm:mt-0 mt-3 w-full sm:w-auto">
        <SearchBar onSearch={onSearch} />
      </div>
    </nav>
  );
}
