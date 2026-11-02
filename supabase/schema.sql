-- ============================================================
-- PathForge Database Schema
-- Run this in Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS
-- ============================================================
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null unique,
  college text,
  branch text,
  semester integer,
  target_role text, -- 'SDE' | 'ML Engineer' | 'Data Analyst' | 'DevOps' | 'PM'
  target_companies text[] default '{}',
  current_skills text[] default '{}',
  cgpa numeric(3,1) default 0,
  tier text default 'free', -- 'free' | 'premium'
  college_tier text, -- 'tier1' | 'tier2' | 'tier3'
  xp integer default 0,
  streak integer default 0,
  last_active timestamptz default now(),
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table public.users enable row level security;
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- ============================================================
-- ROADMAP
-- ============================================================
create table if not exists public.roadmap_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  weeks_json jsonb not null,
  generated_at timestamptz default now(),
  version integer default 1
);

create table if not exists public.roadmap_tasks (
  id uuid default uuid_generate_v4() primary key,
  plan_id uuid references public.roadmap_plans(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  week_number integer not null,
  title text not null,
  type text, -- 'dsa' | 'course' | 'project' | 'aptitude' | 'revision'
  resource_link text,
  estimated_hours numeric(3,1),
  status text default 'pending', -- 'pending' | 'completed' | 'skipped'
  completed_at timestamptz
);

alter table public.roadmap_plans enable row level security;
create policy "Users manage own roadmap plans" on public.roadmap_plans for all using (auth.uid() = user_id);

alter table public.roadmap_tasks enable row level security;
create policy "Users manage own roadmap tasks" on public.roadmap_tasks for all using (auth.uid() = user_id);

-- ============================================================
-- ACADEMIC
-- ============================================================
create table if not exists public.semesters (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  semester_number integer not null,
  year integer not null,
  created_at timestamptz default now()
);

create table if not exists public.subjects (
  id uuid default uuid_generate_v4() primary key,
  semester_id uuid references public.semesters(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  credits integer not null,
  grade text, -- 'O','A+','A','B+','B','C','P','F'
  grade_points numeric(3,1)
);

alter table public.semesters enable row level security;
create policy "Users manage own semesters" on public.semesters for all using (auth.uid() = user_id);

alter table public.subjects enable row level security;
create policy "Users manage own subjects" on public.subjects for all using (auth.uid() = user_id);

-- ============================================================
-- DSA
-- ============================================================
create table if not exists public.dsa_sheets (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  total_problems integer not null
);

create table if not exists public.dsa_problems (
  id uuid default uuid_generate_v4() primary key,
  sheet_id uuid references public.dsa_sheets(id) on delete cascade not null,
  title text not null,
  topic text not null,
  difficulty text not null, -- 'Easy' | 'Medium' | 'Hard'
  lc_link text,
  gfg_link text,
  order_index integer not null
);

create table if not exists public.dsa_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  problem_id uuid references public.dsa_problems(id) on delete cascade not null,
  status text not null, -- 'solved' | 'skip' | 'revisit'
  solved_at timestamptz default now(),
  unique(user_id, problem_id)
);

-- DSA sheets are public read
alter table public.dsa_sheets enable row level security;
create policy "Anyone can read DSA sheets" on public.dsa_sheets for select using (true);

alter table public.dsa_problems enable row level security;
create policy "Anyone can read DSA problems" on public.dsa_problems for select using (true);

alter table public.dsa_progress enable row level security;
create policy "Users manage own DSA progress" on public.dsa_progress for all using (auth.uid() = user_id);

-- ============================================================
-- COURSES
-- ============================================================
create table if not exists public.courses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  url text,
  platform text, -- 'Udemy' | 'YouTube' | 'NPTEL' | 'Coursera' | 'Other'
  total_sections integer not null default 1,
  completed_sections integer not null default 0,
  last_updated timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.courses enable row level security;
create policy "Users manage own courses" on public.courses for all using (auth.uid() = user_id);

-- ============================================================
-- READINESS SCORES
-- ============================================================
create table if not exists public.readiness_scores (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  score numeric(5,2) not null,
  cgpa_score numeric(5,2),
  dsa_score numeric(5,2),
  course_score numeric(5,2),
  project_score numeric(5,2),
  aptitude_score numeric(5,2),
  calculated_at timestamptz default now()
);

alter table public.readiness_scores enable row level security;
create policy "Users manage own readiness scores" on public.readiness_scores for all using (auth.uid() = user_id);

-- ============================================================
-- SOCIAL
-- ============================================================
create table if not exists public.friendships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  friend_id uuid references public.users(id) on delete cascade not null,
  status text default 'pending', -- 'pending' | 'accepted'
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

create table if not exists public.activity_feed (
  id uuid default uuid_generate_v4() primary key,
  actor_id uuid references public.users(id) on delete cascade not null,
  action_type text not null, -- 'dsa_solved' | 'course_progress' | 'challenge_won' | 'streak'
  metadata_json jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.friendships enable row level security;
create policy "Users manage own friendships" on public.friendships for all using (auth.uid() = user_id or auth.uid() = friend_id);

alter table public.activity_feed enable row level security;
create policy "Users can insert own activity" on public.activity_feed for insert with check (auth.uid() = actor_id);
create policy "Users can read own and friends activity" on public.activity_feed for select using (
  auth.uid() = actor_id or
  actor_id in (
    select friend_id from public.friendships where user_id = auth.uid() and status = 'accepted'
  )
);

-- ============================================================
-- CHALLENGES
-- ============================================================
create table if not exists public.challenges (
  id uuid default uuid_generate_v4() primary key,
  creator_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  type text not null, -- 'dsa_count' | 'course_percent' | 'readiness_score' | 'streak'
  goal_value numeric not null,
  deadline timestamptz not null,
  status text default 'active', -- 'active' | 'completed'
  created_at timestamptz default now()
);

create table if not exists public.challenge_participants (
  id uuid default uuid_generate_v4() primary key,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  progress numeric default 0,
  completed boolean default false,
  joined_at timestamptz default now(),
  unique(challenge_id, user_id)
);

alter table public.challenges enable row level security;
create policy "Users can read challenges they participate in" on public.challenges for select using (
  auth.uid() = creator_id or
  id in (select challenge_id from public.challenge_participants where user_id = auth.uid())
);
create policy "Users can create challenges" on public.challenges for insert with check (auth.uid() = creator_id);
create policy "Users can update own challenges" on public.challenges for update using (auth.uid() = creator_id);

alter table public.challenge_participants enable row level security;
create policy "Users manage own challenge participation" on public.challenge_participants for all using (auth.uid() = user_id);
create policy "Challenge creators can view participants" on public.challenge_participants for select using (
  challenge_id in (select id from public.challenges where creator_id = auth.uid())
);

-- ============================================================
-- QUESTS
-- ============================================================
create table if not exists public.quests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  type text not null, -- 'solo' | 'group'
  goal_value numeric not null,
  progress numeric default 0,
  xp_reward integer not null,
  deadline timestamptz,
  status text default 'active' -- 'active' | 'completed' | 'failed'
);

alter table public.quests enable row level security;
create policy "Users manage own quests" on public.quests for all using (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  type text not null, -- 'nudge' | 'challenge' | 'friend_request' | 'quest' | 'checkin'
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;
create policy "Users manage own notifications" on public.notifications for all using (auth.uid() = user_id);

-- ============================================================
-- REALTIME (enable for these tables in Supabase dashboard)
-- activity_feed, challenge_participants, notifications
-- ============================================================

-- ============================================================
-- FUNCTION: increment XP for a user
-- ============================================================
create or replace function public.increment_xp(p_user_id uuid, p_amount integer)
returns void as $$
begin
  update public.users
  set xp = xp + p_amount
  where id = p_user_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- TRIGGER: auto-create user profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
