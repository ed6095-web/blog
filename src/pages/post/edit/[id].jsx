import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useCallback } from 'react';
import Head from 'next/head';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { uploadToCloudinary } from '../../../lib/cloudinary';
import { useAuth } from '../../../context/AuthContext';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import MediaCarousel from '../../../components/MediaCarousel';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowLeftIcon, PaperAirplaneIcon, EyeIcon,
  PhotoIcon, FilmIcon, XMarkIcon, PlusIcon,
  TagIcon, SparklesIcon, CheckCircleIcon, ClockIcon,
} from '@heroicons/react/24/outline';

const CATEGORIES = ['Technology', 'Design', 'Culture', 'Health', 'Science', 'Mental Health', 'Startups', 'Climate'];
const MAX_MEDIA = 50;

function MediaThumb({ item, index, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="relative group flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 border-white/10"
    >
      {item.type === 'video' ? (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center relative">
          <video src={item.url || item.preview} className="w-full h-full object-cover opacity-70" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
              <FilmIcon className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      ) : (
        <img src={item.url || item.preview} alt="" className="w-full h-full object-cover" />
      )}
      {/* Index badge */}
      <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
        <span className="text-white text-[9px] font-bold">{index + 1}</span>
      </div>
      {/* Remove button */}
      <button
        onClick={() => onRemove(index)}
        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
      >
        <XMarkIcon className="w-3 h-3 text-white" />
      </button>
    </motion.div>
  );
}

export default function EditPostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id }  = router.query;

  const [fetching, setFetching]       = useState(true);
  const [post, setPost]               = useState(null);

  // Editable fields
  const [title, setTitle]             = useState('');
  const [content, setContent]         = useState('');
  const [category, setCategory]       = useState('');
  const [tags, setTags]               = useState([]);
  const [tagInput, setTagInput]       = useState('');

  // Media — items can be { url, type } (existing) or { file, preview, type } (new)
  const [mediaItems, setMediaItems]   = useState([]);
  const [removedUrls, setRemovedUrls] = useState([]); // track removed existing

  const [saving, setSaving]           = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState('');
  const [preview, setPreview]         = useState(false);

  const mediaInputRef = useRef(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readTime  = Math.max(1, Math.round(wordCount / 200));

  // ── Fetch post ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id || authLoading) return;
    if (!user) { router.replace('/auth/login'); return; }

    const fetch = async () => {
      setFetching(true);
      try {
        const snap = await getDoc(doc(db, 'posts', id));
        if (!snap.exists()) { router.replace('/'); return; }

        const data = snap.data();

        // ── Auth check: compare by UID (the correct field) ──
        if (data.authorId !== user.uid) {
          setError("You don't have permission to edit this post.");
          setFetching(false);
          return;
        }

        setPost({ id: snap.id, ...data });
        setTitle(data.title || '');
        setContent(data.content || '');
        setCategory(data.category || '');
        setTags(data.tags || []);

        // Populate media items from existing mediaItems or coverImage
        if (data.mediaItems?.length > 0) {
          setMediaItems(data.mediaItems.map(m => ({ url: m.url, type: m.type, existing: true })));
        } else if (data.coverImage) {
          setMediaItems([{ url: data.coverImage, type: 'image', existing: true }]);
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load post. Please try again.');
      } finally {
        setFetching(false);
      }
    };
    fetch();
  }, [id, user, authLoading]);

  // ── Media handlers ────────────────────────────────────────────────────
  const handleMediaAdd = useCallback((files) => {
    const incoming  = Array.from(files);
    const remaining = MAX_MEDIA - mediaItems.length;
    if (remaining <= 0) { setError(`Maximum ${MAX_MEDIA} media items allowed.`); return; }
    const toAdd = incoming.slice(0, remaining).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' : 'image',
      existing: false,
    }));
    setMediaItems(prev => [...prev, ...toAdd]);
    if (incoming.length > remaining) setError(`Only ${remaining} more items can be added.`);
  }, [mediaItems.length]);

  const removeMedia = (idx) => {
    setMediaItems(prev => {
      const item = prev[idx];
      if (!item.existing && item.preview) URL.revokeObjectURL(item.preview);
      if (item.existing) setRemovedUrls(r => [...r, item.url]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t) && tags.length < 5) setTags(prev => [...prev, t]);
    setTagInput('');
  };
  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  // ── Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!title.trim()) { setError('Please add a title.'); return; }
    if (!content.trim()) { setError('Please write some content.'); return; }

    setSaving(true);
    setError('');
    setUploadProgress(0);

    try {
      const finalMedia = [];

      for (let i = 0; i < mediaItems.length; i++) {
        const item = mediaItems[i];
        if (item.existing) {
          finalMedia.push({ url: item.url, type: item.type });
        } else {
          const url = await uploadToCloudinary(item.file);
          finalMedia.push({ url, type: item.type });
        }
        setUploadProgress(Math.round(((i + 1) / mediaItems.length) * 90));
      }

      await updateDoc(doc(db, 'posts', id), {
        title:      title.trim(),
        content:    content.trim(),
        category,
        tags,
        mediaItems: finalMedia,
        coverImage: finalMedia.find(m => m.type === 'image')?.url || '',
        updatedAt:  serverTimestamp(),
      });

      setUploadProgress(100);
      setSaved(true);
      setTimeout(() => router.push(`/post/${id}`), 1200);
    } catch (e) {
      console.error(e);
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  // ── Preview carousel items ────────────────────────────────────────────
  const previewCarouselItems = mediaItems.map(m => ({
    url: m.url || m.preview,
    type: m.type,
  }));

  // ── Render states ─────────────────────────────────────────────────────
  if (authLoading || fetching) {
    return (
      <div className="min-h-screen bg-wavvy-bgDark flex items-center justify-center">
        <Navbar />
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-wavvy-primary2 border-t-transparent animate-spin" />
          <p className="text-gray-400 text-sm">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error && !post) {
    return (
      <div className="min-h-screen bg-wavvy-bgDark flex items-center justify-center">
        <Navbar />
        <div className="text-center px-4">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <Link href="/"><button className="btn-primary px-6 py-3">Go Home</button></Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Post · Wavvy</title>
        <meta name="description" content="Edit your post on Wavvy" />
      </Head>

      <div className="min-h-screen bg-wavvy-bgLight dark:bg-wavvy-bgDark">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Link href={`/post/${id}`}>
                <button className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-wavvy-primary2 transition-colors">
                  <ArrowLeftIcon className="w-4 h-4" />
                </button>
              </Link>
              <div>
                <h1 className="font-grotesk text-2xl font-bold text-gray-900 dark:text-white">Edit Post</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {wordCount > 0 ? `${wordCount} words · ${readTime} min read` : 'Make your changes...'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreview(!preview)}
                className={`btn-ghost text-sm py-2 px-4 flex items-center gap-1.5 ${preview ? 'text-wavvy-primary2' : ''}`}
              >
                <EyeIcon className="w-4 h-4" />
                {preview ? 'Edit' : 'Preview'}
              </button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving || saved}
                className="btn-primary text-sm py-2 px-5 flex items-center gap-1.5 relative overflow-hidden disabled:opacity-80"
              >
                {/* Upload progress bar */}
                {saving && uploadProgress > 0 && (
                  <div
                    className="absolute inset-0 bg-white/20 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {saved
                    ? <><CheckCircleIcon className="w-4 h-4" /> Saved!</>
                    : saving
                      ? uploadProgress > 0
                        ? `Uploading ${uploadProgress}%`
                        : 'Saving...'
                      : <><PaperAirplaneIcon className="w-4 h-4" /> Save Changes</>
                  }
                </span>
              </motion.button>
            </div>
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between"
              >
                {error}
                <button onClick={() => setError('')} className="ml-2"><XMarkIcon className="w-4 h-4" /></button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

            {/* ── Left: Editor ── */}
            <div className="space-y-4">

              {/* Media section */}
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
                      ? 'Add photos & videos...'
                      : `${mediaItems.length}/${MAX_MEDIA} media items`}
                  </span>
                  {mediaItems.length < MAX_MEDIA && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-wavvy-primary/10 text-wavvy-primary2 text-xs font-medium">
                      <PlusIcon className="w-3.5 h-3.5" /> Add
                    </div>
                  )}
                </div>

                {/* Thumbnail strip */}
                <AnimatePresence>
                  {mediaItems.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="p-3"
                    >
                      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                        <AnimatePresence>
                          {mediaItems.map((item, idx) => (
                            <MediaThumb
                              key={item.url || item.preview}
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
                      <p className="text-[11px] text-gray-400 mt-2">Click × to remove · First item becomes the cover</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Preview carousel */}
                <AnimatePresence>
                  {preview && previewCarouselItems.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <MediaCarousel mediaItems={previewCarouselItems} aspectRatio="aspect-[16/9]" showCounter />
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
                  {content.split('\n').map((line, i) => (
                    <p key={i} className={line ? 'mb-4' : 'h-4'}>{line}</p>
                  ))}
                  {!content && <span className="text-gray-400 italic">Nothing to preview yet.</span>}
                </div>
              ) : (
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Tell your story..."
                  rows={20}
                  className="w-full resize-none bg-transparent text-base leading-relaxed text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none border-none"
                />
              )}
            </div>

            {/* ── Right: Sidebar ── */}
            <div className="space-y-4">

              {/* Tip card */}
              <div className="rounded-2xl p-4 bg-gradient-to-br from-violet-500/10 to-pink-500/10 border border-violet-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <SparklesIcon className="w-4 h-4 text-wavvy-primary2" />
                  <span className="text-sm font-semibold text-wavvy-primary2">Editing tips</span>
                </div>
                <ul className="space-y-1.5 text-xs text-gray-400">
                  <li>✦ Existing media is preserved unless removed</li>
                  <li>✦ Add new photos or videos freely</li>
                  <li>✦ Changes go live immediately after saving</li>
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
                      <button onClick={() => removeTag(tag)}><XMarkIcon className="w-3 h-3" /></button>
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
                  <button
                    onClick={addTag}
                    disabled={!tagInput || tags.length >= 5}
                    className="px-3 py-1.5 rounded-lg bg-wavvy-primary/20 text-wavvy-primary2 text-xs font-medium hover:bg-wavvy-primary/30 disabled:opacity-40"
                  >
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
                      <span>Read time</span>
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
