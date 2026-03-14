// src/pages/post/edit/[id].jsx
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { uploadImagesToCloudinary } from "../../../lib/cloudinary";
import { useAuth } from "../../../context/AuthContext";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import PostForm from "../../../components/PostForm";

export default function EditPostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!id || !user) return;
    fetchPost();
  }, [id, user]);

  async function fetchPost() {
    setFetching(true);
    const docRef = doc(db, "posts", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const postData = docSnap.data();
      if (postData.authorEmail !== user.email) {
        alert("You can only edit your own posts!");
        router.push("/");
        return;
      }
      setPost({ id: docSnap.id, ...postData });
    } else {
      alert("Post not found!");
      router.push("/");
    }
    setFetching(false);
  }

  async function handleUpdatePost({ title, content, images }) {
    setLoading(true);
    try {
      let imageUrls = [...(post.images || [])];
      
      if (images && images.length > 0) {
        const newImageUrls = await uploadImagesToCloudinary(images);
        imageUrls = [...imageUrls, ...newImageUrls];
      }

      await updateDoc(doc(db, "posts", id), {
        title,
        content,
        images: imageUrls,
        imageCount: imageUrls.length,
      });
      
      alert("Post updated successfully! 🎉");
      router.push(`/post/${id}`);
    } catch (error) {
      alert(`Failed to update post: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    if (typeof window !== "undefined") router.replace("/auth/login");
    return null;
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tl from-fuchsia-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-2xl font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-tl from-fuchsia-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      <main className="flex-1 w-full px-3 py-14 sm:py-20 flex flex-col">
        <div className="text-center mb-10">
          <div className="inline-block mb-2 px-5 py-2 rounded-xl bg-gradient-to-tr from-blue-200 via-fuchsia-200 to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 text-2xl font-extrabold shadow-lg text-blue-600 dark:text-fuchsia-300">
            Edit Your Post ✏️
          </div>
        </div>
        <PostForm
          initialData={{
            title: post.title,
            content: post.content,
            images: post.images || []
          }}
          onSubmit={handleUpdatePost}
          loading={loading}
        />
      </main>
      <Footer />
    </div>
  );
}
