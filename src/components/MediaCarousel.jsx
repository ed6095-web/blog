import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon, PlayIcon } from '@heroicons/react/24/solid';
import { FilmIcon } from '@heroicons/react/24/outline';

/**
 * Instagram-style swipeable media carousel.
 * Supports photos and videos. Uses CSS scroll-snap for native feel on mobile.
 *
 * Props:
 *  mediaItems  – array of { url: string, type: 'image' | 'video' }
 *  coverImage  – string (fallback if mediaItems is empty)
 *  aspectRatio – tailwind class, default 'aspect-[4/3]'
 *  showCounter – show "1/5" counter top-right (default true)
 *  className   – extra wrapper classes
 */
export default function MediaCarousel({
  mediaItems = [],
  coverImage = '',
  aspectRatio = 'aspect-[4/3]',
  showCounter = true,
  className = '',
}) {
  const items = mediaItems?.length
    ? mediaItems
    : coverImage
    ? [{ url: coverImage, type: 'image' }]
    : [];

  const trackRef = useRef(null);
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [playingIdx, setPlayingIdx] = useState(null);
  const videoRefs = useRef([]);

  // Sync scroll position → current index
  const onScroll = useCallback(() => {
    if (!trackRef.current) return;
    const { scrollLeft, clientWidth } = trackRef.current;
    const idx = Math.round(scrollLeft / clientWidth);
    setCurrent(idx);
    // Pause any video that's no longer current
    if (playingIdx !== null && playingIdx !== idx) {
      videoRefs.current[playingIdx]?.pause();
      setPlayingIdx(null);
    }
  }, [playingIdx]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  const scrollTo = (idx) => {
    if (!trackRef.current) return;
    const clamped = Math.max(0, Math.min(idx, items.length - 1));
    trackRef.current.scrollTo({ left: clamped * trackRef.current.clientWidth, behavior: 'smooth' });
    setCurrent(clamped);
  };

  const handleVideoClick = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    const video = videoRefs.current[idx];
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlayingIdx(idx);
    } else {
      video.pause();
      setPlayingIdx(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className={`${aspectRatio} w-full bg-gradient-to-br from-wavvy-primary/20 via-wavvy-accent/15 to-wavvy-accent2/20 flex items-center justify-center ${className}`}>
        <div className="w-16 h-16 rounded-2xl bg-wavvy-gradient opacity-30" />
      </div>
    );
  }

  const isMulti = items.length > 1;

  return (
    <div className={`relative w-full ${aspectRatio} overflow-hidden select-none ${className}`}>
      {/* Scroll track */}
      <div
        ref={trackRef}
        className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            className="relative flex-shrink-0 w-full h-full snap-center snap-always overflow-hidden"
          >
            {item.type === 'video' ? (
              <>
                <video
                  ref={el => videoRefs.current[idx] = el}
                  src={item.url}
                  className="w-full h-full object-cover"
                  playsInline
                  loop
                  preload="metadata"
                  onClick={e => handleVideoClick(e, idx)}
                />
                {/* Play/Pause overlay */}
                <AnimatePresence>
                  {playingIdx !== idx && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <PlayIcon className="w-7 h-7 text-white ml-1" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Video badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
                  <FilmIcon className="w-3 h-3 text-white" />
                  <span className="text-white text-[10px] font-medium">Video</span>
                </div>
              </>
            ) : (
              <img
                src={item.url}
                alt={`Media ${idx + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading={idx === 0 ? 'eager' : 'lazy'}
              />
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Counter badge top-right */}
      {isMulti && showCounter && (
        <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm z-10">
          <span className="text-white text-[11px] font-semibold">{current + 1}/{items.length}</span>
        </div>
      )}

      {/* Prev / Next arrows (desktop) */}
      {isMulti && (
        <>
          <AnimatePresence>
            {current > 0 && (
              <motion.button
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                onClick={e => { e.preventDefault(); scrollTo(current - 1); }}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                aria-label="Previous"
              >
                <ChevronLeftIcon className="w-4 h-4 text-white" />
              </motion.button>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {current < items.length - 1 && (
              <motion.button
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 6 }}
                onClick={e => { e.preventDefault(); scrollTo(current + 1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                aria-label="Next"
              >
                <ChevronRightIcon className="w-4 h-4 text-white" />
              </motion.button>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Dot indicators bottom-center */}
      {isMulti && items.length <= 12 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={e => { e.preventDefault(); scrollTo(idx); }}
              className={`rounded-full transition-all duration-200 ${
                idx === current
                  ? 'w-4 h-1.5 bg-white'
                  : 'w-1.5 h-1.5 bg-white/50'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
