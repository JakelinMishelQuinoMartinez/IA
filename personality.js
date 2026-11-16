// personality.js — Gestión de personalidades del agente.
// Carga un archivo JSON de personalidad y construye la systemInstruction
// que se pasa al modelo de lenguaje.

/**
 * Carga una personalidad desde un archivo JSON (relativo al documento).
 * @param {string} personalityFile — Ruta al JSON de personalidad.
 * @returns {Promise<string>} systemInstruction construida.
 */
export async function loadPersonality(personalityFile) {
  try {
    const response = await fetch(personalityFile);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} al cargar ${personalityFile}`);
    }
    const personality = await response.json();
    return buildSystemInstruction(personality);
  } catch (error) {
    console.error('Error cargando personalidad:', error);
    return '';
  }
}

/**
 * Construye el texto de systemInstruction a partir de la definición de personalidad.
 * @param {object} personality
 * @returns {string}
 */
export function buildSystemInstruction(personality) {
  const rasgos = personality.rasgos || {};
  const limites = personality.limites || [];

  let instruction = `Eres ${personality.nombre}, ${personality.rol}.\n\n`;
  instruction += `**Personalidad (Big Five):**\n`;
  instruction += `- Apertura: ${rasgos.apertura || 'media'}\n`;
  instruction += `- Responsabilidad: ${rasgos.responsabilidad || 'media'}\n`;
  instruction += `- Extraversión: ${rasgos.extraversion || 'media'}\n`;
  instruction += `- Amabilidad: ${rasgos.amabilidad || 'media'}\n`;
  instruction += `- Neuroticismo: ${rasgos.neuroticismo || 'media'}\n\n`;
  instruction += `**Tono:** ${personality.tono || 'Profesional'}\n`;
  instruction += `**Lenguaje:** ${personality.lenguaje || 'Técnico claro'}\n`;
  instruction += `**Objetivo:** ${personality.objetivo || 'Ayudar al usuario'}\n\n`;
  if (limites.length > 0) {
    instruction += `**Límites importantes:**\n`;
    limites.forEach(limite => {
      instruction += `- ${limite}\n`;
    });
  }
  instruction += `\nResponde siempre manteniendo esta personalidad. No rompas el personaje.`;

  return instruction;
}