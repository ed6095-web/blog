import { useState, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '../lib/cloudinary';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  PhotoIcon,
  TagIcon,
  EyeIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const CATEGORIES = ['Technology', 'Design', 'Culture', 'Health', 'Science', 'Mental Health', 'Startups', 'Climate'];

export default function CreatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const coverInputRef = useRef(null);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  const handlePublish = async () => {
    if (!user) { router.push('/auth/login'); return; }
    if (!title.trim()) { setError('Please add a title.'); return; }
    if (!content.trim()) { setError('Please write some content.'); return; }

    setPublishing(true);
    setError('');
    try {
      let uploadedCoverUrl = coverImage;
      if (coverFile) {
        uploadedCoverUrl = await uploadToCloudinary(coverFile);
      }

      const doc = await addDoc(collection(db, 'posts'), {
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        coverImage: uploadedCoverUrl,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhoto: user.photoURL || '',
        likes: 0,
        commentCount: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.push(`/post/${doc.id}`);
    } catch (e) {
      setError('Failed to publish. Please try again.');
      console.error(e);
    } finally {
      setPublishing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-wavvy-bgDark flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Sign in to write a post.</p>
          <Link href="/auth/login">
            <button className="btn-primary px-6 py-3">Sign In</button>
          </Link>
        </div>
      </div>
    );
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <>
      <Head>
        <title>Write · Wavvy</title>
        <meta name="description" content="Create a new post on Wavvy" />
      </Head>

      <div className="min-h-screen bg-wavvy-bgLight dark:bg-wavvy-bgDark">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-grotesk text-2xl font-bold text-gray-900 dark:text-white">New Story</h1>
              <p className="text-sm text-gray-400 mt-1">
                {wordCount > 0 ? `${wordCount} words · ${readTime} min read` : 'Start writing...'}
                {lastSaved && <span className="ml-2 text-green-400">· Saved</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreview(!preview)}
                className={`btn-ghost text-sm py-2 px-4 flex items-center gap-1.5 ${preview ? 'text-wavvy-primary2 border-wavvy-primary2/50' : ''}`}
              >
                <EyeIcon className="w-4 h-4" />
                {preview ? 'Edit' : 'Preview'}
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePublish}
                disabled={publishing}
                className="btn-primary text-sm py-2 px-5 flex items-center gap-1.5"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
                {publishing ? 'Publishing...' : 'Publish'}
              </motion.button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            {/* Editor */}
            <div className="space-y-4">
              {/* Cover Image Upload */}
              <div 
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-white/[0.06] cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                onClick={() => coverInputRef.current?.click()}
              >
                <PhotoIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCoverFile(file);
                      setCoverImage(URL.createObjectURL(file));
                    }
                  }}
                />
                <span className="flex-1 text-sm text-gray-500 dark:text-gray-400">
                  {coverFile ? coverFile.name : 'Add a cover image...'}
                </span>
              </div>

              {/* Cover preview */}
              {coverImage && (
                <div className="relative rounded-xl overflow-hidden aspect-[16/7]">
                  <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setCoverImage('');
                      setCoverFile(null);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Title */}
              <textarea
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Your story title..."
                rows={2}
                className="w-full resize-none bg-transparent font-grotesk text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-700 outline-none border-none leading-tight"
              />

              <div className="border-t border-gray-200 dark:border-white/[0.06]" />

              {/* Content */}
              {preview ? (
                <div className="post-content min-h-96 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {content || <span className="text-gray-400 italic">Nothing to preview yet.</span>}
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Tell your story... Share what's on your mind. Use paragraphs, quotes, and lists to structure your thoughts."
                  rows={20}
                  className="w-full resize-none bg-transparent text-base leading-relaxed text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none border-none font-inter"
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* AI hint */}
              <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="w-4 h-4 text-wavvy-primary2" />
                  <span className="text-sm font-semibold text-wavvy-primary2">Writing tips</span>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-400">
                  <li>✦ Hook readers in the first sentence</li>
                  <li>✦ Use short paragraphs for readability</li>
                  <li>✦ End with a clear takeaway</li>
                  <li>✦ Add a cover image to increase reads</li>
                </ul>
              </div>

              {/* Category */}
              <div className="rounded-2xl p-4 bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-white/[0.06]">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Category</h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat === category ? '' : cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${
                        category === cat
                          ? 'bg-wavvy-primary text-white'
                          : 'bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="rounded-2xl p-4 bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-white/[0.06]">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <TagIcon className="w-4 h-4" />
                  Tags <span className="text-gray-400 font-normal">({tags.length}/5)</span>
                </h3>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-wavvy-primary/15 text-wavvy-primary2 border border-wavvy-primary/20">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-white">
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                    placeholder="Add a tag..."
                    className="flex-1 bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none focus:border-wavvy-primary2/50"
                    disabled={tags.length >= 5}
                  />
                  <button onClick={addTag} disabled={!tagInput || tags.length >= 5} className="px-3 py-1.5 rounded-lg bg-wavvy-primary/20 text-wavvy-primary2 text-xs font-medium hover:bg-wavvy-primary/30 disabled:opacity-40">
                    Add
                  </button>
                </div>
              </div>

              {/* Stats */}
              {wordCount > 0 && (
                <div className="rounded-2xl p-4 bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-white/[0.06]">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Stats</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Words</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{wordCount}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Reading time</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{readTime} min</span>
                    </div>
                    <div className="flex justify-between text-gray-500 dark:text-gray-400">
                      <span>Characters</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{content.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
