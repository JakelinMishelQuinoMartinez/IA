// agentes.js — Registro y gestión de agentes de personalidad.
// Los agentes se almacenan como JSON en la carpeta agentes_de_personalidad/.
// En entornos sin backend, los nuevos agentes se guardan en memoria (localStorage)
// y se fusionan con los agentes del disco al iniciar.

import { buildSystemInstruction } from './personality.js';

export const AGENTES_DIR = './agentes_de_personalidad/';

// Cache en memoria de agentes cargados: { file: { file, data, systemInstruction } }
let agentesCache = {};

// Clave de localStorage para agentes creados en el navegador.
const LS_KEY = 'campuslands.agentes';

/** Carga los agentes del disco (solo los conocidos en tiempo de carga). */
export async function loadAgentesFromDisk() {
  const files = [
    './agentes_de_personalidad/jarvis.json'
    // Agregar nuevos agentes aquí o usar el descubrimiento automático si el entorno lo permite.
  ];
  for (const file of files) {
    try {
      const response = await fetch(file);
      if (!response.ok) continue;
      const data = await response.json();
      agentesCache[file] = { file, data, systemInstruction: buildSystemInstruction(data) };
    } catch (e) {
      console.warn('No se pudo cargar el agente', file, e);
    }
  }
  loadAgentesFromStorage();
}

/** Carga agentes creados previamente en el navegador (localStorage). */
function loadAgentesFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const list = JSON.parse(raw);
    for (const entry of list) {
      if (!entry || !entry.data) continue;
      agentesCache[entry.file] = {
        file: entry.file,
        data: entry.data,
        systemInstruction: buildSystemInstruction(entry.data)
      };
    }
  } catch (e) {
    console.warn('No se pudieron cargar agentes de localStorage', e);
  }
}

/** Devuelve la lista actual de agentes ordenados por nombre. */
export function listAgentes() {
  return Object.values(agentesCache).sort((a, b) =>
    (a.data.nombre || '').localeCompare(b.data.nombre || '')
  );
}

/** Renderiza las opciones de un <select> con los agentes disponibles. */
export function renderAgentes(selectElement, currentFile = null) {
  selectElement.innerHTML = '';
  const agentes = listAgentes();
  if (agentes.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = '(sin agentes)';
    selectElement.appendChild(opt);
    return;
  }
  for (const ag of agentes) {
    const opt = document.createElement('option');
    opt.value = ag.file;
    opt.textContent = `${ag.data.nombre} (${ag.data.rol || 'sin rol'})`;
    if (ag.file === currentFile) opt.selected = true;
    selectElement.appendChild(opt);
  }
}

/** Obtiene un agente por su archivo. */
export function getAgente(file) {
  return agentesCache[file] || null;
}

/** Guarda un nuevo agente en memoria (y localStorage como fallback). */
export function saveAgente(file, data) {
  agentesCache[file] = { file, data, systemInstruction: buildSystemInstruction(data) };
  saveToStorage();
}

/** Persiste los agentes de memoria en localStorage. */
function saveToStorage() {
  try {
    const list = Object.values(agentesCache).map(ag => ({
      file: ag.file,
      data: ag.data
    }));
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('No se pudieron guardar agentes en localStorage', e);
  }
}

/** Descarga un archivo JSON para que el usuario lo guarde manualmente en la carpeta de agentes. */
export function downloadAgente(file, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.replace(/^.*[\\/]/, '');
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Convierte un nombre a slug seguro para usar como nombre de archivo. */
export function slugify(name) {
  return (name || 'agente')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'agente';
}