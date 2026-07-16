import { useMemo, useState } from 'react'
import { getStats, STATUSES, STATUS_COLORS } from '../utils/gameHelpers.js'
import ScrambleText from './ScrambleText.jsx'
import CountUp from './CountUp.jsx'
import logoImg from '../assets/logo-amber.jpg'
import '../styles/Dashboard.css'

function Dashboard({ games, onAddGame, onSelectGame, onOpenLibrary }) {
  const stats = useMemo(() => getStats(games), [games])

  const topRatedGames = useMemo(() => {
    return [...games]
      .filter(game => Number(game.rating) > 0)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.hoursPlayed || 0) - (a.hoursPlayed || 0))
      .slice(0, 5)
  }, [games])

  const favoriteGames = useMemo(() => {
    return [...games]
      .filter(game => game.favorite)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
  }, [games])

  const genreRows = useMemo(() => {
    const counts = games.reduce((result, game) => {
      const genre = game.genre || 'Unsorted'
      result[genre] = (result[genre] || 0) + 1
      return result
    }, {})

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([genre, count]) => ({ genre, count }))
  }, [games])

  const recentGames = useMemo(() => {
    return [...games]
      .sort((a, b) => (b.updatedAt || b.addedAt || 0) - (a.updatedAt || a.addedAt || 0))
      .slice(0, 5)
  }, [games])

  const maxGenreCount = Math.max(...genreRows.map(row => row.count), 1)
  const avgRating = Number.isFinite(Number(stats.avgRating)) ? stats.avgRating : '0.0'

  // 3D Carousel Setup - Show all games in the library, sorted by most recently updated/played
  const carouselItems = useMemo(() => {
    return [...games]
      .sort((a, b) => (b.updatedAt || b.addedAt || 0) - (a.updatedAt || a.addedAt || 0));
  }, [games]);

  const [carouselIndex, setCarouselIndex] = useState(0);

  // Safety bounds-check
  useState(() => {
    if (carouselIndex >= carouselItems.length) {
      setCarouselIndex(0);
    }
  }, [carouselItems.length, carouselIndex]);

  const rotateLeft = () => {
    setCarouselIndex(prev => {
      const len = carouselItems.length;
      if (len === 0) return 0;
      return prev === 0 ? len - 1 : prev - 1;
    });
  };

  const rotateRight = () => {
    setCarouselIndex(prev => {
      const len = carouselItems.length;
      if (len === 0) return 0;
      return prev === len - 1 ? 0 : prev + 1;
    });
  };

  const statCards = [
    { 
      label: 'Total Games', 
      value: stats.total, 
      decimals: 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="20" height="12" rx="3"/>
          <line x1="6" y1="12" x2="10" y2="12"/>
          <line x1="8" y1="10" x2="8" y2="14"/>
          <line x1="15" y1="13" x2="15.01" y2="13"/>
          <line x1="18" y1="11" x2="18.01" y2="11"/>
        </svg>
      ), 
      accent: 'var(--accent-amber)' 
    },
    { 
      label: 'Completed', 
      value: stats.completed, 
      decimals: 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <polyline points="9 11 11 13 15 9"/>
        </svg>
      ), 
      accent: 'var(--accent-green)' 
    },
    { 
      label: 'Favorites', 
      value: stats.favorites, 
      decimals: 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ), 
      accent: 'var(--accent-amber)' 
    },
    { 
      label: 'Average Rating', 
      value: Number(avgRating), 
      decimals: 1,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="7"/>
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
        </svg>
      ), 
      accent: 'var(--accent-amber)' 
    },
    { 
      label: 'Total Hours', 
      value: Number(stats.totalHours || 0), 
      decimals: 0,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ), 
      accent: 'var(--accent-cyan)' 
    },
  ]

  if (games.length === 0) {
    return (
      <section className="dashboard">
        <div className="dash-empty">
          <img src={logoImg} className="empty-logo" alt="Smart GameVault Logo" />
          <p>Your GameVault cockpit is empty. Initialize database to start.</p>
          <button className="empty-cta" type="button" onClick={onAddGame}>
            INITIALIZE FIRST GAME
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard">
      <div className="section-header">
        <h2 className="section-title">
          <ScrambleText text="Telemetry Cockpit Overview" />
        </h2>
        <button className="nav-btn active" type="button" onClick={onOpenLibrary} style={{ fontSize: '0.75rem', border: '1px solid var(--accent-amber)' }}>
          Launch Library Console
        </button>
      </div>

      <div className="stats-grid">
        {statCards.map((card, index) => (
          <div className="stat-card" style={{ '--card-accent': card.accent }} key={card.label}>
            <span className="stat-icon">{card.icon}</span>
            <div className="stat-value">
              <CountUp value={card.value} decimals={card.decimals} delay={index * 80} />
            </div>
            <div className="stat-label">
              <ScrambleText text={card.label} delay={index * 60} />
            </div>
          </div>
        ))}
      </div>

      {/* Interactive 3D Card Carousel */}
      {carouselItems.length > 0 && (
        <div className="carousel-stage">
          <div className="carousel-telemetry">
            <div className="telemetry-label">
              <span className="telemetry-indicator">&gt;</span> <ScrambleText text="SYSTEM_TARGET_SELECT" />
            </div>
            {carouselItems[carouselIndex] && (
              <div className="telemetry-data">
                <div className="telemetry-title">
                  <ScrambleText text={carouselItems[carouselIndex].title} speed={20} />
                </div>
                <div className="telemetry-meta">
                  <div>
                    GENRE: <ScrambleText text={carouselItems[carouselIndex].genre || 'UNSORTED'} speed={25} />
                  </div>
                  <div>
                    PLATFORM: <ScrambleText text={carouselItems[carouselIndex].platform || 'PC'} speed={25} />
                  </div>
                  <div>
                    PLAYTIME: <ScrambleText text={String(carouselItems[carouselIndex].hoursPlayed || 0)} speed={25} /> HRS
                  </div>
                </div>
              </div>
            )}
          </div>

          {carouselItems.length > 1 && (
            <button className="carousel-btn left" type="button" onClick={rotateLeft} aria-label="Previous Game">
              &lt;
            </button>
          )}
          
          <div className="carousel-viewport">
            <div className="carousel-deck">
              {carouselItems.map((game, index) => {
                let offset = index - carouselIndex;
                
                // Circular wrap-around math for continuous carousel display
                const half = Math.floor(carouselItems.length / 2);
                if (offset > half) {
                  offset -= carouselItems.length;
                } else if (offset < -half) {
                  offset += carouselItems.length;
                }

                const isActive = offset === 0;
                const direction = Math.sign(offset);
                const absOffset = Math.abs(offset);
                
                // CoverFlow math — 130px spread on PC, 80px spread on mobile screen
                const spread = window.innerWidth <= 600 ? 80 : 130;
                const xTranslate = offset * spread; 
                const zTranslate = isActive ? 50 : -absOffset * 80; 
                const yRotate = isActive ? 0 : -direction * 45; 
                
                const transform = `translateX(${xTranslate}px) translateZ(${zTranslate}px) rotateY(${yRotate}deg)`;
                const zIndex = 100 - absOffset;
                const isVisible = absOffset <= 2;

                return (
                  <div
                    key={game.id}
                    className={`carousel-item ${isActive ? 'active' : 'inactive'}`}
                    style={{ transform, zIndex, display: isVisible ? 'block' : 'none' }}
                    onClick={() => {
                      if (isActive) {
                        onSelectGame(game);
                      } else {
                        setCarouselIndex(index);
                      }
                    }}
                  >
                    {game.coverImage ? (
                      <img className="carousel-cover" src={game.coverImage} alt={`${game.title} cover`} />
                    ) : (
                      <div className="carousel-placeholder">
                        <span style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 900 }}>GV</span>
                        <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>{game.genre || 'UNSORTED'}</span>
                      </div>
                    )}
                    {!game.coverImage && <div className="carousel-title-overlay">{game.title}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {carouselItems.length > 1 && (
            <button className="carousel-btn right" type="button" onClick={rotateRight} aria-label="Next Game">
              &gt;
            </button>
          )}
        </div>
      )}

      <div className="dashboard-sections">
        <DashboardPanel title="Top Rated Telemetry">
          <MiniGameList games={topRatedGames} emptyText="No rated games yet." onSelectGame={onSelectGame} />
        </DashboardPanel>

        <DashboardPanel title="Genre Distribution">
          <div className="genre-chart">
            {genreRows.map(row => (
              <div className="genre-bar-row" key={row.genre}>
                <span className="genre-bar-label">{row.genre}</span>
                <div className="genre-bar-track">
                  <div
                    className="genre-bar-fill"
                    style={{ width: `${(row.count / maxGenreCount) * 100}%` }}
                  />
                </div>
                <span className="genre-bar-count">{row.count}</span>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Cockpit Play Status">
          <div className="status-grid">
            {STATUSES.map(status => {
              const count = games.filter(game => game.status === status).length
              const colors = STATUS_COLORS[status] || { bg: 'var(--accent-cyan)' }
              const percentage = games.length > 0 ? (count / games.length) * 100 : 0

              return (
                <div className="status-mini-card" key={status} style={{ position: 'relative' }}>
                  <span className="status-mini-dot" style={{ backgroundColor: colors.bg }} />
                  <span className="status-mini-label">{status}</span>
                  <span className="status-mini-count">
                    {count} <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>({Math.round(percentage)}%)</span>
                  </span>
                </div>
              )
            })}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Recent Activity">
          <div className="activity-feed">
            {recentGames.map(game => {
              const isNew = Math.abs((game.updatedAt || 0) - (game.addedAt || 0)) < 1000;
              return (
                <button
                  className="activity-item"
                  type="button"
                  key={game.id}
                  onClick={() => onSelectGame(game)}
                >
                  <span className={`activity-badge ${isNew ? 'added' : 'updated'}`}>
                    {isNew ? 'ADDED' : 'UPDATED'}
                  </span>
                  <span className="activity-title">{game.title}</span>
                  <span className="activity-date">
                    {formatDate(game.updatedAt || game.addedAt)}
                  </span>
                </button>
              );
            })}
          </div>
        </DashboardPanel>
      </div>
    </section>
  )
}

function DashboardPanel({ title, children }) {
  return (
    <section className="dash-section">
      <h3 className="dash-section-title">
        <span className="dot" />
        {title}
      </h3>
      {children}
    </section>
  )
}

function MiniGameList({ games, emptyText, onSelectGame }) {
  if (games.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>{emptyText}</p>
  }

  return (
    <div className="mini-game-list">
      {games.map(game => (
        <button
          className="mini-game-item"
          type="button"
          key={game.id}
          onClick={() => onSelectGame(game)}
          style={{ border: 0, textAlign: 'left' }}
        >
          {game.coverImage ? (
            <img className="mini-cover" src={game.coverImage} alt={`${game.title} cover`} />
          ) : (
            <span className="mini-cover-placeholder">GV</span>
          )}
          <span className="mini-game-info">
            <span className="mini-game-title">{game.title}</span>
            <span className="mini-game-meta">
              {game.genre || 'Unsorted'} / {game.platform || 'Any platform'}
            </span>
          </span>
          <span className="mini-rating">{game.rating || 0}/5</span>
        </button>
      ))}
    </div>
  )
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown date'

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp))
}

export default Dashboard
