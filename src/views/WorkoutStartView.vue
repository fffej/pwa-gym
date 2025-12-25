<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlansStore } from '@/stores/plans'
import { useWorkoutStore } from '@/stores/workout'
import { useMachinesStore } from '@/stores/machines'
import type { Plan } from '@/types/workout'

const router = useRouter()
const plansStore = usePlansStore()
const workoutStore = useWorkoutStore()
const machinesStore = useMachinesStore()

onMounted(async () => {
  await plansStore.initialize()
})

function goBack() {
  router.push('/')
}

function startFromScratch() {
  workoutStore.startWorkout()
  router.push('/workout')
}

async function startWithPlan(plan: Plan) {
  // Start the workout
  workoutStore.startWorkout()
  
  // Add all exercises from the plan
  for (const planExercise of plan.exercises) {
    await workoutStore.addExercise(
      planExercise.machineId,
      planExercise.attachmentId,
      planExercise.grip
    )
  }
  
  router.push('/workout')
}

function getMachineName(machineId: string): string {
  const machine = machinesStore.getMachineById(machineId)
  return machine?.name ?? machineId
}

function getExerciseCount(plan: Plan): string {
  if (plan.exercises.length === 1) return '1 exercise'
  return `${plan.exercises.length} exercises`
}

function getExercisePreview(plan: Plan): string {
  const names = plan.exercises.slice(0, 3).map(e => getMachineName(e.machineId))
  if (plan.exercises.length > 3) {
    return names.join(', ') + '...'
  }
  return names.join(', ')
}
</script>

<template>
  <div class="workout-start">
    <header class="header">
      <button class="back-btn" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Start Workout</h1>
    </header>

    <div class="content">
      <p class="intro-text">Choose a plan or start from scratch</p>

      <!-- Start from Scratch -->
      <button class="scratch-card" @click="startFromScratch">
        <div class="scratch-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <div class="scratch-info">
          <span class="scratch-title">Start from Scratch</span>
          <span class="scratch-subtitle">Build your workout as you go</span>
        </div>
      </button>

      <!-- Plans Section -->
      <div v-if="plansStore.plans.length > 0" class="plans-section">
        <h2 class="section-title">Or choose a plan</h2>
        
        <div v-if="plansStore.isLoading" class="loading">
          <p>Loading plans...</p>
        </div>

        <div v-else class="plans-list">
          <button
            v-for="plan in plansStore.plans"
            :key="plan.id"
            class="plan-card"
            @click="startWithPlan(plan)"
          >
            <div class="plan-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
            </div>
            <div class="plan-info">
              <span class="plan-name">{{ plan.name }}</span>
              <span class="plan-description" v-if="plan.description">{{ plan.description }}</span>
              <span class="plan-exercises">{{ getExerciseCount(plan) }}</span>
              <span class="plan-preview">{{ getExercisePreview(plan) }}</span>
            </div>
            <div class="plan-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </button>
        </div>
      </div>

      <div v-else-if="!plansStore.isLoading" class="no-plans">
        <p>No plans yet. <router-link to="/plans">Create one</router-link> to get started quickly.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.workout-start {
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

.header h1 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.content {
  flex: 1;
  padding: 1.5rem;
}

.intro-text {
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  text-align: center;
}

.scratch-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1.25rem;
  background: rgba(74, 144, 217, 0.1);
  border: 2px solid var(--color-gold);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  margin-bottom: 2rem;
}

.scratch-card:hover {
  background: rgba(74, 144, 217, 0.15);
  transform: translateY(-2px);
}

.scratch-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: var(--color-gold);
  border-radius: 12px;
  color: var(--color-bg-primary);
  flex-shrink: 0;
}

.scratch-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.scratch-title {
  font-family: 'Poppins', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-gold);
}

.scratch-subtitle {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
}

.plans-section {
  margin-top: 0.5rem;
}

.section-title {
  font-family: 'Poppins', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 1rem;
  text-align: center;
}

.loading {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 2rem;
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.plan-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1rem 1.25rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.1);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
}

.plan-card:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.3);
}

.plan-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(74, 144, 217, 0.1);
  border-radius: 10px;
  color: var(--color-gold);
  flex-shrink: 0;
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  flex: 1;
  min-width: 0;
}

.plan-name {
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.plan-description {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan-exercises {
  font-size: 0.75rem;
  color: var(--color-gold);
  font-weight: 500;
}

.plan-preview {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan-arrow {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.no-plans {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.no-plans a {
  color: var(--color-gold);
  text-decoration: none;
}

.no-plans a:hover {
  text-decoration: underline;
}
</style>

