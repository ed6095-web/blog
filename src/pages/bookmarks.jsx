import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import SkeletonCard from '../components/SkeletonCard';
import Footer from '../components/Footer';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function BookmarksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchBookmarks = async () => {
      setLoading(true);
      try {
        // Get user's saved/bookmarked post IDs from their profile
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
          setPosts([]);
          setLoading(false);
          return;
        }

        const bookmarkedIds = profileSnap.data().bookmarks || [];

        if (bookmarkedIds.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // Fetch each bookmarked post (in chunks of 10 to avoid Firestore limits)
        const fetchedPosts = [];
        for (let i = 0; i < bookmarkedIds.length; i += 10) {
          const chunk = bookmarkedIds.slice(i, i + 10);
          const postPromises = chunk.map((id) => getDoc(doc(db, 'posts', id)));
          const snapshots = await Promise.all(postPromises);
          snapshots.forEach((snap) => {
            if (snap.exists()) {
              fetchedPosts.push({ id: snap.id, ...snap.data() });
            }
          });
        }

        // Sort by most recently bookmarked (using bookmark order from array)
        const orderedPosts = bookmarkedIds
          .map((id) => fetchedPosts.find((p) => p.id === id))
          .filter(Boolean);

        setPosts(orderedPosts);
      } catch (err) {
        console.error('Error fetching bookmarks:', err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookmarks();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-wavvy-bgDark">
        <div className="w-8 h-8 border-2 border-wavvy-primary2 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Bookmarks · Wavvy</title>
        <meta name="description" content="Your saved posts on Wavvy." />
      </Head>

      <Navbar />

      <main className="min-h-screen bg-wavvy-bgDark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-wavvy-gradient flex items-center justify-center shadow-glow">
                <BookmarkIcon className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white font-grotesk">Bookmarks</h1>
            </div>
            <p className="text-gray-400 text-sm ml-13 pl-1">
              Stories you've saved to read later
            </p>
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                <BookmarkIcon className="w-10 h-10 text-gray-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No bookmarks yet</h2>
              <p className="text-gray-400 text-sm max-w-xs mb-8">
                Save stories that inspire you by tapping the bookmark icon on any post.
              </p>
              <Link
                href="/"
                className="px-6 py-3 rounded-xl bg-wavvy-gradient text-white font-semibold text-sm shadow-glow hover:opacity-90 transition-opacity"
              >
                Explore Stories
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-sm text-gray-500 mb-6">
                {posts.length} saved {posts.length === 1 ? 'story' : 'stories'}
              </p>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {posts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <PostCard post={post} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
