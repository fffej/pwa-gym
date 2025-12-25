<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function navigateTo(route: string) {
  router.push(route)
}
</script>

<template>
  <div class="home">
    <div class="cards-container">
      <button class="card card-timer" @click="navigateTo('/timer')">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <span class="card-title">Timer</span>
        <span class="card-subtitle">Rest between sets</span>
      </button>

      <button class="card card-equipment" @click="navigateTo('/equipment')">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6.5 6.5h11v11h-11z"/>
            <path d="M3 12h3M18 12h3M12 3v3M12 18v3"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <span class="card-title">Gym Equipment</span>
        <span class="card-subtitle">Browse equipment</span>
      </button>

      <button class="card card-progress" @click="navigateTo('/progress')">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 3v18h18"/>
            <path d="M18 17V9"/>
            <path d="M13 17V5"/>
            <path d="M8 17v-3"/>
          </svg>
        </div>
        <span class="card-title">Progress</span>
        <span class="card-subtitle">Track your gains</span>
      </button>
    </div>

    <footer class="copyright">
      © Max Foster 2025
    </footer>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 2rem 1.5rem;
}

.cards-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2rem 1.5rem;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  font-family: 'Bebas Neue', 'Oswald', 'Segoe UI', system-ui, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.card:hover {
  transform: translateY(-4px);
}

.card:active {
  transform: translateY(-2px);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.card-subtitle {
  font-size: 0.875rem;
  opacity: 0.8;
  text-transform: none;
  letter-spacing: 0.02em;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

/* Timer Card - Vibrant coral/orange */
.card-timer {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  color: #fff;
  box-shadow: 0 8px 32px rgba(238, 90, 36, 0.35);
}

.card-timer:hover {
  box-shadow: 0 12px 40px rgba(238, 90, 36, 0.5);
}

/* Equipment Card - Electric blue */
.card-equipment {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #0a2540;
  box-shadow: 0 8px 32px rgba(79, 172, 254, 0.35);
}

.card-equipment:hover {
  box-shadow: 0 12px 40px rgba(79, 172, 254, 0.5);
}

/* Progress Card - Emerald green */
.card-progress {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #0a2e1a;
  box-shadow: 0 8px 32px rgba(56, 239, 125, 0.35);
}

.card-progress:hover {
  box-shadow: 0 12px 40px rgba(56, 239, 125, 0.5);
}

.copyright {
  text-align: center;
  padding: 1.5rem 0 0.5rem;
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.875rem;
  font-family: 'Segoe UI', system-ui, sans-serif;
  letter-spacing: 0.05em;
}
</style>

