import { useEffect, useMemo, useState } from 'react'
import FilterBar from './FilterBar.jsx'
import GameCard from './GameCard.jsx'
import RatingSystem from './RatingSystem.jsx'
import SearchBar from './SearchBar.jsx'
import ScrambleText from './ScrambleText.jsx'
import { STATUS_COLORS } from '../utils/gameHelpers.js'
import '../styles/GameCard.css'

function GameList({
  games,
  allGames,
  filters,
  totalGames,
  onFiltersChange,
  onResetFilters,
  onAddGame,
  onEditGame,
  onDeleteGame,
  onToggleFavorite,
}) {
  const [selectedGame, setSelectedGame] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.search ||
        filters.genre ||
        filters.platform ||
        filters.status ||
        filters.favoritesOnly ||
        Number(filters.minRating) > 0
    )
  }, [filters])

  useEffect(() => {
    if (!selectedGame) return

    const freshGame = allGames.find(game => game.id === selectedGame.id)
    if (!freshGame) {
      setSelectedGame(null)
    } else if (freshGame !== selectedGame) {
      setSelectedGame(freshGame)
    }
  }, [allGames, selectedGame])

  function confirmDelete() {
    if (!deleteTarget) return

    onDeleteGame(deleteTarget.id)
    if (selectedGame?.id === deleteTarget.id) {
      setSelectedGame(null)
    }
    setDeleteTarget(null)
  }

  return (
    <section className="game-list-wrapper">
      <div className="section-header">
        <h2 className="section-title">
          <ScrambleText text="Game Library" />
        </h2>
        <span className="game-count">{totalGames} saved</span>
      </div>

      <div className="controls-bar">
        <div className="controls-row">
          <SearchBar
            value={filters.search}
            onChange={value => onFiltersChange({ search: value })}
          />
        </div>
        <FilterBar
          filters={filters}
          onChange={onFiltersChange}
          onReset={onResetFilters}
          resultCount={games.length}
          totalCount={totalGames}
        />
      </div>

      {games.length > 0 ? (
        <div className="game-grid">
          {games.map(game => (
            <GameCard
              key={game.id}
              game={game}
              onView={setSelectedGame}
              onEdit={onEditGame}
              onDelete={setDeleteTarget}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            GV
          </span>
          <h3>{totalGames === 0 ? 'Your vault is empty' : 'No matches found'}</h3>
          <p>
            {totalGames === 0
              ? 'Add your first game, rate it, and start building a personal gaming journal.'
              : hasActiveFilters
                ? 'Try clearing a filter or searching for a different title, genre, or platform.'
                : 'No games are visible right now.'}
          </p>
          {totalGames === 0 ? (
            <button className="empty-cta" type="button" onClick={onAddGame}>
              ADD FIRST GAME
            </button>
          ) : (
            <button className="empty-cta" type="button" onClick={onResetFilters}>
              CLEAR FILTERS
            </button>
          )}
        </div>
      )}

      {selectedGame && (
        <GameDetail
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
          onEdit={game => {
            setSelectedGame(null)
            onEditGame(game)
          }}
        />
      )}

      {deleteTarget && (
        <div className="delete-confirm-overlay">
          <div className="delete-confirm-box">
            <h3>Delete Entry</h3>
            <p>
              Remove <strong>{deleteTarget.title}</strong> from GameVault? This cannot be
              undone.
            </p>
            <div className="delete-confirm-actions">
              <button className="btn-cancel" type="button" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn-delete" type="button" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function GameDetail({ game, onClose, onEdit }) {
  const statusColors = STATUS_COLORS[game.status] || {
    bg: 'var(--bg-elevated)',
    text: 'var(--text-secondary)',
  }

  return (
    <div className="modal-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <div className="modal-box game-detail" onMouseDown={event => event.stopPropagation()}>
        {game.coverImage ? (
          <img className="detail-cover" src={game.coverImage} alt={`${game.title} cover`} />
        ) : (
          <div className="detail-cover-placeholder">GV</div>
        )}

        <div className="detail-body">
          <div className="detail-header">
            <h2 className="detail-title">{game.title}</h2>
            <RatingSystem value={game.rating} readOnly size="md" showValue />
          </div>

          <div className="detail-badges">
            <span
              className="status-badge"
              style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
            >
              {game.status || 'Backlog'}
            </span>
            {game.platform && (
              <span className="platform-badge" style={{ marginLeft: 0 }}>
                {game.platform}
              </span>
            )}
            {game.favorite && (
              <span className="status-badge" style={{ backgroundColor: 'var(--accent-gold)', color: '#111' }}>
                Favorite
              </span>
            )}
          </div>

          <div className="detail-meta-grid">
            <div className="detail-meta-item">
              <div className="detail-meta-key">Genre</div>
              <div className="detail-meta-val">{game.genre || 'Not set'}</div>
            </div>
            <div className="detail-meta-item">
              <div className="detail-meta-key">Release Year</div>
              <div className="detail-meta-val">{game.releaseYear || 'Unknown'}</div>
            </div>
            <div className="detail-meta-item">
              <div className="detail-meta-key">Hours Played</div>
              <div className="detail-meta-val">{Number(game.hoursPlayed || 0).toLocaleString()}h</div>
            </div>
            <div className="detail-meta-item">
              <div className="detail-meta-key">Updated</div>
              <div className="detail-meta-val">{formatDate(game.updatedAt || game.addedAt)}</div>
            </div>
          </div>

          <div className="detail-review">
            <div className="detail-review-title">Review Notes</div>
            <p className="detail-review-text">
              {game.review || 'No review written yet.'}
            </p>
          </div>

          <div className="detail-actions">
            <button className="detail-close-btn" type="button" onClick={onClose}>
              Close
            </button>
            <button className="detail-edit-btn" type="button" onClick={() => onEdit(game)}>
              EDIT GAME
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}

export default GameList
