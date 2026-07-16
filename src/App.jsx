import { useEffect, useMemo, useState, useRef } from 'react'
import Dashboard from './components/Dashboard.jsx'
import GameForm from './components/GameForm.jsx'
import GameList from './components/GameList.jsx'
import SettingsView from './components/SettingsView.jsx'
import UtilityDropdown from './components/UtilityDropdown.jsx'
import SteamSyncModal from './components/SteamSyncModal.jsx'
import { filterGames, generateId, sortGames } from './utils/gameHelpers.js'
import { loadGames, loadSettings, saveGames, saveSettings } from './utils/storage.js'
import logoImg from './assets/logo-amber.jpg'
import './styles/App.css'

const DEFAULT_FILTERS = {
  search: '',
  genre: '',
  platform: '',
  status: '',
  favoritesOnly: false,
  minRating: 0,
  sortBy: 'recent',
}

function normalizeGame(game) {
  return {
    title: game.title.trim(),
    genre: game.genre || '',
    platform: game.platform || '',
    releaseYear: game.releaseYear ? Number(game.releaseYear) : '',
    status: game.status || 'Backlog',
    rating: Number(game.rating) || 0,
    hoursPlayed: Math.max(0, Number(game.hoursPlayed) || 0),
    favorite: Boolean(game.favorite),
    review: game.review.trim(),
    coverImage: game.coverImage || '',
  }
}

function App() {
  const [games, setGames] = useState([])
  const [appState, setAppState] = useState({
    activeView: 'dashboard',
    rawgApiKey: '',
    steamApiKey: '',
    filters: DEFAULT_FILTERS,
  })
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingGame, setEditingGame] = useState(null)
  const [toasts, setToasts] = useState([])

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [steamSyncOpen, setSteamSyncOpen] = useState(false)
  const dropdownButtonRef = useRef(null)

  const { activeView, filters } = appState

  useEffect(() => {
    async function initApp() {
      const [loadedGames, loadedSettings] = await Promise.all([
        loadGames(),
        loadSettings(),
      ])

      setGames(loadedGames || [])
      
      const savedFilters = loadedSettings.filters || {}
      setAppState({
        activeView: loadedSettings.activeView || 'dashboard',
        rawgApiKey: loadedSettings.rawgApiKey || '',
        steamApiKey: loadedSettings.steamApiKey || '',
        filters: {
          ...DEFAULT_FILTERS,
          ...savedFilters,
          minRating: Number(savedFilters.minRating) || 0,
          favoritesOnly: Boolean(savedFilters.favoritesOnly),
        },
      })
      setLoading(false)
    }
    initApp()
  }, [])

  useEffect(() => {
    if (!loading) {
      saveGames(games)
    }
  }, [games, loading])

  useEffect(() => {
    if (!loading) {
      saveSettings({
        activeView,
        rawgApiKey: appState.rawgApiKey,
        steamApiKey: appState.steamApiKey,
        filters,
      })
    }
  }, [appState, loading])

  const visibleGames = useMemo(() => {
    return sortGames(filterGames(games, filters), filters.sortBy)
  }, [games, filters])

  function pushToast(message, type = 'info') {
    const id = Date.now() + Math.random()
    setToasts(current => [...current, { id, message, type }])
    window.setTimeout(() => {
      setToasts(current => current.filter(toast => toast.id !== id))
    }, 2800)
  }

  function setActiveView(view) {
    setAppState(current => ({ ...current, activeView: view }))
  }

  function updateFilters(patch) {
    setAppState(current => ({
      ...current,
      filters: {
        ...current.filters,
        ...(typeof patch === 'function' ? patch(current.filters) : patch),
      },
    }))
  }

  function resetFilters() {
    setAppState(current => ({
      ...current,
      filters: { ...DEFAULT_FILTERS },
    }))
  }

  function openAddForm() {
    setEditingGame(null)
    setFormOpen(true)
  }

  function openEditForm(game) {
    setEditingGame(game)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingGame(null)
  }

  function handleSaveGame(gameDraft) {
    const now = Date.now()
    const cleanGame = normalizeGame(gameDraft)

    if (editingGame) {
      setGames(current =>
        current.map(game =>
          game.id === editingGame.id
            ? {
                ...game,
                ...cleanGame,
                id: game.id,
                addedAt: game.addedAt,
                updatedAt: now,
              }
            : game
        )
      )
      pushToast(`${cleanGame.title} updated.`, 'success')
    } else {
      setGames(current => [
        {
          ...cleanGame,
          id: generateId(),
          addedAt: now,
          updatedAt: now,
        },
        ...current,
      ])
      pushToast(`${cleanGame.title} added to the vault.`, 'success')
      setActiveView('library')
    }

    closeForm()
  }

  function handleDeleteGame(gameId) {
    const removedGame = games.find(game => game.id === gameId)
    setGames(current => current.filter(game => game.id !== gameId))
    pushToast(`${removedGame?.title || 'Game'} removed.`, 'info')
  }

  function handleToggleFavorite(gameId) {
    setGames(current =>
      current.map(game =>
        game.id === gameId
          ? { ...game, favorite: !game.favorite, updatedAt: Date.now() }
          : game
      )
    )
  }

  function showGameFromDashboard(game) {
    setAppState(current => ({
      activeView: 'library',
      filters: {
        ...DEFAULT_FILTERS,
        search: game.title,
        sortBy: current.filters.sortBy || DEFAULT_FILTERS.sortBy,
      },
    }))
  }

  function handleImportSteamGames(steamGames) {
    setGames(current => {
      const existingTitles = new Set(current.map(g => g.title.toLowerCase()))
      const newGames = steamGames.filter(g => !existingTitles.has(g.title.toLowerCase()))

      const processedNewGames = newGames.map(game => ({
        ...game,
        id: generateId(),
        addedAt: Date.now(),
        updatedAt: Date.now(),
      }))

      pushToast(`Imported ${processedNewGames.length} new Steam games!`, 'success')
      return [...processedNewGames, ...current]
    })
  }

  if (loading) {
    return (
      <div className="tactical-loader">
        <div className="loader-scope">
          <img src={logoImg} className="loader-logo" alt="Smart GameVault Logo" />
          <div className="loader-ring"></div>
          <div className="loader-scanline"></div>
          <div className="loader-text">SYS.INIT // LOADING LOCAL STORAGE DATA...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app" id="top">
      <header className="app-header">
        <div className="header-inner">
          <a
            href="#dashboard"
            className="logo"
            onClick={event => {
              event.preventDefault()
              setActiveView('dashboard')
            }}
            aria-label="Open GameVault dashboard"
          >
            <div className="logo-icon-container">
              <img src={logoImg} className="logo-icon-img" alt="Smart GameVault Icon" />
            </div>
            <span className="logo-text">SMART <span>GAMEVAULT</span></span>
          </a>

          <nav className="header-nav" aria-label="Main views">
            <button
              className={`nav-btn ${activeView === 'dashboard' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveView('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-btn ${activeView === 'library' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveView('library')}
            >
              Library
            </button>
          </nav>

          <div className="header-actions" style={{ position: 'relative' }}>
            <button className="add-game-btn" type="button" onClick={openAddForm}>
              ADD GAME
            </button>
            <button
              ref={dropdownButtonRef}
              className={`settings-icon-btn ${activeView === 'settings' || dropdownOpen ? 'active' : ''}`}
              type="button"
              onClick={() => setDropdownOpen(prev => !prev)}
              aria-label="Open utilities menu"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="12" x2="20" y2="12"></line>
                <line x1="4" y1="6" x2="20" y2="6"></line>
                <line x1="4" y1="18" x2="20" y2="18"></line>
              </svg>
            </button>

            <UtilityDropdown
              isOpen={dropdownOpen}
              onClose={() => setDropdownOpen(false)}
              onOpenSettings={() => setActiveView('settings')}
              onOpenSteamSync={() => setSteamSyncOpen(true)}
              buttonRef={dropdownButtonRef}
            />
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="view-tabs" role="tablist" aria-label="GameVault sections">
          <button
            className={`view-tab ${activeView === 'dashboard' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveView('dashboard')}
            role="tab"
            aria-selected={activeView === 'dashboard'}
          >
            Dashboard
          </button>
          <button
            className={`view-tab ${activeView === 'library' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveView('library')}
            role="tab"
            aria-selected={activeView === 'library'}
          >
            Library
          </button>
          <button
            className={`view-tab ${activeView === 'settings' ? 'active' : ''}`}
            type="button"
            onClick={() => setActiveView('settings')}
            role="tab"
            aria-selected={activeView === 'settings'}
          >
            Settings
          </button>
        </div>

        {activeView === 'dashboard' && (
          <Dashboard
            games={games}
            onAddGame={openAddForm}
            onSelectGame={showGameFromDashboard}
            onOpenLibrary={() => setActiveView('library')}
          />
        )}
        {activeView === 'library' && (
          <GameList
            games={visibleGames}
            allGames={games}
            filters={filters}
            totalGames={games.length}
            onFiltersChange={updateFilters}
            onResetFilters={resetFilters}
            onAddGame={openAddForm}
            onEditGame={openEditForm}
            onDeleteGame={handleDeleteGame}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
        {activeView === 'settings' && (
          <SettingsView
            rawgApiKey={appState.rawgApiKey}
            onSaveRawgKey={(key) => setAppState(current => ({ ...current, rawgApiKey: key }))}
            games={games}
            onImportGames={(importedGames) => {
              setGames(importedGames);
            }}
            onPushToast={pushToast}
          />
        )}
      </main>

      {formOpen && (
        <div
          className="modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) closeForm()
          }}
        >
          <div className="modal-box" onMouseDown={event => event.stopPropagation()}>
            <GameForm
              editingGame={editingGame}
              existingGames={games}
              onSubmit={handleSaveGame}
              onClose={closeForm}
              rawgApiKey={appState.rawgApiKey}
            />
          </div>
        </div>
      )}

      {steamSyncOpen && (
        <div
          className="modal-overlay"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setSteamSyncOpen(false)
          }}
        >
          <div className="modal-box" onMouseDown={event => event.stopPropagation()}>
            <SteamSyncModal
              initialApiKey={appState.steamApiKey}
              onSaveApiKey={(key) => setAppState(current => ({ ...current, steamApiKey: key }))}
              onClose={() => setSteamSyncOpen(false)}
              onImport={handleImportSteamGames}
              onPushToast={pushToast}
            />
          </div>
        </div>
      )}

      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map(toast => (
          <div className={`toast ${toast.type}`} key={toast.id}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
