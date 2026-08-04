const STORAGE_KEY = "fwd-grupos-multi-v1";

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.courses)) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    // localStorage puede fallar en modo incógnito o si el navegador lo bloquea.
    // La app sigue funcionando en memoria, solo no persiste entre sesiones.
    return false;
  }
}
