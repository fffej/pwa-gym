<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProgressStore } from '@/stores/progress'
import WorkoutHistoryList from '@/components/WorkoutHistoryList.vue'
import WorkoutDetailView from '@/components/WorkoutDetailView.vue'
import ExerciseAnalysis from '@/components/ExerciseAnalysis.vue'
import type { Workout } from '@/types/workout'

const router = useRouter()
const progressStore = useProgressStore()

// View state: 'list' | 'workout' | 'analysis'
type ViewState = 'list' | 'workout' | 'analysis'
const currentView = ref<ViewState>('list')

// Load workouts on mount
onMounted(async () => {
  await progressStore.loadWorkouts()
})

// Navigation handlers
function handleSelectWorkout(workout: Workout) {
  progressStore.selectWorkout(workout)
  currentView.value = 'workout'
}

function handleBackToList() {
  progressStore.clearSelectedWorkout()
  progressStore.clearExerciseAnalysis()
  currentView.value = 'list'
}

function handleBackToWorkout() {
  progressStore.clearExerciseAnalysis()
  currentView.value = 'workout'
}

async function handleAnalyzeExercise(machineId: string, machineName: string) {
  await progressStore.selectExerciseForAnalysis(machineId, machineName)
  currentView.value = 'analysis'
}

async function handleNextPage() {
  await progressStore.nextPage()
}

async function handlePrevPage() {
  await progressStore.prevPage()
}

</script>

<template>
  <div class="progress-view">
    <header class="header" v-if="currentView === 'list'">
      <button class="back-btn" @click="router.push('/')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Progress</h1>
    </header>

    <div class="content">
      <!-- Workout List View -->
      <WorkoutHistoryList 
        v-if="currentView === 'list'"
        :workouts="progressStore.workouts"
        :current-page="progressStore.currentPage"
        :total-pages="progressStore.totalPages"
        :has-next-page="progressStore.hasNextPage"
        :has-prev-page="progressStore.hasPrevPage"
        :is-loading="progressStore.isLoading"
        :get-summary="progressStore.getWorkoutSummary"
        @select-workout="handleSelectWorkout"
        @next-page="handleNextPage"
        @prev-page="handlePrevPage"
      />

      <!-- Workout Detail View -->
      <WorkoutDetailView 
        v-else-if="currentView === 'workout' && progressStore.selectedWorkout"
        :workout="progressStore.selectedWorkout"
        @back="handleBackToList"
        @analyze-exercise="handleAnalyzeExercise"
      />

      <!-- Exercise Analysis View -->
      <ExerciseAnalysis 
        v-else-if="currentView === 'analysis'"
        :machine-name="progressStore.selectedMachineName"
        :metrics="progressStore.exerciseMetrics"
        @back="handleBackToWorkout"
      />
    </div>
  </div>
</template>

<style scoped>
.progress-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1.5rem;
  max-width: 480px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
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
}

.back-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.4);
}

.header h1 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0;
}

.content {
  flex: 1;
}
</style>
