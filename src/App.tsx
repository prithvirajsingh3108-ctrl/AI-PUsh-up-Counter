import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, Dumbbell, History, BarChart3, Settings, Sparkles, Trophy 
} from 'lucide-react';

import { UserProfile, TrackerSettings, WorkoutSession } from './types';
import { 
  getProfile, saveProfile, 
  getSettings, saveSettings, 
  getWorkouts, saveWorkouts, 
  addWorkout, deleteWorkout, 
  clearWorkouts 
} from './utils/storage';

// View Imports
import HomeView from './components/HomeView';
import WorkoutView from './components/WorkoutView';
import HistoryView from './components/HistoryView';
import AnalyticsView from './components/AnalyticsView';
import SettingsView from './components/SettingsView';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<string>('home');

  // Core States
  const [profile, setProfile] = useState<UserProfile>({ name: 'Champion', age: 25, weight: 70, height: 175 });
  const [trackerSettings, setTrackerSettings] = useState<TrackerSettings>({
    minDownAngle: 85,
    minUpAngle: 155,
    voiceEnabled: true,
    voiceCoachingEnabled: true,
    trackingSide: 'auto',
    cameraFacingMode: 'user',
    minConfidence: 0.5
  });
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);

  // Load state on mount
  useEffect(() => {
    setProfile(getProfile());
    setTrackerSettings(getSettings());
    setWorkouts(getWorkouts());
  }, []);

  // Save Handlers
  const handleSaveProfile = (newProfile: UserProfile) => {
    saveProfile(newProfile);
    setProfile(newProfile);
  };

  const handleSaveSettings = (newSettings: TrackerSettings) => {
    saveSettings(newSettings);
    setTrackerSettings(newSettings);
  };

  const handleAddWorkout = (newSession: WorkoutSession) => {
    addWorkout(newSession);
    const updated = getWorkouts();
    setWorkouts(updated);
    setActiveTab('history'); // Automatically flip to history to view newly saved workout!
  };

  const handleDeleteWorkout = (id: string) => {
    deleteWorkout(id);
    setWorkouts(getWorkouts());
  };

  const handleClearHistory = () => {
    clearWorkouts();
    setWorkouts([]);
    setActiveTab('home');
  };

  // Render view depending on active tab
  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeView
            profile={profile}
            workouts={workouts}
            onStartWorkout={() => setActiveTab('workout_active')}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'workout_active':
        return (
          <WorkoutView
            settings={trackerSettings}
            profile={profile}
            onSaveWorkout={handleAddWorkout}
            onCancel={() => setActiveTab('home')}
          />
        );
      case 'history':
        return (
          <HistoryView
            workouts={workouts}
            onDeleteSession={handleDeleteWorkout}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView
            workouts={workouts}
          />
        );
      case 'settings':
        return (
          <SettingsView
            profile={profile}
            settings={trackerSettings}
            onSaveProfile={handleSaveProfile}
            onSaveSettings={handleSaveSettings}
            onClearHistory={handleClearHistory}
          />
        );
      default:
        return <HomeView profile={profile} workouts={workouts} onStartWorkout={() => setActiveTab('workout_active')} onNavigate={setActiveTab} />;
    }
  };

  // Nav Links
  const navItems = [
    { id: 'home', label: 'Dashboard', icon: Home },
    { id: 'history', label: 'Workout Logs', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const inWorkoutSession = activeTab === 'workout_active';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-150 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      
      {/* Top Main Navigation Bar */}
      {!inWorkoutSession && (
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex h-16 items-center justify-between">
            {/* Visual Logo Brand */}
            <div 
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-zinc-950 transition-transform group-hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/10">
                <Dumbbell size={18} className="rotate-25 group-hover:rotate-0 transition-transform duration-300" />
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <span className="font-extrabold text-sm tracking-tight text-white block">PUSHUP<span className="text-emerald-400">AI</span></span>
                  <span className="text-[9px] text-zinc-500 font-bold tracking-widest uppercase block -mt-1">CV COACH</span>
                </div>
                <span className="ml-1 px-1.5 py-0.5 bg-zinc-900 text-emerald-400 text-[9px] font-bold rounded uppercase tracking-wider border border-emerald-400/20">Pro Version</span>
              </div>
            </div>

            {/* Desktop Navigation Menus and User Badge (Medium and larger screens) */}
            <div className="hidden md:flex items-center gap-6">
              <nav className="flex items-center gap-1.5 text-xs font-bold font-sans">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      id={`nav-tab-desktop-${item.id}`}
                      className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 transition-all cursor-pointer ${
                        isActive 
                          ? 'text-white bg-zinc-900 border border-zinc-800' 
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/40 border border-transparent'
                      }`}
                    >
                      <Icon size={14} className={isActive ? 'text-emerald-400' : 'text-zinc-500'} />
                      {item.label}
                      {isActive && (
                        <motion.div 
                          layoutId="activeTabIndicatorDesktop"
                          className="absolute bottom-0 left-4 right-4 h-0.5 bg-emerald-400 rounded-full"
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </button>
                  );
                })}

                <button
                  onClick={() => setActiveTab('workout_active')}
                  id="nav-tab-desktop-workout-cta"
                  className="ml-2 inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4.5 py-2.5 font-bold text-zinc-950 transition-all shadow-xs shrink-0 cursor-pointer active:scale-98"
                >
                  <Dumbbell size={14} />
                  Workout Now
                </button>
              </nav>

              <div className="flex items-center gap-3 border-l border-zinc-850 pl-6 h-8">
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">User Session</p>
                  <p className="text-xs font-bold text-white -mt-0.5">{profile.name}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-linear-to-tr from-emerald-550 to-emerald-400 border border-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-950 font-mono">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Screen Router Render Segment */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 font-sans">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {renderActiveView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Tech Status Footer Bar */}
      {!inWorkoutSession && (
        <footer className="hidden md:flex h-11 px-8 border-t border-zinc-900 bg-zinc-950 items-center justify-between text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">
          <div className="flex gap-4">
            <span>Lat: 34.0522° N</span>
            <span>Lng: 118.2437° W</span>
          </div>
          <div className="flex gap-6">
            <span>Engine: Mediapipe_v1.0</span>
            <span>FPS: 60.0</span>
            <span className="text-emerald-400">AI Model Status: Synchronized</span>
          </div>
        </footer>
      )}

      {/* Responsive Mobile Bottom Tab Bar (Only visible on screens narrower than md, hidden in active video tracking) */}
      {!inWorkoutSession && (
        <div className="md:hidden sticky bottom-0 z-40 bg-zinc-950/95 border-t border-zinc-900 pb-safe shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-4 h-16 text-[10px] font-bold">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  id={`nav-tab-mobile-${item.id}`}
                  className={`flex flex-col items-center justify-center gap-1.5 transition-all ${
                    isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Floater CTA for starting workouts instantly on mobile */}
          <div className="absolute right-4 -top-13">
            <button
              onClick={() => setActiveTab('workout_active')}
              id="fab-start-workout-mobile"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500 text-zinc-950 shadow-xl active:scale-95 transition-transform"
              title="Start workout session"
            >
              <Dumbbell size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
