// chat.js — Lógica de renderizado y estado del chat.
// ChatManager encapsula la conversación en memoria y el renderizado en el DOM.

export class ChatManager {
  /**
   * @param {object} elements — Referencias a los elementos del DOM.
   * @param {string} [userLabel='Tú'] — Texto del avatar del usuario.
   * @param {string} [modelLabel='G'] — Texto del avatar del modelo.
   */
  constructor(elements, userLabel = 'Tú', modelLabel = 'G') {
    this.elements = elements;
    this.userLabel = userLabel;
    this.modelLabel = modelLabel;
    this.conversation = [];
  }

  /** Añade un mensaje a la conversación y lo renderiza. */
  appendMessage(role, text, isError = false) {
    this.conversation.push({ role, parts: [{ text }] });
    this.renderMessages(isError ? this.conversation.length - 1 : null, isError);
    this.scrollToBottom();
  }

  /** Limpia toda la conversación. */
  clear() {
    this.conversation = [];
    this.renderMessages();
  }

  /** Renderiza todos los mensajes en el área de chat. */
  renderMessages(errorIndex = null, isError = false) {
    this.elements.messages.innerHTML = '';
    let i = 0;
    while (i < this.conversation.length) {
      const msg = this.conversation[i];
      const wrapper = document.createElement('div');
      wrapper.className = 'message ' + (msg.role === 'user' ? 'user' : 'model');

      // Avatar
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = msg.role === 'user' ? this.userLabel : this.modelLabel;

      // Burbuja
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      if (isError && i === errorIndex) {
        bubble.className += ' error';
      }
      let bubbleText = '';
      if (msg && msg.parts && msg.parts[0] && msg.parts[0].text) {
        bubbleText = msg.parts[0].text;
      }
      bubble.textContent = bubbleText;

      wrapper.appendChild(avatar);
      wrapper.appendChild(bubble);
      this.elements.messages.appendChild(wrapper);

      i++;
    }
  }

  /** Desplaza el scroll hacia el último mensaje. */
  scrollToBottom() {
    this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
  }

  /** Activa/desactiva el botón de envío mientras la API responde. */
  setSendingState(isSending) {
    this.elements.sendBtn.disabled = isSending;
  }
}