-- 1. Profiles table (Safe creation)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  username text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for profiles (Drop and Re-create to ensure latest)
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile." on public.profiles;
create policy "Users can update their own profile." on public.profiles
  for update using (auth.uid() = id);

-- 2. Trips table (Safe creation)
create table if not exists public.trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  destination text not null,
  start_date date,
  end_date date,
  metadata jsonb default '{}'::jsonb,
  points jsonb default '[]'::jsonb,
  custom_files jsonb default '[]'::jsonb,
  analyzed_files jsonb default '[]'::jsonb,
  speech_data jsonb default '[]'::jsonb,
  completed_items jsonb default '{}'::jsonb,
  user_reviews jsonb default '{}'::jsonb,
  user_logs jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up RLS for trips (Drop and Re-create)
alter table public.trips enable row level security;

drop policy if exists "Users can view their own trips." on public.trips;
create policy "Users can view their own trips." on public.trips
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their own trips." on public.trips;
create policy "Users can insert their own trips." on public.trips
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their own trips." on public.trips;
create policy "Users can update their own trips." on public.trips
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete their own trips." on public.trips;
create policy "Users can delete their own trips." on public.trips
  for delete using (auth.uid() = user_id);

-- 3. Shared Trips table (Already used in code, let's ensure it exists)
create table if not exists public.shared_trips (
  id uuid default gen_random_uuid() primary key,
  trip_data jsonb not null,
  title text,
  destination text,
  created_at timestamp with time zone default now()
);

-- Public access for shared trips
alter table public.shared_trips enable row level security;
drop policy if exists "Anyone can view shared trips" on public.shared_trips;
create policy "Anyone can view shared trips" on public.shared_trips for select using (true);
drop policy if exists "Anyone can create shared trips" on public.shared_trips;
create policy "Anyone can create shared trips" on public.shared_trips for insert with check (true);

-- 4. Trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trips_updated_at on public.trips;
create trigger trips_updated_at
  before update on public.trips
  for each row execute procedure public.handle_updated_at();

-- 5. Automatically create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, new.email);
  return new;
end;
$$ language plpgsql;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
