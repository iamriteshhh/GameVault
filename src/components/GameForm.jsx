import { useEffect, useMemo, useState } from 'react'
import RatingSystem from './RatingSystem.jsx'
import { searchGameCatalog } from '../utils/gameSearch.js'
import { GENRES, PLATFORMS, STATUSES, validateGame } from '../utils/gameHelpers.js'

const MAX_IMAGE_SIZE = 4 * 1024 * 1024

function createFormState(game) {
  return {
    title: game?.title || '',
    genre: game?.genre || '',
    platform: game?.platform || 'PC',
    releaseYear: game?.releaseYear || '',
    status: game?.status || 'Backlog',
    rating: game?.rating || 0,
    hoursPlayed: game?.hoursPlayed ?? '',
    favorite: Boolean(game?.favorite),
    review: game?.review || '',
    coverImage: game?.coverImage || '',
  }
}

function GameForm({ editingGame, existingGames, onSubmit, onClose, rawgApiKey }) {
  const [formData, setFormData] = useState(() => createFormState(editingGame))
  const [errors, setErrors] = useState({})
  const [imageBusy, setImageBusy] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchBusy, setSearchBusy] = useState(false)
  const [searchError, setSearchError] = useState('')

  const currentYearLimit = useMemo(() => new Date().getFullYear() + 3, [])
  const isEditing = Boolean(editingGame)

  useEffect(() => {
    setFormData(createFormState(editingGame))
    setErrors({})
    setSearchTerm('')
    setSearchResults([])
    setSearchError('')
  }, [editingGame])

  useEffect(() => {
    if (isEditing) return

    const cleanTerm = searchTerm.trim()
    if (cleanTerm.length < 2) {
      setSearchResults([])
      setSearchError('')
      setSearchBusy(false)
      return
    }

    let cancelled = false
    setSearchBusy(true)
    setSearchError('')

    const timerId = window.setTimeout(async () => {
      try {
        const results = await searchGameCatalog(cleanTerm, rawgApiKey)
        if (!cancelled) {
          setSearchResults(results)
          setSearchError(results.length === 0 ? 'No matching games found.' : '')
        }
      } catch {
        if (!cancelled) {
          setSearchResults([])
          setSearchError('Search is unavailable right now.')
        }
      } finally {
        if (!cancelled) {
          setSearchBusy(false)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timerId)
    }
  }, [searchTerm, isEditing])

  function updateField(name, value) {
    setFormData(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: '' }))
  }

  function handleInputChange(event) {
    const { name, value, type, checked } = event.target
    updateField(name, type === 'checkbox' ? checked : value)
  }

  function handleCoverUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setErrors(current => ({ ...current, coverImage: 'Please choose an image file.' }))
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setErrors(current => ({ ...current, coverImage: 'Image must be under 4 MB.' }))
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    setImageBusy(true)

    reader.onload = () => {
      updateField('coverImage', reader.result)
      setImageBusy(false)
    }

    reader.onerror = () => {
      setErrors(current => ({ ...current, coverImage: 'Could not read that image.' }))
      setImageBusy(false)
    }

    reader.readAsDataURL(file)
  }

  function applySearchResult(game) {
    setFormData(current => ({
      ...current,
      title: game.title || current.title,
      genre: game.genre || current.genre,
      platform: game.platform || current.platform,
      releaseYear: game.releaseYear || current.releaseYear,
      coverImage: game.coverImage || current.coverImage,
    }))
    setSearchTerm(game.title)
    setSearchResults([])
    setSearchError('')
    setErrors(current => ({ ...current, title: '', releaseYear: '' }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const nextGame = {
      ...formData,
      title: formData.title.trim(),
      releaseYear: formData.releaseYear ? Number(formData.releaseYear) : '',
      rating: Number(formData.rating) || 0,
      hoursPlayed: Number(formData.hoursPlayed) || 0,
      review: formData.review.trim(),
    }

    const validationErrors = validateGame(nextGame, existingGames, editingGame?.id || null)
    if (validationErrors.releaseYear) {
      validationErrors.releaseYear = `Enter a valid year (1970-${currentYearLimit}).`
    }
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      return
    }

    onSubmit(nextGame)
  }

  const reviewCount = formData.review.length

  return (
    <form style={styles.form} onSubmit={handleSubmit} noValidate>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>{isEditing ? 'EDIT ENTRY' : 'NEW ENTRY'}</p>
          <h2 style={styles.title}>{isEditing ? 'Update Game' : 'Add Game'}</h2>
        </div>
        <button type="button" onClick={onClose} style={styles.closeButton} aria-label="Close form">
          x
        </button>
      </div>

      <div style={styles.coverPanel}>
        <div style={styles.coverPreview}>
          {formData.coverImage ? (
            <img src={formData.coverImage} alt="Game cover preview" style={styles.coverImage} />
          ) : (
            <div style={styles.coverPlaceholder}>
              <span style={styles.coverGlyph}>GV</span>
              <span style={styles.coverText}>Cover Preview</span>
            </div>
          )}
        </div>

        <div style={styles.coverControls}>
          <label style={styles.uploadButton}>
            {imageBusy ? 'LOADING...' : 'UPLOAD COVER'}
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverUpload}
              style={styles.fileInput}
            />
          </label>
          {formData.coverImage && (
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => updateField('coverImage', '')}
            >
              Remove
            </button>
          )}
          {errors.coverImage && <p style={styles.error}>{errors.coverImage}</p>}
        </div>
      </div>

      {!isEditing && (
        <div style={styles.searchPanel}>
          <div style={styles.databaseHeader}>
            <div>
              <span style={styles.label}>Online Game Search</span>
              <p style={styles.databaseText}>
                Search 500,000+ games from RAWG & Steam — PC, console, retro, indie. {rawgApiKey ? 'Using your RAWG key for extra results.' : 'Add a RAWG API key in Settings for priority results.'}
              </p>
            </div>
            <a
              href="https://store.steampowered.com"
              target="_blank"
              rel="noreferrer"
              style={styles.databaseLink}
            >
              Steam
            </a>
          </div>

          <label style={styles.field}>
            <span style={styles.label}>Find Game</span>
            <input
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
              placeholder="Search online by title, then click a result"
              style={styles.searchInput}
            />
          </label>

          {(searchBusy || searchError || searchResults.length > 0) && (
            <div style={styles.searchResults}>
              {searchBusy && <div style={styles.searchHint}>Searching...</div>}
              {!searchBusy && searchError && <div style={styles.searchHint}>{searchError}</div>}
              {!searchBusy &&
                searchResults.map(game => (
                  <button
                    key={game.id}
                    type="button"
                    style={styles.searchResult}
                    onClick={() => applySearchResult(game)}
                  >
                    <span style={styles.searchThumb}>
                      {game.coverImage ? (
                        <img src={game.coverImage} alt="" style={styles.searchThumbImage} />
                      ) : (
                        'GV'
                      )}
                    </span>
                    <span style={styles.searchInfo}>
                      <span style={styles.searchTitle}>{game.title}</span>
                      <span style={styles.searchMeta}>
                        {[game.genre, game.platform, game.releaseYear].filter(Boolean).join(' / ')}
                      </span>
                    </span>
                    <span style={styles.searchSource}>{game.source}</span>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      <div style={styles.grid}>
        <Field label="Game Title" error={errors.title} required>
          <input
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            maxLength={80}
            placeholder="Elden Ring, Celeste, Halo..."
            style={fieldStyle(errors.title)}
            aria-invalid={Boolean(errors.title)}
          />
        </Field>

        <Field label="Genre">
          <select name="genre" value={formData.genre} onChange={handleInputChange} style={styles.input}>
            <option value="">Select genre</option>
            {GENRES.map(genre => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Platform">
          <select name="platform" value={formData.platform} onChange={handleInputChange} style={styles.input}>
            {PLATFORMS.map(platform => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select name="status" value={formData.status} onChange={handleInputChange} style={styles.input}>
            {STATUSES.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Release Year" error={errors.releaseYear}>
          <input
            name="releaseYear"
            type="number"
            min="1970"
            max={currentYearLimit}
            value={formData.releaseYear}
            onChange={handleInputChange}
            placeholder="2024"
            style={fieldStyle(errors.releaseYear)}
            aria-invalid={Boolean(errors.releaseYear)}
          />
        </Field>

        <Field label="Hours Played" error={errors.hoursPlayed}>
          <input
            name="hoursPlayed"
            type="number"
            min="0"
            step="0.5"
            value={formData.hoursPlayed}
            onChange={handleInputChange}
            placeholder="0"
            style={fieldStyle(errors.hoursPlayed)}
            aria-invalid={Boolean(errors.hoursPlayed)}
          />
        </Field>
      </div>

      <div style={styles.ratingBlock}>
        <span style={styles.label}>Rating</span>
        <RatingSystem
          value={formData.rating}
          onChange={rating => updateField('rating', rating)}
          size="lg"
          showValue
        />
      </div>

      <label style={styles.favoriteRow}>
        <input
          type="checkbox"
          name="favorite"
          checked={formData.favorite}
          onChange={handleInputChange}
        />
        <span>Mark as favorite</span>
      </label>

      <Field label="Review Notes" error={errors.review}>
        <textarea
          name="review"
          value={formData.review}
          onChange={handleInputChange}
          maxLength={1000}
          rows={5}
          placeholder="Story thoughts, build notes, co-op memories, final verdict..."
          style={{ ...fieldStyle(errors.review), resize: 'vertical', minHeight: 120 }}
          aria-invalid={Boolean(errors.review)}
        />
        <span style={styles.counter}>{reviewCount}/1000</span>
      </Field>

      <div style={styles.actions}>
        <button type="button" style={styles.secondaryButton} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" style={styles.submitButton}>
          {isEditing ? 'SAVE CHANGES' : 'ADD TO VAULT'}
        </button>
      </div>
    </form>
  )
}

function Field({ label, error, required = false, children }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>
        {label}
        {required && <span style={styles.required}> *</span>}
      </span>
      {children}
      {error && <span style={styles.error}>{error}</span>}
    </label>
  )
}

function fieldStyle(hasError) {
  return {
    ...styles.input,
    ...(hasError ? styles.inputError : null),
  }
}

const styles = {
  form: {
    padding: 24,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  kicker: {
    color: 'var(--accent-cyan)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    letterSpacing: '0.12em',
    marginBottom: 4,
  },
  title: {
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-display)',
    fontSize: '1.15rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  closeButton: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-dim)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-muted)',
    fontSize: '1rem',
    fontWeight: 700,
    height: 34,
    width: 34,
  },
  coverPanel: {
    display: 'grid',
    gridTemplateColumns: '140px minmax(0, 1fr)',
    gap: 16,
    alignItems: 'center',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-lg)',
    padding: 14,
    marginBottom: 18,
  },
  coverPreview: {
    width: 140,
    height: 180,
    borderRadius: 'var(--radius-md)',
    overflow: 'hidden',
    background: 'var(--bg-void)',
    border: '1px solid var(--border-dim)',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  coverPlaceholder: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    color: 'var(--text-muted)',
    background: 'linear-gradient(135deg, var(--bg-void), var(--bg-elevated))',
  },
  coverGlyph: {
    color: 'var(--accent-purple)',
    fontFamily: 'var(--font-display)',
    fontSize: '1.8rem',
    fontWeight: 800,
  },
  coverText: {
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  coverControls: {
    display: 'flex',
    alignItems: 'flex-start',
    flexDirection: 'column',
    gap: 10,
  },
  searchPanel: {
    background: 'rgba(255, 159, 28, 0.02)',
    border: '1px dashed var(--accent-amber)',
    borderRadius: 'var(--radius-sm)',
    padding: 14,
    marginBottom: 18,
  },
  databaseHeader: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  databaseText: {
    color: 'var(--text-muted)',
    fontSize: '0.86rem',
    lineHeight: 1.45,
    marginTop: 4,
  },
  databaseLink: {
    border: '1px solid var(--accent-amber)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--accent-amber)',
    flexShrink: 0,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    padding: '7px 9px',
    textTransform: 'uppercase',
    background: 'transparent',
  },
  searchInput: {
    background: 'var(--bg-input)',
    border: '1px solid var(--bg-card)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    padding: '11px 12px',
    width: '100%',
    fontFamily: 'var(--font-mono)',
  },
  searchResults: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 12,
  },
  searchHint: {
    color: 'var(--text-muted)',
    fontSize: '0.86rem',
    padding: '8px 2px',
  },
  searchResult: {
    alignItems: 'center',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--bg-card)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    display: 'flex',
    gap: 10,
    padding: 8,
    textAlign: 'left',
    width: '100%',
  },
  searchThumb: {
    alignItems: 'center',
    background: 'var(--bg-void)',
    border: '1px solid var(--bg-card)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--accent-amber)',
    display: 'flex',
    flexShrink: 0,
    fontFamily: 'var(--font-display)',
    fontSize: '0.75rem',
    fontWeight: 800,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 38,
  },
  searchThumbImage: {
    height: '100%',
    objectFit: 'cover',
    width: '100%',
  },
  searchInfo: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minWidth: 0,
  },
  searchTitle: {
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    fontWeight: 700,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-display)',
  },
  searchMeta: {
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.72rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  searchSource: {
    color: 'var(--accent-cyan)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  uploadButton: {
    background: 'transparent',
    border: '1px solid var(--accent-amber)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--accent-amber)',
    cursor: 'pointer',
    display: 'inline-flex',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.75rem',
    fontWeight: 500,
    letterSpacing: '0.05em',
    padding: '10px 16px',
    textTransform: 'uppercase',
  },
  fileInput: {
    display: 'none',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 14,
    marginBottom: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    minWidth: 0,
    position: 'relative',
  },
  label: {
    color: 'var(--text-secondary)',
    fontSize: '0.76rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    fontFamily: 'var(--font-mono)',
  },
  required: {
    color: 'var(--accent-red)',
  },
  input: {
    background: 'var(--bg-input)',
    border: '1px solid var(--bg-card)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    padding: '10px 12px',
    width: '100%',
    fontFamily: 'var(--font-mono)',
  },
  inputError: {
    borderColor: 'var(--accent-red)',
    boxShadow: '0 0 10px rgba(255, 77, 77, 0.1)',
  },
  error: {
    color: 'var(--accent-red)',
    fontSize: '0.76rem',
    lineHeight: 1.35,
    fontFamily: 'var(--font-mono)',
  },
  ratingBlock: {
    background: 'var(--bg-card)',
    border: '1px solid var(--bg-card)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: '14px 16px',
    marginBottom: 14,
  },
  favoriteRow: {
    alignItems: 'center',
    color: 'var(--text-secondary)',
    display: 'flex',
    fontWeight: 700,
    gap: 10,
    letterSpacing: '0.04em',
    marginBottom: 16,
    fontFamily: 'var(--font-mono)',
  },
  counter: {
    alignSelf: 'flex-end',
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.7rem',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  secondaryButton: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--bg-card)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontWeight: 500,
    padding: '10px 16px',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
    fontSize: '0.75rem',
  },
  submitButton: {
    background: 'var(--accent-amber)',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--bg-void)',
    cursor: 'pointer',
    fontFamily: 'var(--font-display)',
    fontSize: '0.75rem',
    fontWeight: 900,
    letterSpacing: '0.08em',
    padding: '11px 20px',
    boxShadow: 'var(--glow-amber)',
    textTransform: 'uppercase',
  },
}

export default GameForm
