<script setup lang="ts">
import type { Workout } from '@/types/workout'
import { formatDuration } from '@/utils/metrics'

const props = defineProps<{
  workouts: Workout[]
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  isLoading: boolean
  getSummary: (workout: Workout) => {
    id: string
    date: string
    exerciseCount: number
    totalVolume: number
    duration: number
    completedSets: number
  }
}>()

const emit = defineEmits<{
  'select-workout': [workout: Workout]
  'next-page': []
  'prev-page': []
}>()

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return `${(volume / 1000).toFixed(1)}k kg`
  }
  return `${volume} kg`
}
</script>

<template>
  <div class="workout-history">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading workouts...</p>
    </div>

    <div v-else-if="workouts.length === 0" class="empty-state">
      <div class="empty-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </div>
      <h3>No Workouts Yet</h3>
      <p>Complete your first workout to see your progress here.</p>
    </div>

    <template v-else>
      <ul class="workout-list">
        <li 
          v-for="workout in workouts" 
          :key="workout.id" 
          class="workout-item"
          @click="emit('select-workout', workout)"
        >
          <div class="workout-date">
            <span class="date-text">{{ formatDate(workout.date) }}</span>
            <span class="duration" v-if="getSummary(workout).duration > 0">
              {{ formatDuration(getSummary(workout).duration) }}
            </span>
          </div>
          <div class="workout-stats">
            <div class="stat">
              <span class="stat-value">{{ getSummary(workout).exerciseCount }}</span>
              <span class="stat-label">exercises</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ getSummary(workout).completedSets }}</span>
              <span class="stat-label">sets</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ formatVolume(getSummary(workout).totalVolume) }}</span>
              <span class="stat-label">volume</span>
            </div>
          </div>
          <div class="workout-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </li>
      </ul>

      <div class="pagination" v-if="totalPages > 1">
        <button 
          class="page-btn" 
          :disabled="!hasPrevPage"
          @click="emit('prev-page')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Previous
        </button>
        
        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>
        
        <button 
          class="page-btn" 
          :disabled="!hasNextPage"
          @click="emit('next-page')"
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.workout-history {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(74, 144, 217, 0.2);
  border-top-color: var(--color-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p,
.empty-state p {
  color: var(--color-text-secondary);
  margin-top: 1rem;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  background: var(--color-bg-secondary);
  border-radius: 50%;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: var(--color-text-primary);
  font-family: 'Poppins', sans-serif;
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
}

.workout-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.workout-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.workout-item:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.3);
}

.workout-date {
  display: flex;
  flex-direction: column;
  min-width: 80px;
}

.date-text {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.duration {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.workout-stats {
  display: flex;
  gap: 1.5rem;
  flex: 1;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-gold);
}

.stat-label {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.workout-arrow {
  color: var(--color-text-muted);
  transition: transform 0.2s ease;
}

.workout-item:hover .workout-arrow {
  transform: translateX(4px);
  color: var(--color-gold);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  margin-top: 0.5rem;
  border-top: 1px solid rgba(74, 144, 217, 0.1);
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 4px;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-family: 'Poppins', sans-serif;
  cursor: pointer;
  transition: all 0.2s ease;
}

.page-btn:not(:disabled):hover {
  background: var(--color-bg-tertiary);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-family: 'Poppins', sans-serif;
}
</style>

