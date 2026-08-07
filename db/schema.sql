-- Esquema para "Generador de Grupos FWD"
-- Ejecutar esto en Supabase: Dashboard > SQL Editor > New query > pegar y "Run".
--
-- Guarda cada grupo/curso completo (estudiantes, grupos armados, restricciones,
-- configuración) como un solo bloque JSON, igual a como se guardaba antes en
-- localStorage. Migración simple: casi no hay que tocar la lógica de grouping.js.

create table if not exists public.courses (
  id text primary key,
  label text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sin pantalla de login: la app usa la "anon key" directamente desde el
-- navegador, así que las políticas de abajo dejan que cualquiera con esa
-- key (pública, embebida en el bundle) lea y escriba. Aceptable para un
-- caso de uso interno de un solo docente; si más adelante esto necesita
-- protegerse, hay que agregar Supabase Auth y cambiar estas políticas para
-- que usen auth.uid() en vez de "true".
alter table public.courses enable row level security;

create policy "Anon puede leer cursos"
  on public.courses for select
  to anon
  using (true);

create policy "Anon puede insertar cursos"
  on public.courses for insert
  to anon
  with check (true);

create policy "Anon puede actualizar cursos"
  on public.courses for update
  to anon
  using (true)
  with check (true);

create policy "Anon puede borrar cursos"
  on public.courses for delete
  to anon
  using (true);

-- Mantiene updated_at al día en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_courses_updated_at on public.courses;
create trigger set_courses_updated_at
  before update on public.courses
  for each row
  execute function public.set_updated_at();
