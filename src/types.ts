export interface UserProfile {
  name: string;
  age: number;
  weight: number; // in kg
  height: number; // in cm
}

export interface WorkoutSession {
  id: string;
  date: string;
  reps: number;
  duration: number; // in seconds
  calories: number;
  avgPace: number; // reps per minute
  formAccuracy: number; // percentage of correct form reps
  incorrectReps: number;
  warningsCount: { [key: string]: number };
}

export interface TrackerSettings {
  minDownAngle: number; // default 85
  minUpAngle: number; // default 155
  voiceEnabled: boolean;
  voiceCoachingEnabled: boolean;
  trackingSide: 'left' | 'right' | 'auto';
  cameraFacingMode: 'user' | 'environment';
  minConfidence: number; // default 0.5
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}
