# Prism Pulse - Complete Phaser 3 Project

High-energy, prismatic puzzle game built with TypeScript and Phaser 3.

## Features
- **Grid-based Block Puzzle**: Drag and snap logic.
- **Glassmorphic UI**: Modern aesthetic using programmatic textures.
- **Combo System**: Score bonuses for multiple line clears.
- **Persistence**: High score saved to local storage.
- **Responsive**: Scales to fit mobile and desktop screens.

## Project Structure
- `src/scenes/`: Launcher, Game, UI, and Preloader (texture generation).
- `src/objects/`: Grid and Block logic.
- `src/consts.ts`: Centralized game configuration and colors.
- `src/utils/Storage.ts`: Game state persistence.

## How to Run Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Build for Web**:
   ```bash
   npm run build
   ```

## Mobile Export (Capacitor)

To wrap this project for Android or iOS:

1. **Initialize Capacitor**:
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init
   ```

2. **Add Platforms**:
   ```bash
   npx cap add android
   npx cap add ios
   ```

3. **Sync Build**:
   After running `npm run build`, copy the `dist` folder to the native project:
   ```bash
   npx cap sync
   ```

4. **Open in IDE**:
   ```bash
   npx cap open android
   npx cap open ios
   ```

## Development Notes
- The game generates all textures in `Preloader.ts` to ensure it runs without external image assets.
- Grid size is set to 8x8 (standard for Block Blast style).
- Input supports both Mouse and Touch via Phaser's unified input system.
