import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import SkeletonCard from '../components/SkeletonCard';
import Footer from '../components/Footer';
import {
  PencilSquareIcon,
  LinkIcon,
  CalendarDaysIcon,
  UserPlusIcon,
  UserMinusIcon,
  BookOpenIcon,
  HeartIcon,
  BookmarkIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { format } from 'date-fns';

const TABS = [
  { id: 'posts',     label: 'Posts',    icon: BookOpenIcon },
  { id: 'liked',     label: 'Liked',    icon: HeartIcon },
  { id: 'saved',     label: 'Saved',    icon: BookmarkIcon },
  { id: 'about',     label: 'About',    icon: UserCircleIcon },
];

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user && !loading) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'posts'),
          where('authorId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile({ displayName });
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-wavvy-bgDark flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Please sign in to view your profile.</p>
          <Link href="/auth/login">
            <button className="btn-primary px-6 py-3">Sign In</button>
          </Link>
        </div>
      </div>
    );
  }

  const joinedDate = user.metadata?.creationTime
    ? format(new Date(user.metadata.creationTime), 'MMMM yyyy')
    : null;

  return (
    <>
      <Head>
        <title>{user.displayName || 'Profile'} · Wavvy</title>
        <meta name="description" content={`${user.displayName || 'User'}'s profile on Wavvy`} />
      </Head>

      <div className="min-h-screen bg-wavvy-bgLight dark:bg-wavvy-bgDark">
        <Navbar />

        {/* Profile Banner */}
        <div className="relative h-48 sm:h-64 bg-gradient-to-r from-violet-900 via-purple-900 to-pink-900 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Decorative blobs */}
          <div className="absolute top-4 right-8 w-40 h-40 rounded-full bg-wavvy-accent/30 blur-3xl" />
          <div className="absolute bottom-0 left-12 w-56 h-32 rounded-full bg-wavvy-primary/30 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Avatar + Info Row */}
          <div className="relative -mt-16 mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="relative"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="w-28 h-28 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-xl"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-wavvy-gradient border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center text-4xl font-black text-white font-grotesk">
                    {(user.displayName || user.email || 'W')[0].toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-3 border-white dark:border-slate-900 flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
              </motion.div>

              <div className="pb-2">
                {editing ? (
                  <input
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="input-base text-xl font-bold w-48"
                    placeholder="Your name"
                    autoFocus
                  />
                ) : (
                  <h1 className="font-grotesk text-2xl font-bold text-gray-900 dark:text-white">
                    {user.displayName || 'Wavvy User'}
                  </h1>
                )}
                <p className="text-gray-400 text-sm truncate">{user.email}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pb-2">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)} className="btn-ghost text-sm py-2 px-4">Cancel</button>
                  <button onClick={handleSaveProfile} disabled={saving} className="btn-primary text-sm py-2 px-4">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setEditing(true)} className="btn-ghost text-sm py-2 px-4 flex items-center gap-1.5">
                    <PencilSquareIcon className="w-4 h-4" />
                    Edit Profile
                  </button>
                  <Link href="/create">
                    <button className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5">
                      <PencilSquareIcon className="w-4 h-4" />
                      Write
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6 mb-6 text-sm">
            <div className="text-center">
              <p className="font-grotesk font-bold text-lg text-gray-900 dark:text-white">{posts.length}</p>
              <p className="text-gray-400 text-xs">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-grotesk font-bold text-lg text-gray-900 dark:text-white">0</p>
              <p className="text-gray-400 text-xs">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-grotesk font-bold text-lg text-gray-900 dark:text-white">0</p>
              <p className="text-gray-400 text-xs">Following</p>
            </div>
            {joinedDate && (
              <div className="flex items-center gap-1.5 text-gray-400 text-xs ml-auto">
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                Joined {joinedDate}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-gray-200 dark:border-white/[0.06] mb-8">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-200 ${
                  activeTab === id
                    ? 'border-wavvy-primary2 text-wavvy-primary2'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'posts' && (
                loading
                  ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
                    </div>
                  : posts.length === 0
                  ? <div className="text-center py-20">
                      <p className="text-gray-400 mb-4">You haven't published any posts yet.</p>
                      <Link href="/create">
                        <button className="btn-primary px-6 py-3">Write your first post</button>
                      </Link>
                    </div>
                  : <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {posts.map(post => <PostCard key={post.id} post={post} />)}
                    </div>
              )}

              {activeTab === 'liked' && (
                <div className="text-center py-20 text-gray-400">
                  <HeartIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Posts you've liked will appear here.</p>
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="text-center py-20 text-gray-400">
                  <BookmarkIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Your bookmarked posts will appear here.</p>
                </div>
              )}

              {activeTab === 'about' && (
                <div className="max-w-lg space-y-4">
                  <div className="glass-card p-6">
                    <h3 className="font-grotesk font-semibold text-white mb-3">About</h3>
                    {editing ? (
                      <textarea
                        value={bio}
                        onChange={e => setBio(e.target.value)}
                        placeholder="Tell your story..."
                        rows={4}
                        className="input-base resize-none w-full"
                      />
                    ) : (
                      <p className="text-gray-400 text-sm leading-relaxed">
                        {bio || 'No bio yet. Click Edit Profile to add one.'}
                      </p>
                    )}
                  </div>
                  <div className="glass-card p-6 space-y-3">
                    <h3 className="font-grotesk font-semibold text-white">Details</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <CalendarDaysIcon className="w-4 h-4" />
                      {joinedDate ? `Joined ${joinedDate}` : 'Member'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <LinkIcon className="w-4 h-4" />
                      <span>{user.email}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <Footer />
      </div>
    </>
  );
}
