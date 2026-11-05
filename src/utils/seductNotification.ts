/**
 * Utilitários para Alertas Lúdicos tipo WhatsApp, Notificações Mobile e Carregamento de Imagens da SEDUCT
 */

/**
 * Toca sinal sonoro lúdico em dois tons agradáveis, idêntico à sinalização de mensagem do WhatsApp
 * Utiliza a Web Audio API nativa para máxima compatibilidade sem depender de arquivos externos.
 */
export function playWhatsAppChime() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Primeiro tom: E6 (1318.5 Hz) com subida rápida para A6 (1760 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.5, now);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.08);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.17);

    // Segundo tom (o característico "plim" do WhatsApp): C7 (2093 Hz) -> E7 (2637 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2093, now + 0.11);
    osc2.frequency.exponentialRampToValueAtTime(2637, now + 0.2);
    gain2.gain.setValueAtTime(0.3, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.11);
    osc2.stop(now + 0.36);
  } catch (err) {
    console.warn('Audio chime note could not play:', err);
  }
}

/**
 * Dispara vibração tátil no celular no padrão clássico de notificação
 */
export function triggerHapticNotification() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([100, 60, 140]);
    } catch {
      // Ignorar erros se o dispositivo não permitir vibração
    }
  }
}

let currentUnreadCount = 0;

/**
 * Atualiza o badge no ícone do aplicativo (App Badging API nativa de celulares e desktops instalados)
 * e também desenha a bolinha vermelha estilo WhatsApp no favicon da aba para máxima visibilidade.
 */
export function updateAppBadge(count?: number) {
  if (typeof count === 'number') {
    currentUnreadCount = count;
  } else {
    currentUnreadCount++;
  }

  // 1. App Badging API Oficial (PWA no celular e desktop)
  if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
    try {
      (navigator as unknown as { setAppBadge: (c?: number) => Promise<void> })
        .setAppBadge(currentUnreadCount > 0 ? currentUnreadCount : undefined)
        .catch(() => {});
    } catch {
      // Ignorar caso não suportado
    }
  }

  // 2. Atualizar Favicon dinamicamente com bolinha vermelha de notificação estilo WhatsApp
  drawFaviconBadge(currentUnreadCount);
}

/**
 * Limpa o badge do ícone do aplicativo
 */
export function clearAppBadge() {
  currentUnreadCount = 0;
  if (typeof navigator !== 'undefined' && 'clearAppBadge' in navigator) {
    try {
      (navigator as unknown as { clearAppBadge: () => Promise<void> })
        .clearAppBadge()
        .catch(() => {});
    } catch {
      // Ignorar
    }
  }
  drawFaviconBadge(0);
}

/**
 * Desenha uma bolinha vermelha estilizada no favicon da aba do navegador
 */
function drawFaviconBadge(count: number) {
  if (typeof document === 'undefined') return;
  try {
    const favicon = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
    if (!favicon) return;

    if (count <= 0) {
      favicon.href = '/pwa-192x192.png';
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/pwa-192x192.png';
    img.onload = () => {
      ctx.clearRect(0, 0, 64, 64);
      ctx.drawImage(img, 0, 0, 64, 64);

      // Badge vermelho estilo notificação do WhatsApp no canto superior direito
      ctx.fillStyle = '#25D366'; // Borda verde estilo WhatsApp
      ctx.beginPath();
      ctx.arc(48, 16, 15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#E53935'; // Vermelho alerta
      ctx.beginPath();
      ctx.arc(48, 16, 13, 0, Math.PI * 2);
      ctx.fill();

      // Número ou ponto
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const label = count > 9 ? '9+' : String(count);
      ctx.fillText(label, 48, 16);

      favicon.href = canvas.toDataURL('image/png');
    };
  } catch {
    // Ignorar falhas de canvas
  }
}

/**
 * Dispara notificação push oficial do navegador/mobile
 */
export function sendMobilePushNotification(title: string, body: string, url?: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: 'efem-seduct-alert',
      });
      if (url) {
        notif.onclick = () => {
          window.focus();
          window.open(url, '_blank');
        };
      }
    } catch {
      // Silenciar erro em navegadores que exigem serviceWorker
    }
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().catch(() => {});
  }
}

/**
 * Alerta completo estilo WhatsApp: som + vibração celular + push do sistema + Badge no ícone do aplicativo
 */
export function notifyUserWhatsAppStyle(title: string, body: string, url?: string) {
  playWhatsAppChime();
  triggerHapticNotification();
  updateAppBadge();
  sendMobilePushNotification(title, body, url);
}

/**
 * Gera URL confiável para qualquer imagem da SEDUCT através do proxy local,
 * prevenindo bloqueios de CORS, iframe e ausência de cabeçalho Referer.
 */
export function getSeductProxiedImageUrl(originalUrl: string | undefined): string {
  if (!originalUrl || originalUrl === 'https://seduct.campos.rj.gov.br/eventos/') {
    return 'https://seduct.campos.rj.gov.br/eventos/CARD-MODELO-TODOS_64.jpg';
  }
  if (originalUrl.startsWith('https://seduct.campos.rj.gov.br/')) {
    return `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;
  }
  return originalUrl;
}
