import { useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { uploadToCloudinary } from '../lib/cloudinary';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MediaCarousel from '../components/MediaCarousel';
import {
  PhotoIcon,
  TagIcon,
  EyeIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  SparklesIcon,
  FilmIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

const CATEGORIES = ['Technology', 'Design', 'Culture', 'Health', 'Science', 'Mental Health', 'Startups', 'Climate'];
const MAX_MEDIA = 50;

function MediaThumb({ item, index, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="relative group flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 border-white/10 cursor-grab active:cursor-grabbing"
    >
      {item.type === 'video' ? (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
          <video src={item.preview} className="w-full h-full object-cover opacity-70" />
          <PlayIcon className="absolute w-8 h-8 text-white opacity-90" />
        </div>
      ) : (
        <img src={item.preview} alt="" className="w-full h-full object-cover" />
      )}
      {/* index badge */}
      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
        <span className="text-white text-[9px] font-bold">{index + 1}</span>
      </div>
      {/* type badge */}
      {item.type === 'video' && (
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60">
          <FilmIcon className="w-3 h-3 text-white" />
        </div>
      )}
      {/* remove */}
      <button
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
      >
        <XMarkIcon className="w-3 h-3 text-white" />
      </button>
    </motion.div>
  );
}

export default function CreatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState('');

  // Media state — each item: { file, preview, type: 'image'|'video' }
  const [mediaItems, setMediaItems] = useState([]);
  const mediaInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0); // 0-100

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  const handleMediaAdd = useCallback((files) => {
    const incoming = Array.from(files);
    const remaining = MAX_MEDIA - mediaItems.length;
    if (remaining <= 0) { setError(`Maximum ${MAX_MEDIA} media items allowed.`); return; }
    const toAdd = incoming.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
    }));
    setMediaItems(prev => [...prev, ...toAdd]);
    if (incoming.length > remaining) {
      setError(`Only ${remaining} more items can be added (max ${MAX_MEDIA}).`);
    }
  }, [mediaItems.length]);

  const removeMedia = (idx) => {
    setMediaItems(prev => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t) && tags.length < 5) setTags([...tags, t]);
    setTagInput('');
  };
  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  const handlePublish = async () => {
    if (!user) { router.push('/auth/login'); return; }
    if (!title.trim()) { setError('Please add a title.'); return; }
    if (!content.trim()) { setError('Please write some content.'); return; }

    setPublishing(true);
    setError('');
    setUploadProgress(0);

    try {
      // Upload all media files to Cloudinary
      const uploaded = [];
      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];
        const url = await uploadToCloudinary(item.file);
        uploaded.push({ url, type: item.type });
        setUploadProgress(Math.round(((i + 1) / mediaItems.length) * 90));
      }

      const docRef = await addDoc(collection(db, 'posts'), {
        title: title.trim(),
        content: content.trim(),
        category,
        tags,
        // first image as cover (for legacy PostCard fallback)
        coverImage: uploaded.find(m => m.type === 'image')?.url || '',
        // full media array for carousel
        mediaItems: uploaded,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhoto: user.photoURL || '',
        likes: 0,
        commentCount: 0,
        views: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setUploadProgress(100);
      router.push(`/post/${docRef.id}`);
    } catch (e) {
      setError('Failed to publish. Please try again.');
      console.error(e);
    } finally {
      setPublishing(false);
      setUploadProgress(0);
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

  // Preview carousel items
  const previewCarouselItems = mediaItems.map(m => ({ url: m.preview, type: m.type }));

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
                className="btn-primary text-sm py-2 px-5 flex items-center gap-1.5 relative overflow-hidden"
              >
                {/* Progress bar inside button */}
                {publishing && uploadProgress > 0 && (
                  <div
                    className="absolute inset-0 bg-white/20 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                )}
                <PaperAirplaneIcon className="w-4 h-4 relative z-10" />
                <span className="relative z-10">
                  {publishing
                    ? uploadProgress > 0
                      ? `Uploading ${uploadProgress}%`
                      : 'Publishing...'
                    : 'Publish'}
                </span>
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

              {/* ── Media Upload Section ── */}
              <div className="rounded-2xl bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-white/[0.06] overflow-hidden">
                {/* Upload bar */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors border-b border-gray-200 dark:border-white/[0.06]"
                  onClick={() => mediaInputRef.current?.click()}
                >
                  <input
                    ref={mediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={e => { handleMediaAdd(e.target.files); e.target.value = ''; }}
                  />
                  <div className="flex items-center gap-2 text-gray-400">
                    <PhotoIcon className="w-5 h-5" />
                    <FilmIcon className="w-5 h-5" />
                  </div>
                  <span className="flex-1 text-sm text-gray-500 dark:text-gray-400">
                    {mediaItems.length === 0
                      ? 'Add photos & videos (up to 50)...'
                      : `${mediaItems.length}/${MAX_MEDIA} media items`}
                  </span>
                  {mediaItems.length < MAX_MEDIA && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-wavvy-primary/10 text-wavvy-primary2 text-xs font-medium">
                      <PlusIcon className="w-3.5 h-3.5" />
                      Add
                    </div>
                  )}
                </div>

                {/* Media grid / drag to reorder */}
                <AnimatePresence>
                  {mediaItems.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-3"
                    >
                      {/* Scrollable thumbnail strip */}
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                        <AnimatePresence>
                          {mediaItems.map((item, idx) => (
                            <MediaThumb
                              key={item.preview}
                              item={item}
                              index={idx}
                              onRemove={removeMedia}
                            />
                          ))}
                        </AnimatePresence>
                        {mediaItems.length < MAX_MEDIA && (
                          <button
                            onClick={() => mediaInputRef.current?.click()}
                            className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-wavvy-primary2/50 hover:text-wavvy-primary2 transition-colors"
                          >
                            <PlusIcon className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Add more</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-2">
                        Drag thumbnails to reorder · First item will be the cover
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Preview carousel (when in preview mode) */}
                <AnimatePresence>
                  {preview && previewCarouselItems.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <MediaCarousel
                        mediaItems={previewCarouselItems}
                        aspectRatio="aspect-[16/9]"
                        showCounter
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

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
                  {content.split('\n').map((line, i) => {
                    if (line.match(/^!\[.*\]\(.*\)$/)) {
                      const url = line.match(/\((.*)\)/)?.[1];
                      return <img key={i} src={url} alt="Post content" className="my-6 rounded-2xl w-full" />;
                    }
                    return <p key={i} className={line ? 'mb-4' : 'h-4'}>{line}</p>;
                  })}
                  {!content && <span className="text-gray-400 italic">Nothing to preview yet.</span>}
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Tell your story... Share what's on your mind."
                  rows={20}
                  className="w-full resize-none bg-transparent text-base leading-relaxed text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none border-none font-inter"
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Tips */}
              <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="w-4 h-4 text-wavvy-primary2" />
                  <span className="text-sm font-semibold text-wavvy-primary2">Media tips</span>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-400">
                  <li>✦ Upload up to 50 photos & videos</li>
                  <li>✦ First item becomes the cover</li>
                  <li>✦ Readers can swipe through your media</li>
                  <li>✦ Mix photos and videos freely</li>
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
                      <span>Media</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{mediaItems.length} items</span>
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
