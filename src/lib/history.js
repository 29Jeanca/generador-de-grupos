import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

const HISTORY_KEY = "fwd-grupos-history-v1";

// ---------- Respaldo local (localStorage) ----------
// Se usa cuando Supabase no está configurado, indexado por curso.

function readAllLocal() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}

function writeAllLocal(all) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(all));
  } catch (e) {
    // No es crítico: el historial local se pierde, la app sigue funcionando.
  }
}

export function loadLocalHistory(courseId) {
  const all = readAllLocal();
  return all[courseId] || [];
}

export function saveLocalHistoryEntry(courseId, entry) {
  const all = readAllLocal();
  const list = all[courseId] || [];
  const withDefaults = {
    ...entry,
    id: entry.id || `h-${Date.now()}`,
    createdAt: entry.createdAt || new Date().toISOString(),
  };
  all[courseId] = [withDefaults, ...list];
  writeAllLocal(all);
  return withDefaults;
}

export function deleteLocalHistoryEntry(courseId, entryId) {
  const all = readAllLocal();
  const list = all[courseId] || [];
  all[courseId] = list.filter((e) => e.id !== entryId);
  writeAllLocal(all);
}

// ---------- Supabase ----------
// Ver db/002_group_history.sql para la tabla y sus políticas.

export async function fetchRemoteHistory(courseId) {
  const { data, error } = await supabase
    .from("group_history")
    .select("id, course_id, label, note, mode, size_mode, num_groups, group_size, groups, created_at")
    .eq("course_id", courseId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    courseId: row.course_id,
    label: row.label,
    note: row.note,
    mode: row.mode,
    sizeMode: row.size_mode,
    numGroups: row.num_groups,
    groupSize: row.group_size,
    groups: row.groups,
    createdAt: row.created_at,
  }));
}

export async function insertRemoteHistory(entry) {
  const { data, error } = await supabase
    .from("group_history")
    .insert({
      course_id: entry.courseId,
      label: entry.label,
      note: entry.note || null,
      mode: entry.mode,
      size_mode: entry.sizeMode,
      num_groups: entry.numGroups,
      group_size: entry.groupSize,
      groups: entry.groups,
    })
    .select("id, created_at")
    .single();
  if (error) throw error;
  return { ...entry, id: data.id, createdAt: data.created_at };
}

export async function deleteRemoteHistory(id) {
  const { error } = await supabase.from("group_history").delete().eq("id", id);
  if (error) throw error;
}

export { isSupabaseConfigured };
