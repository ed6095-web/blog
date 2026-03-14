// src/components/PostCard.jsx
import Link from "next/link";
import formatDate from "../utils/formatDate";
import Avatar from "./Avatar";

const emojis = ["🔥", "💡", "📚", "🎨", "🚀", "🥑", "🦄", "🌸", "🎮", "🤖"];
function getPostEmoji(postId) {
  let idx = (postId || "").split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % emojis.length;
  return emojis[idx];
}

function displayAuthor(post) {
  if (post.authorName && post.authorName.length > 0) return post.authorName;
  if (post.author && post.author.includes("@")) return post.author.split("@")[0];
  if (post.authorEmail && post.authorEmail.includes("@")) return post.authorEmail.split("@")[0];
  return "User";
}

export default function PostCard({ post }) {
  const hasImages = post.images && post.images.length > 0;

  return (
    <div className="flex flex-col gap-2 bg-white/60 dark:bg-gray-900/75 rounded-2xl px-6 py-5 shadow-lg border border-gray-200 dark:border-gray-800 relative overflow-hidden z-10 min-h-[480px]">
      {/* Big fun emoji */}
      <span className="absolute left-3 top-3 text-3xl select-none opacity-85 drop-shadow">
        {getPostEmoji(post.id)}
      </span>
      
      {/* Author, time */}
      <div className="flex items-center gap-2 mb-3 mt-2">
        <Avatar url={post.authorAvatar} name={displayAuthor(post)} size={32} />
        <span className="font-semibold text-sm text-gray-700 dark:text-gray-200 truncate">
          {displayAuthor(post)}
        </span>
        <span className="text-xs text-blue-400 dark:text-pink-200 ml-auto">{formatDate(post.createdAt)}</span>
      </div>

      <Link href={`/post/${post.id}`} legacyBehavior>
        <a className="block">
          <h2 className="text-lg sm:text-xl font-bold mb-1 bg-gradient-to-r from-blue-600 to-fuchsia-500 bg-clip-text text-transparent hover:underline max-w-full transition">
            {post.title}
          </h2>
        </a>
      </Link>

      {/* Image Preview - Show first image if exists */}
      {hasImages && (
        <div className="my-3 -mx-2">
          <img
            src={post.images[0]}
            alt={post.title}
            className="w-full h-48 object-cover rounded-xl shadow-md"
          />
          {post.images.length > 1 && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              +{post.images.length - 1} more image{post.images.length > 2 ? 's' : ''}
            </div>
          )}
        </div>
      )}

      {/* Content - Flexible spacing */}
      <div className="flex-1 flex flex-col justify-between">
        <p className={`text-gray-600 dark:text-gray-200 text-base mb-3 ${hasImages ? 'line-clamp-2' : 'line-clamp-5'}`}>
          {post.content}
        </p>
        
        <Link
          href={`/post/${post.id}`}
          className="text-sm px-3 py-1 bg-gradient-to-r from-blue-400 via-pink-400 to-blue-400 rounded-xl text-white font-medium hover:scale-105 shadow-md inline-block border-2 border-transparent hover:border-fuchsia-300 dark:hover:border-blue-300 transition-all w-fit"
        >
          Read More →
        </Link>
      </div>
    </div>
  );
}
