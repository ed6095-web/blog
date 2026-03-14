// src/pages/post/[id].jsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Avatar from "../../components/Avatar";
import formatDate from "../../utils/formatDate";

function displayAuthor(post) {
  if (post.authorName && post.authorName.length > 0) return post.authorName;
  if (post.author && post.author.includes("@")) return post.author.split("@")[0];
  if (post.authorEmail && post.authorEmail.includes("@")) return post.authorEmail.split("@")[0];
  return "User";
}

export default function PostDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchPost();
  }, [id]);

  async function fetchPost() {
    setLoading(true);
    const docRef = doc(db, "posts", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setPost({ id: docSnap.id, ...docSnap.data() });
    }
    setLoading(false);
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone!")) {
      return;
    }
    
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "posts", id));
      alert("Post deleted successfully!");
      router.push("/");
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tl from-fuchsia-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-2xl font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-tl from-fuchsia-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Post Not Found</h1>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-fuchsia-500 text-white rounded-xl font-semibold hover:scale-105 transition"
            >
              Go Home
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const hasImages = post.images && post.images.length > 0;
  const isAuthor = user && user.email === post.authorEmail;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-tl from-fuchsia-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-10">
        <article className="bg-white/60 dark:bg-gray-900/80 backdrop-blur-lg border border-fuchsia-200 dark:border-blue-900 shadow-2xl rounded-3xl px-8 py-10">
          {/* Author Info */}
          <div className="flex items-center gap-3 mb-6">
            <Avatar url={post.authorAvatar} name={displayAuthor(post)} size={48} />
            <div className="flex-1">
              <div className="font-bold text-lg text-gray-800 dark:text-gray-100">
                {displayAuthor(post)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(post.createdAt)}
              </div>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 to-fuchsia-500 bg-clip-text text-transparent">
            {post.title}
          </h1>

          {/* Image Gallery */}
          {hasImages && (
            <div className="mb-6">
              {post.images.length === 1 ? (
                <img
                  src={post.images[0]}
                  alt={post.title}
                  className="w-full rounded-2xl shadow-lg"
                />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {post.images.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`${post.title} - Image ${index + 1}`}
                      className="w-full h-64 object-cover rounded-xl shadow-md hover:scale-105 transition cursor-pointer"
                      onClick={() => window.open(img, '_blank')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
          </div>

          {/* Edit & Delete Buttons - Only for author */}
          {isAuthor && (
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => router.push(`/post/edit/${id}`)}
                className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-semibold hover:scale-105 transition shadow-lg"
              >
                ✏️ Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:scale-105 transition shadow-lg ${deleting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {deleting ? "Deleting..." : "🗑️ Delete"}
              </button>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}
