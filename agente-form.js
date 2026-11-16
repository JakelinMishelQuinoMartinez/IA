// agente-form.js - Formulario para crear/editar un agente de personalidad.
// showAgenteForm inyecta el formulario en un contenedor y devuelve una
// Promesa con los datos validados al confirmar, o null al cancelar.

// Valores por defecto para un agente nuevo.
const DEFAULTS = {
  nombre: "",
  rol: "mentor",
  caso: "mentor",
  rasgos: {
    apertura: "media",
    responsabilidad: "media",
    extraversion: "media",
    amabilidad: "media",
    neuroticismo: "media"
  },
  dominio: ["Contexto de la tarea, proyecto o tema."],
  tono: "Profesional",
  lenguaje: "Tecnico claro",
  objetivo: "Ayudar al usuario",
  limites: []
};

// Comilla simple como constante para evitar problemas de escape en el codigo fuente.
const Q = String.fromCharCode(39);

/**
 * Muestra un formulario para crear/editar un agente.
 * @param {HTMLElement} container - Donde se renderiza el formulario.
 * @param {object} [initial] - Datos iniciales (para edicion).
 * @returns {Promise<object|null>} Datos del agente al confirmar, o null al cancelar.
 */
export function showAgenteForm(container, initial = null) {
  const data = initial
    ? { ...DEFAULTS, ...initial, rasgos: { ...DEFAULTS.rasgos, ...(initial.rasgos || {}) } }
    : { ...DEFAULTS, rasgos: { ...DEFAULTS.rasgos } };

  container.innerHTML = "";
  container.classList.add("agente-form");

  const form = document.createElement("form");
  form.innerHTML = (
    "<h3>" + (initial ? "Editar agente" : "Nuevo agente") + "</h3>" +
    "<label>Nombre *" +
      "<input type=\"text\" name=\"nombre\" value=\"" + esc(data.nombre) + "\" required>" +
    "</label>" +
    "<label>Rol *" +
      "<input type=\"text\" name=\"rol\" value=\"" + esc(data.rol) + "\" required>" +
    "</label>" +
    "<label>Caso" +
      "<input type=\"text\" name=\"caso\" value=\"" + esc(data.caso || "") + "\">" +
    "</label>" +
    "<fieldset class=\"rasgos\">" +
      "<legend>Rasgos de personalidad (Big Five)</legend>" +
      ["apertura", "responsabilidad", "extraversion", "amabilidad", "neuroticismo"].map(k => (
        "<label>" + k +
          "<select name=\"" + k + "\">" +
            ["baja", "media", "alta"].map(v => (
              "<option value=\"" + v + "\"" + (data.rasgos[k] === v ? " selected" : "") + ">" + v + "</option>"
            ).join("")) +
          "</select>" +
        "</label>"
      ).join("")) +
    "</fieldset>" +
    "<label>Tono" +
      "<input type=\"text\" name=\"tono\" value=\"" + esc(data.tono || "") + "\">" +
    "</label>" +
    "<label>Lenguaje" +
      "<input type=\"text\" name=\"lenguaje\" value=\"" + esc(data.lenguaje || "") + "\">" +
    "</label>" +
    "<label>Objetivo" +
      "<input type=\"text\" name=\"objetivo\" value=\"" + esc(data.objetivo || "") + "\">" +
    "</label>" +
    "<label>Dominio (uno por linea)" +
      "<textarea name=\"dominio\" rows=\"3\">" + esc((data.dominio || []).join("\n")) + "</textarea>" +
    "</label>" +
    "<label>Limites (uno por linea)" +
      "<textarea name=\"limites\" rows=\"3\">" + esc((data.limites || []).join("\n")) + "</textarea>" +
    "</label>" +
    "<div class=\"form-actions\">" +
      "<button type=\"button\" class=\"cancel\"> Cancelar </button>" +
      "<button type=\"submit\"> Confirmar </button>" +
    "</div>"
  );

  container.appendChild(form);

  return new Promise((resolve) => {
    form.querySelector(".cancel").addEventListener("click", () => resolve(null));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const result = {
        nombre: (fd.get("nombre") || "").toString().trim(),
        rol: (fd.get("rol") || "").toString().trim(),
        caso: (fd.get("caso") || "").toString().trim(),
        rasgos: {
          apertura: fd.get("apertura"),
          responsabilidad: fd.get("responsabilidad"),
          extraversion: fd.get("extraversion"),
          amabilidad: fd.get("amabilidad"),
          neuroticismo: fd.get("neuroticismo")
        },
        tono: (fd.get("tono") || "").toString().trim(),
        lenguaje: (fd.get("lenguaje") || "").toString().trim(),
        objetivo: (fd.get("objetivo") || "").toString().trim(),
        dominio: splitLines(fd.get("dominio")),
        limites: splitLines(fd.get("limites"))
      };

      if (!result.nombre || !result.rol) {
        alert("Nombre y rol son obligatorios.");
        return;
      }
      resolve(result);
    });
  });
}

/** Convierte un textarea de lineas a un array (ignora vacios). */
function splitLines(value) {
  return (value || "").toString().split("\n").map(l => l.trim()).filter(Boolean);
}

/** Escapa valores para inyectar como texto en HTML. */
function esc(value) {
  return (value == null ? "" : String(value))
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(new RegExp(Q, "g"), "'");
}
