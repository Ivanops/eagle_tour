create extension if not exists pgcrypto;

do $$
begin
  create type public.player_gender as enum ('femenino', 'masculino');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.player_role as enum ('player', 'organizer', 'super');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.tournament_gender as enum ('femenino', 'masculino', 'mixto');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.tournament_status as enum ('abierto', 'cerrado', 'finalizado');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.match_status as enum ('por_jugar', 'finalizado');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  gender public.player_gender not null,
  role public.player_role not null default 'player',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tournament_date date,
  location text not null,
  level text not null,
  gender public.tournament_gender not null default 'mixto',
  status public.tournament_status not null default 'abierto',
  access_code text not null,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tournaments
drop constraint if exists tournaments_access_code_format_check;

alter table public.tournaments
add constraint tournaments_access_code_format_check
check (access_code ~ '^[0-9]{4}$') not valid;

create table if not exists public.tournament_players (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (tournament_id, player_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  round text not null,
  court text not null default 'Cancha por confirmar',
  starts_at timestamptz,
  pair_a_player_1_id uuid not null references public.profiles (id),
  pair_a_player_2_id uuid not null references public.profiles (id),
  pair_b_player_1_id uuid not null references public.profiles (id),
  pair_b_player_2_id uuid not null references public.profiles (id),
  status public.match_status not null default 'por_jugar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.match_sets (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  set_number integer not null check (set_number between 1 and 5),
  pair_a_games integer not null default 0 check (pair_a_games between 0 and 99),
  pair_b_games integer not null default 0 check (pair_b_games between 0 and 99),
  unique (match_id, set_number)
);

create table if not exists public.match_acceptances (
  match_id uuid not null references public.matches (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  accepted_at timestamptz not null default now(),
  primary key (match_id, player_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_super_user()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'super'
  );
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_tournaments_updated_at on public.tournaments;
create trigger set_tournaments_updated_at
before update on public.tournaments
for each row execute function public.set_updated_at();

drop trigger if exists set_matches_updated_at on public.matches;
create trigger set_matches_updated_at
before update on public.matches
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_players enable row level security;
alter table public.matches enable row level security;
alter table public.match_sets enable row level security;
alter table public.match_acceptances enable row level security;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
create policy "Profiles are readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Super users can update non-super profiles" on public.profiles;
create policy "Super users can update non-super profiles"
on public.profiles for update
to authenticated
using (public.is_super_user() and role <> 'super')
with check (public.is_super_user() and role <> 'super');

drop policy if exists "Tournaments are readable by authenticated users" on public.tournaments;
create policy "Tournaments are readable by authenticated users"
on public.tournaments for select
to authenticated
using (true);

drop policy if exists "Organizers can create tournaments" on public.tournaments;
create policy "Organizers can create tournaments"
on public.tournaments for insert
to authenticated
with check (
  auth.uid() = creator_id
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role in ('organizer', 'super')
  )
);

drop policy if exists "Creators can update tournaments" on public.tournaments;
create policy "Creators can update tournaments"
on public.tournaments for update
to authenticated
using (auth.uid() = creator_id)
with check (auth.uid() = creator_id);

drop policy if exists "Creators can delete tournaments" on public.tournaments;
create policy "Creators can delete tournaments"
on public.tournaments for delete
to authenticated
using (auth.uid() = creator_id);

drop policy if exists "Tournament players are readable by authenticated users" on public.tournament_players;
create policy "Tournament players are readable by authenticated users"
on public.tournament_players for select
to authenticated
using (true);

drop policy if exists "Users can join themselves to tournaments" on public.tournament_players;
drop policy if exists "Tournament creators can assign players" on public.tournament_players;
create policy "Users can join themselves to tournaments"
on public.tournament_players for insert
to authenticated
with check (
  auth.uid() = player_id
  and exists (
    select 1
    from public.tournaments
    where tournaments.id = tournament_players.tournament_id
      and tournaments.status = 'abierto'
  )
);

drop policy if exists "Tournament creators can remove players" on public.tournament_players;
drop policy if exists "Creators or players can remove tournament players" on public.tournament_players;
create policy "Creators or players can remove tournament players"
on public.tournament_players for delete
to authenticated
using (
  exists (
    select 1
    from public.tournaments
    where tournaments.id = tournament_players.tournament_id
      and tournaments.status = 'abierto'
      and (
        tournaments.creator_id = auth.uid()
        or tournament_players.player_id = auth.uid()
      )
  )
);

drop policy if exists "Matches are readable by authenticated users" on public.matches;
create policy "Matches are readable by authenticated users"
on public.matches for select
to authenticated
using (true);

drop policy if exists "Tournament creators can manage matches" on public.matches;
create policy "Tournament creators can manage matches"
on public.matches for all
to authenticated
using (
  exists (
    select 1
    from public.tournaments
    where tournaments.id = matches.tournament_id
      and tournaments.creator_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.tournaments
    where tournaments.id = matches.tournament_id
      and tournaments.creator_id = auth.uid()
  )
);

drop policy if exists "Match players can update their matches" on public.matches;
create policy "Match players can update their matches"
on public.matches for update
to authenticated
using (
  auth.uid() in (
    pair_a_player_1_id,
    pair_a_player_2_id,
    pair_b_player_1_id,
    pair_b_player_2_id
  )
)
with check (
  auth.uid() in (
    pair_a_player_1_id,
    pair_a_player_2_id,
    pair_b_player_1_id,
    pair_b_player_2_id
  )
);

drop policy if exists "Match sets are readable by authenticated users" on public.match_sets;
create policy "Match sets are readable by authenticated users"
on public.match_sets for select
to authenticated
using (true);

drop policy if exists "Match players can manage sets" on public.match_sets;
create policy "Match players can manage sets"
on public.match_sets for all
to authenticated
using (
  exists (
    select 1
    from public.matches
    where matches.id = match_sets.match_id
      and auth.uid() in (
        matches.pair_a_player_1_id,
        matches.pair_a_player_2_id,
        matches.pair_b_player_1_id,
        matches.pair_b_player_2_id
      )
  )
)
with check (
  exists (
    select 1
    from public.matches
    where matches.id = match_sets.match_id
      and auth.uid() in (
        matches.pair_a_player_1_id,
        matches.pair_a_player_2_id,
        matches.pair_b_player_1_id,
        matches.pair_b_player_2_id
      )
  )
);

drop policy if exists "Tournament creators can manage match sets" on public.match_sets;
create policy "Tournament creators can manage match sets"
on public.match_sets for all
to authenticated
using (
  exists (
    select 1
    from public.matches
    join public.tournaments on tournaments.id = matches.tournament_id
    where matches.id = match_sets.match_id
      and tournaments.creator_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.matches
    join public.tournaments on tournaments.id = matches.tournament_id
    where matches.id = match_sets.match_id
      and tournaments.creator_id = auth.uid()
  )
);

drop policy if exists "Match acceptances are readable by authenticated users" on public.match_acceptances;
create policy "Match acceptances are readable by authenticated users"
on public.match_acceptances for select
to authenticated
using (true);

drop policy if exists "Match players can accept their own result" on public.match_acceptances;
create policy "Match players can accept their own result"
on public.match_acceptances for insert
to authenticated
with check (
  auth.uid() = player_id
  and exists (
    select 1
    from public.matches
    where matches.id = match_acceptances.match_id
      and auth.uid() in (
        matches.pair_a_player_1_id,
        matches.pair_a_player_2_id,
        matches.pair_b_player_1_id,
        matches.pair_b_player_2_id
      )
  )
);

drop policy if exists "Match players can revoke their own acceptance" on public.match_acceptances;
create policy "Match players can revoke their own acceptance"
on public.match_acceptances for delete
to authenticated
using (auth.uid() = player_id);
