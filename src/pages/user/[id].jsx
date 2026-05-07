import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection, query, where, getDocs, addDoc, serverTimestamp,
  doc, getDoc, updateDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import PostCard from '../../components/PostCard';
import SkeletonCard from '../../components/SkeletonCard';
import Footer from '../../components/Footer';
import {
  LinkIcon,
  CalendarDaysIcon,
  BookOpenIcon,
  UserPlusIcon,
  UserMinusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

export default function PublicProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  
  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  // Fetch Profile Data
  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'profiles', id));
        if (snap.exists()) {
          const data = snap.data();
          setProfile(data);
          setFollowerCount(data.followers?.length || 0);
          
          if (currentUser && data.followers?.includes(currentUser.uid)) {
            setIsFollowing(true);
          }
        } else {
          setProfile(null); // Not found
        }
      } catch (e) {
        console.error('Profile fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id, currentUser]);

  // Fetch user's posts
  useEffect(() => {
    if (!id) return;
    const fetchPosts = async () => {
      setPostsLoading(true);
      try {
        const q = query(collection(db, 'posts'), where('authorId', '==', id));
        const snap = await getDocs(q);
        const fetchedPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        fetchedPosts.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setPosts(fetchedPosts);
      } catch (e) {
        console.error(e);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchPosts();
  }, [id]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    
    setFollowLoading(true);
    
    // Optimistic UI update
    setIsFollowing(v => !v);
    setFollowerCount(c => !isFollowing ? c + 1 : c - 1);
    
    try {
      const targetUserRef = doc(db, 'profiles', id);
      const currentUserRef = doc(db, 'profiles', currentUser.uid);

      if (!isFollowing) {
        // Follow: add currentUser.uid to target's followers, target id to currentUser's following
        await updateDoc(targetUserRef, { followers: arrayUnion(currentUser.uid) });
        await updateDoc(currentUserRef, { following: arrayUnion(id) });
        
        await addDoc(collection(db, 'notifications'), {
          recipientId: id,
          senderId: currentUser.uid,
          type: 'follow',
          text: `${currentUser.displayName || 'Someone'} started following you`,
          link: `/user/${currentUser.uid}`,
          createdAt: serverTimestamp(),
          read: false
        });
      } else {
        // Unfollow
        await updateDoc(targetUserRef, { followers: arrayRemove(currentUser.uid) });
        await updateDoc(currentUserRef, { following: arrayRemove(id) });
      }
    } catch (e) {
      console.error("Error toggling follow:", e);
      // Revert optimistic update
      setIsFollowing(v => !v);
      setFollowerCount(c => !isFollowing ? c - 1 : c + 1);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-wavvy-bgLight dark:bg-wavvy-bgDark">
        <Navbar />
        <div className="h-48 sm:h-64 bg-gray-200 dark:bg-slate-800 animate-pulse" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
          <div className="flex gap-6 mb-8">
            <div className="w-28 h-28 rounded-2xl bg-gray-300 dark:bg-slate-700 animate-pulse -mt-16 border-4 border-white dark:border-slate-900" />
            <div className="flex-1 space-y-3">
              <div className="w-1/3 h-6 bg-gray-300 dark:bg-slate-700 animate-pulse rounded" />
              <div className="w-1/4 h-4 bg-gray-300 dark:bg-slate-700 animate-pulse rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-wavvy-bgLight dark:bg-wavvy-bgDark">
        <Navbar />
        <div className="max-w-3xl mx-auto text-center py-32">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">User not found</h1>
          <p className="text-gray-500 mb-8">This profile doesn&apos;t exist or has been removed.</p>
          <button onClick={() => router.push('/')} className="btn-primary px-6 py-2">Return Home</button>
        </div>
      </div>
    );
  }

  const avatarSrc = profile.photoURL || '';
  const bannerSrc = profile.bannerURL || '';
  const isOwnProfile = currentUser?.uid === id;

  const joinedDate = profile.updatedAt?.toDate ? format(profile.updatedAt.toDate(), 'MMMM yyyy') : null;

  return (
    <>
      <Head>
        <title>{profile.displayName || 'Profile'} · Wavvy</title>
        <meta name="description" content={`View ${profile.displayName}'s profile on Wavvy.`} />
      </Head>

      <div className="min-h-screen bg-wavvy-bgLight dark:bg-wavvy-bgDark">
        <Navbar />

        {/* Banner */}
        <div className="relative h-48 sm:h-64 overflow-hidden">
          {bannerSrc ? (
            <img src={bannerSrc} alt="Profile banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-violet-900 via-purple-900 to-pink-900">
              <div className="absolute top-4 right-8 w-40 h-40 rounded-full bg-wavvy-accent/30 blur-3xl" />
              <div className="absolute bottom-0 left-12 w-56 h-32 rounded-full bg-wavvy-primary/30 blur-3xl" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Row */}
          <div className="relative -mt-16 mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 px-2 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 flex-1 min-w-0">
              <div className="relative">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={profile.displayName} className="w-28 h-28 rounded-2xl object-cover border-4 border-white dark:border-slate-900 shadow-xl" />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-wavvy-gradient border-4 border-white dark:border-slate-900 shadow-xl flex items-center justify-center text-4xl font-black text-white font-grotesk">
                    {(profile.displayName || '?')[0].toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 rounded-full border-3 border-white dark:border-slate-900 flex items-center justify-center">
                  <SparklesIcon className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="pb-2 pt-2 sm:pt-0 flex-1 min-w-0">
                <h1 className="font-grotesk text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {profile.displayName || 'Wavvy User'}
                </h1>
                {profile.bio && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 max-w-xl break-words">{profile.bio}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pb-2">
              {isOwnProfile ? (
                <button onClick={() => router.push('/profile')} className="btn-ghost py-2 px-4 text-sm font-medium">
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`py-2 px-6 rounded-full text-sm font-medium flex items-center gap-2 transition-all ${
                    isFollowing 
                      ? 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-gray-200 dark:bg-slate-800 dark:border-white/10 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-500/30'
                      : 'bg-wavvy-primary2 text-white hover:opacity-90 shadow-lg shadow-wavvy-primary2/30'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <CheckIcon className="w-4 h-4 hidden group-hover:hidden" />
                      <UserMinusIcon className="w-4 h-4 block" />
                      <span>Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200 dark:border-white/[0.06] text-sm">
            <div className="text-center">
              <p className="font-grotesk font-bold text-lg text-gray-900 dark:text-white">{posts.length}</p>
              <p className="text-gray-400 text-xs">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-grotesk font-bold text-lg text-gray-900 dark:text-white">{followerCount}</p>
              <p className="text-gray-400 text-xs">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-grotesk font-bold text-lg text-gray-900 dark:text-white">{profile.following?.length || 0}</p>
              <p className="text-gray-400 text-xs">Following</p>
            </div>

            <div className="ml-auto flex items-center gap-4 text-gray-400 text-xs">
              {profile.website && (
                <div className="flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5" />
                  <a href={profile.website} target="_blank" rel="noreferrer" className="hover:text-wavvy-primary2 transition-colors">{profile.website.replace(/^https?:\/\//, '')}</a>
                </div>
              )}
              {joinedDate && (
                <div className="flex items-center gap-1.5 hidden sm:flex">
                  <CalendarDaysIcon className="w-3.5 h-3.5" />
                  Joined {joinedDate}
                </div>
              )}
            </div>
          </div>

          {/* Posts list */}
          <div className="mb-16">
            <h2 className="font-grotesk text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <BookOpenIcon className="w-5 h-5" />
              Published Posts
            </h2>
            
            {postsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 dark:bg-slate-800/30 rounded-2xl border border-gray-200 dark:border-white/[0.06]">
                <BookOpenIcon className="w-10 h-10 mx-auto mb-3 text-gray-400 opacity-30" />
                <p className="text-gray-500">This user hasn&apos;t published any posts yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {posts.map(post => <PostCard key={post.id} post={post} />)}
              </div>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
}
