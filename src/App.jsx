import React, { useCallback, useEffect, useRef, useState } from "react";
import CourseLanding from "./components/CourseLanding.jsx";
import CourseEditor from "./components/CourseEditor.jsx";
import { loadState, saveState } from "./lib/storage.js";
import { defaultCourses, makeDefaultCourse } from "./lib/defaultCourses.js";

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [toast, setToast] = useState(null);

  const saveTimer = useRef(null);
  const toastTimer = useRef(null);

  // ---------- Load persisted state on mount ----------
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setCourses(saved.courses);
      setSelectedId(saved.selectedId ?? null);
    } else {
      setCourses(defaultCourses());
      setSelectedId(null);
    }
    setLoaded(true);
  }, []);

  // ---------- Persist on change (debounced) ----------
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveState({ courses, selectedId });
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [courses, selectedId, loaded]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

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
