import React, { useState } from "react";
import { Plus, X, ShieldAlert } from "lucide-react";

export default function ConstraintsPanel({ students, constraints, onAdd, onRemove }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");

  function handleAdd() {
    if (!a || !b || a === b) return;
    onAdd(a, b);
    setA("");
    setB("");
  }

  return (
    <div className="fwd-card" style={{ gridColumn: "1 / -1" }}>
      <h2>
        <ShieldAlert size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
        Restricciones — no pueden ir juntos
      </h2>
      <div className="fwd-row">
        <select className="fwd-select" value={a} onChange={(e) => setA(e.target.value)}>
          <option value="">Estudiante A…</option>
          {students.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className="fwd-select" value={b} onChange={(e) => setB(e.target.value)}>
          <option value="">Estudiante B…</option>
          {students.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button className="btn btn-purple" onClick={handleAdd}>
          <Plus size={15} /> Agregar
        </button>
      </div>
      {constraints.length > 0 && (
        <div className="constraint-list">
          {constraints.map(([x, y], idx) => (
            <div className="constraint-row" key={`${x}-${y}-${idx}`}>
              <span className="constraint-pill">
                {x} ↔ {y}
              </span>
              <button className="btn-ghost" onClick={() => onRemove(idx)} aria-label="Quitar restricción">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="hint">
        Estos estudiantes nunca quedarán en el mismo grupo — ni al generar automáticamente, ni al mover a mano.
      </p>
    </div>
  );
}
