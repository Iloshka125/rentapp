// Утилита для обхода Mixed Content через iframe
class ApiProxy {
  constructor() {
    this.iframe = null;
    this.callbacks = new Map();
    this.messageId = 0;
    this.setupMessageListener();
  }

  setupMessageListener() {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'API_RESPONSE') {
        const { messageId, data, error } = event.data;
        const callback = this.callbacks.get(messageId);
        if (callback) {
          callback(error, data);
          this.callbacks.delete(messageId);
        }
      }
    });
  }

  createIframe() {
    if (this.iframe) return;
    
    this.iframe = document.createElement('iframe');
    this.iframe.style.display = 'none';
    this.iframe.src = 'https://91.92.42.248/proxy.html'; // Нужно создать на сервере
    document.body.appendChild(this.iframe);
  }

  async request(url, options = {}) {
    return new Promise((resolve, reject) => {
      // Если есть поддержка fetch и нет Mixed Content, используем обычный запрос
      if (window.location.protocol === 'https:' || url.startsWith('https:')) {
        fetch(url, options)
          .then(response => response.json())
          .then(data => resolve(data))
          .catch(error => reject(error));
        return;
      }

      // Иначе используем iframe proxy
      this.createIframe();
      const messageId = ++this.messageId;
      
      this.callbacks.set(messageId, (error, data) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(data);
        }
      });

      this.iframe.contentWindow.postMessage({
        type: 'API_REQUEST',
        messageId,
        url,
        options
      }, 'https://91.92.42.248/api');
    });
  }
}

export const apiProxy = new ApiProxy();
