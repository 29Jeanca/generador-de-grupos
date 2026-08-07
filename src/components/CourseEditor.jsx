import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Download,
  Hash,
  ListOrdered,
  Plus,
  Printer,
  RotateCcw,
  Rows,
  Save,
  Shuffle,
  ShieldAlert,
  X,
} from "lucide-react";
import GroupCard from "./GroupCard.jsx";
import ConstraintsPanel from "./ConstraintsPanel.jsx";
import HistoryPanel from "./HistoryPanel.jsx";
import {
  generateGroupsByCount,
  generateGroupsBySize,
  generateGroupsAvoidingRepeats,
  buildPairHistorySet,
  resolveConstraints,
  findViolationPairs,
} from "../lib/grouping.js";
import {
  isSupabaseConfigured,
  loadLocalHistory,
  saveLocalHistoryEntry,
  deleteLocalHistoryEntry,
  fetchRemoteHistory,
  insertRemoteHistory,
  deleteRemoteHistory,
} from "../lib/history.js";

const HEADER_COLORS = ["#5B3A8E", "#1F8A8A"];

export default function CourseEditor({ course, onBack, onUpdate, showToast }) {
  const c = course;
  const [nameInput, setNameInput] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [selectedChip, setSelectedChip] = useState(null); // { name, from }
  const [dragOverTarget, setDragOverTarget] = useState(null);
  const dragInfoRef = useRef(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [noteInput, setNoteInput] = useState("");
  const [savingHistory, setSavingHistory] = useState(false);

  function update(fn) {
    onUpdate(c.id, fn);
  }

  // ---------- Historial ----------
  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setHistoryLoading(true);
      if (isSupabaseConfigured) {
        try {
          const remote = await fetchRemoteHistory(c.id);
          if (!cancelled) setHistory(remote);
        } catch (e) {
          console.error("[history] Error cargando desde Supabase, usando local", e);
          if (!cancelled) setHistory(loadLocalHistory(c.id));
        }
      } else {
        setHistory(loadLocalHistory(c.id));
      }
      if (!cancelled) setHistoryLoading(false);
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [c.id]);

  const pairHistorySet = useMemo(() => buildPairHistorySet(history), [history]);

  async function handleSaveToHistory() {
    if (!c.groups.some((g) => g.length > 0)) {
      showToast("No hay grupos generados para guardar");
      return;
    }
    const entry = {
      courseId: c.id,
      label: c.label,
      note: noteInput.trim() || null,
      mode: c.mode,
      sizeMode: c.sizeMode,
      numGroups: c.numGroups,
      groupSize: c.groupSize,
      groups: c.groups,
    };
    setSavingHistory(true);
    try {
      const saved = isSupabaseConfigured
        ? await insertRemoteHistory(entry)
        : saveLocalHistoryEntry(c.id, entry);
      setHistory((prev) => [saved, ...prev]);
      setNoteInput("");
      showToast("Sesión guardada en el historial");
    } catch (e) {
      console.error("[history] Error guardando", e);
      // Si falla lo remoto, al menos se guarda localmente para no perder el registro.
      const fallback = saveLocalHistoryEntry(c.id, entry);
      setHistory((prev) => [fallback, ...prev]);
      showToast("No se pudo guardar en Supabase, se guardó localmente");
    } finally {
      setSavingHistory(false);
    }
  }

  function handleRestoreHistory(entry) {
    update((cc) => ({ ...cc, groups: entry.groups.map((g) => [...g]) }));
    setSelectedChip(null);
    showToast("Agrupación restaurada desde el historial");
  }

  async function handleDeleteHistory(id) {
    if (!window.confirm("¿Eliminar esta entrada del historial?")) return;
    setHistory((prev) => prev.filter((e) => e.id !== id));
    if (isSupabaseConfigured) {
      try {
        await deleteRemoteHistory(id);
      } catch (e) {
        console.error("[history] Error eliminando en Supabase", e);
        showToast("No se pudo eliminar en Supabase");
      }
    } else {
      deleteLocalHistoryEntry(c.id, id);
    }
  }

  // ---------- Roster ----------
  function addName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    const exists = c.students.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      showToast("Ese nombre ya está en la lista");
      return;
    }
    update((cc) => ({ ...cc, students: [...cc.students, trimmed] }));
    setNameInput("");
  }

  function addBulk() {
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    update((cc) => {
      const lower = new Set(cc.students.map((s) => s.toLowerCase()));
      const additions = [];
      lines.forEach((l) => {
        if (!lower.has(l.toLowerCase())) {
          lower.add(l.toLowerCase());
          additions.push(l);
        }
      });
      return { ...cc, students: [...cc.students, ...additions] };
    });
    setBulkText("");
    showToast("Nombres agregados");
  }

  function removeStudent(name) {
    update((cc) => ({
      ...cc,
      students: cc.students.filter((s) => s !== name),
      groups: cc.groups.map((g) => g.filter((n) => n !== name)),
      constraints: cc.constraints.filter(([a, b]) => a !== name && b !== name),
    }));
    if (selectedChip && selectedChip.name === name) setSelectedChip(null);
  }

  // ---------- Constraints ----------
  function addConstraint(a, b) {
    if (c.constraints.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) {
      showToast("Esa restricción ya existe");
      return;
    }
    update((cc) => ({ ...cc, constraints: [...cc.constraints, [a, b]] }));
    showToast("Restricción agregada");
  }

  function removeConstraint(idx) {
    update((cc) => ({ ...cc, constraints: cc.constraints.filter((_, i) => i !== idx) }));
  }

  // ---------- Generate / reset ----------
  function handleGenerate() {
    let resolved, unresolved, repeatCount = 0;

    if (c.mode === "aleatorio" && pairHistorySet.size > 0) {
      // Hay sesiones guardadas: probamos varias combinaciones y elegimos la
      // que menos repita parejas de esas sesiones (ver grouping.js).
      const result = generateGroupsAvoidingRepeats({
        students: c.students,
        sizeMode: c.sizeMode,
        numGroups: c.numGroups,
        groupSize: c.groupSize,
        constraints: c.constraints,
        pairHistorySet,
      });
      resolved = result.groups;
      unresolved = result.unresolved;
      repeatCount = result.repeatCount;
    } else {
      const base =
        c.sizeMode === "size"
          ? generateGroupsBySize(c.students, c.groupSize, c.mode)
          : generateGroupsByCount(c.students, c.numGroups, c.mode);
      const r = resolveConstraints(base, c.constraints);
      resolved = r.groups;
      unresolved = r.unresolved;
    }

    update((cc) => ({ ...cc, groups: resolved }));
    setSelectedChip(null);
    if (unresolved.length > 0) {
      showToast(
        `Grupos generados — no se pudieron separar ${unresolved.length} restricción(es) con esta configuración`
      );
    } else if (repeatCount > 0) {
      showToast(
        `Grupos generados — quedaron ${repeatCount} pareja(s) que ya estuvieron juntas antes (no se pudo evitar del todo)`
      );
    } else {
      showToast("Grupos generados");
    }
  }

  function handleResetCourse() {
    if (
      !window.confirm(
        "¿Reiniciar la configuración de este grupo? La lista y las restricciones se mantienen."
      )
    )
      return;
    update((cc) => ({
      ...cc,
      sizeMode: "count",
      numGroups: 4,
      groupSize: 2,
      mode: "ordenado",
      groups: resolveConstraints(generateGroupsByCount(cc.students, 4, "ordenado"), cc.constraints).groups,
    }));
    setSelectedChip(null);
    showToast("Configuración reiniciada");
  }

  // ---------- Move student ----------
  function moveStudent(name, from, to) {
    if (from === to) return;
    const targetArr = to === "pool" ? [] : c.groups[to] || [];
    if (to !== "pool") {
      const conflict = c.constraints.find(
        ([x, y]) => (x === name && targetArr.includes(y)) || (y === name && targetArr.includes(x))
      );
      if (conflict) {
        showToast(`No se puede: ${conflict[0]} y ${conflict[1]} no pueden estar juntos`);
        return;
      }
    }
    update((cc) => {
      const g = cc.groups.map((arr) => [...arr]);
      if (from !== "pool" && g[from]) g[from] = g[from].filter((n) => n !== name);
      if (to !== "pool" && g[to] && !g[to].includes(name)) g[to] = [...g[to], name];
      return { ...cc, groups: g };
    });
  }

  function handleDrop(e, to) {
    e.preventDefault();
    setDragOverTarget(null);
    const info = dragInfoRef.current;
    if (info) {
      moveStudent(info.name, info.from, to);
      dragInfoRef.current = null;
    }
  }

  function handleCardClick(to) {
    if (selectedChip) {
      moveStudent(selectedChip.name, selectedChip.from, to);
      setSelectedChip(null);
    }
  }

  function toggleSelect(name, from) {
    if (selectedChip && selectedChip.name === name && selectedChip.from === from) {
      setSelectedChip(null);
    } else {
      setSelectedChip({ name, from });
    }
  }

  // ---------- Export ----------
  function buildExportText() {
    const title = c.label || "Grupos";
    const lines = [title, "=".repeat(title.length), ""];
    c.groups.forEach((g, i) => {
      lines.push(`Grupo ${i + 1} (${g.length}):`);
      g.forEach((n) => lines.push(`  - ${n}`));
      lines.push("");
    });
    if (unassigned.length) {
      lines.push(`Sin asignar (${unassigned.length}):`);
      unassigned.forEach((n) => lines.push(`  - ${n}`));
    }
    return lines.join("\n");
  }

  function handleDownload() {
    const text = buildExportText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(c.label || "grupos").replace(/\s+/g, "_")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Archivo descargado");
  }

  function handleCopy() {
    const text = buildExportText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => showToast("Copiado al portapapeles"))
        .catch(() => showToast("No se pudo copiar"));
    } else {
      showToast("No se pudo copiar");
    }
  }

  function handlePrint() {
    window.print();
  }

  const unassigned = useMemo(() => {
    const placed = new Set(c.groups.flat());
    return c.students.filter((s) => !placed.has(s));
  }, [c.groups, c.students]);

  const liveViolations = useMemo(
    () => findViolationPairs(c.groups, c.constraints),
    [c.groups, c.constraints]
  );

  const total = c.students.length;
  const ng = Math.max(c.numGroups, 1);
  const minSize = total ? Math.floor(total / ng) : 0;
  const maxSize = total ? Math.ceil(total / ng) : 0;
  const sizeModeGroupsComputed = total ? Math.ceil(total / Math.max(c.groupSize, 2)) : 0;

  function isChipConflicting(name, groupIdx) {
    const members = c.groups[groupIdx];
    if (!members) return false;
    return c.constraints.some(
      ([x, y]) => (x === name && members.includes(y)) || (y === name && members.includes(x))
    );
  }

  return (
    <>
      <div className="fwd-topbar">
        <span className="wordmark">FWD COSTA RICA</span>
        <span className="course">Programación Front End con IA Aplicada</span>
      </div>

      <div className="fwd-header">
        <button className="back-link no-print" onClick={onBack}>
          <ArrowLeft size={14} /> Volver a grupos
        </button>
        <p className="fwd-kicker">{c.label}</p>
        <h1 className="fwd-title">Generador de Grupos</h1>
      </div>

      <div className="fwd-panel no-print">
        <div className="fwd-card">
          <h2>Lista de estudiantes ({c.students.length})</h2>
          <div className="fwd-field">
            <label htmlFor="course-input">Nombre del grupo</label>
            <input
              id="course-input"
              className="fwd-input"
              value={c.label}
              onChange={(e) => update((cc) => ({ ...cc, label: e.target.value }))}
            />
          </div>
          <div className="fwd-field">
            <label htmlFor="name-input">Agregar un nombre</label>
            <div className="fwd-row">
              <input
                id="name-input"
                className="fwd-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addName()}
                placeholder="Nombre completo"
              />
              <button className="btn btn-teal" onClick={addName}>
                <Plus size={15} /> Agregar
              </button>
            </div>
          </div>
          <div className="fwd-field">
            <label htmlFor="bulk-input">Pegar lista (un nombre por línea)</label>
            <textarea
              id="bulk-input"
              className="fwd-textarea"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"Juan Pérez\nMaría Gómez\n..."}
            />
            <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={addBulk}>
              <Plus size={15} /> Agregar todos
            </button>
          </div>
          <ul className="roster-list">
            {c.students.map((s) => (
              <li key={s}>
                <span>{s}</span>
                <button className="btn-ghost" onClick={() => removeStudent(s)} aria-label={`Quitar a ${s}`} title="Quitar de la lista">
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="fwd-card">
          <h2>Configuración</h2>
          <div className="fwd-field">
            <label>Dividir por</label>
            <div className="segmented">
              <button
                className={c.sizeMode === "count" ? "active" : ""}
                onClick={() => update((cc) => ({ ...cc, sizeMode: "count" }))}
              >
                <Hash size={15} /> Cantidad de grupos
              </button>
              <button
                className={c.sizeMode === "size" ? "active" : ""}
                onClick={() => update((cc) => ({ ...cc, sizeMode: "size" }))}
              >
                <Rows size={15} /> Tamaño por grupo
              </button>
            </div>
          </div>

          {c.sizeMode === "count" ? (
            <div className="fwd-field">
              <label>Cantidad de grupos</label>
              <div className="stepper">
                <button
                  onClick={() => update((cc) => ({ ...cc, numGroups: Math.max(1, cc.numGroups - 1) }))}
                  aria-label="Menos grupos"
                >
                  –
                </button>
                <input
                  type="number"
                  min={1}
                  max={Math.max(c.students.length, 1)}
                  value={c.numGroups}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) update((cc) => ({ ...cc, numGroups: Math.max(1, v) }));
                  }}
                />
                <button
                  onClick={() =>
                    update((cc) => ({
                      ...cc,
                      numGroups: Math.min(Math.max(cc.students.length, 1), cc.numGroups + 1),
                    }))
                  }
                  aria-label="Más grupos"
                >
                  +
                </button>
              </div>
              <p className="hint">
                {total} estudiantes → grupos de {minSize}–{maxSize} aprox.
              </p>
            </div>
          ) : (
            <div className="fwd-field">
              <label>Estudiantes por grupo (número par, ideal para parejas)</label>
              <div className="stepper">
                <button
                  onClick={() => update((cc) => ({ ...cc, groupSize: Math.max(2, cc.groupSize - 2) }))}
                  aria-label="Menos estudiantes por grupo"
                >
                  –
                </button>
                <input
                  type="number"
                  step={2}
                  min={2}
                  value={c.groupSize}
                  onChange={(e) => {
                    let v = parseInt(e.target.value, 10);
                    if (isNaN(v)) return;
                    if (v < 2) v = 2;
                    if (v % 2 !== 0) v += 1;
                    update((cc) => ({ ...cc, groupSize: v }));
                  }}
                />
                <button
                  onClick={() => update((cc) => ({ ...cc, groupSize: cc.groupSize + 2 }))}
                  aria-label="Más estudiantes por grupo"
                >
                  +
                </button>
              </div>
              <p className="hint">
                {total} estudiantes → aprox. {sizeModeGroupsComputed} grupos de {c.groupSize} (el último puede
                variar un poco).
              </p>
            </div>
          )}

          <div className="fwd-field">
            <label>Modo de reparto automático</label>
            <div className="segmented">
              <button
                className={c.mode === "ordenado" ? "active" : ""}
                onClick={() => update((cc) => ({ ...cc, mode: "ordenado" }))}
              >
                <ListOrdered size={15} /> Ordenado
              </button>
              <button
                className={c.mode === "aleatorio" ? "active" : ""}
                onClick={() => update((cc) => ({ ...cc, mode: "aleatorio" }))}
              >
                <Shuffle size={15} /> Aleatorio
              </button>
            </div>
          </div>

          <button className="btn btn-teal btn-block" onClick={handleGenerate}>
            <Shuffle size={16} /> Generar grupos
          </button>
          <p className="hint">
            Después de generar, arrastrá un nombre a otro grupo para ajustarlo a mano, o tocá un nombre y luego
            tocá el grupo destino.
          </p>
        </div>

        <ConstraintsPanel
          students={c.students}
          constraints={c.constraints}
          onAdd={addConstraint}
          onRemove={removeConstraint}
        />

        <HistoryPanel
          entries={history}
          loading={historyLoading}
          onRestore={handleRestoreHistory}
          onDelete={handleDeleteHistory}
        />
      </div>

      <div className="results-header">
        <h2>Resultado</h2>
        <span className="meta">
          {c.groups.length} grupo{c.groups.length !== 1 ? "s" : ""} ·{" "}
          {unassigned.length > 0 ? `${unassigned.length} sin asignar` : "todos asignados"}
        </span>
      </div>

      {liveViolations.length > 0 && (
        <div className="warn-banner">
          <ShieldAlert size={16} />
          <span>
            {liveViolations.length} restricción(es) sin respetar en la agrupación actual:{" "}
            {liveViolations.map((v, i) => (
              <strong key={i}>
                {v.a} ↔ {v.b}
                {i < liveViolations.length - 1 ? ", " : ""}
              </strong>
            ))}
            . Movelos a mano o generá de nuevo.
          </span>
        </div>
      )}

      <div className="groups-grid">
        {c.groups.map((g, idx) => (
          <GroupCard
            key={idx}
            title={`Grupo ${idx + 1}`}
            headerColor={HEADER_COLORS[idx % HEADER_COLORS.length]}
            members={g}
            isPool={false}
            isDragOver={dragOverTarget === idx}
            onDragOver={() => setDragOverTarget(idx)}
            onDragLeave={() => setDragOverTarget((t) => (t === idx ? null : t))}
            onDrop={(e) => handleDrop(e, idx)}
            onCardClick={() => handleCardClick(idx)}
            onDragStartChip={(name) => (dragInfoRef.current = { name, from: idx })}
            onToggleSelectChip={(name) => toggleSelect(name, idx)}
            isChipSelected={(name) => !!(selectedChip && selectedChip.name === name && selectedChip.from === idx)}
            isChipConflicting={(name) => isChipConflicting(name, idx)}
          />
        ))}

        <GroupCard
          title="Sin asignar"
          members={unassigned}
          isPool
          isDragOver={dragOverTarget === "pool"}
          onDragOver={() => setDragOverTarget("pool")}
          onDragLeave={() => setDragOverTarget((t) => (t === "pool" ? null : t))}
          onDrop={(e) => handleDrop(e, "pool")}
          onCardClick={() => handleCardClick("pool")}
          onDragStartChip={(name) => (dragInfoRef.current = { name, from: "pool" })}
          onToggleSelectChip={(name) => toggleSelect(name, "pool")}
          isChipSelected={(name) => !!(selectedChip && selectedChip.name === name && selectedChip.from === "pool")}
        />
      </div>

      <div className="toolbar no-print">
        <input
          className="fwd-input history-note-input"
          placeholder="Nota para el historial (opcional)"
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
        />
        <button className="btn btn-purple" onClick={handleSaveToHistory} disabled={savingHistory}>
          <Save size={15} /> Guardar en historial
        </button>
        <button className="btn btn-outline" onClick={handlePrint}>
          <Printer size={15} /> Imprimir
        </button>
        <button className="btn btn-outline" onClick={handleDownload}>
          <Download size={15} /> Descargar .txt
        </button>
        <button className="btn btn-outline" onClick={handleCopy}>
          <Copy size={15} /> Copiar
        </button>
        <button className="btn btn-outline" onClick={handleResetCourse} style={{ marginLeft: "auto" }}>
          <RotateCcw size={15} /> Reiniciar configuración
        </button>
      </div>
    </>
  );
}
