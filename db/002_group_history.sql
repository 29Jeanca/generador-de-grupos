-- Historial de agrupaciones para "Generador de Grupos FWD"
-- Ejecutar en Supabase: Dashboard > SQL Editor > New query > pegar y "Run".
-- (Este archivo se ejecuta ADEMÁS de db/schema.sql, no en su lugar).
--
-- Cada fila es una "sesión" de grupos que el docente decidió guardar
-- explícitamente (botón "Guardar en historial" en la app) — no cada intento
-- de generar. Sirve para mostrar el historial con fecha, y también como
-- fuente de datos para que el modo aleatorio evite repetir parejas que ya
-- estuvieron juntas antes.

create table if not exists public.group_history (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses(id) on delete cascade,
  label text,
  note text,
  mode text,
  size_mode text,
  num_groups integer,
  group_size integer,
  groups jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists group_history_course_id_idx
  on public.group_history (course_id, created_at desc);

-- Mismo criterio que courses: sin login, políticas abiertas para "anon".
-- El historial es de solo lectura una vez creado (no hay política de
-- update): se guarda o se borra, no se edita.
alter table public.group_history enable row level security;

create policy "Anon puede leer historial"
  on public.group_history for select
  to anon
  using (true);

create policy "Anon puede insertar historial"
  on public.group_history for insert
  to anon
  with check (true);

create policy "Anon puede borrar historial"
  on public.group_history for delete
  to anon
  using (true);
