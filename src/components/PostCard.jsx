import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  HeartIcon,
  ChatBubbleLeftIcon,
  BookmarkIcon,
  EyeIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid,
} from '@heroicons/react/24/solid';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const CATEGORY_COLORS = {
  Technology: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  Design:     'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  Culture:    'bg-pink-500/15 text-pink-400 border border-pink-500/20',
  Health:     'bg-green-500/15 text-green-400 border border-green-500/20',
  Science:    'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
  default:    'bg-violet-500/15 text-violet-400 border border-violet-500/20',
};

function estimateReadingTime(content = '') {
  const words = content.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return `${minutes} min read`;
}

function formatDate(ts) {
  if (!ts) return '';
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return format(date, 'MMM d');
  } catch {
    return '';
  }
}

export default function PostCard({ post }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  
  // Backward compatibility: handle both 'likes' integer and 'likedBy' array
  const [likeCount, setLikeCount] = useState(post?.likedBy?.length || post?.likes || 0);

  useEffect(() => {
    if (user && post?.likedBy?.includes(user.uid)) {
      setLiked(true);
    } else {
      setLiked(false);
    }
  }, [user, post]);

  if (!post) return null;

  const categoryColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.default;
  const readTime = estimateReadingTime(post.content);

  const handleLike = async (e) => {
    e.preventDefault();
    if (!user) return; // Must be logged in to like
    
    // Optimistic UI update
    setLiked(v => !v);
    setLikeCount(c => !liked ? c + 1 : c - 1);

    try {
      const postRef = doc(db, 'posts', post.id);
      if (!liked) {
        await updateDoc(postRef, { likedBy: arrayUnion(user.uid) });
        if (user.uid !== post.authorId) {
          await addDoc(collection(db, 'notifications'), {
            recipientId: post.authorId,
            senderId: user.uid,
            type: 'like',
            text: `${user.displayName || 'Someone'} liked your post "${post.title}"`,
            link: `/post/${post.id}`,
            createdAt: serverTimestamp(),
            read: false
          });
        }
      } else {
        await updateDoc(postRef, { likedBy: arrayRemove(user.uid) });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert on failure
      setLiked(v => !v);
      setLikeCount(c => !liked ? c - 1 : c + 1);
    }
  };

  const handleBookmark = (e) => {
    e.preventDefault();
    setBookmarked(v => !v);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-800/60
                 border border-gray-200/60 dark:border-white/[0.06]
                 shadow-card hover:shadow-card-hover transition-shadow duration-300"
    >
      <Link href={`/post/${post.id}`} className="flex flex-col flex-1">
        {/* Cover Image */}
        {post.coverImage ? (
          <div className="relative w-full aspect-[16/10] overflow-hidden">
            <img
              src={post.coverImage}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        ) : (
          <div className="w-full aspect-[16/10] bg-gradient-to-br from-wavvy-primary/20 via-wavvy-accent/15 to-wavvy-accent2/20 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-wavvy-gradient opacity-30" />
          </div>
        )}

        <div className="flex flex-col flex-1 p-5">
          {/* Category + read time */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {post.category && (
              <span className={`badge text-[11px] ${categoryColor}`}>
                {post.category}
              </span>
            )}
            {post.tags?.slice(0, 1).map(tag => (
              <span key={tag} className="badge bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400 text-[11px]">
                #{tag}
              </span>
            ))}
            <span className="ml-auto flex items-center gap-1 text-[11px] text-gray-400">
              <ClockIcon className="w-3 h-3" />
              {readTime}
            </span>
          </div>

          {/* Title */}
          <h2 className="font-grotesk font-bold text-lg leading-snug text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-wavvy-primary2 transition-colors duration-200">
            {post.title}
          </h2>

          {/* Excerpt */}
          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed flex-1">
            {post.content?.replace(/<[^>]+>/g, '') || ''}
          </p>
        </div>
      </Link>

      {/* Footer */}
      <div className="px-5 pb-4 flex items-center justify-between mt-auto">
        {/* Author */}
        <Link href={`/user/${post.authorId}`} className="flex items-center gap-2 min-w-0 group/author" onClick={(e) => e.stopPropagation()}>
          {post.authorPhoto ? (
            <img src={post.authorPhoto} alt={post.authorName} className="w-7 h-7 rounded-full object-cover flex-shrink-0 ring-2 ring-transparent group-hover/author:ring-wavvy-primary transition-all" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-wavvy-gradient flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-transparent group-hover/author:ring-wavvy-primary transition-all">
              {(post.authorName || '?')[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate group-hover/author:text-wavvy-primary transition-colors">{post.authorName || 'Anonymous'}</p>
            <p className="text-[11px] text-gray-400">{formatDate(post.createdAt)}</p>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleLike}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-wavvy-accent transition-colors"
            aria-label="Like"
          >
            {liked
              ? <HeartSolid className="w-4 h-4 text-wavvy-accent" />
              : <HeartIcon className="w-4 h-4" />}
            <span>{likeCount}</span>
          </button>
          <button
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-wavvy-accent2 transition-colors"
            aria-label="Comments"
          >
            <ChatBubbleLeftIcon className="w-4 h-4" />
            <span>{post.commentCount || 0}</span>
          </button>
          <button
            onClick={handleBookmark}
            className="text-gray-400 hover:text-wavvy-primary2 transition-colors"
            aria-label="Bookmark"
          >
            {bookmarked
              ? <BookmarkSolid className="w-4 h-4 text-wavvy-primary2" />
              : <BookmarkIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
