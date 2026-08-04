import React from "react";
import { Users } from "lucide-react";

export default function GroupCard({
  title,
  headerColor,
  members,
  isPool,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardClick,
  onDragStartChip,
  onToggleSelectChip,
  isChipSelected,
  isChipConflicting,
}) {
  return (
    <div
      className={`group-card ${isPool ? "pool-card" : ""} ${isDragOver ? "drag-over" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onCardClick}
    >
      <div className="group-header" style={!isPool ? { background: headerColor } : undefined}>
        <span>
          {isPool && <Users size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />}
          {title}
        </span>
        <span>{members.length}</span>
      </div>
      <div className="group-body">
        {members.length === 0 && (
          <p className="empty-hint">
            {isPool ? "No hay estudiantes sin asignar" : "Arrastrá o tocá un estudiante y luego tocá aquí"}
          </p>
        )}
        {members.map((name) => {
          const conflicting = !isPool && isChipConflicting && isChipConflicting(name);
          return (
            <div
              key={name}
              className={`chip ${isChipSelected(name) ? "selected" : ""} ${conflicting ? "conflict" : ""}`}
              draggable
              onDragStart={() => onDragStartChip(name)}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelectChip(name);
              }}
              title={conflicting ? "Tiene una restricción con otro miembro de este grupo" : undefined}
            >
              {name}
            </div>
          );
        })}
      </div>
    </div>
  );
}
