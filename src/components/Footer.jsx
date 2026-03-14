// src/components/Footer.jsx
import { FaGithub, FaInstagram, FaEnvelope } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="
      w-full relative mt-20 z-20
      py-6 px-4 flex flex-col items-center justify-center
      bg-white/70 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/30
      shadow-[0_4px_32px_0_rgba(31,38,135,0.09)]
    ">
      <div className="text-md font-bold tracking-tight bg-gradient-to-tr from-blue-600 via-fuchsia-500 to-purple-500 bg-clip-text text-transparent select-none">
        &copy; {new Date().getFullYear()} Wavvy
      </div>
      <div className="text-xs mt-1 text-gray-500 dark:text-gray-300">
        Made with <span className="text-pink-500">❤</span> by Eashan.
      </div>
      <div className="flex gap-5 mt-2">
        <a 
          href="https://github.com/ed6095-web" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-500 hover:underline underline-offset-4 transition-all text-lg"
        >
          <FaGithub className="text-xl" /> GitHub
        </a>
        <a 
          href="https://www.instagram.com/er.eashan_darsh?igsh=MjhkenFsZThzZHdj" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-400 hover:underline underline-offset-4 transition-all text-lg"
        >
          <FaInstagram className="text-xl" /> Instagram
        </a>
        <a 
  href="https://mail.google.com/mail/?view=cm&to=eashandarsh77@gmail.com" 
  target="_blank"
  rel="noopener noreferrer"
  className="flex items-center gap-1 text-fuchsia-400 hover:underline underline-offset-4 transition-all text-lg"
>
  <FaEnvelope className="text-xl" /> Gmail
</a>

      </div>
    </footer>
  );
}
