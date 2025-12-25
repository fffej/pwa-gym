# PWA Gym

A Progressive Web App for tracking gym workouts, built with Vue 3, TypeScript, and Vite.

## Features

- Track workouts with exercises and sets
- Browse gym equipment with usage instructions
- Rest timer with customizable duration
- Smart defaults based on previous workouts
- Offline support with IndexedDB storage
- Installable as a PWA on mobile and desktop

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Testing

The project includes comprehensive unit and end-to-end tests.

### Unit Tests (Vitest)

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage report
npm run test:coverage
```

Unit tests cover:
- **Store logic** - Workout, machines, and settings stores
- **Calculations** - Weight conversion, volume calculations, timer formatting
- **Data validation** - machines.json schema and type validation

### End-to-End Tests (Playwright)

```bash
# Run E2E tests (requires build first)
npm run build
npm run test:e2e
```

E2E tests cover:
- **Route accessibility** - All pages load without errors
- **Navigation flows** - Links and back buttons work correctly
- **Link integrity** - No broken internal links

### CI/CD

Tests run automatically on every push to `main` via GitHub Actions. The build and deployment only proceed if all tests pass.

## Deployment

This project automatically deploys to GitHub Pages when changes are pushed to the `main` branch.

### Setup GitHub Pages

1. Go to your repository Settings > Pages
2. Under "Build and deployment", select **GitHub Actions** as the source
3. Push to `main` and the workflow will deploy your app

Your app will be available at: `https://<username>.github.io/pwa-gym/`

## Tech Stack

- **Vue 3** - Frontend framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Dexie** - IndexedDB wrapper for offline storage
- **vite-plugin-pwa** - PWA support with service worker
- **Vitest** - Unit testing
- **Playwright** - End-to-end testing
- **GitHub Actions** - CI/CD for testing and deployment
