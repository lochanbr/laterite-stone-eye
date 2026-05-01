
-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Inspections table
create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  image_path text not null,
  grade text not null check (grade in ('A','B','C','D')),
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index inspections_user_id_created_at_idx on public.inspections (user_id, created_at desc);

alter table public.inspections enable row level security;

create policy "Users can view own inspections" on public.inspections
  for select using (auth.uid() = user_id);
create policy "Users can insert own inspections" on public.inspections
  for insert with check (auth.uid() = user_id);
create policy "Users can delete own inspections" on public.inspections
  for delete using (auth.uid() = user_id);

-- Storage bucket for inspection images (private)
insert into storage.buckets (id, name, public) values ('inspection-images', 'inspection-images', false);

create policy "Users can upload own inspection images"
  on storage.objects for insert
  with check (bucket_id = 'inspection-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own inspection images"
  on storage.objects for select
  using (bucket_id = 'inspection-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own inspection images"
  on storage.objects for delete
  using (bucket_id = 'inspection-images' and auth.uid()::text = (storage.foldername(name))[1]);
