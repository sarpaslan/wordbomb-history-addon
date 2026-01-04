const { WordBombAddon } = require('./wordbomb-addon.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const addon = new WordBombAddon(process.env.ADDON_TOKEN, {
  name: 'Word History',
  desc: 'Track your last 100 words and prompts, export to Discord',
  practice: false,
  permissions: ['io.wordbomb.sendmessage'],
  welcome: `
    <h3>Word History</h3>
    <p>Track your recent words and prompts!</p>
    <p><b>/history</b> - View recent words</p>
    <p><b>/export</b> - Send history to Discord DM</p>
    <p><b>/clearhistory</b> - Clear your history</p>
  `
});

const HISTORY_FILE = path.join(__dirname, 'history.json');
const MAX_ENTRIES = 100;
const EXPORT_COOLDOWN = 60 * 1000;

let playerHistory = {};
const lastExport = new Map();

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      playerHistory = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load history:', e);
  }
}

function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(playerHistory, null, 2));
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}

function getHistory(clientId) {
  if (!playerHistory[clientId]) {
    playerHistory[clientId] = [];
  }
  return playerHistory[clientId];
}

function addEntry(clientId, entry) {
  const history = getHistory(clientId);
  history.unshift(entry);
  if (history.length > MAX_ENTRIES) {
    history.pop();
  }
  saveHistory();
}

loadHistory();

addon.registerCommand('history', (client, args) => {
  const history = getHistory(client.id);

  if (history.length === 0) {
    addon.sendChat(client.id, 'No history yet! Play some games first.');
    return;
  }

  const recent = history.slice(0, 10);
  const lines = recent.map((entry, i) => {
    const status = entry.correct ? '✓' : '✗';
    return `${status} [${entry.prompt}] ${entry.word}`;
  });

  addon.sendEmbed(client.id, {
    icon: '📜',
    title: `Recent Words (${history.length} total)`,
    content: lines.join('\n'),
    color: '#3b82f6'
  });
});

addon.registerCommand('export', async (client, args) => {
  const now = Date.now();
  const last = lastExport.get(client.id) || 0;
  const remaining = Math.ceil((EXPORT_COOLDOWN - (now - last)) / 1000);

  if (now - last < EXPORT_COOLDOWN) {
    addon.sendChat(client.id, `Please wait ${remaining}s before exporting again.`);
    return;
  }

  const history = getHistory(client.id);

  if (history.length === 0) {
    addon.sendChat(client.id, 'No history to export!');
    return;
  }

  const lines = ['Word History Export', '==================', ''];

  for (const entry of history) {
    const status = entry.correct ? 'O' : 'X';
    lines.push(`[${entry.prompt}] ${entry.word || '-'} ${status}`);
  }

  lines.push('', `Total: ${history.length} entries`);

  const content = lines.join('\n');
  const fileName = `word-history-${Date.now()}.txt`;

  try {
    await addon.sendDiscordFile(client.id, fileName, content);
    lastExport.set(client.id, Date.now());
    addon.sendChat(client.id, 'History sent to your Discord DMs!');
  } catch (err) {
    if (err === 'Permission denied') {
      addon.sendChat(client.id, 'Permission denied. Please enable the addon again and grant permission.');
    } else if (err === 'Rate limited') {
      addon.sendChat(client.id, 'Rate limited. Please wait before exporting again.');
    } else {
      addon.sendChat(client.id, 'Failed to send. Make sure you can receive DMs from the bot.');
    }
  }
});

addon.registerCommand('clearhistory', (client, args) => {
  playerHistory[client.id] = [];
  saveHistory();
  addon.sendChat(client.id, 'Your history has been cleared!');
});

addon.on('ready', (id) => {
  console.log('Word History addon ready:', id);
});

addon.on('turn', (data, client) => {
  const history = getHistory(client.id);
  if (history.length > 0 && history[0].prompt === data.letter && !history[0].word) {
    return;
  }
  addEntry(client.id, {
    prompt: data.letter,
    word: null,
    correct: null,
    timestamp: Date.now()
  });
});

addon.on('submit', (data, client) => {
  const history = getHistory(client.id);

  if (history.length > 0 && history[0].word === null) {
    history[0].word = data.word;
    history[0].correct = data.correct;
    saveHistory();
  } else {
    addEntry(client.id, {
      prompt: data.letter || '?',
      word: data.word,
      correct: data.correct,
      timestamp: Date.now()
    });
  }
});

addon.on('error', (err) => {
  console.error('Addon error:', err);
});
