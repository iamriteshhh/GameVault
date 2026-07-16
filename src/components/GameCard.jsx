import { useRef } from 'react'
import RatingSystem from './RatingSystem.jsx'
import { STATUS_COLORS } from '../utils/gameHelpers.js'

function formatHours(hours) {
  const value = Number(hours) || 0
  return `${value.toLocaleString()}h`
}

function GameCard({ game, onView, onEdit, onDelete, onToggleFavorite }) {
  const cardRef = useRef(null)

  function handleMouseMove(e) {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const xc = rect.width / 2
    const yc = rect.height / 2
    const angleX = -((y - yc) / yc) * 12
    const angleY = ((x - xc) / xc) * 12
    card.style.setProperty('--rx', `${angleX}deg`)
    card.style.setProperty('--ry', `${angleY}deg`)
  }

  function handleMouseLeave() {
    const card = cardRef.current
    if (!card) return
    card.style.setProperty('--rx', '0deg')
    card.style.setProperty('--ry', '0deg')
  }

  const statusColors = STATUS_COLORS[game.status] || {
    bg: 'var(--bg-elevated)',
    text: 'var(--text-secondary)',
  }

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`game-card ${game.favorite ? 'is-favorite' : ''}`}
      onClick={() => onView(game)}
      tabIndex={0}
      onKeyDown={event => {
        if (event.key === 'Enter') onView(game)
      }}
      aria-label={`Open details for ${game.title}`}
    >
      <div className="card-cover-wrap">
        {game.coverImage ? (
          <img className="card-cover" src={game.coverImage} alt={`${game.title} cover`} />
        ) : (
          <div className="card-cover-placeholder">
            <span className="placeholder-icon">GV</span>
            <span className="placeholder-genre">{game.genre || 'Unsorted'}</span>
          </div>
        )}

        <div className="card-cover-overlay" />
        <div className="card-badges">
          <span
            className="status-badge"
            style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
          >
            {game.status || 'Backlog'}
          </span>
          {game.platform && <span className="platform-badge">{game.platform}</span>}
        </div>

        {game.favorite && (
          <span className="fav-star" aria-label="Favorite game">
            {'\u2605'}
          </span>
        )}
      </div>

      <div className="card-body">
        <div className="card-title-row">
          <h3 className="card-title">{game.title}</h3>
          <div className="card-rating-display">
            <RatingSystem value={game.rating} readOnly size="sm" />
            <span className="card-rating-value">{game.rating || '-'}</span>
          </div>
        </div>

        <div className="card-meta">
          {game.genre && <span className="meta-tag">{game.genre}</span>}
          {game.releaseYear && <span className="meta-tag">{game.releaseYear}</span>}
          <span className="meta-tag">{formatHours(game.hoursPlayed)}</span>
        </div>

        {game.review && <p className="card-review">"{game.review}"</p>}

        <div className="card-actions" aria-label={`${game.title} actions`}>
          <button
            className="card-action-btn"
            type="button"
            onClick={event => {
              event.stopPropagation()
              onEdit(game)
            }}
          >
            Edit
          </button>
          <button
            className="card-action-btn"
            type="button"
            onClick={event => {
              event.stopPropagation()
              onToggleFavorite(game.id)
            }}
          >
            {game.favorite ? 'Unfav' : 'Fav'}
          </button>
          <button
            className="card-action-btn danger"
            type="button"
            onClick={event => {
              event.stopPropagation()
              onDelete(game)
            }}
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  )
}

export default GameCard
