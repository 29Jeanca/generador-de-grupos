import React, { useState } from "react";
import { ChevronDown, ChevronUp, History, RotateCcw, Trash2 } from "lucide-react";

const MODE_LABEL = { ordenado: "Ordenado", aleatorio: "Aleatorio" };

function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat("es-CR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch (e) {
    return iso;
  }
}

export default function HistoryPanel({ entries, loading, onRestore, onDelete }) {
  const [openId, setOpenId] = useState(null);

  return (
    <div className="fwd-card" style={{ gridColumn: "1 / -1" }}>
      <h2>
        <History size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
        Historial de grupos guardados
      </h2>

      {loading && <p className="hint">Cargando historial…</p>}

      {!loading && entries.length === 0 && (
        <p className="hint">
          Todavía no guardaste ninguna sesión. Generá los grupos que vas a usar y apretá
          "Guardar en historial" para que quede registrada con fecha.
        </p>
      )}

      {!loading && entries.length > 0 && (
        <div className="history-list">
          {entries.map((entry) => {
            const isOpen = openId === entry.id;
            const sizes = entry.groups.map((g) => g.length).join(", ");
            return (
              <div className="history-entry" key={entry.id}>
                <button
                  className="history-entry-head"
                  onClick={() => setOpenId(isOpen ? null : entry.id)}
                  aria-expanded={isOpen}
                >
                  <span className="history-entry-main">
                    <strong>{formatDate(entry.createdAt)}</strong>
                    {entry.note && <span className="history-note">— {entry.note}</span>}
                  </span>
                  <span className="history-entry-meta">
                    {entry.groups.length} grupo{entry.groups.length !== 1 ? "s" : ""} ({sizes}) ·{" "}
                    {MODE_LABEL[entry.mode] || entry.mode}
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>
                {isOpen && (
                  <div className="history-entry-body">
                    {entry.groups.map((g, i) => (
                      <div className="history-group" key={i}>
                        <p className="history-group-title">Grupo {i + 1}</p>
                        <p className="history-group-members">{g.join(", ")}</p>
                      </div>
                    ))}
                    <div className="history-entry-actions">
                      <button
                        className="btn btn-outline"
                        onClick={() => onRestore(entry)}
                        title="Cargar esta agrupación como el resultado actual"
                      >
                        <RotateCcw size={14} /> Restaurar
                      </button>
                      <button className="btn btn-outline" onClick={() => onDelete(entry.id)}>
                        <Trash2 size={14} /> Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="hint">
        El modo aleatorio usa este historial para tratar de no repetir parejas que ya
        estuvieron juntas en una sesión guardada.
      </p>
    </div>
  );
}
