export interface Profile {
  id: string;
  user_id: string;
  name: string;
  age: number;
  weight: number;
  protein_goal: number;
}

export interface ProteinLog {
  id: string;
  user_id: string;
  meal_name: string;
  protein_grams: number;
  logged_at: string;
}

export interface GymAttendance {
  id: string;
  user_id: string;
  date: string;
  attended: boolean;
}

export interface Workout {
  id: string;
  user_id: string;
  workout_name: string;
  logged_at: string;
  workout_sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  set_number: number;
  weight: number;
  reps: number;
}
