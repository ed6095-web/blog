// src/pages/index.jsx
import { useEffect, useRef, useState } from "react";
import { collection, query, orderBy, limit, getDocs, startAfter } from "firebase/firestore";
import { db } from "../lib/firebase";
import PostCard from "../components/PostCard";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const PAGE_SIZE = 6;

export default function HomePage() {
  const [posts, setPosts] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const loaderRef = useRef();

  useEffect(() => {
    fetchInitialPosts();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new window.IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !fetchingMore) {
        fetchMorePosts();
      }
    });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
    // eslint-disable-next-line
  }, [loaderRef.current, fetchingMore]);

  async function fetchInitialPosts() {
    setLoading(true);
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    );
    const snap = await getDocs(postsQuery);
    const lastVisible = snap.docs[snap.docs.length - 1];
    setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLastDoc(lastVisible);
    setLoading(false);
  }

  async function fetchMorePosts() {
    if (!lastDoc || fetchingMore) return;
    setFetchingMore(true);
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    );
    const snap = await getDocs(postsQuery);
    const morePosts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPosts(prev => [...prev, ...morePosts]);
    setLastDoc(snap.docs[snap.docs.length - 1]);
    setFetchingMore(false);
  }

  // Filter posts in-memory on search
  const filteredPosts = !searchQuery
    ? posts
    : posts.filter(post =>
        (post.title && post.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (post.authorName && post.authorName.toLowerCase().includes(searchQuery.toLowerCase()))
      );

  return (
    <div className="min-h-screen w-full bg-gradient-to-tl from-purple-100 via-blue-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-x-hidden">
      {/* Animated, glassy blobs background */}
      <div className="absolute top-[-14%] left-[-8%] w-[350px] h-[350px] bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
      <div className="absolute top-[50%] right-[-15%] w-[320px] h-[320px] bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse-slow"></div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar onSearch={setSearchQuery} />
        {/* Hero */}
        <section className="mb-10 pt-8 sm:pt-14">
          {/* Mobile: animated marquee */}
          <div className="block sm:hidden w-full overflow-x-hidden py-2">
            <div className="animate-marquee whitespace-nowrap flex items-center justify-start">
              <span className="text-3xl xs:text-4xl font-black bg-gradient-to-tr from-blue-600 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-2xl mx-2">
                Welcome to Wavvy
              </span>
              <span className="ml-1 not-italic text-3xl xs:text-4xl" style={{ color: "inherit" }}>🚀</span>
            </div>
          </div>
          {/* Desktop: static center, NON-colored emoji */}
          <h1 className="hidden sm:flex items-center justify-center text-5xl lg:text-6xl font-black drop-shadow-2xl animate-fade-in gap-2">
            <span className="bg-gradient-to-tr from-blue-600 to-fuchsia-500 bg-clip-text text-transparent">
              Welcome to Wavvy
            </span>
            <span className="not-italic text-5xl lg:text-6xl" style={{ color: "inherit" }}>🚀</span>
          </h1>
          <p className="text-2xl mt-5 text-gray-700 dark:text-gray-200 max-w-2xl mx-auto animate-fade-in delay-150 text-center font-bold">
            Awareness before impact.
          </p>
        </section>
        {/* Blog Grid */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-3 py-2">
          <div className="grid gap-9 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 px-1">
            {filteredPosts.length === 0 && !loading ? (
              <p className="text-lg col-span-full text-center text-gray-500 font-medium">No results found.</p>
            ) : (
              filteredPosts.map((post, idx) => (
                <div
                  key={post.id}
                  className={`
                    glass rounded-3xl border-2 border-transparent
                    bg-white/80 dark:bg-gray-800/90 shadow-xl relative overflow-hidden
                    flex flex-col gap-4 transition-all duration-300
                    hover:scale-[1.035] hover:shadow-2xl 
                    hover:border-blue-300 dark:hover:border-fuchsia-500
                    hover:z-10
                    before:absolute before:inset-0 before:bg-gradient-to-tr
                    before:from-blue-100 before:via-pink-100 before:to-violet-200
                    dark:before:from-gray-800 dark:before:via-gray-700 dark:before:to-gray-900
                    before:opacity-30 before:z-0
                  `}
                  style={{ animation: `pop-in .7s cubic-bezier(.18,.63,.48,1.17) ${idx * 50}ms both` }}
                >
                  <div className="relative z-10">
                    <PostCard post={post} />
                  </div>
                </div>
              ))
            )}
          </div>
          {loading && <div className="text-center py-8 text-lg animate-pulse-slow">Loading...</div>}
          <div ref={loaderRef} style={{ height: "36px" }}></div>
          {fetchingMore && <div className="text-center py-4 text-base animate-pulse">Loading more...</div>}
          {!loading && posts.length === 0 && (
            <div className="text-center mt-16 text-gray-500 font-medium">No blog posts yet.</div>
          )}
        </main>
        <Footer />
      </div>
      <style global jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 12s linear infinite;
        }
        @keyframes pop-in {
          0% { transform: scale(0.93) translateY(60px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
