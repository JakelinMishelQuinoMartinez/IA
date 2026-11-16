// build-config.js — Genera config.local.js a partir del archivo .env.
// Uso: node build-config.js
// El archivo .env NO debe commitearse; usa .example.env como plantilla.
// config.local.js tampoco debe commitearse (está en .gitignore sugerido).

const fs = require('fs');
const path = require('path');

const ENV_FILE = path.join(__dirname, '.env');
const OUT_FILE = path.join(__dirname, 'config.local.js');

if (!fs.existsSync(ENV_FILE)) {
  console.error('No se encontró el archivo .env. Copia .example.env a .env y rellena los valores.');
  process.exit(1);
}

// Parsear .env: ignora comentarios (#), líneas vacías y soporta comillas simples.
function parseEnv(content) {
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (key) env[key] = value;
  }
  return env;
}

const env = parseEnv(fs.readFileSync(ENV_FILE, 'utf8'));

const apiKey = env.GEMINI_API_KEY || '';
const defaultModel = env.DEFAULT_MODEL || 'gemini-2.5-flash';
const apiBaseUrl = env.GEMINI_API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';

// Escapar comillas dobles y backslashes para generar un string literal seguro.
function escapeJs(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

const content = `// config.local.js — Generado automáticamente por build-config.js a partir de .env.
// NO edites este archivo a mano; modifica .env y vuelve a ejecutar build-config.js.

export const API_KEY = "${escapeJs(apiKey)}";
export const DEFAULT_MODEL = "${escapeJs(defaultModel)}";
export const API_BASE_URL = "${escapeJs(apiBaseUrl)}";
`;

fs.writeFileSync(OUT_FILE, content, 'utf8');
console.log('config.local.js generado correctamente en', OUT_FILE);