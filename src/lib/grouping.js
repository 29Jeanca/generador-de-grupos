export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateGroupsByCount(list, n, mode) {
  const count = Math.max(1, n);
  const base = mode === "aleatorio" ? shuffleArray(list) : [...list];
  const groups = Array.from({ length: count }, () => []);
  base.forEach((name, i) => groups[i % count].push(name));
  return groups;
}

export function generateGroupsBySize(list, size, mode) {
  const s = Math.max(2, size);
  const base = mode === "aleatorio" ? shuffleArray(list) : [...list];
  const groups = [];
  for (let i = 0; i < base.length; i += s) groups.push(base.slice(i, i + s));
  // Evitar dejar un solo estudiante en un grupo final de tamaño 1
  if (groups.length > 1 && groups[groups.length - 1].length === 1) {
    const last = groups.pop();
    groups[groups.length - 1] = groups[groups.length - 1].concat(last);
  }
  return groups;
}

export function pairViolates(a, b, constraints) {
  return constraints.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export function hasInternalViolation(groupArr, constraints) {
  for (let i = 0; i < groupArr.length; i++) {
    for (let j = i + 1; j < groupArr.length; j++) {
      if (pairViolates(groupArr[i], groupArr[j], constraints)) return true;
    }
  }
  return false;
}

export function findViolationPairs(groups, constraints) {
  const res = [];
  groups.forEach((g, gi) => {
    for (let i = 0; i < g.length; i++) {
      for (let j = i + 1; j < g.length; j++) {
        if (pairViolates(g[i], g[j], constraints)) {
          res.push({ gi, a: g[i], b: g[j] });
        }
      }
    }
  });
  return res;
}

/**
 * Intenta resolver restricciones intercambiando estudiantes entre grupos
 * (swap 1 a 1, sin cambiar el tamaño de ningún grupo) hasta que no queden
 * violaciones o se agoten los intentos. Es una búsqueda local, no garantiza
 * una solución óptima ni siempre perfecta si la cantidad de grupos es muy baja.
 */
export function resolveConstraints(groupsInput, constraints, maxAttempts = 300) {
  let groups = groupsInput.map((g) => [...g]);
  if (!constraints.length) return { groups, unresolved: [] };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const violations = findViolationPairs(groups, constraints);
    if (violations.length === 0) return { groups, unresolved: [] };

    const v = violations[Math.floor(Math.random() * violations.length)];
    const gi = v.gi;
    const b = v.b;

    const otherIndices = groups.map((_, idx) => idx).filter((idx) => idx !== gi);
    for (let k = otherIndices.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [otherIndices[k], otherIndices[j]] = [otherIndices[j], otherIndices[k]];
    }

    let swapped = false;
    for (const gj of otherIndices) {
      const candidates = [...groups[gj]];
      for (const x of candidates) {
        const newGi = groups[gi].filter((n) => n !== b).concat([x]);
        const newGj = groups[gj].filter((n) => n !== x).concat([b]);
        if (!hasInternalViolation(newGi, constraints) && !hasInternalViolation(newGj, constraints)) {
          groups[gi] = newGi;
          groups[gj] = newGj;
          swapped = true;
          break;
        }
      }
      if (swapped) break;
    }
    if (!swapped) continue;
  }

  return { groups, unresolved: findViolationPairs(groups, constraints) };
}
