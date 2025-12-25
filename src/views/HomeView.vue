<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workout'

const router = useRouter()
const workoutStore = useWorkoutStore()

function navigateTo(route: string) {
  router.push(route)
}

function startWorkout() {
  workoutStore.startWorkout()
  router.push('/workout')
}
</script>

<template>
  <div class="home">
    <header class="site-header">
      <h1 class="site-title">Le Coach Fitness</h1>
      <p class="site-tagline">Upgrade Your Fitness Journey</p>
    </header>

    <div class="cards-container">
      <button class="card card-workout" @click="startWorkout">
        <div class="card-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6.5 6.5h11v11h-11z"/>
            <path d="M3 12h3M18 12h3M12 3v3M12 18v3"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <span class="card-title">Start Workout</span>
        <span class="card-subtitle">Begin tracking your exercises</span>
      </button>

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

.site-header {
  text-align: center;
  margin-bottom: 2.5rem;
  padding: 1rem 0;
}

.site-title {
  font-family: 'Cinzel', serif;
  font-size: 2.5rem;
  font-weight: 600;
  color: var(--color-gold);
  letter-spacing: 0.08em;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.site-tagline {
  font-family: 'Raleway', sans-serif;
  font-size: 0.9rem;
  font-weight: 300;
  color: var(--color-text-secondary);
  letter-spacing: 0.2em;
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
  border: 1px solid rgba(201, 169, 98, 0.2);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Cinzel', serif;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  background: var(--color-bg-secondary);
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--color-gold), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card:hover {
  transform: translateY(-2px);
  border-color: rgba(201, 169, 98, 0.4);
  background: var(--color-bg-tertiary);
}

.card:hover::before {
  opacity: 1;
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
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--color-text-primary);
}

.card-subtitle {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  text-transform: none;
  letter-spacing: 0.05em;
  font-family: 'Raleway', sans-serif;
  font-weight: 400;
}

/* Workout Card - Primary Action */
.card-workout {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border-color: rgba(201, 169, 98, 0.4);
  background: linear-gradient(135deg, var(--color-bg-secondary) 0%, rgba(201, 169, 98, 0.1) 100%);
}

.card-workout:hover {
  box-shadow: 0 8px 30px rgba(201, 169, 98, 0.25);
  border-color: var(--color-gold);
}

.card-workout .card-icon {
  color: var(--color-gold);
}

.card-workout .card-title {
  color: var(--color-gold);
}

/* Timer Card */
.card-timer {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.card-timer:hover {
  box-shadow: 0 8px 30px rgba(201, 169, 98, 0.15);
}

.card-timer .card-icon {
  color: var(--color-accent-coral);
}

/* Equipment Card */
.card-equipment {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.card-equipment:hover {
  box-shadow: 0 8px 30px rgba(201, 169, 98, 0.15);
}

.card-equipment .card-icon {
  color: var(--color-gold);
}

/* Progress Card */
.card-progress {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.card-progress:hover {
  box-shadow: 0 8px 30px rgba(201, 169, 98, 0.15);
}

.card-progress .card-icon {
  color: var(--color-accent-teal);
}

.copyright {
  text-align: center;
  padding: 2rem 0 1rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  font-family: 'Raleway', sans-serif;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
</style>

