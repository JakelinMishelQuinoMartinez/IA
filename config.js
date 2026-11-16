// config.js — Configuración centralizada del proyecto.
// DEFAULT_MODEL y API_BASE_URL son constantes públicas.
// API_KEY se carga desde config.local.js (generado por build-config.js a partir de .env).
// Si no existe config.local.js, API_KEY queda vacío y el usuario debe generarla.

export const DEFAULT_MODEL = 'gemini-2.5-flash';
export const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export let API_KEY = '';

try {
  const local = await import('./config.local.js');
  if (local && local.API_KEY) {
    API_KEY = local.API_KEY;
  }
} catch (e) {
  // No hay config.local.js; API_KEY permanece vacío.
  console.warn('No se encontró config.local.js. Ejecuta `node build-config.js` para generarla desde .env.');
}