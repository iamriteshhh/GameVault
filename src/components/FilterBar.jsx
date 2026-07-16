import { useMemo } from 'react'
import { GENRES, PLATFORMS, SORT_OPTIONS, STATUSES } from '../utils/gameHelpers.js'

function FilterBar({ filters, onChange, onReset, resultCount, totalCount }) {
  const ratingOptions = useMemo(() => [0, 1, 2, 3, 4, 5], [])

  function updateFilter(name, value) {
    onChange({
      [name]: name === 'minRating' ? Number(value) : value,
    })
  }

  const hasFilters =
    filters.search ||
    filters.genre ||
    filters.platform ||
    filters.status ||
    filters.favoritesOnly ||
    Number(filters.minRating) > 0

  return (
    <>
      <div className="controls-row">
        <select
          className={`filter-select ${filters.genre ? 'active' : ''}`}
          value={filters.genre}
          onChange={event => updateFilter('genre', event.target.value)}
          aria-label="Filter by genre"
        >
          <option value="">All genres</option>
          {GENRES.map(genre => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>

        <select
          className={`filter-select ${filters.platform ? 'active' : ''}`}
          value={filters.platform}
          onChange={event => updateFilter('platform', event.target.value)}
          aria-label="Filter by platform"
        >
          <option value="">All platforms</option>
          {PLATFORMS.map(platform => (
            <option key={platform} value={platform}>
              {platform}
            </option>
          ))}
        </select>

        <select
          className={`filter-select ${filters.status ? 'active' : ''}`}
          value={filters.status}
          onChange={event => updateFilter('status', event.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUSES.map(status => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          className={`filter-select ${filters.minRating > 0 ? 'active' : ''}`}
          value={filters.minRating}
          onChange={event => updateFilter('minRating', event.target.value)}
          aria-label="Filter by minimum rating"
        >
          {ratingOptions.map(rating => (
            <option key={rating} value={rating}>
              {rating === 0 ? 'Any rating' : `${rating} Star${rating > 1 ? 's' : ''}`}
            </option>
          ))}
        </select>

        <button
          className={`filter-toggle ${filters.favoritesOnly ? 'active' : ''}`}
          type="button"
          onClick={() => updateFilter('favoritesOnly', !filters.favoritesOnly)}
          aria-pressed={filters.favoritesOnly}
        >
          Favorites
        </button>

        {hasFilters && (
          <button className="filter-toggle active-pink" type="button" onClick={onReset}>
            Reset
          </button>
        )}
      </div>

      <div className="controls-row">
        <div className="sort-wrap">
          <span className="sort-label">Sort</span>
          <select
            className="filter-select"
            value={filters.sortBy}
            onChange={event => updateFilter('sortBy', event.target.value)}
            aria-label="Sort games"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.value === 'alpha' ? 'A-Z' : option.label}
              </option>
            ))}
          </select>
        </div>

        <span className="results-info">
          {resultCount} / {totalCount} games shown
        </span>
      </div>
    </>
  )
}

export default FilterBar
