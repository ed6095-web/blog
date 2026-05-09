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
import { doc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, serverTimestamp, getDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import Avatar from './Avatar';
import MediaCarousel from './MediaCarousel';

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
  const [isLiking, setIsLiking] = useState(false);
  const [authorProfile, setAuthorProfile] = useState(null);
  
  // Backward compatibility: handle both 'likes' integer and 'likedBy' array
  const [likeCount, setLikeCount] = useState(post?.likedBy?.length || post?.likes || 0);

  useEffect(() => {
    if (user && post?.likedBy?.includes(user.uid)) {
      setLiked(true);
    } else {
      setLiked(false);
    }

    if (user) {
      const fetchBookmarkState = async () => {
        try {
          const profileSnap = await getDoc(doc(db, 'profiles', user.uid));
          if (profileSnap.exists()) {
            const bookmarks = profileSnap.data().bookmarks || [];
            setBookmarked(bookmarks.includes(post.id));
          }
        } catch (err) {
          console.error("Error fetching bookmark state:", err);
        }
      };
      fetchBookmarkState();
    } else {
      setBookmarked(false);
    }

    // Always fetch latest author profile to ensure DP is up-to-date
    if (post.authorId) {
      const fetchAuthor = async () => {
        try {
          const snap = await getDoc(doc(db, 'profiles', post.authorId));
          if (snap.exists()) setAuthorProfile(snap.data());
        } catch (err) {
          console.error("Error fetching author profile:", err);
        }
      };
      fetchAuthor();
    }
  }, [user, post.id, post.authorId, post.likedBy]);

  if (!post) return null;

  const categoryColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.default;
  const readTime = estimateReadingTime(post.content);

  const handleLike = async (e) => {
    e.preventDefault();
    if (!user || isLiking) return;
    
    setIsLiking(true);
    const wasLiked = liked;
    
    // Optimistic UI update
    setLiked(!wasLiked);
    setLikeCount(c => !wasLiked ? c + 1 : c - 1);

    try {
      const postRef = doc(db, 'posts', post.id);
      if (!wasLiked) {
        await updateDoc(postRef, { 
          likedBy: arrayUnion(user.uid),
          // Also increment the likes counter for legacy support/sorting
          likes: increment(1)
        });
        
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
        await updateDoc(postRef, { 
          likedBy: arrayRemove(user.uid),
          likes: increment(-1)
        });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert on failure
      setLiked(wasLiked);
      setLikeCount(c => !wasLiked ? c - 1 : c + 1);
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);

    try {
      const profileRef = doc(db, 'profiles', user.uid);
      if (!wasBookmarked) {
        await updateDoc(profileRef, { bookmarks: arrayUnion(post.id) });
      } else {
        await updateDoc(profileRef, { bookmarks: arrayRemove(post.id) });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      setBookmarked(wasBookmarked);
    }
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
        {/* Media Carousel — supports photos & videos */}
        <MediaCarousel
          mediaItems={post.mediaItems}
          coverImage={post.coverImage}
          aspectRatio="aspect-[16/10]"
          showCounter
          className="group-hover:scale-[1.01] transition-transform duration-500"
        />


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
          <Avatar 
            url={authorProfile?.photoURL || post.authorPhoto} 
            name={authorProfile?.displayName || post.authorName} 
            size={28} 
          />
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
