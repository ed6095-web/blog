// src/pages/create.jsx
import { useState } from "react";
import { useRouter } from "next/router";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { uploadImagesToCloudinary } from "../lib/cloudinary";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PostForm from "../components/PostForm";

export default function CreatePostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!user) {
    if (typeof window !== "undefined") {
      router.replace("/auth/login");
    }
    return null;
  }

  async function handleCreatePost({ title, content, images }) {
    setLoading(true);
    try {
      let imageUrls = [];
      
      // Upload images to Cloudinary
      if (images && images.length > 0) {
        console.log("Uploading images to Cloudinary...");
        imageUrls = await uploadImagesToCloudinary(images);
        console.log("Images uploaded:", imageUrls);
      }

      // Create post with image URLs
      await addDoc(collection(db, "posts"), {
        title,
        content,
        images: imageUrls,
        imageCount: imageUrls.length,
        author: user.email.split("@")[0],
        authorEmail: user.email,
        authorAvatar: user.photoURL || "",
        createdAt: serverTimestamp(),
      });
      
      alert("Post created successfully! 🎉");
      router.push("/");
    } catch (error) {
      console.error("Error creating post:", error);
      alert(`Failed to create post: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-tl from-fuchsia-50 via-blue-50 to-purple-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navbar />
      <main className="flex-1 w-full px-3 py-14 sm:py-20 flex flex-col">
        <div className="text-center mb-10">
          <div className="inline-block mb-2 px-5 py-2 rounded-xl bg-gradient-to-tr from-blue-200 via-fuchsia-200 to-blue-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 text-2xl font-extrabold shadow-lg text-blue-600 dark:text-fuchsia-300 animate-fade-in">
            Write Something Epic ✨
          </div>
          <p className="max-w-lg mx-auto mt-3 text-gray-500 dark:text-gray-200 text-lg animate-fade-in delay-150">
            Unleash your best ideas—every post inspires the world!  
          </p>
        </div>
        <PostForm onSubmit={handleCreatePost} loading={loading} />
      </main>
      <Footer />
    </div>
  );
}
