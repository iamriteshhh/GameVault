import { PLATFORMS } from './gameHelpers.js'

// ─── RAWG free tier ─────────────────────────────────────────────────────────
// Works with NO key (rate-limited to 20k req/month, 3/sec). Covers 500k+ games
// across all platforms: PC, console, retro, mobile, indie, etc.
const RAWG_BASE = 'https://api.rawg.io/api'

// ─── Steam store search ─────────────────────────────────────────────────────
// Called directly — bypasses CORS on Android via CapacitorHttp-patched fetch.
// Also works in Electron and dev (Vite proxy not needed anymore).
const STEAM_SEARCH_BASE = 'https://store.steampowered.com/api/storesearch'

// ─── Small local fallback ────────────────────────────────────────────────────
const LOCAL_GAME_CATALOG = [
  { title: 'Elden Ring', genre: 'Soulslike', platform: 'PC', releaseYear: 2022 },
  { title: 'God of War', genre: 'Action', platform: 'PlayStation', releaseYear: 2018 },
  { title: 'God of War Ragnarok', genre: 'Action', platform: 'PlayStation', releaseYear: 2022 },
  { title: 'The Legend of Zelda: Breath of the Wild', genre: 'Adventure', platform: 'Nintendo', releaseYear: 2017 },
  { title: 'The Legend of Zelda: Tears of the Kingdom', genre: 'Adventure', platform: 'Nintendo', releaseYear: 2023 },
  { title: 'Red Dead Redemption 2', genre: 'Open World', platform: 'PC', releaseYear: 2018 },
  { title: 'Cyberpunk 2077', genre: 'RPG', platform: 'PC', releaseYear: 2020 },
  { title: 'The Witcher 3: Wild Hunt', genre: 'RPG', platform: 'PC', releaseYear: 2015 },
  { title: "Baldur's Gate 3", genre: 'RPG', platform: 'PC', releaseYear: 2023 },
  { title: 'Hades', genre: 'Action', platform: 'PC', releaseYear: 2020 },
  { title: 'Hollow Knight', genre: 'Indie', platform: 'PC', releaseYear: 2017 },
  { title: 'Celeste', genre: 'Platformer', platform: 'PC', releaseYear: 2018 },
  { title: 'Minecraft', genre: 'Simulation', platform: 'PC', releaseYear: 2011 },
  { title: 'Stardew Valley', genre: 'Simulation', platform: 'PC', releaseYear: 2016 },
  { title: 'Resident Evil 4 Remake', genre: 'Horror', platform: 'PC', releaseYear: 2023 },
  { title: 'Halo Infinite', genre: 'FPS', platform: 'Xbox', releaseYear: 2021 },
  { title: 'Doom Eternal', genre: 'FPS', platform: 'PC', releaseYear: 2020 },
  { title: 'Forza Horizon 5', genre: 'Racing', platform: 'Xbox', releaseYear: 2021 },
  { title: 'Gran Turismo 7', genre: 'Racing', platform: 'PlayStation', releaseYear: 2022 },
  { title: 'Mortal Kombat 1', genre: 'Fighting', platform: 'PC', releaseYear: 2023 },
  { title: 'Street Fighter 6', genre: 'Fighting', platform: 'PC', releaseYear: 2023 },
  { title: 'Civilization VI', genre: 'Strategy', platform: 'PC', releaseYear: 2016 },
  { title: 'Age of Empires IV', genre: 'Strategy', platform: 'PC', releaseYear: 2021 },
  { title: 'FIFA 23', genre: 'Sports', platform: 'PC', releaseYear: 2022 },
  { title: 'Tetris Effect', genre: 'Puzzle', platform: 'PC', releaseYear: 2018 },
]

// ─── Main exported function ─────────────────────────────────────────────────

export async function searchGameCatalog(query, rawgApiKey) {
  const cleanQuery = query.trim()
  if (cleanQuery.length < 2) return []

  // Kick off all searches in parallel
  const [steamResult, rawgResult] = await Promise.allSettled([
    searchSteam(cleanQuery),
    searchRawg(cleanQuery, rawgApiKey), // rawgApiKey may be undefined/empty — that's fine
  ])

  const steamGames  = steamResult.status  === 'fulfilled' ? steamResult.value  : []
  const rawgGames   = rawgResult.status   === 'fulfilled' ? rawgResult.value   : []

  // If both APIs failed, fall back to local catalog
  if (steamGames.length === 0 && rawgGames.length === 0) {
    return searchLocalCatalog(cleanQuery)
  }

  // Merge: RAWG first (has richer metadata + cover), Steam as supplement
  return mergeResults([...rawgGames, ...steamGames]).slice(0, 20)
}

// ─── RAWG ───────────────────────────────────────────────────────────────────

async function searchRawg(query, apiKey) {
  const params = new URLSearchParams({ search: query, page_size: '12' })
  // Use the provided key if available; otherwise go keyless (still works)
  if (apiKey && apiKey.trim()) {
    params.set('key', apiKey.trim())
  }

  const response = await fetch(`${RAWG_BASE}/games?${params}`)
  if (!response.ok) throw new Error('RAWG search failed')

  const data = await response.json()
  return (data.results || []).map(item => ({
    id: `rawg_${item.id}`,
    externalId: item.id,
    source: 'RAWG',
    title: item.name,
    genre: item.genres?.[0]?.name || '',
    platform: normalizeRawgPlatform(item.platforms),
    releaseYear: item.released ? new Date(item.released).getFullYear() : '',
    coverImage: item.background_image || '',
    storefrontUrl: '',
  }))
}

function normalizeRawgPlatform(platforms = []) {
  if (!platforms || platforms.length === 0) return 'PC'
  const names = platforms.map(p => p.platform.name.toLowerCase())

  if (names.some(n => n.includes('nintendo') || n.includes('switch') || n.includes('wii') || n.includes('nes') || n.includes('snes') || n.includes('game boy'))) return 'Nintendo'
  if (names.some(n => n.includes('playstation') || n.includes('ps5') || n.includes('ps4') || n.includes('ps3') || n.includes('ps2') || n.includes('ps1') || n.includes('psp'))) return 'PlayStation'
  if (names.some(n => n.includes('xbox'))) return 'Xbox'
  if (names.some(n => n.includes('android') || n.includes('ios') || n.includes('phone') || n.includes('mobile'))) return 'Mobile'
  if (names.some(n => n.includes('genesis') || n.includes('atari') || n.includes('amiga') || n.includes('sega') || n.includes('dreamcast'))) return 'Retro'
  return 'PC'
}

// ─── Steam ──────────────────────────────────────────────────────────────────

async function searchSteam(query) {
  const params = new URLSearchParams({ term: query, l: 'en', cc: 'US' })

  // Direct URL — works on Android (CapacitorHttp patches fetch) and Electron.
  // In browser dev mode, Vite proxy handles /steam-api → but we go direct now.
  const response = await fetch(`${STEAM_SEARCH_BASE}/?${params}`)
  if (!response.ok) throw new Error('Steam search failed')

  const data = await response.json()
  return (data.items || [])
    .filter(item => item.type === 'app')
    .map(item => ({
      id: `steam_${item.id}`,
      externalId: item.id,
      source: 'Steam',
      title: item.name,
      genre: guessGenre(item.name),
      platform: normalizeSteamPlatform(item.platforms),
      releaseYear: '',
      // Prefer portrait library art, fallback to store banner
      coverImage: item.id
        ? `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/library_600x900_2x.jpg`
        : (item.tiny_image || ''),
      storefrontUrl: `https://store.steampowered.com/app/${item.id}`,
    }))
}

function normalizeSteamPlatform(platforms = {}) {
  if (platforms.windows || platforms.mac || platforms.linux) return 'PC'
  return PLATFORMS[0]
}

function guessGenre(title) {
  const t = title.toLowerCase()
  const hints = [
    ['racing',      'Racing'],
    ['simulator',   'Simulation'],
    ['simulation',  'Simulation'],
    ['strategy',    'Strategy'],
    ['puzzle',      'Puzzle'],
    ['football',    'Sports'],
    ['soccer',      'Sports'],
    ['fighting',    'Fighting'],
    ['horror',      'Horror'],
    ['rpg',         'RPG'],
    ['shooter',     'FPS'],
    ['adventure',   'Adventure'],
  ]
  return hints.find(([hint]) => t.includes(hint))?.[1] || ''
}

// ─── Local fallback ──────────────────────────────────────────────────────────

function searchLocalCatalog(query) {
  const needle = query.toLowerCase()
  return LOCAL_GAME_CATALOG
    .filter(g =>
      g.title.toLowerCase().includes(needle) ||
      g.genre.toLowerCase().includes(needle) ||
      g.platform.toLowerCase().includes(needle)
    )
    .slice(0, 8)
    .map((g, i) => ({
      id: `local_${i}_${g.title}`,
      source: 'Local',
      coverImage: '',
      ...g,
    }))
}

// ─── Merge & de-dupe ─────────────────────────────────────────────────────────

function mergeResults(results) {
  const byTitle = new Map()

  for (const result of results) {
    const key = result.title.toLowerCase()
    const existing = byTitle.get(key)

    if (!existing) {
      byTitle.set(key, result)
    } else {
      // Prefer whichever has a cover image; fill in missing fields
      byTitle.set(key, {
        ...existing,
        genre:       existing.genre       || result.genre,
        platform:    existing.platform     || result.platform,
        releaseYear: existing.releaseYear  || result.releaseYear,
        coverImage:  existing.coverImage   || result.coverImage,
        storefrontUrl: existing.storefrontUrl || result.storefrontUrl,
      })
    }
  }

  return Array.from(byTitle.values())
}
