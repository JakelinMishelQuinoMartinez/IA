// app.js — Punto de entrada de la aplicación (módulo ES).
// Conecta DOM, personalidades, chat y la API de Gemini.

import { API_KEY, DEFAULT_MODEL } from './config.js';
import { loadPersonality } from './personality.js';
import { ChatManager } from './chat.js';
import { generateContent } from './api.js';

// Referencias al DOM
const elements = {
  modelSelect: document.getElementById('modeloSelect'),
  clearChatBtn: document.getElementById('clearChatBtn'),
  messages: document.getElementById('messages'),
  composer: document.getElementById('composer'),
  prompt: document.getElementById('prompt'),
  sendBtn: document.getElementById('sendBtn'),
  personalitySelect: document.getElementById('personalitySelect')
};

// Estado de la aplicación
const chat = new ChatManager(elements);
let systemInstruction = '';

// ========== Cargar personalidad por defecto (Jarvis) ==========
systemInstruction = await loadPersonality('./agentes_de_personalidad/jarvis.json');

// ========== Borrar conversación ==========
elements.clearChatBtn.addEventListener('click', () => {
  if (!confirm('¿Borrar toda la conversación?')) return;
  chat.clear();
});

// ========== Cambiar personalidad ==========
elements.personalitySelect.addEventListener('change', async () => {
  systemInstruction = await loadPersonality(elements.personalitySelect.value);
  // Limpiar conversación al cambiar personalidad para evitar confusión
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

  // Validar modelo
  let model = elements.modelSelect.value;
  if (!model) model = DEFAULT_MODEL;

  // Mostrar mensaje del usuario
  chat.appendMessage('user', text, false);
  elements.prompt.value = '';
  elements.prompt.style.height = 'auto';

  // Bloquear envío mientras la API responde
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