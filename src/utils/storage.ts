import { UserProfile, WorkoutSession, TrackerSettings } from '../types';

const STORAGE_KEYS = {
  PROFILE: 'pushup_tracker_profile',
  SETTINGS: 'pushup_tracker_settings',
  WORKOUTS: 'pushup_tracker_workouts',
};

// Default structures
const DEFAULT_PROFILE: UserProfile = {
  name: 'Champion',
  age: 25,
  weight: 70, // kg
  height: 175, // cm
};

const DEFAULT_SETTINGS: TrackerSettings = {
  minDownAngle: 85,
  minUpAngle: 155,
  voiceEnabled: true,
  voiceCoachingEnabled: true,
  trackingSide: 'auto',
  cameraFacingMode: 'user',
  minConfidence: 0.5,
};

// Get profile
export function getProfile(): UserProfile {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

// Save profile
export function saveProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile', e);
  }
}

// Get settings
export function getSettings(): TrackerSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Save settings
export function saveSettings(settings: TrackerSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings', e);
  }
}

// Get workouts list
export function getWorkouts(): WorkoutSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
    if (!data) {
      // Seed some dummy workout data to make the charts beautiful initially!
      const seeded = generateDummyWorkouts();
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save workout list
export function saveWorkouts(workouts: WorkoutSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(workouts));
  } catch (e) {
    console.error('Error saving workouts', e);
  }
}

// Add a single workout
export function addWorkout(session: WorkoutSession): void {
  const currentWorkouts = getWorkouts();
  const updated = [session, ...currentWorkouts];
  saveWorkouts(updated);
}

// Delete a workout session
export function deleteWorkout(id: string): void {
  const currentWorkouts = getWorkouts();
  const filtered = currentWorkouts.filter(w => w.id !== id);
  saveWorkouts(filtered);
}

// Reset workouts
export function clearWorkouts(): void {
  saveWorkouts([]);
}

// Seed clean functional data for nice metrics
function generateDummyWorkouts(): WorkoutSession[] {
  const now = new Date();
  const list: WorkoutSession[] = [];
  
  // Create 6 historical entries for the last 6 days
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const reps = [25, 30, 32, 28, 35, 40][5 - i];
    const duration = reps * 2 + Math.floor(Math.random() * 20) + 15; // roughly 2-3 sec per rep
    const calories = reps * 0.45 + (duration / 60) * 4;
    
    list.push({
      id: `seeded-${5-i}`,
      date: d.toISOString(),
      reps,
      duration,
      calories: Math.round(calories * 10) / 10,
      avgPace: Math.round((reps / (duration / 60)) * 10) / 10,
      formAccuracy: 85 + Math.floor(Math.random() * 10),
      incorrectReps: Math.floor(Math.random() * 4),
      warningsCount: {
        "Go Lower": Math.floor(Math.random() * 3),
        "Keep Back Straight": Math.floor(Math.random() * 2),
      }
    });
  }
  return list;
}
