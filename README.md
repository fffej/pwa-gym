# PWA Gym

A simple Progressive Web App built with Vue 3, TypeScript, and Vite.

## Features

- Displays "Hello world" with an interactive counter
- Counter persists to localStorage (works offline)
- Installable as a PWA on mobile and desktop
- Automatic deployment to GitHub Pages on merge to main

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
- **vite-plugin-pwa** - PWA support with service worker
- **GitHub Actions** - CI/CD for deployment
