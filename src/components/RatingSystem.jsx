import { useMemo, useState } from 'react'

const FILLED_STAR = '\u2605'
const EMPTY_STAR = '\u2606'

const STAR_SIZES = {
  sm: 15,
  md: 23,
  lg: 31,
}

function RatingSystem({
  value = 0,
  onChange,
  max = 5,
  readOnly = false,
  size = 'md',
  showValue = false,
  label = 'Rating',
}) {
  const [hoverValue, setHoverValue] = useState(0)
  const stars = useMemo(() => Array.from({ length: max }, (_, index) => index + 1), [max])

  const numericValue = Number(value) || 0
  const displayValue = hoverValue || numericValue
  const starSize = STAR_SIZES[size] || STAR_SIZES.md

  function chooseRating(nextValue) {
    if (!readOnly && onChange) {
      onChange(nextValue)
    }
  }

  return (
    <div
      aria-label={`${label}: ${numericValue} out of ${max}`}
      onMouseLeave={() => setHoverValue(0)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: size === 'sm' ? 1 : 3,
      }}
    >
      {stars.map(star => {
        const active = star <= displayValue
        const commonStyle = {
          color: active ? 'var(--accent-gold)' : 'var(--text-dim)',
          fontSize: starSize,
          lineHeight: 1,
          textShadow: active ? '0 0 12px rgba(255, 214, 10, 0.7)' : 'none',
          transform: hoverValue === star && !readOnly ? 'translateY(-2px) scale(1.08)' : 'none',
          transition: 'color var(--transition), transform var(--transition), text-shadow var(--transition)',
        }

        if (readOnly) {
          return (
            <span key={star} aria-hidden="true" style={commonStyle}>
              {active ? FILLED_STAR : EMPTY_STAR}
            </span>
          )
        }

        return (
          <button
            key={star}
            type="button"
            aria-label={`Set rating to ${star} out of ${max}`}
            onClick={() => chooseRating(star)}
            onFocus={() => setHoverValue(star)}
            onMouseEnter={() => setHoverValue(star)}
            style={{
              ...commonStyle,
              background: 'transparent',
              border: 0,
              padding: size === 'lg' ? '2px 3px' : '1px 2px',
              cursor: 'pointer',
            }}
          >
            {active ? FILLED_STAR : EMPTY_STAR}
          </button>
        )
      })}

      {showValue && (
        <span
          style={{
            marginLeft: 8,
            color: 'var(--accent-gold)',
            fontFamily: 'var(--font-display)',
            fontSize: size === 'lg' ? '0.9rem' : '0.78rem',
            fontWeight: 700,
          }}
        >
          {numericValue || 0}/{max}
        </span>
      )}
    </div>
  )
}

export default RatingSystem
