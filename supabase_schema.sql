-- Supabase Schema for Escent
-- Copy and paste this entire file into the Supabase SQL Editor and run it!

-- PROFILES
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text
);
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.profiles for select using (true);
create policy "Users can insert their own profile." on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.profiles for update using (auth.uid() = id);

-- SUBJECTS (Journals)
create table public.subjects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  color text not null
);
alter table public.subjects enable row level security;
create policy "Subjects are viewable by everyone." on public.subjects for select using (true);
create policy "Users can insert own subjects." on public.subjects for insert with check (auth.uid() = user_id);
create policy "Users can update own subjects." on public.subjects for update using (auth.uid() = user_id);
create policy "Users can delete own subjects." on public.subjects for delete using (auth.uid() = user_id);

-- POSTS
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject_id uuid references public.subjects(id) on delete cascade not null,
  title text not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.posts enable row level security;
create policy "Posts are viewable by everyone." on public.posts for select using (true);
create policy "Users can insert own posts." on public.posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts." on public.posts for update using (auth.uid() = user_id);
create policy "Users can delete own posts." on public.posts for delete using (auth.uid() = user_id);

-- SECTIONS (Questions & Answers within a post)
create table public.post_sections (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  question text not null,
  answer text,
  asked_by text -- username of the person who asked
);
alter table public.post_sections enable row level security;
create policy "Sections are viewable by everyone." on public.post_sections for select using (true);
create policy "Users can insert sections to any post." on public.post_sections for insert with check (true);
create policy "Users can update sections on their own post." on public.post_sections for update using (
  exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
);
create policy "Users can delete sections on their own post." on public.post_sections for delete using (
  exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
);

-- COMMENTS
create table public.post_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.post_comments enable row level security;
create policy "Comments are viewable by everyone." on public.post_comments for select using (true);
create policy "Users can insert comments." on public.post_comments for insert with check (auth.uid() = author_id);
create policy "Users can delete own comments." on public.post_comments for delete using (auth.uid() = author_id);
create policy "Post owners can delete comments on their posts." on public.post_comments for delete using (
  exists (select 1 from public.posts where id = post_id and user_id = auth.uid())
);

-- FOLLOWS
create table public.follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  status text not null check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id)
);
alter table public.follows enable row level security;
create policy "Follows are viewable by everyone." on public.follows for select using (true);
create policy "Users can create follow requests." on public.follows for insert with check (auth.uid() = follower_id);
create policy "Users can accept/decline follow requests to them." on public.follows for update using (auth.uid() = following_id);
create policy "Users can delete their own follow requests." on public.follows for delete using (auth.uid() = follower_id);
create policy "Users can remove followers." on public.follows for delete using (auth.uid() = following_id);
