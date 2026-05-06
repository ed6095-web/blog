import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AuthForm from '../../components/AuthForm';
import { useAuth } from '../../context/AuthContext';
import { signup } from '../../lib/auth';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function SignupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const canvasRef = useRef(null);

  useEffect(() => {
    if (user) router.push('/');
  }, [user, router]);

  // Animated canvas background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.4 + 0.1,
    }));
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(236,72,153,${p.alpha})`;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleSubmit = async ({ name, email, password }) => {
    const cred = await signup(email, password);
    if (name && cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Brand Panel */}
      <div className="hidden lg:flex flex-col w-[55%] relative overflow-hidden bg-slate-950">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900/50 via-slate-950/40 to-violet-900/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

        <div className="relative z-10 flex flex-col h-full px-14 py-12">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-wavvy-gradient flex items-center justify-center shadow-glow">
              <span className="text-white font-black text-lg font-grotesk">W</span>
            </div>
            <span className="font-grotesk font-bold text-2xl gradient-text-static">Wavvy</span>
          </Link>

          <div className="flex-1 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
            >
              <h1 className="font-grotesk text-5xl font-black text-white leading-tight mb-6">
                Start writing<br />
                <span className="gradient-text">your story.</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed max-w-md">
                Join thousands of writers who use Wavvy to publish ideas, build
                audiences, and create real impact.
              </p>
            </motion.div>

            {/* Feature list */}
            <motion.ul
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-10 space-y-4"
            >
              {[
                { icon: '✦', text: 'Beautiful, distraction-free writing editor' },
                { icon: '◈', text: 'Reach thousands of engaged readers' },
                { icon: '⬡', text: 'Grow a genuine following around your ideas' },
                { icon: '◎', text: 'Real-time analytics on every post' },
              ].map(({ icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-gray-300 text-sm">
                  <span className="text-wavvy-primary2 text-base">{icon}</span>
                  {text}
                </li>
              ))}
            </motion.ul>
          </div>

          <div className="flex items-center gap-8 pb-4">
            {[['Free', 'Forever'], ['No', 'Ads'], ['You own', 'your content']].map(([val, label]) => (
              <div key={label}>
                <p className="font-grotesk font-bold text-xl text-white">{val}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-slate-950 dark:bg-slate-950 lg:bg-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-wavvy-gradient flex items-center justify-center">
              <span className="text-white font-black text-sm">W</span>
            </div>
            <span className="font-grotesk font-bold text-xl gradient-text-static">Wavvy</span>
          </div>

          <h2 className="font-grotesk text-3xl font-bold text-white mb-2">Create your account</h2>
          <p className="text-gray-400 text-sm mb-8">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-wavvy-primary2 hover:text-wavvy-primary3 font-medium transition-colors">
              Sign in →
            </Link>
          </p>

          <AuthForm
            onSubmit={handleSubmit}
            isSignup={true}
            onSuccess={() => router.push('/')}
          />

          <p className="text-xs text-gray-600 text-center mt-8">
            By signing up, you agree to our{' '}
            <Link href="/" className="text-wavvy-primary2 hover:underline">Terms</Link>
            {' '}and{' '}
            <Link href="/" className="text-wavvy-primary2 hover:underline">Privacy Policy</Link>.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
