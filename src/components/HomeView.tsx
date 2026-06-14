import React from 'react';
import { motion } from 'motion/react';
import { Dumbbell, Flame, Trophy, Calendar, Info, Play, ChevronRight, Sparkles, Download, ExternalLink, Monitor } from 'lucide-react';
import { WorkoutSession, UserProfile } from '../types';

interface HomeViewProps {
  profile: UserProfile;
  workouts: WorkoutSession[];
  onStartWorkout: () => void;
  onNavigate: (tab: string) => void;
}

export default function HomeView({ profile, workouts, onStartWorkout, onNavigate }: HomeViewProps) {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isIframe, setIsIframe] = React.useState<boolean>(false);
  const [isInstalled, setIsInstalled] = React.useState<boolean>(false);

  React.useEffect(() => {
    setIsIframe(window.self !== window.top);
    setIsInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Installation dialog can also be opened via Google Chrome's address bar. Look for the 'Install App' icon (monitor/arrow icon) at the right side of your Chrome URL address bar, or click Chrome Menu (⋮) > 'Save and share' > 'Install page'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const handleOpenNewTab = () => {
    const directUrl = window.location.href;
    window.open(directUrl, '_blank');
  };

  // Calculate stats
  const totalWorkouts = workouts.length;
  const totalReps = workouts.reduce((acc, curr) => acc + curr.reps, 0);
  const maxRepSession = workouts.length > 0 ? Math.max(...workouts.map(w => w.reps)) : 0;
  
  // Calculate streak
  const calculateStreak = () => {
    if (workouts.length === 0) return 0;
    
    const sortedDates = [...workouts]
      .map(w => new Date(w.date).toDateString())
      .filter((v, i, a) => a.indexOf(v) === i); // unique dates
      
    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();
    
    // Check if user worked out today or yesterday to continue streak
    if (!sortedDates.includes(today) && !sortedDates.includes(yesterdayStr)) {
      return 0;
    }
    
    let checkDate = new Date();
    if (!sortedDates.includes(today)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    while (sortedDates.includes(checkDate.toDateString())) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    return streak;
  };
  
  const streak = calculateStreak();

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-emerald-600 to-teal-500 p-8 text-white shadow-xl">
        <div className="absolute right-0 bottom-0 translate-x-6 translate-y-6 opacity-10">
          <Dumbbell size={250} />
        </div>
        <div className="relative z-10 max-w-lg space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3.5 py-1 text-xs font-semibold backdrop-blur-xs"
          >
            <Sparkles size={14} className="text-amber-300" />
            AI-Powered Fitness Coach
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Welcome back, {profile.name}!
            </h1>
            <p className="text-emerald-50 text-sm sm:text-base">
              Ready to crush your workout? Let the AI track your form and count your push-ups perfectly with real-time audio coaching.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onStartWorkout}
              id="cta-start-workout-hero"
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-teal-900 transition-all hover:bg-teal-50 hover:shadow-lg active:scale-98"
            >
              <Play size={18} fill="currentColor" />
              Start Push-Up Session
              <ChevronRight size={18} className="translate-x-0 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Install App Helper Banner */}
      {!isInstalled && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/20 bg-zinc-950 p-6 shadow-xl">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-400">
            <Monitor size={120} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Install Desktop Application</span>
              </div>
              <h2 className="text-lg font-bold text-white font-sans tracking-tight">
                Use PushUp Tracker AI as a Native Laptop App
              </h2>
              {isIframe ? (
                <p className="text-xs text-zinc-400 leading-relaxed">
                  We noticed you are currently using this app inside the Google AI Studio preview frame. To install it directly on your laptop, <strong>open the app in a new tab</strong> first!
                </p>
              ) : (
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Install this tracker to run fullscreen, gain automatic offline capability, fast startup, and native camera permission integration with zero browser bar clutter.
                </p>
              )}
            </div>
            
            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              {isIframe ? (
                <button
                  onClick={handleOpenNewTab}
                  id="cta-open-new-tab"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 py-3 text-xs font-bold text-zinc-950 transition-all cursor-pointer active:scale-98 shadow-md shadow-emerald-500/10"
                >
                  <ExternalLink size={14} />
                  Open in New Tab & Install
                </button>
              ) : (
                <button
                  onClick={handleInstallClick}
                  id="cta-trigger-pwa-install"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 py-3 text-xs font-bold text-zinc-950 transition-all cursor-pointer active:scale-98 shadow-md shadow-emerald-500/10"
                >
                  <Download size={14} />
                  Install App on Laptop
                </button>
              )}
            </div>
          </div>
          {!isIframe && !deferredPrompt && (
            <p className="mt-3 text-[10px] text-zinc-500 leading-relaxed border-t border-zinc-900 pt-3">
              💡 <strong>Chrome Install Guide</strong>: If the install button doesn&apos;t trigger mechanical browser popups, look for the <strong>App Install icon</strong> (monitor with down arrow) in the right-side of your Google Chrome address URL bar, or click Chrome Menu <strong>(⋮) &gt; &apos;Save and share&apos; &gt; &apos;Install page&apos;</strong>.
            </p>
          )}
        </div>
      )}

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Streak */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-orange-500/10 p-2.5 text-orange-500">
              <Flame size={20} fill="currentColor" />
            </div>
            <span className="text-xs text-zinc-400 font-medium">Daily Streak</span>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-white">{streak}</span>
            <span className="text-xs text-zinc-500 font-semibold">{streak === 1 ? 'day' : 'days'}</span>
          </div>
        </div>

        {/* Max Reps */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-500">
              <Trophy size={20} />
            </div>
            <span className="text-xs text-zinc-400 font-medium">Personal Best</span>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-white">{maxRepSession}</span>
            <span className="text-xs text-zinc-500 font-semibold">reps</span>
          </div>
        </div>

        {/* Total Reps */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
              <Dumbbell size={20} />
            </div>
            <span className="text-xs text-zinc-400 font-medium">Total Lifetime reps</span>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-white">{totalReps}</span>
            <span className="text-xs text-zinc-500 font-semibold">push-ups</span>
          </div>
        </div>

        {/* Total Sessions */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-500">
              <Calendar size={20} />
            </div>
            <span className="text-xs text-zinc-400 font-medium">Sessions</span>
          </div>
          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="text-3xl font-bold tracking-tight text-white">{totalWorkouts}</span>
            <span className="text-xs text-zinc-500 font-semibold">workouts</span>
          </div>
        </div>
      </div>

      {/* Guide & Camera setup tips */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: Setup steps */}
        <div className="md:col-span-2 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Info size={18} className="text-emerald-500" />
            Camera Calibration & Setup Guide
          </h2>
          
          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-xl bg-zinc-900 p-4 space-y-2 border border-zinc-800/50">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold">1</div>
              <p className="font-semibold text-zinc-200">Side View Position</p>
              <p className="text-zinc-400 leading-relaxed">Place your camera 4-6 feet away, level with your body height when down. Side views offer the best tracking accuracy.</p>
            </div>
            
            <div className="rounded-xl bg-zinc-900 p-4 space-y-2 border border-zinc-800/50">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold">2</div>
              <p className="font-semibold text-zinc-200">Full Body Framing</p>
              <p className="text-zinc-400 leading-relaxed">Ensure your head, shoulders, elbows, hips, knees, and feet are visible inside the frame so the AI can track your overall form.</p>
            </div>
            
            <div className="rounded-xl bg-zinc-900 p-4 space-y-2 border border-zinc-800/50">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 font-bold">3</div>
              <p className="font-semibold text-zinc-200">Good Lighting</p>
              <p className="text-zinc-400 leading-relaxed">Ensure you are in a well-lit room. Avoid bright backlights directly behind you that make your outline silhouetted.</p>
            </div>
          </div>
        </div>

        {/* Right column: Form tips */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
          <h2 className="text-sm font-bold tracking-wider text-zinc-400 uppercase">Correct Push-Up Form</h2>
          <ul className="space-y-3.5 text-xs text-zinc-300">
            <li className="flex gap-2.5">
              <span className="mt-0.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span><strong>Plank Line</strong>: Keep landmarked points (Shoulders, Hips, Knees) in a straight line. Do not sag your back or peak your hips!</span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span><strong>Elbow Depth</strong>: Go all the way down until your elbows bend below <strong className="text-emerald-400">85°</strong>. The coach will alert you to &apos;Go Lower&apos; if needed.</span>
            </li>
            <li className="flex gap-2.5">
              <span className="mt-0.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span><strong>Full Lockout</strong>: Return all the way to the top. Push up until your arms are fully extended (<strong className="text-emerald-400">&gt; 155°</strong>).</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom CTA for stats */}
      {workouts.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-zinc-900/30 border border-zinc-800/60 p-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-zinc-300 font-medium">Completed {totalWorkouts} sessions this season.</span>
          </div>
          <button 
            onClick={() => onNavigate('history')}
            className="text-emerald-400 font-semibold hover:text-emerald-300 flex items-center gap-1 group"
          >
            Review History
            <ChevronRight size={16} className="translate-x-0 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}
    </div>
  );
}
