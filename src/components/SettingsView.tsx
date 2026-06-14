import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Save, User, Sliders, Volume2, HelpCircle, HardDrive, Trash2, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { UserProfile, TrackerSettings } from '../types';

interface SettingsViewProps {
  profile: UserProfile;
  settings: TrackerSettings;
  onSaveProfile: (profile: UserProfile) => void;
  onSaveSettings: (settings: TrackerSettings) => void;
  onClearHistory: () => void;
}

export default function SettingsView({ profile, settings, onSaveProfile, onSaveSettings, onClearHistory }: SettingsViewProps) {
  // Local profile state
  const [localProfile, setLocalProfile] = useState<UserProfile>({ ...profile });
  const [profileSaved, setProfileSaved] = useState(false);

  // Local settings state
  const [localSettings, setLocalSettings] = useState<TrackerSettings>({ ...settings });
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Handle Profile Save
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(localProfile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  // Handle Settings Save
  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(localSettings);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  // Factory reset calibration angles
  const resetAngles = () => {
    setLocalSettings(prev => ({
      ...prev,
      minDownAngle: 85,
      minUpAngle: 155,
    }));
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Overview */}
      <div>
        <h1 className="text-2xl font-black text-white sm:text-3xl tracking-tight">Settings & Profile</h1>
        <p className="text-zinc-400 text-sm">Customize tracking rules, update your height and weight for calorie tracking, and adjust visual guides.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Profile Form */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <User size={18} />
            </div>
            <div>
              <h2 className="text-md font-bold text-white">User Profile</h2>
              <p className="text-xs text-zinc-500">Calorie computations are precision-tuned on weight, age, and height.</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Display Name</label>
              <input
                type="text"
                value={localProfile.name}
                id="profile-name-input"
                onChange={e => setLocalProfile({ ...localProfile, name: e.target.value })}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white placeholder-zinc-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                placeholder="Enter name"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Age</label>
                <input
                  type="number"
                  value={localProfile.age}
                  id="profile-age-input"
                  onChange={e => setLocalProfile({ ...localProfile, age: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  min="5"
                  max="120"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Weight (kg)</label>
                <input
                  type="number"
                  value={localProfile.weight}
                  id="profile-weight-input"
                  onChange={e => setLocalProfile({ ...localProfile, weight: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  min="20"
                  max="300"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">Height (cm)</label>
                <input
                  type="number"
                  value={localProfile.height}
                  id="profile-height-input"
                  onChange={e => setLocalProfile({ ...localProfile, height: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
                  min="50"
                  max="250"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              {profileSaved && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck size={14} /> Profile saved successfully!
                </span>
              )}
              <button
                type="submit"
                id="btn-save-profile"
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-5 py-2.5 text-xs font-bold text-zinc-950 transition-all active:scale-98 cursor-pointer"
              >
                <Save size={14} />
                Save Profile
              </button>
            </div>
          </form>
        </div>

        {/* AI Tracking Settings */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="rounded-lg bg-teal-500/10 p-2 text-teal-400">
              <Sliders size={18} />
            </div>
            <div>
              <h2 className="text-md font-bold text-white">Tracking & Heuristics</h2>
              <p className="text-xs text-zinc-500">Fine-tune push-up joint angles, camera direction and audio behavior.</p>
            </div>
          </div>

          <form onSubmit={handleSettingsSubmit} className="space-y-5">
            {/* Range of Motion Thresholds */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Calibration Thresholds</span>
                <button
                  type="button"
                  id="btn-reset-calibration"
                  onClick={resetAngles}
                  className="text-[11px] font-bold text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RotateCcw size={11} /> Reset Defaults
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">DOWN Elbow Angle</span>
                    <span className="font-bold text-emerald-400">{localSettings.minDownAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="110"
                    id="slider-down-angle"
                    value={localSettings.minDownAngle}
                    onChange={e => setLocalSettings({ ...localSettings, minDownAngle: parseInt(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-600">Maximum elbow bend to register bottom state. Lower means deeper push-up.</p>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">UP lockout Angle</span>
                    <span className="font-bold text-emerald-400">{localSettings.minUpAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="130"
                    max="175"
                    id="slider-up-angle"
                    value={localSettings.minUpAngle}
                    onChange={e => setLocalSettings({ ...localSettings, minUpAngle: parseInt(e.target.value) })}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-zinc-600">Minimum extension required to count rep. Higher forces stricter lock-out.</p>
                </div>
              </div>
            </div>

            {/* Audio Settings */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3.5">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 size={13} className="text-teal-400" />
                Coach Audio Control
              </span>

              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-medium text-zinc-200">Voice Count Assistance</p>
                  <p className="text-zinc-500 text-[11px]">Speaks your completed repetitions aloud (&quot;One&quot;, &quot;Two&quot;).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.voiceEnabled}
                    onChange={e => setLocalSettings({ ...localSettings, voiceEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-zinc-950"></div>
                </label>
              </div>

              <div className="flex items-center justify-between text-xs border-t border-zinc-800/80 pt-3">
                <div>
                  <p className="font-medium text-zinc-200">Form Coaching Alerts</p>
                  <p className="text-zinc-500 text-[11px]">Real-time warnings: &apos;Go Lower&apos; or &apos;Keep Back Straight&apos;.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.voiceCoachingEnabled}
                    onChange={e => setLocalSettings({ ...localSettings, voiceCoachingEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-zinc-950"></div>
                </label>
              </div>
            </div>

            {/* Tracking Preferences */}
            <div className="grid gap-3 grid-cols-2 text-xs">
              <div>
                <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Tracking Side</label>
                <select
                  value={localSettings.trackingSide}
                  id="select-tracking-side"
                  onChange={e => setLocalSettings({ ...localSettings, trackingSide: e.target.value as any })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-3 text-white focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="auto">Auto (Most visible side)</option>
                  <option value="left">Left Arm Only</option>
                  <option value="right">Right Arm Only</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 font-semibold mb-1.5 uppercase tracking-wider">Webcam Lens</label>
                <select
                  value={localSettings.cameraFacingMode}
                  id="select-facing-mode"
                  onChange={e => setLocalSettings({ ...localSettings, cameraFacingMode: e.target.value as any })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3.5 py-3 text-white focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="user">Front/Selfie</option>
                  <option value="environment">Back/Rear Camera</option>
                </select>
              </div>
            </div>

            <div className="pt-1 flex items-center justify-between">
              {settingsSaved && (
                <span className="text-xs text-teal-400 font-medium flex items-center gap-1">
                  <ShieldCheck size={14} /> Tracking rules updated!
                </span>
              )}
              <button
                type="submit"
                id="btn-save-settings"
                className="ml-auto inline-flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-600 px-5 py-2.5 text-xs font-bold text-zinc-950 transition-all active:scale-98 cursor-pointer"
              >
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* System Admin Tools */}
      <div className="rounded-2xl border border-red-900/40 bg-red-950/10 p-6 space-y-4">
        <h2 className="text-md font-bold text-red-400 flex items-center gap-2">
          <Trash2 size={18} />
          Danger Zone
        </h2>
        <p className="text-xs text-zinc-400">Irreversible actions on local fitness storage. Be careful!</p>
        
        {!showClearConfirm ? (
          <button
            onClick={() => setShowClearConfirm(true)}
            id="btn-confirm-delete-history"
            className="flex items-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 text-xs font-bold text-red-400 border border-red-500/20 transition-all active:scale-98"
          >
            Clear Workout History
          </button>
        ) : (
          <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 space-y-3">
            <p className="text-xs text-red-200 flex items-center gap-1.5 font-semibold">
              <AlertTriangle size={15} /> Are you absolutely sure? This will wipe your historical push-ups stats.
            </p>
            <div className="flex gap-2 text-xs font-bold">
              <button
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                id="btn-final-clear-history"
                className="rounded-lg bg-red-500 hover:bg-red-600 px-4 py-2 text-zinc-950"
              >
                Yes, Clear All History
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                id="btn-cancel-clear-history"
                className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-zinc-300 border border-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
