const STORAGE_KEY = 'gamevault_games'
const SETTINGS_KEY = 'gamevault_settings'

export async function loadGames() {
  try {
    if (window.electronAPI) {
      return await window.electronAPI.loadGames();
    }
    const raw = localStorage.getItem('gamevault_games');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('GameVault: load error, resetting.', e);
    return [];
  }
}

export async function saveGames(games) {
  try {
    if (window.electronAPI) {
      await window.electronAPI.saveGames(games);
      return;
    }
    localStorage.setItem('gamevault_games', JSON.stringify(games));
  } catch (e) {
    console.error('GameVault: failed to save games.', e);
  }
}

export async function loadSettings() {
  try {
    if (window.electronAPI) {
      return await window.electronAPI.loadSettings();
    }
    const raw = localStorage.getItem('gamevault_settings');
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export async function saveSettings(settings) {
  try {
    if (window.electronAPI) {
      await window.electronAPI.saveSettings(settings);
      return;
    }
    localStorage.setItem('gamevault_settings', JSON.stringify(settings));
  } catch {}
}
