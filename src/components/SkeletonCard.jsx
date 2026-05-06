import { motion } from 'framer-motion';

export default function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white dark:bg-slate-800/60 border border-gray-200/60 dark:border-white/[0.06]">
      <div className="aspect-[16/9] skeleton-light dark:skeleton w-full" />
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-16 h-5 rounded-full skeleton-light dark:skeleton" />
          <div className="w-20 h-5 rounded-full skeleton-light dark:skeleton" />
        </div>
        <div className="w-full h-6 rounded-lg skeleton-light dark:skeleton" />
        <div className="w-4/5 h-6 rounded-lg skeleton-light dark:skeleton" />
        <div className="w-full h-4 rounded-lg skeleton-light dark:skeleton" />
        <div className="w-3/4 h-4 rounded-lg skeleton-light dark:skeleton" />
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full skeleton-light dark:skeleton" />
            <div className="w-24 h-4 rounded-full skeleton-light dark:skeleton" />
          </div>
          <div className="w-20 h-4 rounded-full skeleton-light dark:skeleton" />
        </div>
      </div>
    </div>
  );
}
