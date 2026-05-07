import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, query, where, orderBy, getDocs,
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../lib/firebase';
import { updateProfile as fbUpdateProfile } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import SkeletonCard from '../components/SkeletonCard';
import Footer from '../components/Footer';
import {
  PencilSquareIcon,
  LinkIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  HeartIcon,
  BookmarkIcon,
  UserCircleIcon,
  CameraIcon,
  PhotoIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { format } from 'date-fns';

const TABS = [
  { id: 'posts', label: 'Posts', icon: BookOpenIcon },
  { id: 'liked', label: 'Liked', icon: HeartIcon },
  { id: 'saved', label: 'Saved', icon: BookmarkIcon },
  { id: 'about', label: 'About', icon: UserCircleIcon },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // editable fields
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // photo states
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerURL, setBannerURL] = useState('');

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Load saved profile data from Firestore
  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || '');
    setPhotoPreview(null);
    setBannerPreview(null);

    const fetchProfileData = async () => {
      try {
        const snap = await getDoc(doc(db, 'profiles', user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setBio(data.bio || '');
          setWebsite(data.website || '');
          setBannerURL(data.bannerURL || '');
        }
      } catch (e) {
        console.error('Profile fetch error:', e);
      }
    };
    fetchProfileData();
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) router.push('/auth/login');
  }, [user, router]);

  // Fetch user's posts
  useEffect(() => {
    if (!user) return;
    const fetchPosts = async () => {
      setPostsLoading(true);
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
        setPostsLoading(false);
      }
    };
    fetchPosts();
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    setSaveError('');
    try {
      let newPhotoURL = user.photoURL;
      let newBannerURL = bannerURL;

      // Upload avatar if changed
      if (photoFile) {
        const avatarRef = ref(storage, `avatars/${user.uid}/${Date.now()}_${photoFile.name}`);
        await uploadBytes(avatarRef, photoFile);
        newPhotoURL = await getDownloadURL(avatarRef);
      }

      // Upload banner if changed
      if (bannerFile) {
        const bRef = ref(storage, `banners/${user.uid}/${Date.now()}_${bannerFile.name}`);
        await uploadBytes(bRef, bannerFile);
        newBannerURL = await getDownloadURL(bRef);
      }

      // Update Firebase Auth profile
      await fbUpdateProfile(auth.currentUser, {
        displayName: displayName || user.displayName,
        photoURL: newPhotoURL,
      });

      // Save extra fields to Firestore
      await setDoc(doc(db, 'profiles', user.uid), {
        displayName: displayName || user.displayName,
        bio,
        website,
        bannerURL: newBannerURL,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setBannerURL(newBannerURL);
      setPhotoFile(null);
      setBannerFile(null);
      setEditing(false);
    } catch (e) {
      console.error(e);
      setSaveError(e.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setDisplayName(user.displayName || '');
    setPhotoFile(null);
    setBannerFile(null);
    setPhotoPreview(null);
    setBannerPreview(null);
    setSaveError('');
  };

  if (!user) return null;

  const joinedDate = user.metadata?.creationTime
    ? format(new Date(user.metadata.creationTime), 'MMMM yyyy')
    : null;

  const avatarSrc = photoPreview || user.photoURL;
  const bannerSrc = bannerPreview || bannerURL;

  return (
    <>
      <Head>
        <title>{user.displayName || 'Profile'} · Wavvy</title>
        <meta name="description" content={`${user.displayName || 'User'}'s profile on Wavvy`} />
      </Head>

      <div className="min-h-screen bg-wavvy-bgLight dark:bg-wavvy-bgDark">
        <Navbar />

        {/* Profile Banner */}
        <div className="relative h-48 sm:h-64 overflow-hidden group">
          {bannerSrc ? (
            <img src={bannerSrc} alt="Profile banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-violet-900 via-purple-900 to-pink-900">
              <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10" />
              <div className="absolute top-4 right-8 w-40 h-40 rounded-full bg-wavvy-accent/30 blur-3xl" />
              <div className="absolute bottom-0 left-12 w-56 h-32 rounded-full bg-wavvy-primary/30 blur-3xl" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Banner upload button */}
          {editing && (
            <>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerChange}
              />
              <button
                onClick={() => bannerInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              >
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/30">
                  <PhotoIcon className="w-4 h-4" />
                  Change Banner
                </div>
              </button>
            </>
          )}
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Avatar + Info Row */}
          <div className="relative -mt-16 mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="relative group"
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={user.displayName}
                    className="w-28 h-28 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-xl"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-wavvy-gradient border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center text-4xl font-black text-white font-grotesk">
                    {(user.displayName || user.email || 'W')[0].toUpperCase()}
                  </div>
                )}

                {/* Avatar upload overlay */}
                {editing && (
                  <>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 border-4 border-white dark:border-slate-900"
                    >
                      <CameraIcon className="w-7 h-7 text-white" />
                    </button>
                  </>
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
                    className="input-base text-xl font-bold w-48 mb-1"
                    placeholder="Your name"
                    autoFocus
                  />
                ) : (
                  <h1 className="font-grotesk text-2xl font-bold text-gray-900 dark:text-white">
                    {user.displayName || 'Wavvy User'}
                  </h1>
                )}
                <p className="text-gray-400 text-sm truncate">{user.email}</p>
                {bio && !editing && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-xs line-clamp-2">{bio}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pb-2">
              {editing ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="btn-ghost text-sm py-2 px-4 flex items-center gap-1.5"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="btn-primary text-sm py-2 px-4 flex items-center gap-1.5"
                  >
                    {saving ? (
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                    ) : (
                      <CheckIcon className="w-4 h-4" />
                    )}
                    {saving ? 'Saving...' : 'Save Profile'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="btn-ghost text-sm py-2 px-4 flex items-center gap-1.5"
                  >
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

          {/* Save Error */}
          {saveError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {saveError}
            </div>
          )}

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
                postsLoading
                  ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
                    </div>
                  : posts.length === 0
                  ? <div className="text-center py-20">
                      <BookOpenIcon className="w-10 h-10 mx-auto mb-3 text-gray-500 opacity-30" />
                      <p className="text-gray-400 mb-4">You haven&apos;t published any posts yet.</p>
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
                  <p>Posts you&apos;ve liked will appear here.</p>
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

                  <div className="glass-card p-6 space-y-4">
                    <h3 className="font-grotesk font-semibold text-white">Details</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <CalendarDaysIcon className="w-4 h-4 flex-shrink-0" />
                      {joinedDate ? `Joined ${joinedDate}` : 'Member'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <LinkIcon className="w-4 h-4 flex-shrink-0" />
                      {editing ? (
                        <input
                          value={website}
                          onChange={e => setWebsite(e.target.value)}
                          placeholder="https://yourwebsite.com"
                          className="input-base text-sm py-1 flex-1"
                        />
                      ) : (
                        website
                          ? <a href={website} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline truncate">{website}</a>
                          : <span>{user.email}</span>
                      )}
                    </div>
                  </div>

                  {/* Photo & Banner upload shortcuts when in edit mode */}
                  {editing && (
                    <div className="glass-card p-6 space-y-3">
                      <h3 className="font-grotesk font-semibold text-white mb-2">Media</h3>
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300"
                      >
                        <CameraIcon className="w-5 h-5 text-violet-400" />
                        {photoFile ? `✓ Avatar selected: ${photoFile.name}` : 'Change Profile Photo'}
                      </button>
                      <button
                        onClick={() => bannerInputRef.current?.click()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm text-gray-300"
                      >
                        <PhotoIcon className="w-5 h-5 text-pink-400" />
                        {bannerFile ? `✓ Banner selected: ${bannerFile.name}` : 'Change Banner Image'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-16">
          <Footer />
        </div>
      </div>
    </>
  );
}
