import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRightIcon,
  FireIcon,
  PencilIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { SparklesIcon } from '@heroicons/react/24/solid';

const TOPICS = ['Technology', 'Design', 'Culture', 'Health', 'Science', 'Mental Health', 'Startups', 'Climate'];

const STATS = [
  { value: '12K+', label: 'Posts published' },
  { value: '4.2K', label: 'Active writers' },
  { value: '89K+', label: 'Monthly readers' },
];

// Floating particle component
function Particle({ style, size = 8, color }) {
  return (
    <div
      className="particle"
      style={{
        width: size,
        height: size,
        background: color,
        ...style,
      }}
    />
  );
}

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const itemVariants = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export default function HeroSection({ onTopicSelect }) {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex flex-col justify-center pt-8 pb-16">
      {/* Background */}
      <div className="absolute inset-0 bg-wavvy-radial dark:opacity-100 opacity-0 -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-violet-50/80 via-white to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 -z-10" />

      {/* Decorative glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-wavvy-primary/10 dark:bg-wavvy-primary/20 blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-wavvy-accent/10 dark:bg-wavvy-accent/20 blur-[80px] pointer-events-none -z-10" />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
        <Particle style={{ top: '15%', left: '8%', animationDelay: '0s' }} size={10} color="rgba(124,58,237,0.5)" />
        <Particle style={{ top: '25%', right: '12%', animationDelay: '1s' }} size={6} color="rgba(236,72,153,0.5)" />
        <Particle style={{ top: '55%', left: '5%', animationDelay: '2s' }} size={8} color="rgba(59,130,246,0.5)" />
        <Particle style={{ top: '70%', right: '8%', animationDelay: '0.5s' }} size={12} color="rgba(168,85,247,0.4)" />
        <Particle style={{ top: '40%', left: '45%', animationDelay: '1.5s' }} size={5} color="rgba(236,72,153,0.35)" />
        <Particle style={{ top: '10%', right: '30%', animationDelay: '2.5s' }} size={7} color="rgba(124,58,237,0.4)" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center gap-8"
        >
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass dark:glass border border-white/20 text-sm font-medium text-gray-700 dark:text-gray-300">
              <SparklesIcon className="w-4 h-4 text-wavvy-primary2" />
              The next generation of social publishing
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div variants={itemVariants} className="max-w-4xl">
            <h1 className="font-grotesk text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight text-gray-900 dark:text-white">
              Share ideas that{' '}
              <span className="gradient-text">actually matter.</span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="max-w-2xl text-lg sm:text-xl text-gray-500 dark:text-gray-400 leading-relaxed font-inter"
          >
            Wavvy is where writers, thinkers, and creators come to publish bold ideas,
            build an audience, and spark conversations that drive real change.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/create">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary px-8 py-4 text-base flex items-center gap-2 shadow-glow"
              >
                <PencilIcon className="w-5 h-5" />
                Start Writing Free
              </motion.button>
            </Link>
            <Link href="#feed">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-ghost px-8 py-4 text-base flex items-center gap-2"
              >
                Explore Stories
                <ArrowRightIcon className="w-4 h-4" />
              </motion.button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div variants={itemVariants} className="flex items-center gap-8 sm:gap-12 pt-2">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="font-grotesk text-2xl sm:text-3xl font-bold gradient-text-static">{value}</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>

          {/* Trending Topics */}
          <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FireIcon className="w-4 h-4 text-orange-400" />
              <span>Trending topics</span>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {TOPICS.map((topic) => (
                <motion.button
                  key={topic}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onTopicSelect && onTopicSelect(topic)}
                  className="px-4 py-1.5 rounded-full text-sm font-medium
                             bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10
                             text-gray-600 dark:text-gray-300
                             hover:border-wavvy-primary2/50 hover:text-wavvy-primary2
                             dark:hover:border-wavvy-primary2/40 dark:hover:text-wavvy-primary2
                             transition-all duration-200 shadow-sm"
                >
                  {topic}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
