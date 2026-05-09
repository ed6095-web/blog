import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, query, where, getDocs,
  doc, getDoc, setDoc, serverTimestamp, deleteDoc,
} from 'firebase/firestore';
import { uploadToCloudinary } from '../lib/cloudinary';
import { db, auth } from '../lib/firebase';
import { updateProfile as fbUpdateProfile } from 'firebase/auth';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import SkeletonCard from '../components/SkeletonCard';
import Footer from '../components/Footer';
import Avatar from '../components/Avatar';
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
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { format } from 'date-fns';

const TABS = [
  { id: 'posts', label: 'Posts', icon: BookOpenIcon },
  { id: 'followers', label: 'Followers', icon: UserCircleIcon },
  { id: 'following', label: 'Following', icon: UserCircleIcon },
  { id: 'about', label: 'About', icon: UserCircleIcon },
];

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  // editable fields
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle | checking | available | taken
  const [originalUsername, setOriginalUsername] = useState('');
  const [bio, setBio] = useState('');
  const [website, setWebsite] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  
  // Follow stats
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  // photo states
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerURL, setBannerURL] = useState('');
  const [photoURL, setPhotoURL] = useState('');

  const [followersList, setFollowersList] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [socialLoading, setSocialLoading] = useState(false);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Load saved profile data from Firestore
  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName || '');
    setPhotoURL(user.photoURL || '');
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
          setPhotoURL(data.photoURL || user.photoURL || '');
          setFollowerCount(data.followers?.length || 0);
          setFollowingCount(data.following?.length || 0);
          setUsername(data.username || '');
          setOriginalUsername(data.username || '');
        }
      } catch (e) {
        console.error('Profile fetch error:', e);
      }
    };
    fetchProfileData();
  }, [user]);

  // Debounced username uniqueness check
  const usernameDebounceRef = useRef(null);
  const handleUsernameChange = (val) => {
    const cleaned = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(cleaned);
    setUsernameStatus('idle');
    if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    if (cleaned.length < 3) return;
    // If same as original, it's always available
    if (cleaned === originalUsername) { setUsernameStatus('available'); return; }
    setUsernameStatus('checking');
    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const snap = await getDoc(doc(db, 'usernames', cleaned));
        setUsernameStatus(snap.exists() ? 'taken' : 'available');
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);
  };

  // Redirect if not logged in — wait for auth to finish loading first
  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/login');
  }, [user, authLoading, router]);

  // Fetch user's posts
  useEffect(() => {
    if (!user) return;
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const q = query(
          collection(db, 'posts'),
          where('authorId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const fetchedPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort client-side to avoid Firestore composite index requirement
        fetchedPosts.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setPosts(fetchedPosts);
      } catch (e) {
        console.error(e);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchPosts();
  }, [user]);

  // Fetch followers/following list when those tabs are active
  useEffect(() => {
    if (!user || (activeTab !== 'followers' && activeTab !== 'following')) return;
    
    const fetchSocial = async () => {
      setSocialLoading(true);
      try {
        const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          const ids = activeTab === 'followers' ? (data.followers || []) : (data.following || []);
          
          if (ids.length === 0) {
            activeTab === 'followers' ? setFollowersList([]) : setFollowingList([]);
            return;
          }

          // Fetch profiles for these IDs (chunked to 10 at a time for where-in)
          const fetchedProfiles = [];
          for (let i = 0; i < ids.length; i += 10) {
            const chunk = ids.slice(i, i + 10);
            const q = query(collection(db, 'profiles'), where('__name__', 'in', chunk));
            const snap = await getDocs(q);
            fetchedProfiles.push(...snap.docs.map(d => ({ id: d.id, ...d.data() })));
          }
          
          activeTab === 'followers' ? setFollowersList(fetchedProfiles) : setFollowingList(fetchedProfiles);
        }
      } catch (err) {
        console.error("Error fetching social data:", err);
      } finally {
        setSocialLoading(false);
      }
    };
    fetchSocial();
  }, [user, activeTab]);

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
    if (username && username.length < 3) { setSaveError('Username must be at least 3 characters.'); return; }
    if (usernameStatus === 'taken') { setSaveError('That username is already taken.'); return; }
    setSaving(true);
    setSaveError('');
    try {
      let newPhotoURL = photoURL || user.photoURL;
      let newBannerURL = bannerURL;

      if (photoFile) newPhotoURL = await uploadToCloudinary(photoFile);
      if (bannerFile) newBannerURL = await uploadToCloudinary(bannerFile);

      await fbUpdateProfile(auth.currentUser, {
        displayName: displayName || user.displayName,
        photoURL: newPhotoURL,
      });

      // Handle username changes in Firestore
      const newUsername = username.toLowerCase().trim();
      if (newUsername && newUsername !== originalUsername) {
        // Delete old username mapping if it exists
        if (originalUsername) {
          await deleteDoc(doc(db, 'usernames', originalUsername));
        }
        // Create new username mapping
        await setDoc(doc(db, 'usernames', newUsername), {
          email: user.email || '',
          uid: user.uid,
        });
      }

      await setDoc(doc(db, 'profiles', user.uid), {
        displayName: displayName || user.displayName,
        photoURL: newPhotoURL,
        username: newUsername || originalUsername || '',
        bio,
        website,
        bannerURL: newBannerURL,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      setOriginalUsername(newUsername || originalUsername);
      setPhotoURL(newPhotoURL);
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
    setUsername(originalUsername);
    setUsernameStatus('idle');
    setPhotoFile(null);
    setBannerFile(null);
    setPhotoPreview(null);
    setBannerPreview(null);
    setSaveError('');
  };

  if (!user) return null;

  // While auth is still loading or user not yet resolved, show a loading screen
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-wavvy-bgLight dark:bg-wavvy-bgDark flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-wavvy-primary2 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const joinedDate = user.metadata?.creationTime
    ? format(new Date(user.metadata.creationTime), 'MMMM yyyy')
    : null;

  const avatarSrc = photoPreview || photoURL || user.photoURL;
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
        <div
          className={`relative h-28 sm:h-44 overflow-hidden ${editing ? 'cursor-pointer' : ''}`}
          onClick={editing ? () => bannerInputRef.current?.click() : undefined}
        >
          {bannerSrc ? (
            <img src={bannerSrc} alt="Profile banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-violet-900 via-purple-900 to-pink-900">
              <div className="absolute top-4 right-8 w-40 h-40 rounded-full bg-wavvy-accent/30 blur-3xl" />
              <div className="absolute bottom-0 left-12 w-56 h-32 rounded-full bg-wavvy-primary/30 blur-3xl" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

          {/* Banner upload button — visible when editing */}
          {editing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                onChange={handleBannerChange}
              />
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/30 pointer-events-none">
                <PhotoIcon className="w-4 h-4" />
                {bannerFile ? `✓ ${bannerFile.name}` : 'Click to change banner'}
              </div>
            </div>
          )}
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* Avatar Row */}
          <div className="relative -mt-12 mb-3 px-1">
            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="relative inline-block"
              onClick={editing ? () => avatarInputRef.current?.click() : undefined}
              style={{ cursor: editing ? 'pointer' : 'default' }}
            >
              <Avatar 
                url={avatarSrc} 
                name={user.displayName} 
                size={80} 
                className="rounded-2xl border-4 border-white dark:border-slate-900 shadow-xl"
              />

              {/* Avatar upload overlay */}
              {editing && (
                <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50 border-4 border-white dark:border-slate-900 overflow-hidden">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={handleAvatarChange}
                  />
                  <div className="flex flex-col items-center gap-1 pointer-events-none">
                    <CameraIcon className="w-7 h-7 text-white" />
                    {photoFile && <span className="text-white text-[10px] font-medium">✓</span>}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* User Info (Name, Username, Bio) */}
          <div className="px-2 mb-4">
            {editing ? (
              <div className="space-y-3 max-w-sm">
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="input-base text-xl font-bold w-full"
                  placeholder="Your name"
                  autoFocus
                />
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-gray-400 text-sm font-medium pointer-events-none select-none">@</span>
                  <input
                    value={username}
                    onChange={e => handleUsernameChange(e.target.value)}
                    className={`input-base text-sm w-full pl-8 pr-8 ${
                      usernameStatus === 'available' ? 'border-green-500/50' :
                      usernameStatus === 'taken' ? 'border-red-500/50' : ''
                    }`}
                    placeholder="username"
                    maxLength={30}
                  />
                  <span className="absolute right-3 text-sm">
                    {usernameStatus === 'checking' && <span className="text-gray-400 text-xs">...</span>}
                    {usernameStatus === 'available' && <span className="text-green-400">✓</span>}
                    {usernameStatus === 'taken' && <span className="text-red-400">✗</span>}
                  </span>
                </div>
                {usernameStatus === 'taken' && <p className="text-red-400 text-xs">Username already taken</p>}
                {usernameStatus === 'available' && username !== originalUsername && <p className="text-green-400 text-xs">@{username} is available!</p>}
              </div>
            ) : (
              <>
                <h1 className="font-grotesk text-2xl font-bold text-gray-900 dark:text-white break-words">
                  {user.displayName || 'Wavvy User'}
                </h1>
                {username && <p className="text-wavvy-primary2 text-sm font-medium mt-0.5">@{username}</p>}
                <p className="text-gray-400 text-sm break-words mt-0.5">{user.email}</p>
                {bio && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 max-w-xl leading-relaxed whitespace-pre-wrap">{bio}</p>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="px-2 mb-6 flex flex-wrap items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="btn-ghost text-sm py-2 px-3 sm:px-4 flex items-center gap-1.5"
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
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </button>
                <button
                  onClick={async () => {
                    const { logout } = await import('../lib/auth');
                    await logout();
                    router.push('/');
                  }}
                  className="btn-ghost text-sm py-2 px-4 flex items-center gap-1.5 text-red-400 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/50"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            )}
          </div>

          {/* Save Error */}
          {saveError && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {saveError}
            </div>
          )}

          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 text-sm">
            <div className="text-center">
              <p className="font-grotesk font-bold text-lg text-gray-900 dark:text-white">{posts.length}</p>
              <p className="text-gray-400 text-xs">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-grotesk font-bold text-lg text-gray-900 dark:text-white">{followerCount}</p>
              <p className="text-gray-400 text-xs">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-grotesk font-bold text-lg text-gray-900 dark:text-white">{followingCount}</p>
              <p className="text-gray-400 text-xs">Following</p>
            </div>
            {joinedDate && (
              <div className="flex items-center gap-1.5 text-gray-400 text-xs ml-auto w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200 dark:border-white/5">
                <CalendarDaysIcon className="w-3.5 h-3.5" />
                Joined {joinedDate}
              </div>
            )}
          </div>

          {/* Tabs — scrollable on mobile so they never wrap */}
          <div className="flex gap-0 border-b border-gray-200 dark:border-white/[0.06] mb-8 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all duration-200 ${
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

              {(activeTab === 'followers' || activeTab === 'following') && (
                <div className="space-y-4">
                  {socialLoading ? (
                    <div className="space-y-3">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-16 bg-gray-100 dark:bg-white/[0.06] animate-pulse rounded-2xl" />
                      ))}
                    </div>
                  ) : (activeTab === 'followers' ? followersList : followingList).length === 0 ? (
                    <div className="text-center py-20 bg-gray-50 dark:bg-slate-800/30 rounded-2xl border border-gray-200 dark:border-white/[0.06]">
                      <UserCircleIcon className="w-10 h-10 mx-auto mb-3 text-gray-400 opacity-30" />
                      <p className="text-gray-500">
                        {activeTab === 'followers' ? "No followers yet." : "You aren't following anyone yet."}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(activeTab === 'followers' ? followersList : followingList).map(p => (
                        <Link key={p.id} href={`/user/${p.id}`}>
                          <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] hover:border-wavvy-primary2/50 transition-all">
                            <Avatar 
                              url={p.photoURL} 
                              name={p.displayName} 
                              size={40} 
                              className="rounded-xl" 
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{p.displayName}</p>
                              <p className="text-xs text-gray-400 truncate">{p.bio || 'Wavvy Enthusiast'}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
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
