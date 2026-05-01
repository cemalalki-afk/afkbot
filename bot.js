const mineflayer = require('mineflayer');
const config = require('./config.json');

const RECONNECT_DELAY = 5000;
const AI_TOKEN = process.env.GITHUB_TOKEN;
const AI_COOLDOWN = 3000;
let lastAIResponse = 0;

async function callAI(username, message) {
  try {
    const res = await fetch('https://models.inference.ai.azure.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Sen CodexBOT2 adında bir Minecraft botusun. Türkçe konuş, çok kısa ve samimi cevaplar ver (maksimum 1 cümle, 50 kelimeden az), arkadaş gibi konuş. Minecraft dünyasındasın.'
          },
          {
            role: 'user',
            content: `${username} sana şunu söyledi: ${message}`
          }
        ],
        max_tokens: 80
      })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error('AI hatası:', err.message);
    return null;
  }
}

function createBot() {
  console.log(`🔄 Connecting to ${config.serverHost}:${config.serverPort} as ${config.botUsername}...`);

  const bot = mineflayer.createBot({
    host: config.serverHost,
    port: config.serverPort,
    username: config.botUsername,
    auth: 'offline',
    version: false,
    viewDistance: config.botChunk
  });

  let movementPhase = 0;
  const STEP_INTERVAL = 1500;
  const JUMP_DURATION = 500;
  let spawnTime = null;

  bot.on('spawn', () => {
    spawnTime = Date.now();
    setTimeout(() => {
      bot.chat('/register 123456abc- 123456abc-');
      console.log('📝 Register komutu gönderildi');
    }, 1500);
    setTimeout(() => {
      bot.chat('/login 123456abc-');
      console.log('🔑 Login komutu gönderildi');
    }, 3000);
    setTimeout(() => {
      bot.setControlState('sneak', true);
      console.log(`✅ ${config.botUsername} is Ready!`);
    }, 5000);
    setTimeout(movementCycle, STEP_INTERVAL);
  });

  bot.on('chat', async (username, message) => {
    if (username === config.botUsername) return;

    const lower = message.toLowerCase();

    if (message === '!status') {
      if (!spawnTime) { bot.chat('Henüz sunucuya bağlanmadım!'); return; }
      const ms = Date.now() - spawnTime;
      const hours = Math.floor(ms / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      bot.chat(`Sunucuda ${hours} saat ${minutes} dakika ${seconds} saniyedir bekliyorum!`);
      return;
    }

    if (message === '!naber') {
      bot.chat('iyidir senden naber kanks');
      return;
    }

    if (message === '!iyiyim') {
      bot.chat('sevindim');
      return;
    }

    if (message === '!kaccm') {
      const cm = Math.floor(Math.random() * 40) + 1;
      bot.chat(`${cm}cm`);
      return;
    }

    if (lower.startsWith('bot ')) {
      const now = Date.now();
      if (now - lastAIResponse < AI_COOLDOWN) return;
      lastAIResponse = now;

      const userMessage = message.slice(4).trim();
      if (!userMessage) return;

      if (!AI_TOKEN) {
        bot.chat('AI token ayarlanmamış!');
        return;
      }

      console.log(`🤖 AI isteği: ${username}: ${userMessage}`);
      const reply = await callAI(username, userMessage);
      if (reply) {
        bot.chat(reply.slice(0, 250));
        console.log(`🤖 AI cevabı: ${reply}`);
      }
    }
  });

  function movementCycle() {
    if (!bot.entity) return;
    switch (movementPhase) {
      case 0:
        bot.setControlState('forward', true);
        bot.setControlState('back', false);
        bot.setControlState('jump', false);
        break;
      case 1:
        bot.setControlState('forward', false);
        bot.setControlState('back', true);
        bot.setControlState('jump', false);
        break;
      case 2:
        bot.setControlState('forward', false);
        bot.setControlState('back', false);
        bot.setControlState('jump', true);
        setTimeout(() => { bot.setControlState('jump', false); }, JUMP_DURATION);
        break;
      case 3:
        bot.setControlState('forward', false);
        bot.setControlState('back', false);
        bot.setControlState('jump', false);
        break;
    }
    movementPhase = (movementPhase + 1) % 4;
    setTimeout(movementCycle, STEP_INTERVAL);
  }

  let reconnectScheduled = false;

  function scheduleReconnect() {
    if (reconnectScheduled) return;
    reconnectScheduled = true;
    console.log(`🔁 Reconnecting in ${RECONNECT_DELAY / 1000}s...`);
    setTimeout(createBot, RECONNECT_DELAY);
  }

  bot.on('error', (err) => { console.error('⚠️ Error:', err.message); scheduleReconnect(); });
  bot.on('end', () => { console.log('⛔️ Bot Disconnected!'); scheduleReconnect(); });
}

createBot();
