-- Comptes de Cap Études : à exécuter une fois dans Supabase › SQL Editor.
-- Chaque personne connectée a une seule ligne, qu'elle seule peut lire et modifier.
create table if not exists public.profils (
  user_id uuid primary key references auth.users (id) on delete cascade,
  prenom text check (prenom is null or char_length(prenom) <= 40),
  donnees jsonb not null default '{}'::jsonb,
  maj timestamptz not null default now()
);

alter table public.profils enable row level security;

drop policy if exists "lire son profil" on public.profils;
create policy "lire son profil" on public.profils for select to authenticated using (auth.uid() = user_id);
drop policy if exists "créer son profil" on public.profils;
create policy "créer son profil" on public.profils for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "modifier son profil" on public.profils;
create policy "modifier son profil" on public.profils for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "effacer son profil" on public.profils;
create policy "effacer son profil" on public.profils for delete to authenticated using (auth.uid() = user_id);

-- Les visiteurs non connectés n'ont aucun accès ; les personnes connectées seulement à leur ligne (règles ci-dessus).
revoke all on public.profils from anon;
grant select, insert, update, delete on public.profils to authenticated;

-- Taille maximale des données synchronisées (résultats, notes, budget) : 200 ko par compte.
alter table public.profils drop constraint if exists donnees_taille;
alter table public.profils add constraint donnees_taille check (pg_column_size(donnees) < 200000);
