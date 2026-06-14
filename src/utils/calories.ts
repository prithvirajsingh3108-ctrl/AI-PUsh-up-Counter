import { UserProfile } from '../types';

/**
 * Calculates estimated calorie burn for a push-up workout.
 * Uses MET-based formula adjusted for user profiles.
 * MET for moderate to heavy bodyweight exercises (like push-ups) is ~8.0
 */
export function calculateCalories(reps: number, durationSeconds: number, profile: UserProfile): number {
  if (durationSeconds <= 0) return 0;
  
  const minutes = durationSeconds / 60;
  const weight = profile.weight || 70; // fallback to average 70kg
  
  // MET calorie formula: Calories = MET * 3.5 * Weight(kg) / 200 * Time(min)
  const met = 8.0; 
  const baselineCalories = met * 3.5 * weight / 200 * minutes;
  
  // Scale based on actual work done (speed and count) to make it highly dynamic
  // A person who does 50 reps in 1 min burns more than 5 reps in 1 min.
  // Add 0.25 calories per completed rep.
  const workCalorieFactor = reps * 0.22;
  
  // Blend both factors (50% aerobic time, 50% anaerobic work)
  const totalCalories = (baselineCalories * 0.4) + (workCalorieFactor * 0.6);
  
  // Return rounded to 1 decimal place
  return Math.round(totalCalories * 10) / 10;
}
