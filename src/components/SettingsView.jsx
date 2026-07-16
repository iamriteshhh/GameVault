import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import ScrambleText from './ScrambleText.jsx';
import logoImg from '../assets/logo-amber.jpg';
import '../styles/SettingsView.css';

async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard failed, using fallback', err);
    }
  }

  // Fallback to execCommand (works in insecure context / mobile WebView localhost)
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  textArea.style.left = "-99999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    document.body.removeChild(textArea);
    return false;
  }
}

export default function SettingsView({ 
  rawgApiKey, 
  onSaveRawgKey, 
  games, 
  onImportGames, 
  onPushToast 
}) {
  const [rawgKeyInput, setRawgKeyInput] = useState(rawgApiKey || '');

  function handleSaveKeys(e) {
    e.preventDefault();
    onSaveRawgKey(rawgKeyInput.trim());
    onPushToast('API configuration updated.', 'success');
  }

  async function handleExport() {
    try {
      const backupJson = JSON.stringify(games, null, 2);
      const fileName = `gamevault_backup_${new Date().toISOString().split('T')[0]}.json`;

      // 1. Try Capacitor native filesystem + share if on native app
      if (Capacitor.isNativePlatform()) {
        try {
          const result = await Filesystem.writeFile({
            path: fileName,
            data: backupJson,
            directory: Directory.Cache,
            encoding: 'utf8'
          });

          await Share.share({
            title: 'GameVault Backup',
            text: 'Here is your GameVault library backup file.',
            url: result.uri,
            dialogTitle: 'Share Library Backup'
          });
          onPushToast('Backup file shared successfully.', 'success');
          return;
        } catch (nativeErr) {
          // If native share fails or cancel, log it, but fall through just in case
          console.warn('Native share failed, attempting browser share fallback', nativeErr);
        }
      }

      // 2. Try native Web Share API
      if (navigator.share) {
        try {
          const file = new File([backupJson], fileName, { type: 'application/json' });
          await navigator.share({
            files: [file],
            title: 'GameVault Backup',
            text: 'Here is your GameVault library backup file.'
          });
          onPushToast('Backup file shared successfully.', 'success');
          return;
        } catch (shareErr) {
          // If user cancelled, don't show error toast
          if (shareErr.name === 'AbortError') return;
          // Otherwise, fall through to browser download fallback
        }
      }

      // 3. Browser/Electron fallback anchor download
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(backupJson);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', fileName);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onPushToast('Database backup downloaded.', 'success');
    } catch (err) {
      // 4. Last resort fallback: copy to clipboard
      const copied = await copyToClipboard(JSON.stringify(games, null, 2));
      if (copied) {
        onPushToast('Backup copied to clipboard (export failed).', 'info');
      } else {
        onPushToast('Failed to export library.', 'error');
      }
    }
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        let gamesList = [];

        if (Array.isArray(importedData)) {
          gamesList = importedData;
        } else if (importedData && Array.isArray(importedData.games)) {
          gamesList = importedData.games;
        } else {
          onPushToast('Invalid backup file structure.', 'error');
          return;
        }

        if (window.confirm(`Are you sure you want to import ${gamesList.length} games? This will replace your current library.`)) {
          onImportGames(gamesList);
          onPushToast('Database imported successfully.', 'success');
        }
      } catch {
        onPushToast('Failed to parse backup JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  }

  const databaseSize = (JSON.stringify(games).length / 1024).toFixed(2);

  return (
    <section className="settings-view">
      <div className="section-header">
        <h2 className="section-title">
          <ScrambleText text="SYSTEM_SETTINGS_CONSOLE" />
        </h2>
      </div>

      <div className="settings-grid">
        {/* API Key Panel */}
        <div className="settings-panel">
          <h3 className="panel-title">
            <span className="dot"></span>
            API Integrations & Keys
          </h3>
          <p className="panel-desc">
            Configure third-party database keys. Adding a RAWG key unlocks retro and console search capabilities alongside Steam.
          </p>

          <form onSubmit={handleSaveKeys} className="settings-form">
            <label className="settings-label">
              <span>RAWG API Key (Custom / Paid / Free Key)</span>
              <input
                type="text"
                value={rawgKeyInput}
                onChange={(e) => setRawgKeyInput(e.target.value)}
                placeholder="Enter rawg.io API key (e.g. 5a2d8e...)"
                className="settings-input"
              />
            </label>
            <div className="help-text">
              Don't have a key? Sign up for a free developer key at <a href="https://rawg.io/apidocs" target="_blank" rel="noreferrer">rawg.io/apidocs</a>.
            </div>

            <button type="submit" className="settings-btn save">
              SAVE KEY CONFIG
            </button>
          </form>
        </div>

        {/* Database Management Panel */}
        <div className="settings-panel">
          <h3 className="panel-title">
            <span className="dot"></span>
            Local Database Console
          </h3>
          <p className="panel-desc">
            Export backups of your game vault or import an existing data file. All changes save directly to your native drive.
          </p>

          <div className="db-metrics">
            <div className="metric-row">
              <span className="metric-label">LIBRARY COUNTER</span>
              <span className="metric-value">{games.length} games</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">DISK USAGE</span>
              <span className="metric-value">{databaseSize} KB</span>
            </div>
            <div className="metric-row">
              <span className="metric-label">ACTIVE ENGINES</span>
              <span className="metric-value color-cyan">
                STEAMSearch {rawgApiKey ? '+ RAWG_HD' : ''}
              </span>
            </div>
          </div>

          <div className="db-actions">
            <button onClick={handleExport} className="settings-btn export">
              EXPORT DATABASE (.JSON)
            </button>

            <label className="settings-btn import">
              IMPORT DATABASE (.JSON)
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          <div className="text-backup-console" style={{ marginTop: '16px', borderTop: '1px dashed var(--bg-card)', paddingTop: '16px' }}>
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Manual Backup Code (Copy/Paste)
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button 
                onClick={async () => {
                  const copied = await copyToClipboard(JSON.stringify(games, null, 2));
                  if (copied) {
                    onPushToast('Backup JSON code copied to clipboard!', 'success');
                  } else {
                    onPushToast('Failed to copy to clipboard.', 'error');
                  }
                }} 
                className="settings-btn" 
                style={{ fontSize: '0.7rem', padding: '8px 12px', background: 'rgba(255, 159, 28, 0.05)', borderColor: 'rgba(255, 159, 28, 0.2)', color: 'var(--accent-amber)' }}
              >
                COPY BACKUP CODE
              </button>
              <textarea
                placeholder="Paste backup JSON code here to import..."
                id="manual-backup-import-area"
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--bg-card)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  padding: '8px',
                  height: '60px',
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
              <button 
                onClick={() => {
                  const area = document.getElementById('manual-backup-import-area');
                  const code = area?.value?.trim();
                  if (!code) {
                    onPushToast('Please paste valid JSON backup code first.', 'error');
                    return;
                  }
                  try {
                    const importedData = JSON.parse(code);
                    let gamesList = [];
                    if (Array.isArray(importedData)) {
                      gamesList = importedData;
                    } else if (importedData && Array.isArray(importedData.games)) {
                      gamesList = importedData.games;
                    } else {
                      onPushToast('Invalid backup code structure.', 'error');
                      return;
                    }
                    if (window.confirm(`Are you sure you want to import ${gamesList.length} games? This will replace your current library.`)) {
                      onImportGames(gamesList);
                      onPushToast('Database imported successfully!', 'success');
                      area.value = '';
                    }
                  } catch {
                    onPushToast('Failed to parse backup JSON code.', 'error');
                  }
                }} 
                className="settings-btn" 
                style={{ fontSize: '0.7rem', padding: '8px 12px', background: 'rgba(0, 229, 255, 0.05)', borderColor: 'rgba(0, 229, 255, 0.2)', color: 'var(--accent-cyan)' }}
              >
                IMPORT BACKUP CODE
              </button>
            </div>
          </div>
        </div>

        {/* Brand/Logo Panel */}
        <div className="settings-panel brand-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '30px' }}>
          <img src={logoImg} alt="Smart GameVault Logo" style={{ width: '150px', height: '150px', borderRadius: '12px', border: '1px solid rgba(255, 159, 28, 0.2)', boxShadow: '0 0 25px rgba(255, 159, 28, 0.15)', marginBottom: '15px' }} />
          <h4 style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-amber)', margin: '0 0 5px 0', fontSize: '1.1rem', letterSpacing: '0.1em' }}>SMART GAMEVAULT</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, fontFamily: 'var(--font-mono)' }}>VERSION 1.0.0 // COCKPIT TELEMETRY ACTIVE</p>
        </div>
      </div>
    </section>
  );
}
