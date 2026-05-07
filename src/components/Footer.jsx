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
      { label: 'Write', href: '/create' },
    ],
  },
];

const SOCIALS = [
  { 
    label: 'Instagram', 
    href: 'https://www.instagram.com/eashan_darsh/', 
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
      </svg>
    ) 
  },
  { 
    label: 'LinkedIn', 
    href: 'https://www.linkedin.com/in/eashan-darsh-3137a6324?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app', 
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
      </svg>
    )
  },
  { 
    label: 'GitHub', 
    href: 'https://github.com/ed6095-web', 
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    ) 
  },
  { 
    label: 'Email', 
    href: 'mailto:eashandarsh77@gmail.com', 
    icon: <EnvelopeIcon className="w-4 h-4" /> 
  },
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
            Made with <HeartIcon className="w-3 h-3 text-wavvy-accent inline" /> by Eashan Darsh · © {new Date().getFullYear()}
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
