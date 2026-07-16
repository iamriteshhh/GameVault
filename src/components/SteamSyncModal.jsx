import { useState } from 'react';
import '../styles/SteamSyncModal.css';

// On Android (Capacitor native), CapacitorHttp is enabled in capacitor.config.json
// which patches window.fetch to use the native HTTP client, bypassing CORS.
// So we can just use regular fetch() here and it works on both desktop and mobile.
async function fetchSteamGamesMobile({ steamId, apiKey }) {
  const cleanId = steamId.trim();
  const isNumeric = /^\d+$/.test(cleanId) && cleanId.length === 17;

  const profileUrl = isNumeric
    ? `https://steamcommunity.com/profiles/${cleanId}/?xml=1`
    : `https://steamcommunity.com/id/${cleanId}/?xml=1`;

  let profileResponse;
  try {
    profileResponse = await fetch(profileUrl);
  } catch (fetchErr) {
    throw new Error('Network error connecting to Steam. Check your internet connection.');
  }

  if (!profileResponse.ok) {
    throw new Error('Failed to retrieve Steam profile. Check ID or custom name.');
  }

  const xmlText = await profileResponse.text();
  if (!xmlText) {
    throw new Error('No profile data returned from Steam.');
  }

  const steamIdMatch = xmlText.match(/<steamID64>(\d+)<\/steamID64>/);
  const numericId = steamIdMatch ? steamIdMatch[1] : (isNumeric ? cleanId : null);

  if (!numericId) {
    throw new Error('Steam profile not found. Verify your ID or Custom URL Name.');
  }

  if (apiKey && apiKey.trim()) {
    const gamesUrl = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey.trim()}&steamid=${numericId}&include_appinfo=true&include_played_free_games=true&format=json`;
    
    let gamesResponse;
    try {
      gamesResponse = await fetch(gamesUrl);
    } catch (fetchErr) {
      throw new Error('Network error connecting to Steam API.');
    }

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
}

export default function SteamSyncModal({ initialApiKey, onSaveApiKey, onClose, onImport, onPushToast }) {
  const [steamId, setSteamId] = useState('');
  const [apiKey, setApiKey] = useState(initialApiKey || '');
  const [busy, setBusy] = useState(false);

  async function handleSync(e) {
    e.preventDefault();
    const id = steamId.trim();
    const key = apiKey.trim();

    if (!id) {
      onPushToast('Please enter a Steam ID or Custom Name.', 'error');
      return;
    }

    setBusy(true);
    try {
      // Save key in app state / settings persistence
      onSaveApiKey(key);

      let result;
      if (window.electronAPI) {
        // Query GOG-style fetch handler in Electron Node.js main process
        result = await window.electronAPI.fetchSteamGames({ steamId: id, apiKey: key });
      } else {
        // Run mobile Capacitor native implementation
        result = await fetchSteamGamesMobile({ steamId: id, apiKey: key });
      }


      const importedGames = result.games.map(game => {
        const hours = parseFloat((game.playtime_forever / 60).toFixed(1)) || 0;
        return {
          title: game.name,
          genre: '',
          platform: 'PC',
          releaseYear: '',
          status: hours > 0 ? 'Playing' : 'Backlog',
          rating: 0,
          hoursPlayed: hours,
          favorite: false,
          review: '',
          coverImage: game.appid ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appid}/library_600x900_2x.jpg` : '',
        };
      });

      onImport(importedGames);

      if (result.type === 'recent') {
        onPushToast(`Synced ${importedGames.length} recently played games keylessly! Paste a Web API Key in Settings to sync your entire library.`, 'success');
      } else {
        onPushToast(`Successfully synced ${importedGames.length} games from your library!`, 'success');
      }

      onClose();
    } catch (err) {
      console.error(err);
      onPushToast(err.message || 'Profile search failed. Make sure your Game Details privacy is public.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="steam-sync-modal">
      <div className="modal-header">
        <div>
          <p className="kicker">TELEMETRY_IMPORT_SERVICE</p>
          <h2 className="title">Import Steam Library</h2>
        </div>
        <button type="button" onClick={onClose} className="close-btn" disabled={busy}>
          x
        </button>
      </div>

      <div className="modal-body">
        <p className="description">
          Sync your Steam games and playtimes using the official Steam Web API.
        </p>

        <div className="instructions">
          <div className="step">
            <span className="num">01</span> Ensure your Steam profile's <strong>Game Details</strong> are set to <strong>Public</strong>.
          </div>
          <div className="step">
            <span className="num">02</span> Enter a free Steam Web API Key from{' '}
            <a href="https://steamcommunity.com/dev/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-amber)', textDecoration: 'underline' }}>
              steamcommunity.com/dev/apikey
            </a>.
          </div>
          <div className="step">
            <span className="num">03</span> Enter your <strong>Steam ID</strong> (17 digits) or <strong>Custom URL Name</strong>.
          </div>
        </div>

        <form onSubmit={handleSync} className="sync-form">
          <label className="sync-label">
            <span>Steam Web API Key</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your 32-character Steam Web API Key"
              className="sync-input"
              disabled={busy}
            />
          </label>

          <label className="sync-label">
            <span>Steam Profile ID or Custom Name</span>
            <input
              type="text"
              value={steamId}
              onChange={(e) => setSteamId(e.target.value)}
              placeholder="e.g. 76561198031548484 or custom_username"
              className="sync-input"
              disabled={busy}
            />
          </label>

          <button type="submit" className="sync-btn" disabled={busy}>
            {busy ? 'CONNECTING & RETRIEVING...' : 'START SYNC TELEMETRY'}
          </button>
        </form>

        {busy && (
          <div className="scanner-line">
            <div className="scan"></div>
          </div>
        )}
      </div>
    </div>
  );
}
