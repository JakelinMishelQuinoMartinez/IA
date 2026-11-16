// ESCUCHA CUANDO SE CARGUE NUESTRO DOM
document.addEventListener('DOMContentLoaded', async function(){
    let elements = {
        modelSelect: document.getElementById('modeloSelect'),
        clearChatBtn: document.getElementById('clearChatBtn'),
        messages: document.getElementById('messages'),
        composer: document.getElementById('composer'),
        prompt: document.getElementById('prompt'),
        sendBtn: document.getElementById('sendBtn'),
        personalitySelect: document.getElementById('personalitySelect') // ==========
    }
    // API RESTUL DE LLM
    const API_KEY = '';
    const DEFAULT_MODEL = 'gemini-2.5-flash';
    // MANEJAR EL CONTEXTO EN MEMORIA, SE GUARDARÁ EL CHAT EN EL ARREGLO VACÍO
    let conversation = [];
    let systemInstruction = ''; // ==========

    // ========== Cargar personalidad de Jarvis ==========
    async function loadPersonality(personalityFile) {
        try {
            const response = await fetch(personalityFile);
            const personality = await response.json();
            return buildSystemInstruction(personality);
        } catch (error) {
            console.error('Error cargando personalidad:', error);
            return '';
        }
    }

    // ========== Construir system instruction desde la definición de personalidad ==========
    function buildSystemInstruction(personality) {
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

    // ========== Inicializar personalidad por defecto (Jarvis) ==========
    systemInstruction = await loadPersonality('./agentes_de_personalidad/jarvis.json');

    elements.clearChatBtn.addEventListener('click', function(){
        const confirmDelete = confirm('¿Borrar toda la conversación?');
        if(!confirmDelete) return; // SE SALE DE LA FUNCIÓ AL PRESIONAR 'NO'
        // TOMA LO QUE ESTÀ EN EL ARREGLO (mensajes) Y LO DIBUJA EN EL CHAT
        conversation = [];
        renderMessages();
    });

    // ========== Cambiar personalidad ==========
    elements.personalitySelect.addEventListener('change', async function(){
        const personalityFile = elements.personalitySelect.value;
        systemInstruction = await loadPersonality(personalityFile);
        // Limpiar conversación al cambiar personalidad para evitar confusión
        conversation = [];
        renderMessages();
    });

    elements.prompt.addEventListener('input', function(){
        // MODIFICAR LOS ESTILOS
        elements.prompt.style.height = 'auto';
        let newHeight = elements.prompt.scrollHeight;
        if(newHeight > 200) {
            newHeight = 200;
        }
        elements.prompt.style.height = newHeight+'px';
    });

    elements.composer.addEventListener('submit', function(e){
        e.preventDefault();
        let text = elements.prompt.value;
        if(text){
            // LIMPIAMOS LOS ESPACIOS PORQUE CONSUMEN TEXTOS
            text = text.trim();
        }
        if(!text){
            return;
        }

        if(!API_KEY){
            alert('Configura tu API Key')
        }
        
        // VALIDAR MODELO 
        let model = elements.modelSelect.value;
        if(!model){
            model = DEFAULT_MODEL;
        }
        // IR AGREGANDO LOS MENSAJES A MI VENTANA DE MENSAJES (rol, text, es error)
        appendMessage('user', text, false);
        elements.prompt.value;
        elements.prompt.style.height = 'auto';

        // CUÁNDO SE ENVÍA EL PROMPT BLOQUEAR EL MISMO BORÓN MIENTRAS LLM RESPONDE
        setSendingState(true);
        // FUNCIÓN DECLARATIVA (SE USAN ANTES DE SER DEFINIDAS)
        // CALLBACK SE EJECUTA AL LLAMAR A LA API
        generateContent(API_KEY, model, conversation, function(error, replyText){
            if(error){
                appendMessage('model', 'Error: '+ error, true);
            }
            else {
                appendMessage('model', replyText, false);
            }
            setSendingState(false);
        }, systemInstruction); // ==========
    });

    // FUNCIÓN DECLARATIVA
    function setSendingState(isSending){
        elements.sendBtn.disabled = isSending
    }

    function appendMessage(role, text, isError){
        conversation.push({ role, parts: [{text}] });
        renderMessages(isError ? (conversation.length -1) : null, isError);
        scrollToBottom();
    }
    // TOMA TODO LOQ EUE HAY EN EN ARRAY Y LO MUESTRA EN EL ÁREA DEL CHAT
    function renderMessages(errorIndex, isError){
        elements.messages.innerHTML = '';
        let i = 0;
        // SE ITERA SEGÙNN LA CANTIDAD DE CHAT
        while( i < conversation.length){
            let msg = conversation[i];
            let wrapper = document.createElement('div');
            wrapper.className = 'message '+ (msg.role === 'user' ? 'user' : 'model');

            // CREAR AVATAR
            let avatar = document.createElement('div');
            avatar.className = 'avatar';
            avatar.textContent = msg.role === 'user' ? 'Tú' : 'G';

            // BURBUJA DE CHAT
            let bubble = document.createElement('div');
            bubble.className = 'bubble';
            // VER SI ESE BUBBLE ES UN ERROR O NO
            if(isError && i === errorIndex){
                bubble.className += ' error';
            }
            let bubbleText = '';
            if(msg && msg.parts && msg.parts[0] && msg.parts[0].text){
                bubbleText = msg.parts[0].text;
            }
            bubble.textContent = bubbleText;

            wrapper.appendChild(avatar);
            wrapper.appendChild(bubble);
            elements.messages.appendChild(wrapper);

            i++;
        }
    }

    // HACER QUE EL ÚLTIMO MENSAJE ES LO QUE VEAMOS Y LOS ANIGUOS SE QUEDEN HASTA ARRIBA
    function scrollToBottom(){
        elements.messages.scrollTop = elements.messages.scrollHeight;
    }


    // ========== CALLBACK SE EJECUTA AL LLAMAR A LA API (con systemInstruction) ==========
    function generateContent(apiKey, model, contents, callback, systemInstruction) {
        let url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(apiKey);

        // DATOS QUE PROCESARÁ NUESTRO LLM
        let payload = {contents};
        if (systemInstruction) { // ==========
            payload.systemInstruction = {
                parts: [{text: systemInstruction}]
            };
        }

        // CREAR INSTANCIA DE UN OBJETO PARA HACER SOLICITUDES A UNA API
        let xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
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
                    let candidate = data.candidates[0];
                    if (candidate.content && candidate.content. parts && candidate.content.parts[0]) {
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
                    let errJson = JSON.parse(xhr.responseText);
                    if (errJson && errJson.error && errJson.error.message) {
                    errorMsg = errorMsg + ': ' + errJson.error.message;
                    }
                } catch (e2) {
                    // ignore
                }
                callback(errorMsg, null);
            }
          }
        };
     
        try {
          xhr.send(JSON.stringify(payload));
        } catch (sendErr) {
          callback('No se pudo enviar la solicitud', null);
        }
      }
})