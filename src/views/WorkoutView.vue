<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workout'
import ExerciseCard from '@/components/ExerciseCard.vue'

const router = useRouter()
const workoutStore = useWorkoutStore()

const showFinishConfirm = ref(false)

// Rest stopwatch state
const showRestModal = ref(false)
const restElapsed = ref(0)
const isRestRunning = ref(false)
let restInterval: number | null = null

// Stopwatch display format
const restDisplay = computed(() => {
  const mins = Math.floor(restElapsed.value / 60)
  const secs = restElapsed.value % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
})

function startRest() {
  isRestRunning.value = true
  restInterval = window.setInterval(() => {
    restElapsed.value++
  }, 1000)
}

function pauseRest() {
  isRestRunning.value = false
  if (restInterval) {
    clearInterval(restInterval)
    restInterval = null
  }
}

function resetRest() {
  pauseRest()
  restElapsed.value = 0
}

function openRestModal() {
  showRestModal.value = true
  resetRest()
  startRest()
}

// Cleanup on unmount
onUnmounted(() => {
  if (restInterval) {
    clearInterval(restInterval)
  }
})

onMounted(async () => {
  // If no active workout, redirect to home
  if (!workoutStore.isWorkoutActive) {
    router.push('/')
  }
})

const workout = computed(() => workoutStore.activeWorkout)
const hasExercises = computed(() => workout.value && workout.value.exercises.length > 0)

const workoutDuration = computed(() => {
  if (!workout.value) return '0:00'
  const elapsed = Math.floor((Date.now() - workout.value.startTime) / 1000)
  const hours = Math.floor(elapsed / 3600)
  const minutes = Math.floor((elapsed % 3600) / 60)
  const seconds = elapsed % 60
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
)

function goToExercisePicker() {
  router.push('/workout/add-exercise')
}

function handleAddSet(exerciseId: string) {
  workoutStore.addSet(exerciseId)
}

function handleRemoveSet(exerciseId: string, setId: string) {
  workoutStore.removeSet(exerciseId, setId)
}

function handleUpdateSet(exerciseId: string, setId: string, updates: Record<string, unknown>) {
  workoutStore.updateSet(exerciseId, setId, updates)
}

async function handleCompleteSet(exerciseId: string, setId: string) {
  await workoutStore.completeSet(exerciseId, setId)
}

function handleRemoveExercise(exerciseId: string) {
  workoutStore.removeExercise(exerciseId)
}

async function finishWorkout() {
  await workoutStore.finishWorkout()
  router.push('/')
}

function discardWorkout() {
  workoutStore.discardWorkout()
  router.push('/')
}
</script>

<template>
  <div class="workout-view">
    <header class="header">
      <button class="back-btn" @click="showFinishConfirm = true">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <div class="header-info">
        <h1>Workout</h1>
        <span class="duration">{{ workoutDuration }}</span>
      </div>
      <div class="header-stats">
        <div class="stat">
          <span class="stat-value">{{ workoutStore.totalSetsCompleted }}</span>
          <span class="stat-label">Sets</span>
        </div>
        <button class="stat stat-btn" @click="openRestModal">
          <svg class="stat-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Finish Confirmation Modal -->
    <div v-if="showFinishConfirm" class="modal-overlay" @click.self="showFinishConfirm = false">
      <div class="modal">
        <h2>End Workout?</h2>
        <p v-if="hasExercises">
          {{ workout?.exercises.length }} exercise{{ workout?.exercises.length === 1 ? '' : 's' }}, 
          {{ workoutStore.totalSetsCompleted }} set{{ workoutStore.totalSetsCompleted === 1 ? '' : 's' }} completed.
        </p>
        <p v-else>
          You haven't added any exercises yet.
        </p>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="showFinishConfirm = false">
            Continue Workout
          </button>
          <button v-if="hasExercises" class="modal-btn save" @click="finishWorkout">
            Save Workout
          </button>
          <button class="modal-btn discard" @click="discardWorkout">
            Discard
          </button>
        </div>
      </div>
    </div>

    <!-- Rest Stopwatch Modal -->
    <div v-if="showRestModal" class="modal-overlay" @click.self="pauseRest(); showRestModal = false">
      <div class="modal rest-modal">
        <h2>Rest Time</h2>
        
        <!-- Stopwatch Display -->
        <div class="rest-display" :class="{ running: isRestRunning }">
          {{ restDisplay }}
        </div>

        <!-- Stopwatch Controls -->
        <div class="rest-controls">
          <button v-if="!isRestRunning" class="rest-btn start" @click="startRest">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Resume
          </button>
          <button v-else class="rest-btn pause" @click="pauseRest">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16"/>
              <rect x="14" y="4" width="4" height="16"/>
            </svg>
            Pause
          </button>
          <button class="rest-btn reset" @click="resetRest">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Reset
          </button>
        </div>

        <button class="modal-btn close-rest" @click="pauseRest(); showRestModal = false">
          Done
        </button>
      </div>
    </div>

    <div class="content">
      <!-- Empty State -->
      <div v-if="!hasExercises" class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6.5 6.5h11v11h-11z"/>
            <path d="M3 12h3M18 12h3M12 3v3M12 18v3"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <h2>No exercises yet</h2>
        <p>Add your first exercise to get started</p>
      </div>

      <!-- Exercise List -->
      <div v-else class="exercises-list">
        <ExerciseCard
          v-for="exercise in workout?.exercises"
          :key="exercise.id"
          :exercise="exercise"
          @add-set="handleAddSet(exercise.id)"
          @remove-set="(setId) => handleRemoveSet(exercise.id, setId)"
          @update-set="(setId, updates) => handleUpdateSet(exercise.id, setId, updates)"
          @complete-set="(setId) => handleCompleteSet(exercise.id, setId)"
          @remove-exercise="handleRemoveExercise(exercise.id)"
        />
      </div>
    </div>

    <!-- Add Machine Button -->
    <div class="bottom-actions">
      <button class="add-exercise-btn" @click="goToExercisePicker">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Machine
      </button>
    </div>
  </div>
</template>

<style scoped>
.workout-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--color-bg-primary);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid rgba(74, 144, 217, 0.1);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
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

.header h1 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.duration {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  font-family: 'Poppins', sans-serif;
}

.header-stats {
  display: flex;
  gap: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-secondary);
  border-radius: 6px;
}

.stat-value {
  font-family: 'Poppins', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-gold);
  line-height: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-muted);
}

.content {
  flex: 1;
  padding: 1rem 1.5rem;
  padding-bottom: 100px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 50%;
  color: var(--color-gold);
  margin-bottom: 1.5rem;
}

.empty-state h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: var(--color-text-muted);
  font-size: 0.9rem;
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem 1.5rem;
  background: linear-gradient(transparent, var(--color-bg-primary) 20%);
  max-width: 480px;
  margin: 0 auto;
}

.add-exercise-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-gold);
  border: none;
  border-radius: 8px;
  color: var(--color-bg-primary);
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 20px rgba(74, 144, 217, 0.3);
}

.add-exercise-btn:hover {
  background: var(--color-gold-light);
  box-shadow: 0 6px 25px rgba(74, 144, 217, 0.4);
  transform: translateY(-1px);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  z-index: 100;
}

.modal {
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 12px;
  padding: 2rem;
  max-width: 320px;
  width: 100%;
  text-align: center;
}

.modal h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.75rem 0;
}

.modal p {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin: 0 0 1.5rem 0;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.modal-btn {
  padding: 0.875rem 1.5rem;
  border-radius: 6px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-btn.cancel {
  background: var(--color-gold);
  border: none;
  color: var(--color-bg-primary);
}

.modal-btn.cancel:hover {
  background: var(--color-gold-light);
}

.modal-btn.save {
  background: rgba(129, 178, 154, 0.2);
  border: 1px solid var(--color-accent-teal);
  color: var(--color-accent-teal);
}

.modal-btn.save:hover {
  background: rgba(129, 178, 154, 0.3);
}

.modal-btn.discard {
  background: transparent;
  border: 1px solid rgba(224, 122, 95, 0.3);
  color: var(--color-accent-coral);
}

.modal-btn.discard:hover {
  background: rgba(224, 122, 95, 0.1);
  border-color: var(--color-accent-coral);
}

/* Rest Button Styles */
.stat-btn {
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.stat-btn:hover {
  background: var(--color-bg-tertiary);
  transform: scale(1.05);
}

.stat-icon {
  color: var(--color-gold);
  height: 1.5rem;
  width: 1.5rem;
}

/* Rest Modal Styles */
.rest-modal {
  max-width: 320px;
}

.rest-display {
  font-family: 'Poppins', sans-serif;
  font-size: 4rem;
  font-weight: 700;
  color: var(--color-text-primary);
  text-align: center;
  padding: 1.5rem 0;
  margin-bottom: 1.5rem;
  border-radius: 12px;
  background: var(--color-bg-tertiary);
  transition: all 0.3s ease;
}

.rest-display.running {
  color: var(--color-gold);
  background: rgba(74, 144, 217, 0.1);
}

.rest-controls {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.rest-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.rest-btn.start {
  background: var(--color-gold);
  border: none;
  color: var(--color-bg-primary);
}

.rest-btn.start:hover {
  background: var(--color-gold-light);
}

.rest-btn.pause {
  background: rgba(224, 122, 95, 0.2);
  border: 1px solid var(--color-accent-coral);
  color: var(--color-accent-coral);
}

.rest-btn.pause:hover {
  background: rgba(224, 122, 95, 0.3);
}

.rest-btn.reset {
  background: transparent;
  border: 1px solid rgba(74, 144, 217, 0.3);
  color: var(--color-text-secondary);
}

.rest-btn.reset:hover {
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.modal-btn.close-rest {
  width: 100%;
  background: var(--color-gold);
  border: none;
  color: var(--color-bg-primary);
  margin-top: 0.5rem;
}

.modal-btn.close-rest:hover {
  background: var(--color-gold-light);
}
</style>

