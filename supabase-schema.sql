-- Run this in your Supabase SQL Editor

-- Profiles table
create table if not exists profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null,
  age integer not null,
  weight numeric not null,
  protein_goal integer not null,
  created_at timestamptz default now()
);

-- Protein logs table
create table if not exists protein_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  meal_name text not null,
  protein_grams numeric not null,
  logged_at timestamptz not null default now()
);

-- Gym attendance table
create table if not exists gym_attendance (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  attended boolean not null,
  unique(user_id, date)
);

-- Workouts table
create table if not exists workouts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  workout_name text not null,
  logged_at timestamptz not null default now()
);

-- Workout sets table
create table if not exists workout_sets (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references workouts(id) on delete cascade not null,
  set_number integer not null,
  weight numeric not null,
  reps integer not null
);

-- Enable Row Level Security on all tables
alter table profiles enable row level security;
alter table protein_logs enable row level security;
alter table gym_attendance enable row level security;
alter table workouts enable row level security;
alter table workout_sets enable row level security;

-- RLS Policies: users can only access their own data
create policy "profiles: own data" on profiles for all using (auth.uid() = user_id);
create policy "protein_logs: own data" on protein_logs for all using (auth.uid() = user_id);
create policy "gym_attendance: own data" on gym_attendance for all using (auth.uid() = user_id);
create policy "workouts: own data" on workouts for all using (auth.uid() = user_id);
-- workout_sets: accessible if the parent workout belongs to the user
create policy "workout_sets: own data" on workout_sets for all
  using (exists (select 1 from workouts where workouts.id = workout_sets.workout_id and workouts.user_id = auth.uid()));
