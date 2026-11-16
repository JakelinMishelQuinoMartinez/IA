// api.js — Comunicación con la API REST de Google Gemini.
// generateContent encapsula la solicitud HTTP (XMLHttpRequest) y notifica
// al callback con (error, replyText).

import { API_BASE_URL } from './config.js';

/**
 * Llama al endpoint de generateContent de Gemini.
 * @param {string} apiKey
 * @param {string} model
 * @param {Array} contents — Historial de la conversación ({role, parts}).
 * @param {function(error: string|null, replyText: string|null)} callback
 * @param {string} [systemInstruction] — Instrucción de sistema opcional.
 */
export function generateContent(apiKey, model, contents, callback, systemInstruction = '') {
  const url = API_BASE_URL + '/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);

  const payload = { contents };
  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onreadystatechange = function () {
    if (xhr.readyState !== 4) return;

    if (xhr.status >= 200 && xhr.status < 300) {
      let data;
      try {
        data = JSON.parse(xhr.responseText);
      } catch (e) {
        callback('Respuesta no es JSON válido', null);
        return;
      }

      let text = '';
      if (data && data.candidates && data.candidates[0]) {
        const candidate = data.candidates[0];
        if (candidate.content && candidate.content.parts && candidate.content.parts[0]) {
          text = candidate.content.parts[0].text;
        }
      }
      if (!text) {
        text = '(sin contenido)';
      }
      callback(null, text);
    } else {
      let errorMsg = 'HTTP ' + xhr.status;
      try {
        const errJson = JSON.parse(xhr.responseText);
        if (errJson && errJson.error && errJson.error.message) {
          errorMsg = errorMsg + ': ' + errJson.error.message;
        }
      } catch (e2) {
        // ignorar
      }
      callback(errorMsg, null);
    }
  };

  try {
    xhr.send(JSON.stringify(payload));
  } catch (sendErr) {
    callback('No se pudo enviar la solicitud', null);
  }
}