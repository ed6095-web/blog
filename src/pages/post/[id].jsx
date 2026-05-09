import { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  doc, getDoc, updateDoc, deleteDoc, increment,
  collection, addDoc, getDocs, query, orderBy,
  serverTimestamp, arrayUnion, arrayRemove,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Avatar from '../../components/Avatar';
import MediaCarousel from '../../components/MediaCarousel';
import {
  HeartIcon, ChatBubbleLeftIcon, BookmarkIcon, ShareIcon,
  ClockIcon, ArrowLeftIcon, PaperAirplaneIcon,
  TrashIcon, PencilIcon, ArrowUturnLeftIcon,
  ChevronDownIcon, ChevronUpIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid,
} from '@heroicons/react/24/solid';
import { format } from 'date-fns';

function estimateReadingTime(content = '') {
  const words = content.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function formatDate(ts) {
  if (!ts) return '';
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return format(d, 'MMM d, yyyy');
  } catch { return ''; }
}

// ── Single Comment with nested Reply ──────────────────────────────────────
function CommentItem({ comment, postId, user, depth = 0 }) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText]           = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [replies, setReplies]               = useState([]);
  const [showReplies, setShowReplies]       = useState(false);
  const [replyCount, setReplyCount]         = useState(comment.replyCount || 0);

  const handleSubmitReply = async () => {
    if (!user || !replyText.trim()) return;
    setSubmitting(true);
    try {
      const replyData = {
        text: replyText.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
      };
      await addDoc(
        collection(db, 'posts', postId, 'comments', comment.id, 'replies'),
        replyData
      );
      // Increment reply count on the parent comment
      await updateDoc(doc(db, 'posts', postId, 'comments', comment.id), {
        replyCount: increment(1),
      });
      setReplies(prev => [
        { id: Date.now().toString(), ...replyData, createdAt: { toDate: () => new Date() } },
        ...prev,
      ]);
      setReplyCount(c => c + 1);
      setShowReplies(true);
      setReplyText('');
      setShowReplyInput(false);
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  const loadReplies = async () => {
    if (showReplies) { setShowReplies(false); return; }
    try {
      const q = query(
        collection(db, 'posts', postId, 'comments', comment.id, 'replies'),
        orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(q);
      setReplies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setShowReplies(true);
    } catch (e) { console.error(e); }
  };

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'pl-10 sm:pl-12' : ''}`}>
      <Avatar url={comment.authorPhoto} name={comment.authorName} size={32} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl px-4 py-3">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{comment.authorName || 'Anonymous'}</span>
            <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{comment.text}</p>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-4 mt-1.5 px-1">
          {user && depth === 0 && (
            <button
              onClick={() => setShowReplyInput(v => !v)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-wavvy-primary2 transition-colors"
            >
              <ArrowUturnLeftIcon className="w-3.5 h-3.5" />
              Reply
            </button>
          )}
          {replyCount > 0 && depth === 0 && (
            <button
              onClick={loadReplies}
              className="flex items-center gap-1 text-xs text-wavvy-primary2 hover:opacity-80 transition-opacity"
            >
              {showReplies ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
              {showReplies ? 'Hide' : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
            </button>
          )}
        </div>

        {/* Reply input */}
        <AnimatePresence>
          {showReplyInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex gap-2 items-center"
            >
              <Avatar url={user.photoURL} name={user.displayName} size={28} className="flex-shrink-0" />
              <input
                autoFocus
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSubmitReply()}
                placeholder={`Reply to ${comment.authorName}...`}
                className="flex-1 input-base text-sm py-1.5"
              />
              <button
                onClick={handleSubmitReply}
                disabled={!replyText.trim() || submitting}
                className="btn-primary px-2.5 py-1.5 disabled:opacity-50"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
              <button onClick={() => setShowReplyInput(false)} className="text-gray-400 hover:text-white text-xs">Cancel</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nested replies */}
        <AnimatePresence>
          {showReplies && replies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-3"
            >
              {replies.map(reply => (
                <CommentItem key={reply.id} comment={reply} postId={postId} user={user} depth={1} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Main Post Page ─────────────────────────────────────────────────────────
export default function PostPage() {
  const router   = useRouter();
  const { id }   = router.query;
  const { user } = useAuth();

  const [post, setPost]                       = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [liked, setLiked]                     = useState(false);
  const [bookmarked, setBookmarked]           = useState(false);
  const [likeCount, setLikeCount]             = useState(0);
  const [comments, setComments]               = useState([]);
  const [commentText, setCommentText]         = useState('');
  const [submittingComment, setSubmitting]    = useState(false);
  const [readProgress, setReadProgress]       = useState(0);
  const [isLiking, setIsLiking]               = useState(false);
  const [authorPhoto, setAuthorPhoto]         = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting]               = useState(false);

  // Reading progress bar
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const prog = el.scrollHeight - el.clientHeight;
      setReadProgress(prog > 0 ? Math.min(100, (el.scrollTop / prog) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fetch post
  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const ref  = doc(db, 'posts', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setPost(data);
          setLikeCount(data.likedBy?.length || data.likes || 0);
          if (user && data.likedBy?.includes(user.uid)) setLiked(true);

          // Fetch author profile
          if (data.authorId) {
            const aSnap = await getDoc(doc(db, 'profiles', data.authorId));
            if (aSnap.exists()) {
              const pd = aSnap.data();
              setAuthorPhoto(pd.photoURL || data.authorPhoto || '');
              if (pd.displayName) setPost(p => ({ ...p, authorName: pd.displayName }));
            } else {
              setAuthorPhoto(data.authorPhoto || '');
            }
          }
          await updateDoc(ref, { views: increment(1) });
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    };
    fetch();
  }, [id, user]);

  // Fetch bookmark state
  useEffect(() => {
    if (!user || !id) return;
    const check = async () => {
      try {
        const snap = await getDoc(doc(db, 'profiles', user.uid));
        if (snap.exists()) setBookmarked((snap.data().bookmarks || []).includes(id));
      } catch (e) { console.error(e); }
    };
    check();
  }, [user, id]);

  // Fetch comments
  useEffect(() => {
    if (!id) return;
    const fetchComments = async () => {
      try {
        const q    = query(collection(db, 'posts', id, 'comments'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) { console.error(e); }
    };
    fetchComments();
  }, [id]);

  const handleLike = async () => {
    if (!user) { router.push('/auth/login'); return; }
    if (isLiking) return;
    setIsLiking(true);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(c => newLiked ? c + 1 : c - 1);
    try {
      await updateDoc(doc(db, 'posts', id), {
        likedBy: newLiked ? arrayUnion(user.uid) : arrayRemove(user.uid),
        likes: increment(newLiked ? 1 : -1),
      });
    } catch (e) {
      setLiked(!newLiked);
      setLikeCount(c => newLiked ? c - 1 : c + 1);
    } finally { setIsLiking(false); }
  };

  const handleBookmark = async () => {
    if (!user) { router.push('/auth/login'); return; }
    const was = bookmarked;
    setBookmarked(!was);
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        bookmarks: was ? arrayRemove(id) : arrayUnion(id),
      });
    } catch (e) { setBookmarked(was); console.error(e); }
  };

  const handleComment = async () => {
    if (!user) { router.push('/auth/login'); return; }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const newComment = {
        text: commentText.trim(),
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhoto: user.photoURL || '',
        createdAt: serverTimestamp(),
        replyCount: 0,
      };
      const docRef = await addDoc(collection(db, 'posts', id, 'comments'), newComment);
      setComments(prev => [{ id: docRef.id, ...newComment, createdAt: { toDate: () => new Date() } }, ...prev]);
      setCommentText('');
      await updateDoc(doc(db, 'posts', id), { commentCount: increment(1) });
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!user || user.uid !== post.authorId) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'posts', id));
      router.push('/');
    } catch (e) { console.error(e); setDeleting(false); }
  };

  const handleShare = () => {
    if (navigator.share) navigator.share({ title: post?.title, url: window.location.href });
    else navigator.clipboard.writeText(window.location.href);
  };

  // ── Render states ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-wavvy-bgDark">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 space-y-6">
          <div className="w-2/3 h-10 skeleton" />
          <div className="w-full h-64 skeleton rounded-2xl" />
          {[1,2,3,4,5].map(i => <div key={i} className="w-full h-4 skeleton" />)}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-wavvy-bgDark flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-grotesk text-2xl font-bold text-white mb-3">Post not found</h2>
          <Link href="/"><button className="btn-primary px-6 py-3">Go home</button></Link>
        </div>
      </div>
    );
  }

  const readTime      = estimateReadingTime(post.content);
  const publishedDate = formatDate(post.createdAt);
  const isAuthor      = user?.uid === post.authorId;

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
      <div id="reading-progress" style={{ width: `${readProgress}%` }} />

      <div className="min-h-screen bg-wavvy-bgLight dark:bg-wavvy-bgDark">
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

          {/* Back + Author actions */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/">
              <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-wavvy-primary2 transition-colors">
                <ArrowLeftIcon className="w-4 h-4" />
                Back to feed
              </button>
            </Link>

            {/* Edit / Delete (only author) */}
            {isAuthor && (
              <div className="flex items-center gap-2">
                <Link href={`/post/edit/${id}`}>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:text-wavvy-primary2 transition-colors">
                    <PencilIcon className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Delete confirmation modal */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <TrashIcon className="w-6 h-6 text-red-400" />
                  </div>
                  <h3 className="font-grotesk text-lg font-bold text-gray-900 dark:text-white text-center mb-2">Delete Post?</h3>
                  <p className="text-sm text-gray-400 text-center mb-6">This action cannot be undone. Your post will be permanently deleted.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 btn-ghost py-2.5 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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

          {/* ── Author + Meta + Actions row ── */}
          <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-gray-200 dark:border-white/[0.06]">
            {/* Author info */}
            <Link href={`/user/${post.authorId}`} className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar
                url={authorPhoto}
                name={post.authorName}
                size={44}
                className="ring-2 ring-wavvy-primary2/20 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm hover:text-wavvy-primary transition-colors truncate">
                  {post.authorName || 'Anonymous'}
                </p>
                {/* Clean meta line */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5 flex-wrap">
                  {publishedDate && <span>{publishedDate}</span>}
                  {publishedDate && <span className="opacity-50">·</span>}
                  <span className="flex items-center gap-0.5">
                    <ClockIcon className="w-3 h-3" />
                    {readTime} min read
                  </span>
                </div>
              </div>
            </Link>

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  liked ? 'bg-wavvy-accent/15 text-wavvy-accent' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-wavvy-accent'
                }`}
              >
                {liked ? <HeartSolid className="w-4 h-4" /> : <HeartIcon className="w-4 h-4" />}
                <span>{likeCount}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
                onClick={handleBookmark}
                className={`p-2 rounded-xl transition-all ${
                  bookmarked ? 'bg-wavvy-primary/15 text-wavvy-primary2' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-wavvy-primary2'
                }`}
                aria-label="Bookmark"
              >
                {bookmarked ? <BookmarkSolid className="w-4 h-4" /> : <BookmarkIcon className="w-4 h-4" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.07 }} whileTap={{ scale: 0.93 }}
                onClick={handleShare}
                className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-wavvy-accent2 transition-colors"
                aria-label="Share"
              >
                <ShareIcon className="w-4 h-4" />
              </motion.button>
            </div>
          </div>

          {/* Media carousel */}
          {(post.mediaItems?.length > 0 || post.coverImage) && (
            <div className="rounded-2xl overflow-hidden mb-10">
              <MediaCarousel
                mediaItems={post.mediaItems}
                coverImage={post.coverImage}
                aspectRatio="aspect-[16/9]"
                showCounter
              />
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

          {/* ── Comment Section ── */}
          <section className="space-y-6">
            <h3 className="font-grotesk text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ChatBubbleLeftIcon className="w-5 h-5" />
              Discussion ({comments.length})
            </h3>

            {/* New comment input */}
            {user ? (
              <div className="flex gap-3">
                <Avatar url={user.photoURL} name={user.displayName} size={36} className="flex-shrink-0 mt-0.5" />
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
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
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
            <div className="space-y-5">
              <AnimatePresence>
                {comments.map(comment => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <CommentItem comment={comment} postId={id} user={user} depth={0} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {comments.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No comments yet. Start the conversation!</p>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}
