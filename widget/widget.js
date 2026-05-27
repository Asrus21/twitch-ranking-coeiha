// ===== StreamElements Widget JS (paste in JS panel) =====
// Don't forget to update API_URL and WIDGET_KEY below.

const API_URL = 'https://asrus.app/api/ponto';
const WIDGET_KEY = 'troque_essa_chave_aleatoria'; // must match WIDGET_KEY in Vercel env

let fieldData = {};
let queue = [];
let isShowing = false;
let pontosBatidos = new Set();

window.addEventListener('onWidgetLoad', (obj) => {
  fieldData = obj.detail.fieldData;
  document.documentElement.style.setProperty('--accent-color', fieldData.accentColor);
  document.documentElement.style.setProperty('--avatar-size', fieldData.avatarSize + 'px');
  document.documentElement.style.setProperty('--nick-size', fieldData.nickSize + 'px');
  document.documentElement.style.setProperty('--msg-size', fieldData.msgSize + 'px');
});

window.addEventListener('onEventReceived', async (obj) => {
  const listener = obj.detail.listener;
  const event = obj.detail.event;

  if (listener !== 'message') return;

  const data = event.data;
  const message = data.text.trim().toLowerCase();
  const userId = data.userId;
  const username = data.nick;
  const displayName = data.displayName || username;
  const badges = data.badges || [];

  // !pontoreset (broadcaster/mod only)
  if (message === '!pontoreset') {
    const isMod = badges.some((b) => b.type === 'moderator' || b.type === 'broadcaster');
    if (isMod) {
      pontosBatidos.clear();
      queue = [];
      console.log('[ponto] local list reset');
    }
    return;
  }

  if (message !== '!ponto') return;

  // local dedupe (per browser session) — prevents showing the overlay twice for the same user
  if (pontosBatidos.has(userId)) return;
  pontosBatidos.add(userId);

  const avatarUrl = await getAvatar(username);

  // Fire-and-forget the API call. The API also dedupes server-side.
  sendToApi(username, displayName, avatarUrl).catch((e) =>
    console.error('[ponto] api error', e)
  );

  queue.push({ avatarUrl, displayName });
  processQueue();
});

async function sendToApi(username, displayName, avatar) {
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Widget-Key': WIDGET_KEY,
      },
      body: JSON.stringify({ username, displayName, avatar }),
    });
  } catch (e) {
    console.error('[ponto] failed to record', e);
  }
}

async function getAvatar(username) {
  try {
    const res = await fetch(`https://decapi.me/twitch/avatar/${username}`);
    const url = await res.text();
    if (url && url.startsWith('http')) return url;
  } catch (e) {
    console.error('Erro ao buscar avatar:', e);
  }
  return 'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_300x300.png';
}

function processQueue() {
  if (isShowing || queue.length === 0) return;

  isShowing = true;
  const { avatarUrl, displayName } = queue.shift();

  const card = document.getElementById('ponto-card');
  const avatar = document.getElementById('ponto-avatar');
  const nick = document.getElementById('ponto-nick');
  const msg = document.getElementById('ponto-msg');

  avatar.src = avatarUrl;
  nick.textContent = displayName;
  msg.textContent = `${displayName} bateu o ponto!`;

  card.classList.remove('hidden');
  void card.offsetWidth;
  card.classList.add('show');

  setTimeout(() => {
    card.classList.remove('show');
    setTimeout(() => {
      card.classList.add('hidden');
      isShowing = false;
      processQueue();
    }, 400);
  }, fieldData.duration * 1000);
}
