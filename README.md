# GameVault Cockpit Console

GameVault is a premium, retro-futuristic backlog journal and game library manager built to run on both **Desktop (React + Vite + Electron)** and **Mobile (Capacitor for Android)**. Designed as a simulated tactical telemetry cockpit, it completely overhauls the generic game tracking experience with high-end animations, responsive layouts, native file persistence, and multi-platform sync tools.

---

##  Mobile APK Included

We have pre-compiled the latest mobile build for you!
- You can find the installable Android package inside the **([mobile apk in here])**.
- Simply transfer this file to your Android device, open it using your device's File Manager, and select **Install** (make sure to uninstall any older versions of the app first).

---

## Key Features

### 1. Tactical Charcoal & Amber Cockpit UI
- **Immersive Visuals:** Rugged dark charcoal matte plates, custom warnings, sliced corner borders, and high-contrast amber highlights designed to look like hardware gauges.
- **Responsive Layout:** Beautiful mobile-first styling for headers, tabs, grids, and details. The entire app scales perfectly down to phone screens.
- **3D Card Interactive Depth:** Hovering over library cards on desktop triggers a smooth, JavaScript-driven 3D mouse tilt parallax effect.
- **3D Rotating Carousel:** The Dashboard cockpit features an interactive, floating circular 3D game highlight wheel (scaled down for small screens).
- **Smooth Telemetry Animations:** Statistics grids load with staggered slide-ups, entry blurs, and decelerating odometer count-up tickers.

### 2. Dual-Mode Steam Library Importer
- **Keyless Fallback Sync:** Sync your recently played games (with titles, playtimes, and covers) keylessly by fetching your public profile XML feed—no setup required.
- **Full Web API Sync:** Provide an optional Steam Web API Key inside the sync console to unlock a full library import (syncing your entire owned games catalog at once).
- **CORS-Free Mobile Support:** Operates seamlessly on Android via Capacitor's native HTTP interception (which automatically patches `window.fetch` to bypass web CORS restrictions).

### 3. Integrated RAWG Search Engine
- **Console & Retro Support:** Queries Steam and the **RAWG Open Game Database** concurrently on search to unlock Xbox, PlayStation, Nintendo, and retro console titles.
- **Works Keyless:** Search catalog functions with zero setup, returning up to 20 matched titles across all platforms.
- **Smart Metadata Merge:** Merges results automatically—keeping Steam's store details and vertical library art while pulling genres, launch years, and console categories from RAWG.

### 4. Cross-Device Database Console
- **Direct Drive Saves:** All game entries and settings save directly to physical storage. On desktop, it saves to your system's AppData folder; on mobile, it uses local storage persistence.
- **Mobile Native Sharing:** Export backups easily on mobile! Clicking **"Export Database"** triggers your native Android Share sheet (share to Google Drive, WhatsApp, email, etc.).
- **PC Backup Tools:** On PC, downloads a standard `.json` backup file. Move backups between your laptop and phone to restore libraries with a single click.

---

## Technical Architecture

- **Core Frontend:** React 18, Vite, Vanilla CSS.
- **Desktop Wrapper:** Electron (with secure IPC ContextBridge).
- **Mobile Wrapper:** Capacitor JS (configured with native Android wrapper, custom icons, and splash screens).
- **Network Stack:** CapacitorHttp-patched native `fetch` (for Android) and Node.js proxying (for Electron) to bypass CORS policies.

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18+ recommended)
- [Android SDK & JDK 21](https://developer.android.com/) (Only required if you want to rebuild the APK from source)

### Installation
1. Clone this repository locally.
2. Navigate to the project root:
   ```bash
   cd "Game vault"
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

---

## Development & Build Commands

###  Desktop / Electron Console

Start the React development server and launch the Electron wrapper concurrently:
```bash
npm run dev
```

Compile React assets and build a native Windows standalone executable (`.exe`):
```bash
npm run build
```
*(The packaged executable will output to your build directory.)*

---

###  Mobile / Capacitor Console

To build and compile the Android app from source:

1. Build the production web assets:
   ```bash
   npx vite build
   ```
2. Synchronize web assets with the Capacitor native Android project:
   ```bash
   npx cap sync android
   ```
3. Open the Android project in Android Studio (optional):
   ```bash
   npx cap open android
   ```
4. Assemble a release/debug APK locally using Gradle:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   *(Outputs the compiled APK to `android/app/build/outputs/apk/debug/app-debug.apk`)*

---

## License

This software is **Proprietary & Closed Source** but is **Free to Use** for personal, non-commercial purposes. See the [LICENSE](LICENSE) file for the complete terms.
