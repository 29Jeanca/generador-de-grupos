import React, { useCallback, useEffect, useRef, useState } from "react";
import CourseLanding from "./components/CourseLanding.jsx";
import CourseEditor from "./components/CourseEditor.jsx";
import {
  isSupabaseConfigured,
  loadLocalCourses,
  saveLocalCourses,
  loadSelectedId,
  saveSelectedId,
  fetchRemoteCourses,
  upsertRemoteCourse,
  deleteRemoteCourse,
} from "./lib/storage.js";
import { defaultCourses, makeDefaultCourse } from "./lib/defaultCourses.js";

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);

  const saveTimer = useRef(null);
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // ---------- Load persisted state on mount ----------
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setSelectedId(loadSelectedId());

      if (isSupabaseConfigured) {
        try {
          const remote = await fetchRemoteCourses();
          if (cancelled) return;
          if (remote.length > 0) {
            setCourses(remote);
          } else {
            // Tabla vacía (proyecto de Supabase recién creado): siembra los
            // cursos por defecto tanto local como remotamente.
            const seed = defaultCourses();
            setCourses(seed);
            await Promise.all(seed.map((c) => upsertRemoteCourse(c)));
          }
        } catch (e) {
          console.error("[supabase] No se pudo cargar desde Supabase, usando localStorage", e);
          if (cancelled) return;
          showToast("Sin conexión con Supabase, usando datos locales");
          setCourses(loadLocalCourses() ?? defaultCourses());
        }
      } else {
        setCourses(loadLocalCourses() ?? defaultCourses());
      }

      if (!cancelled) setLoaded(true);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [showToast]);

  // ---------- Persist courses on change (debounced) ----------
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      if (isSupabaseConfigured) {
        Promise.all(courses.map((c) => upsertRemoteCourse(c))).catch((e) => {
          console.error("[supabase] Error guardando en Supabase", e);
          showToast("No se pudo guardar en Supabase");
        });
        // Además guarda una copia local, por si se pierde la conexión.
        saveLocalCourses(courses);
      } else {
        saveLocalCourses(courses);
      }
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [courses, loaded, showToast]);

  // ---------- Persist selected course (navigation state) ----------
  useEffect(() => {
    if (!loaded) return;
    saveSelectedId(selectedId);
  }, [selectedId, loaded]);

  function updateCourse(id, fn) {
    setCourses((prev) => prev.map((c) => (c.id === id ? fn(c) : c)));
  }

  function handleCreateCourse(label, students) {
    const id = `c-${Date.now()}`;
    const course = makeDefaultCourse(id, label, students);
    setCourses((prev) => [...prev, course]);
    setSelectedId(id);
    showToast("Grupo creado");
  }

  function handleDeleteCourse(id) {
    if (!window.confirm("¿Eliminar este grupo y todos sus datos?")) return;
    setCourses((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (isSupabaseConfigured) {
      deleteRemoteCourse(id).catch((e) => {
        console.error("[supabase] Error eliminando en Supabase", e);
        showToast("No se pudo eliminar en Supabase");
      });
    }
  }

  if (!loaded) {
    return (
      <div className="fwd-app">
        <div className="fwd-topbar">
          <span className="wordmark">FWD COSTA RICA</span>
        </div>
        <div className="landing-wrap">
          <p className="hint">Cargando…</p>
        </div>
      </div>
    );
  }

  const selectedCourse = courses.find((c) => c.id === selectedId) || null;

  return (
    <div className="fwd-app">
      {!selectedCourse ? (
        <CourseLanding
          courses={courses}
          onOpen={setSelectedId}
          onDelete={handleDeleteCourse}
          onCreate={handleCreateCourse}
        />
      ) : (
        <CourseEditor
          course={selectedCourse}
          onBack={() => setSelectedId(null)}
          onUpdate={updateCourse}
          showToast={showToast}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
