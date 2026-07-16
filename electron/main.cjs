const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function getStoragePath() {
  return path.join(app.getPath('userData'), 'gamevault_data.json');
}

function readDataFile() {
  const filePath = getStoragePath();
  if (!fs.existsSync(filePath)) {
    return { games: [], settings: {} };
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) || { games: [], settings: {} };
  } catch (error) {
    console.error('Error reading storage file:', error);
    return { games: [], settings: {} };
  }
}

function writeDataFile(data) {
  const filePath = getStoragePath();
  try {
    // Ensure dir exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing storage file:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    title: 'GameVault',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Remove default menu for a cleaner console cockpit aesthetic
  mainWindow.setMenu(null);

  // In development, load local Vite dev server
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('load-games', () => {
  const data = readDataFile();
  return data.games || [];
});

ipcMain.handle('save-games', (event, games) => {
  const data = readDataFile();
  data.games = games;
  writeDataFile(data);
  return true;
});

ipcMain.handle('load-settings', () => {
  const data = readDataFile();
  return data.settings || {};
});

ipcMain.handle('save-settings', (event, settings) => {
  const data = readDataFile();
  data.settings = settings;
  writeDataFile(data);
  return true;
});

ipcMain.handle('fetch-steam-games', async (event, { steamId, apiKey }) => {
  const cleanId = steamId.trim();
  const isNumeric = /^\d+$/.test(cleanId) && cleanId.length === 17;

  const profileUrl = isNumeric
    ? `https://steamcommunity.com/profiles/${cleanId}/?xml=1`
    : `https://steamcommunity.com/id/${cleanId}/?xml=1`;

  const profileResponse = await fetch(profileUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!profileResponse.ok) {
    throw new Error('Failed to retrieve Steam profile. Check ID or custom name.');
  }

  const xmlText = await profileResponse.text();
  const steamIdMatch = xmlText.match(/<steamID64>(\d+)<\/steamID64>/);
  const numericId = steamIdMatch ? steamIdMatch[1] : (isNumeric ? cleanId : null);

  if (!numericId) {
    throw new Error('Steam profile not found. Verify your ID or Custom URL Name.');
  }

  if (apiKey && apiKey.trim()) {
    const gamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey.trim()}&steamid=${numericId}&include_appinfo=true&include_played_free_games=true&format=json`;
    const gamesResponse = await fetch(gamesUrl);
    if (!gamesResponse.ok) {
      throw new Error('Steam Web API Key validation failed.');
    }

    const data = await gamesResponse.json();
    if (!data.response || !data.response.games) {
      throw new Error('No games found or profile is private.');
    }

    return {
      type: 'full',
      games: data.response.games.map(game => ({
        appid: game.appid,
        name: game.name,
        playtime_forever: game.playtime_forever,
      }))
    };
  }

  const games = [];
  const mostPlayedGamesRegex = /<mostPlayedGame>([\s\S]*?)<\/mostPlayedGame>/g;
  let match;
  while ((match = mostPlayedGamesRegex.exec(xmlText)) !== null) {
    const gameBlock = match[1];
    const gameName = gameBlock.match(/<gameName><!\[CDATA\[([\s\S]*?)\]\]><\/gameName>/)?.[1] 
                  || gameBlock.match(/<gameName>(.*?)<\/gameName>/)?.[1];
    const gameLink = gameBlock.match(/<gameLink><!\[CDATA\[([\s\S]*?)\]\]><\/gameLink>/)?.[1]
                  || gameBlock.match(/<gameLink>(.*?)<\/gameLink>/)?.[1];
    const hoursOnRecord = gameBlock.match(/<hoursOnRecord>(.*?)<\/hoursOnRecord>/)?.[1];

    const appidMatch = gameLink ? gameLink.match(/\/app\/(\d+)/) : null;
    const appid = appidMatch ? parseInt(appidMatch[1]) : null;
    const playtime_forever = hoursOnRecord ? Math.round(parseFloat(hoursOnRecord) * 60) : 0;

    if (gameName) {
      games.push({
        appid,
        name: gameName,
        playtime_forever,
      });
    }
  }

  if (games.length === 0) {
    throw new Error('No recently played games found (or profile is private). Paste a free Web API Key to sync your entire library.');
  }

  return {
    type: 'recent',
    games
  };
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
