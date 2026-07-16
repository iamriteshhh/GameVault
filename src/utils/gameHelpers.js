export const GENRES = [
  'RPG', 'FPS', 'Action', 'Adventure', 'Horror',
  'Soulslike', 'Open World', 'Strategy', 'Indie', 'Simulation',
  'Fighting', 'Racing', 'Sports', 'Puzzle', 'Platformer'
]

export const PLATFORMS = ['PC', 'PlayStation', 'Xbox', 'Nintendo', 'Mobile', 'Retro']

export const STATUSES = ['Playing', 'Completed', 'Dropped', 'Wishlist', 'Backlog']

export const STATUS_COLORS = {
  Playing:   { bg: '#00ff88', text: '#0a0a0f' },
  Completed: { bg: '#6c63ff', text: '#ffffff' },
  Dropped:   { bg: '#ff4466', text: '#ffffff' },
  Wishlist:  { bg: '#ffaa00', text: '#0a0a0f' },
  Backlog:   { bg: '#44aaff', text: '#0a0a0f' },
}

export const PLATFORM_ICONS = {
  PC: '🖥️',
  PlayStation: '🎮',
  Xbox: '🅧',
  Nintendo: '🕹️',
  Mobile: '📱',
  Retro: '👾',
}

export const SORT_OPTIONS = [
  { value: 'recent',     label: 'Recently Added' },
  { value: 'rating',     label: 'Highest Rated' },
  { value: 'hours',      label: 'Most Played' },
  { value: 'alpha',      label: 'A → Z' },
  { value: 'year',       label: 'Release Year' },
]

export function generateId() {
  return `gv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function filterGames(games, { search, genre, platform, status, favoritesOnly, minRating }) {
  return games.filter(game => {
    if (search) {
      const q = search.toLowerCase()
      if (!game.title.toLowerCase().includes(q) &&
          !game.genre?.toLowerCase().includes(q) &&
          !game.platform?.toLowerCase().includes(q)) {
        return false
      }
    }
    if (genre && game.genre !== genre) return false
    if (platform && game.platform !== platform) return false
    if (status && game.status !== status) return false
    if (favoritesOnly && !game.favorite) return false
    const fRating = Number(minRating) || 0
    const gRating = Number(game.rating) || 0
    if (fRating && gRating !== fRating) return false
    return true
  })
}

export function sortGames(games, sortBy) {
  const sorted = [...games]
  switch (sortBy) {
    case 'rating':
      return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    case 'hours':
      return sorted.sort((a, b) => (b.hoursPlayed || 0) - (a.hoursPlayed || 0))
    case 'alpha':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case 'year':
      return sorted.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0))
    case 'recent':
    default:
      return sorted.sort((a, b) => b.addedAt - a.addedAt)
  }
}

export function getStats(games) {
  const total = games.length
  const completed = games.filter(g => g.status === 'Completed').length
  const playing = games.filter(g => g.status === 'Playing').length
  const favorites = games.filter(g => g.favorite).length
  const dropped = games.filter(g => g.status === 'Dropped').length
  const rated = games.filter(g => g.rating > 0)
  const avgRating = rated.length
    ? (rated.reduce((s, g) => s + g.rating, 0) / rated.length).toFixed(1)
    : '—'
  const totalHours = games.reduce((s, g) => s + (g.hoursPlayed || 0), 0)
  return { total, completed, playing, favorites, dropped, avgRating, totalHours }
}

export function validateGame(game, existingGames, editingId = null) {
  const errors = {}
  if (!game.title?.trim()) errors.title = 'Title is required.'
  if (game.title?.length > 80) errors.title = 'Title too long (max 80 chars).'
  const duplicate = existingGames.find(
    g => g.title.toLowerCase() === game.title?.toLowerCase().trim() && g.id !== editingId
  )
  if (duplicate) errors.title = 'A game with this title already exists.'
  if (game.releaseYear) {
    const y = parseInt(game.releaseYear)
    if (isNaN(y) || y < 1970 || y > new Date().getFullYear() + 3)
      errors.releaseYear = 'Enter a valid year (1970–present).'
  }
  if (game.review?.length > 1000) errors.review = 'Review too long (max 1000 chars).'
  if (game.hoursPlayed && (isNaN(game.hoursPlayed) || game.hoursPlayed < 0))
    errors.hoursPlayed = 'Hours must be a positive number.'
  return errors
}
