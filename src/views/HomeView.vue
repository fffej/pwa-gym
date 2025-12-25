<script setup lang="ts">
import { useRouter } from 'vue-router'
import logoImage from '@/assets/lecoach-logo.webp'
import UserProfile from '@/components/UserProfile.vue'

const router = useRouter()

function navigateTo(route: string) {
  router.push(route)
}
</script>

<template>
  <div class="home">
    <!-- User Profile Icon - Top Right -->
    <div class="top-bar">
      <UserProfile />
    </div>

    <header class="site-header">
      <img :src="logoImage" alt="Le Coach Fitness" class="site-logo" />
      <p class="site-tagline">Upgrade Your Fitness Journey</p>
    </header>

    <div class="cards-container">
      <button class="card card-workout" @click="navigateTo('/workout/start')">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
          </svg>
        </div>
        <span class="card-title">Start Workout</span>
        <span class="card-subtitle">Begin tracking your exercises</span>
      </button>

      <button class="card card-plans" @click="navigateTo('/plans')">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
          </svg>
        </div>
        <span class="card-title">Plans</span>
        <span class="card-subtitle">Manage workout templates</span>
      </button>

      <button class="card card-equipment" @click="navigateTo('/equipment')">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
          </svg>
        </div>
        <span class="card-title">Gym Info</span>
        <span class="card-subtitle">Opening hours & equipment</span>
      </button>

      <button class="card card-progress" @click="navigateTo('/progress')">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/>
          </svg>
        </div>
        <span class="card-title">Progress</span>
        <span class="card-subtitle">Track your gains</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 2rem 1.5rem;
  position: relative;
}

.top-bar {
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 50;
}

.site-header {
  text-align: center;
  margin-bottom: 2.5rem;
  padding: 1rem 0;
}

.site-logo {
  height: 60px;
  width: auto;
  margin-bottom: 0.5rem;
}

.site-tagline {
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.cards-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: rgba(255, 255, 255, 0.03);
  position: relative;
  overflow: hidden;
}

.card:hover {
  background: rgba(255, 255, 255, 0.06);
  transform: translateY(-2px);
}

.card:active {
  transform: translateY(0);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-gold);
}

.card-title {
  font-family: 'Poppins', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: var(--color-text-primary);
}

.card-subtitle {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  text-transform: none;
  letter-spacing: 0.02em;
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
}

/* Workout Card - Primary Action */
.card-workout {
  background: rgba(74, 144, 217, 0.08);
}

.card-workout:hover {
  background: rgba(74, 144, 217, 0.12);
}

.card-workout .card-icon {
  color: var(--color-gold);
}

.card-workout .card-title {
  color: var(--color-gold);
}

/* Plans Card */
.card-plans .card-icon {
  color: var(--color-accent-coral);
}

/* Equipment Card */
.card-equipment .card-icon {
  color: var(--color-gold);
}

/* Progress Card */
.card-progress .card-icon {
  color: var(--color-accent-teal);
}
</style>

