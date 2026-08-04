import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function CourseLanding({ courses, onOpen, onDelete, onCreate }) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [bulk, setBulk] = useState("");

  function handleCreate() {
    const trimmed = label.trim();
    if (!trimmed) return;
    const lines = bulk
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const seen = new Set();
    const dedup = [];
    lines.forEach((l) => {
      if (!seen.has(l.toLowerCase())) {
        seen.add(l.toLowerCase());
        dedup.push(l);
      }
    });
    onCreate(trimmed, dedup);
    setLabel("");
    setBulk("");
    setAdding(false);
  }

  return (
    <>
      <div className="fwd-topbar">
        <span className="wordmark">FWD COSTA RICA</span>
        <span className="course">Programación Front End con IA Aplicada</span>
      </div>
      <div className="fwd-header">
        <p className="fwd-kicker">Herramienta de organización</p>
        <h1 className="fwd-title">Elegí un grupo</h1>
      </div>

      <div className="landing-wrap">
        <div className="course-grid">
          {courses.map((c) => (
            <div className="course-tile" key={c.id} onClick={() => onOpen(c.id)}>
              <button
                className="del-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                aria-label={`Eliminar ${c.label}`}
                title="Eliminar grupo"
              >
                <Trash2 size={15} />
              </button>
              <h3>{c.label}</h3>
              <p>
                {c.students.length} estudiantes · {c.groups.length} grupos armados
              </p>
              <p className="open-hint">Abrir →</p>
            </div>
          ))}
          <div className="add-tile" onClick={() => setAdding((v) => !v)}>
            <Plus size={22} />
            Agregar grupo
          </div>
        </div>

        {adding && (
          <div className="fwd-card" style={{ marginTop: 18 }}>
            <h2>Nuevo grupo</h2>
            <div className="fwd-field">
              <label>Nombre del grupo</label>
              <input
                className="fwd-input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ej: Grupos II - San Ramón"
              />
            </div>
            <div className="fwd-field">
              <label>Lista de estudiantes (uno por línea, opcional — podés agregarlos después)</label>
              <textarea
                className="fwd-textarea"
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                placeholder={"Juan Pérez\nMaría Gómez\n..."}
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-teal" onClick={handleCreate}>
                <Plus size={15} /> Crear grupo
              </button>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setAdding(false);
                  setLabel("");
                  setBulk("");
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
