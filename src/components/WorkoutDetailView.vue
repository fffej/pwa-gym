<script setup lang="ts">
import type { Workout, Exercise } from '@/types/workout'
import { calculateExerciseVolume, getExerciseMaxWeight, getExerciseBestE1RM } from '@/utils/metrics'

const props = defineProps<{
  workout: Workout
}>()

const emit = defineEmits<{
  'back': []
  'analyze-exercise': [machineId: string, machineName: string]
}>()

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatDuration(): string {
  if (!props.workout.endTime) return ''
  const durationMs = props.workout.endTime - props.workout.startTime
  const minutes = Math.floor(durationMs / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
}

function formatGrip(grip: string | undefined): string {
  if (!grip) return ''
  return grip.charAt(0).toUpperCase() + grip.slice(1)
}

function getExerciseSummary(exercise: Exercise) {
  const completedSets = exercise.sets.filter(s => s.isCompleted)
  return {
    setCount: completedSets.length,
    volume: calculateExerciseVolume(exercise),
    maxWeight: getExerciseMaxWeight(exercise),
    bestE1RM: getExerciseBestE1RM(exercise)
  }
}
</script>

<template>
  <div class="workout-detail">
    <div class="detail-header">
      <button class="back-btn" @click="emit('back')">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <div class="header-info">
        <h2>{{ formatDate(workout.date) }}</h2>
        <span class="duration" v-if="formatDuration()">{{ formatDuration() }}</span>
      </div>
    </div>

    <div class="exercises-list">
      <div 
        v-for="exercise in workout.exercises" 
        :key="exercise.id" 
        class="exercise-card"
        @click="emit('analyze-exercise', exercise.machineId, exercise.machineName)"
      >
        <div class="exercise-header">
          <div class="exercise-info">
            <h3 class="exercise-name">{{ exercise.machineName }}</h3>
            <div class="exercise-meta">
              <span v-if="exercise.attachmentId" class="meta-tag">{{ exercise.attachmentId }}</span>
              <span v-if="exercise.grip" class="meta-tag">{{ formatGrip(exercise.grip) }}</span>
            </div>
          </div>
          <div class="analyze-hint">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3v18h18"/>
              <path d="M18 17V9"/>
              <path d="M13 17V5"/>
              <path d="M8 17v-3"/>
            </svg>
          </div>
        </div>

        <div class="sets-display">
          <div 
            v-for="(set, index) in exercise.sets.filter(s => s.isCompleted)" 
            :key="set.id" 
            class="set-pill"
          >
            <span class="set-number">{{ index + 1 }}</span>
            <span class="set-details">{{ set.weight }}{{ set.weightUnit }} × {{ set.reps }}</span>
          </div>
        </div>

        <div class="exercise-summary">
          <div class="summary-stat">
            <span class="stat-label">Volume</span>
            <span class="stat-value">{{ getExerciseSummary(exercise).volume }} kg</span>
          </div>
          <div class="summary-stat">
            <span class="stat-label">Max</span>
            <span class="stat-value">{{ getExerciseSummary(exercise).maxWeight }} kg</span>
          </div>
          <div class="summary-stat">
            <span class="stat-label">E1RM</span>
            <span class="stat-value">{{ getExerciseSummary(exercise).bestE1RM }} kg</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="workout.notes" class="workout-notes">
      <h4>Notes</h4>
      <p>{{ workout.notes }}</p>
    </div>
  </div>
</template>

<style scoped>
.workout-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 4px;
  color: var(--color-gold);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.4);
}

.header-info {
  flex: 1;
}

.header-info h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.duration {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.exercise-card {
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.exercise-card:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.3);
}

.exercise-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}

.exercise-info {
  flex: 1;
}

.exercise-name {
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.25rem 0;
}

.exercise-meta {
  display: flex;
  gap: 0.5rem;
}

.meta-tag {
  padding: 0.15rem 0.4rem;
  background: rgba(74, 144, 217, 0.15);
  border-radius: 3px;
  font-size: 0.65rem;
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.analyze-hint {
  color: var(--color-text-muted);
  transition: color 0.2s;
}

.exercise-card:hover .analyze-hint {
  color: var(--color-accent-teal);
}

.sets-display {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.set-pill {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.6rem;
  background: rgba(94, 204, 151, 0.1);
  border: 1px solid rgba(94, 204, 151, 0.3);
  border-radius: 20px;
  font-size: 0.75rem;
}

.set-number {
  font-weight: 600;
  color: var(--color-accent-teal);
  min-width: 1rem;
  text-align: center;
}

.set-details {
  color: var(--color-text-primary);
}

.exercise-summary {
  display: flex;
  gap: 1.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(74, 144, 217, 0.1);
}

.summary-stat {
  display: flex;
  flex-direction: column;
}

.summary-stat .stat-label {
  font-size: 0.65rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-stat .stat-value {
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-gold);
}

.workout-notes {
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 8px;
  padding: 1rem;
}

.workout-notes h4 {
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
}

.workout-notes p {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}
</style>

