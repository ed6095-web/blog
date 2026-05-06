import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  EnvelopeIcon,
  GlobeAltIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

const LINKS = [
  {
    title: 'Platform',
    items: [
      { label: 'Home', href: '/' },
      { label: 'Explore', href: '/' },
      { label: 'Write', href: '/create' },
      { label: 'Trending', href: '/' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', href: '/' },
      { label: 'Blog', href: '/' },
      { label: 'Careers', href: '/' },
      { label: 'Press', href: '/' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Privacy', href: '/' },
      { label: 'Terms', href: '/' },
      { label: 'Cookie Policy', href: '/' },
    ],
  },
];

const SOCIALS = [
  { label: 'Twitter', href: '#', icon: '𝕏' },
  { label: 'GitHub', href: '#', icon: '⌥' },
  { label: 'Discord', href: '#', icon: '◎' },
];

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-gray-200/60 dark:border-white/[0.06]">
      {/* Gradient divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-wavvy-gradient opacity-30" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-wavvy-gradient flex items-center justify-center">
                <span className="text-white font-black text-sm font-grotesk">W</span>
              </div>
              <span className="font-grotesk font-bold text-xl gradient-text-static">Wavvy</span>
            </Link>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-xs mb-6">
              The modern home for ideas that move people. Write, share, and discover stories that matter.
            </p>

            {/* Newsletter */}
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Stay in the loop</p>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-white/10">
                  <EnvelopeIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none"
                  />
                </div>
                <button className="btn-primary px-4 py-2 text-sm whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {LINKS.map(({ title, items }) => (
            <div key={title}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
              <ul className="space-y-3">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-wavvy-primary2 dark:hover:text-wavvy-primary2 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gray-200/60 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            Made with <HeartIcon className="w-3 h-3 text-wavvy-accent inline" /> by the Wavvy team · © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-4">
            {SOCIALS.map(({ label, href, icon }) => (
              <motion.a
                key={label}
                href={href}
                whileHover={{ scale: 1.15 }}
                className="w-9 h-9 flex items-center justify-center rounded-xl
                           bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-white/10
                           text-gray-500 dark:text-gray-400 hover:text-wavvy-primary2 dark:hover:text-wavvy-primary2
                           hover:border-wavvy-primary2/30 transition-all text-sm font-bold"
                aria-label={label}
              >
                {icon}
              </motion.a>
            ))}
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <GlobeAltIcon className="w-3.5 h-3.5" />
              English
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
