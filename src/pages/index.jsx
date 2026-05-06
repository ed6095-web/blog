import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  where,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import PostCard from '../components/PostCard';
import SkeletonCard from '../components/SkeletonCard';
import Footer from '../components/Footer';
import { AdjustmentsHorizontalIcon, FireIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';

const CATEGORIES = ['All', 'Technology', 'Design', 'Culture', 'Health', 'Science', 'Startups', 'Mental Health'];
const SORT_OPTIONS = [
  { label: 'Trending', icon: FireIcon },
  { label: 'Latest', icon: ClockIcon },
  { label: 'Featured', icon: SparklesIcon },
];

const PAGE_SIZE = 9;

export default function HomePage() {
  const [posts, setPosts]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [lastDoc, setLastDoc]         = useState(null);
  const [hasMore, setHasMore]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory]       = useState('All');
  const [sortBy, setSortBy]           = useState('Trending');

  const fetchPosts = useCallback(async (reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      let q = query(
        collection(db, 'posts'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      );
      if (!reset && lastDoc) {
        q = query(
          collection(db, 'posts'),
          orderBy('createdAt', 'desc'),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }
      const snapshot = await getDocs(q);
      const newPosts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(newPosts.length === PAGE_SIZE);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [lastDoc]);

  useEffect(() => {
    fetchPosts(true);
  }, []); // eslint-disable-line

  // Filter posts client-side by search and category
  const filteredPosts = posts.filter(post => {
    const matchSearch = !searchQuery ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = category === 'All' || post.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <>
      <Head>
        <title>Wavvy — Share ideas that actually matter</title>
        <meta name="description" content="Wavvy is the modern home for ideas that move people. Write, share, and discover stories that matter." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-wavvy-bgLight dark:bg-wavvy-bgDark">
        <Navbar onSearch={setSearchQuery} />

        <main>
          {/* Hero (hide when searching) */}
          <AnimatePresence>
            {!searchQuery && (
              <motion.div exit={{ opacity: 0 }}>
                <HeroSection onTopicSelect={setCategory} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feed Section */}
          <section id="feed" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Feed Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="font-grotesk text-2xl font-bold text-gray-900 dark:text-white">
                  {searchQuery
                    ? `Results for "${searchQuery}"`
                    : category !== 'All'
                    ? `${category} Stories`
                    : 'Latest Stories'}
                </h2>
                {filteredPosts.length > 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {filteredPosts.length} {filteredPosts.length === 1 ? 'story' : 'stories'}
                  </p>
                )}
              </div>

              {/* Sort Tabs */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 rounded-xl p-1">
                {SORT_OPTIONS.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    onClick={() => setSortBy(label)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      sortBy === label
                        ? 'bg-white dark:bg-slate-700 text-wavvy-primary2 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-8 scrollbar-hide">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    category === cat
                      ? 'bg-wavvy-primary text-white shadow-glow'
                      : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Posts Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-24"
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-wavvy-gradient opacity-20 flex items-center justify-center text-4xl">
                  📝
                </div>
                <h3 className="font-grotesk text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {searchQuery ? 'No results found' : 'No posts yet'}
                </h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto">
                  {searchQuery
                    ? `Try a different search term or explore by category.`
                    : 'Be the first to share an idea on Wavvy.'}
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {filteredPosts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(i * 0.06, 0.36) }}
                    >
                      <PostCard post={post} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Load More */}
            {!loading && hasMore && filteredPosts.length > 0 && (
              <div className="mt-12 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => fetchPosts(false)}
                  disabled={loadingMore}
                  className="btn-ghost px-8 py-3 flex items-center gap-2"
                >
                  {loadingMore
                    ? <><svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg> Loading...</>
                    : 'Load more stories'
                  }
                </motion.button>
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
