const mineflayer = require('mineflayer');
const config = require('./config.json');

const RECONNECT_DELAY = 5000;

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
      bot.setControlState('sneak', true);
      console.log(`✅ ${config.botUsername} is Ready!`);
    }, 3000);
    setTimeout(movementCycle, STEP_INTERVAL);
  });

  bot.on('chat', (username, message) => {
    if (username === config.botUsername) return;

    if (message === '!status') {
      if (!spawnTime) { bot.chat('Henüz sunucuya bağlanmadım!'); return; }
      const ms = Date.now() - spawnTime;
      const hours = Math.floor(ms / 3600000);
      const minutes = Math.floor((ms % 3600000) / 60000);
      const seconds = Math.floor((ms % 60000) / 1000);
      bot.chat(`Sunucuda ${hours} saat ${minutes} dakika ${seconds} saniyedir bekliyorum!`);
    }
    else if (message === '!naber') {
      bot.chat('iyidir senden naber kanks');
    }
    else if (message === '!iyiyim') {
      bot.chat('sevindim');
    }
    else if (message === '!kaccm') {
      const cm = Math.floor(Math.random() * 40) + 1;
      bot.chat(`${cm}cm`);
    }
  });

  function movementCycle() {
    if (!bot.entity) return;
    switch (movementPhase) {
      case 0: bot.setControlState('forward', true); bot.setControlState('back', false); bot.setControlState('jump', false); break;
      case 1: bot.setControlState('forward', false); bot.setControlState('back', true); bot.setControlState('jump', false); break;
      case 2: bot.setControlState('forward', false); bot.setControlState('back', false); bot.setControlState('jump', true);
        setTimeout(() => { bot.setControlState('jump', false); }, JUMP_DURATION); break;
      case 3: bot.setControlState('forward', false); bot.setControlState('back', false); bot.setControlState('jump', false); break;
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
