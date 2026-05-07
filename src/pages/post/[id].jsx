import { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, updateDoc, increment, collection, addDoc, getDocs, query, orderBy, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon,
  ShareIcon,
  ClockIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid, BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';
import { format } from 'date-fns';

function estimateReadingTime(content = '') {
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export default function PostPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  // Reading progress bar
  useEffect(() => {
    const handleScroll = () => {
      const el = document.documentElement;
      const scrollTop = el.scrollTop || document.body.scrollTop;
      const scrollHeight = el.scrollHeight - el.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      setReadProgress(Math.min(100, progress));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchPost = async () => {
      try {
        const ref = doc(db, 'posts', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setPost(data);
          setLikeCount(data.likedBy?.length || data.likes || 0);
          
          if (user && data.likedBy?.includes(user.uid)) {
            setLiked(true);
          } else {
            setLiked(false);
          }

          // Increment views
          await updateDoc(ref, { views: increment(1) });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, user]);

  useEffect(() => {
    if (!id) return;
    const fetchComments = async () => {
      try {
        const q = query(collection(db, 'posts', id, 'comments'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      }
    };
    fetchComments();
  }, [id]);

  const handleLike = async () => {
    if (!user) { router.push('/auth/login'); return; }
    
    // Optimistic UI update
    setLiked(v => !v);
    setLikeCount(c => !liked ? c + 1 : c - 1);
    
    try {
      await updateDoc(doc(db, 'posts', id), { 
        likedBy: !liked ? arrayUnion(user.uid) : arrayRemove(user.uid) 
      });
    } catch (e) { 
      console.error("Error liking post:", e);
      setLiked(v => !v);
      setLikeCount(c => !liked ? c - 1 : c + 1);
    }
  };

  const handleComment = async () => {
    if (!user) { router.push('/auth/login'); return; }
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const newComment = {
        text: commentText.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'posts', id, 'comments'), newComment);
      setComments(prev => [{ id: Date.now().toString(), ...newComment, createdAt: { toDate: () => new Date() } }, ...prev]);
      setCommentText('');
      await updateDoc(doc(db, 'posts', id), { commentCount: increment(1) });
    } catch (e) { console.error(e); } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: post?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-wavvy-bgDark">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 space-y-6">
          <div className="w-2/3 h-10 skeleton" />
          <div className="w-full h-64 skeleton rounded-2xl" />
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="w-full h-4 skeleton" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-wavvy-bgDark flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-grotesk text-2xl font-bold text-white mb-3">Post not found</h2>
          <Link href="/">
            <button className="btn-primary px-6 py-3">Go home</button>
          </Link>
        </div>
      </div>
    );
  }

  const readTime = estimateReadingTime(post.content);
  const publishedDate = post.createdAt?.toDate ? format(post.createdAt.toDate(), 'MMMM d, yyyy') : '';

  return (
    <>
      <Head>
        <title>{post.title} · Wavvy</title>
        <meta name="description" content={post.content?.slice(0, 160)} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.content?.slice(0, 160)} />
        {post.coverImage && <meta property="og:image" content={post.coverImage} />}
      </Head>

      {/* Reading progress bar */}
      <div
        id="reading-progress"
        style={{ width: `${readProgress}%` }}
      />

      <div className="min-h-screen bg-wavvy-bgLight dark:bg-wavvy-bgDark">
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
          {/* Back */}
          <Link href="/">
            <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-wavvy-primary2 transition-colors mb-8">
              <ArrowLeftIcon className="w-4 h-4" />
              Back to feed
            </button>
          </Link>

          {/* Category */}
          {post.category && (
            <span className="badge bg-wavvy-primary/15 text-wavvy-primary2 border border-wavvy-primary/20 mb-4">
              {post.category}
            </span>
          )}

          {/* Title */}
          <h1 className="font-grotesk text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight mb-6">
            {post.title}
          </h1>

          {/* Author + Meta */}
          <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200 dark:border-white/[0.06]">
            <Link href={`/user/${post.authorId}`}>
              {post.authorPhoto
                ? <img src={post.authorPhoto} alt={post.authorName} className="w-12 h-12 rounded-full object-cover ring-2 ring-wavvy-primary2/20 hover:ring-wavvy-primary transition-all" />
                : <div className="w-12 h-12 rounded-full bg-wavvy-gradient flex items-center justify-center text-white font-bold ring-2 ring-wavvy-primary2/20 hover:ring-wavvy-primary transition-all">
                    {(post.authorName || '?')[0].toUpperCase()}
                  </div>
              }
            </Link>
            <div className="flex-1">
              <Link href={`/user/${post.authorId}`} className="font-semibold text-gray-900 dark:text-white hover:text-wavvy-primary transition-colors">
                {post.authorName || 'Anonymous'}
              </Link>
              <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                <span>{publishedDate}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5" />
                  {readTime} min read
                </span>
              </div>
            </div>

            {/* Floating actions */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all ${
                  liked ? 'bg-wavvy-accent/15 text-wavvy-accent' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'
                }`}
              >
                {liked ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
                {likeCount}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setBookmarked(v => !v)}
                className={`p-2 rounded-xl text-sm transition-all ${
                  bookmarked ? 'bg-wavvy-primary/15 text-wavvy-primary2' : 'bg-gray-100 dark:bg-slate-800 text-gray-500'
                }`}
              >
                {bookmarked ? <BookmarkSolid className="w-4 h-4" /> : <BookmarkIcon className="w-4 h-4" />}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-wavvy-accent2 transition-colors"
              >
                <ShareIcon className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Cover image */}
          {post.coverImage && (
            <div className="rounded-2xl overflow-hidden mb-10 aspect-[16/8]">
              <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Content */}
          <article className="post-content text-gray-700 dark:text-gray-300 mb-16">
            {post.content?.split('\n').map((para, i) =>
              para.trim() ? <p key={i}>{para}</p> : <br key={i} />
            )}
          </article>

          {/* Tags */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12 pb-8 border-b border-gray-200 dark:border-white/[0.06]">
              {post.tags.map(tag => (
                <span key={tag} className="badge bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 text-xs">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Comment Section */}
          <section className="space-y-6">
            <h3 className="font-grotesk text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ChatBubbleLeftIcon className="w-5 h-5" />
              Discussion ({comments.length})
            </h3>

            {/* Comment input */}
            {user ? (
              <div className="flex gap-3">
                {user.photoURL
                  ? <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                  : <div className="w-9 h-9 rounded-full bg-wavvy-gradient flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(user.displayName || user.email || 'U')[0].toUpperCase()}
                    </div>
                }
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleComment()}
                    placeholder="Share your thoughts..."
                    className="flex-1 input-base text-sm"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleComment}
                    disabled={!commentText.trim() || submittingComment}
                    className="btn-primary px-3 py-2 disabled:opacity-50"
                  >
                    <PaperAirplaneIcon className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/[0.06] text-sm text-gray-500">
                <Link href="/auth/login" className="text-wavvy-primary2 hover:underline">Sign in</Link> to join the discussion.
              </div>
            )}

            {/* Comments list */}
            <AnimatePresence>
              {comments.map(comment => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  {comment.authorPhoto
                    ? <img src={comment.authorPhoto} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-8 h-8 rounded-full bg-wavvy-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {(comment.authorName || 'U')[0].toUpperCase()}
                      </div>
                  }
                  <div className="flex-1 bg-gray-50 dark:bg-slate-800/50 rounded-xl px-4 py-3">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{comment.authorName || 'Anonymous'}</span>
                      <span className="text-xs text-gray-400">
                        {comment.createdAt?.toDate ? format(comment.createdAt.toDate(), 'MMM d') : 'Just now'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {comments.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-6">No comments yet. Start the conversation!</p>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
