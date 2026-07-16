function SearchBar({ value, onChange, placeholder = 'Search title, genre, or platform' }) {
  return (
    <div className="search-wrap">
      <span className="search-icon" aria-hidden="true">
        /
      </span>
      <input
        className="search-input"
        type="search"
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Search games"
      />
      {value && (
        <button
          className="search-clear"
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          x
        </button>
      )}
    </div>
  )
}

export default SearchBar
