// app.js — Punto de entrada de la aplicación (módulo ES).
// Conecta DOM, personalidades, chat, API de Gemini y gestión de agentes.

import { API_KEY, DEFAULT_MODEL } from './config.js';
import { loadPersonality } from './personality.js';
import { ChatManager } from './chat.js';
import { generateContent } from './api.js';
import {
  AGENTES_DIR,
  loadAgentesFromDisk,
  renderAgentes,
  getAgente,
  saveAgente,
  downloadAgente,
  slugify
} from './agentes.js';
import { showAgenteForm } from './agente-form.js';

// Referencias al DOM
const elements = {
  modelSelect: document.getElementById('modeloSelect'),
  clearChatBtn: document.getElementById('clearChatBtn'),
  messages: document.getElementById('messages'),
  composer: document.getElementById('composer'),
  prompt: document.getElementById('prompt'),
  sendBtn: document.getElementById('sendBtn'),
  personalitySelect: document.getElementById('personalitySelect'),
  nuevoAgenteBtn: document.getElementById('nuevoAgenteBtn'),
  agenteForm: document.getElementById('agenteForm')
};

// Estado de la aplicación
const chat = new ChatManager(elements);
let systemInstruction = '';

// ========== Inicialización de agentes ==========
await loadAgentesFromDisk();
renderAgentes(elements.personalitySelect);

// ========== Cargar personalidad por defecto (Jarvis) ==========
const jarvis = getAgente('./agentes_de_personalidad/jarvis.json');
systemInstruction = jarvis ? jarvis.systemInstruction : await loadPersonality('./agentes_de_personalidad/jarvis.json');

// ========== Borrar conversación ==========
elements.clearChatBtn.addEventListener('click', () => {
  if (!confirm('¿Borrar toda la conversación?')) return;
  chat.clear();
});

// ========== Cambiar personalidad ==========
elements.personalitySelect.addEventListener('change', async () => {
  const agente = getAgente(elements.personalitySelect.value);
  if (agente) {
    systemInstruction = agente.systemInstruction;
  } else {
    systemInstruction = await loadPersonality(elements.personalitySelect.value);
  }
  chat.clear();
});

// ========== Auto-ajuste de altura del textarea ==========
elements.prompt.addEventListener('input', () => {
  elements.prompt.style.height = 'auto';
  let newHeight = elements.prompt.scrollHeight;
  if (newHeight > 200) newHeight = 200;
  elements.prompt.style.height = newHeight + 'px';
});

// ========== Enviar mensaje ==========
elements.composer.addEventListener('submit', (e) => {
  e.preventDefault();
  let text = elements.prompt.value;
  if (text) text = text.trim();
  if (!text) return;

  if (!API_KEY) {
    alert('Configura tu API Key (ejecuta `node build-config.js` desde .env).');
    return;
  }

  let model = elements.modelSelect.value;
  if (!model) model = DEFAULT_MODEL;

  chat.appendMessage('user', text, false);
  elements.prompt.value = '';
  elements.prompt.style.height = 'auto';
  chat.setSendingState(true);

  generateContent(API_KEY, model, chat.conversation, (error, replyText) => {
    if (error) {
      chat.appendMessage('model', 'Error: ' + error, true);
    } else {
      chat.appendMessage('model', replyText, false);
    }
    chat.setSendingState(false);
  }, systemInstruction);
});

// ========== Crear/editar agente ==========
elements.nuevoAgenteBtn.addEventListener('click', async () => {
  const datos = await showAgenteForm(elements.agenteForm);
  if (!datos) {
    elements.agenteForm.innerHTML = '';
    return;
  }

  const file = AGENTES_DIR + slugify(datos.nombre) + '.json';
  saveAgente(file, datos);

  // Opcional: descargar el archivo para que el usuario lo guarde en la carpeta.
  downloadAgente(file, datos);

  // Refrescar selector y seleccionar el nuevo agente.
  renderAgentes(elements.personalitySelect, file);
  elements.agenteForm.innerHTML = '';
  alert('Agente "' + datos.nombre + '" creado. Seleccionado en la lista.');
});