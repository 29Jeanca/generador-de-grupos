import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

const COURSES_KEY = "fwd-grupos-multi-v1";
const SELECTED_KEY = "fwd-grupos-selected-v1";

// ---------- Respaldo local (localStorage) ----------
// Se usa cuando Supabase todavía no está configurado, y como red de
// seguridad si una operación remota falla (modo avión, RLS mal puesta, etc).

export function loadLocalCourses() {
  try {
    const raw = localStorage.getItem(COURSES_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.courses)) return null;
    return parsed.courses;
  } catch (e) {
    return null;
  }
}

export function saveLocalCourses(courses) {
  try {
    localStorage.setItem(COURSES_KEY, JSON.stringify({ courses }));
    return true;
  } catch (e) {
    // localStorage puede fallar en modo incógnito o si el navegador lo bloquea.
    // La app sigue funcionando en memoria, solo no persiste entre sesiones.
    return false;
  }
}

// El curso seleccionado es solo estado de navegación (qué pantalla ves), no
// datos de negocio, así que vive siempre en localStorage aunque Supabase
// esté configurado.
export function loadSelectedId() {
  try {
    const direct = localStorage.getItem(SELECTED_KEY);
    if (direct) return direct;
    // Compatibilidad: versiones anteriores guardaban selectedId dentro del
    // mismo blob que los cursos.
    const raw = localStorage.getItem(COURSES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.selectedId) return parsed.selectedId;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function saveSelectedId(id) {
  try {
    if (id) localStorage.setItem(SELECTED_KEY, id);
    else localStorage.removeItem(SELECTED_KEY);
  } catch (e) {
    // No es crítico: solo se pierde a qué grupo volver al recargar.
  }
}

// ---------- Supabase ----------
// Cada curso se guarda completo (estudiantes, grupos armados, restricciones,
// configuración) en la columna jsonb "data" de una fila de la tabla
// "courses". Ver db/schema.sql para crear la tabla y sus políticas.

export async function fetchRemoteCourses() {
  const { data, error } = await supabase
    .from("courses")
    .select("id, label, data")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map((row) => ({ ...row.data, id: row.id, label: row.label }));
}

export async function upsertRemoteCourse(course) {
  const { error } = await supabase.from("courses").upsert({
    id: course.id,
    label: course.label,
    data: course,
  });
  if (error) throw error;
}

export async function deleteRemoteCourse(id) {
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) throw error;
}

export { isSupabaseConfigured };
