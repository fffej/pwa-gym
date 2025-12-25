import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Workout } from '@/types/workout'
import { workoutDb } from '@/services/db'
import { 
  calculateTotalVolume, 
  calculateWorkoutDuration,
  countCompletedSets,
  getExerciseProgressMetrics,
  type ExerciseMetrics
} from '@/utils/metrics'
import type { E1RMFormula } from '@/utils/e1rm'

export const useProgressStore = defineStore('progress', () => {
  // Pagination state
  const currentPage = ref(1)
  const pageSize = ref(10)
  const totalWorkouts = ref(0)
  const workouts = ref<Workout[]>([])
  const isLoading = ref(false)
  
  // Selected workout for detail view
  const selectedWorkout = ref<Workout | null>(null)
  
  // Selected exercise for analysis
  const selectedMachineId = ref<string | null>(null)
  const selectedMachineName = ref<string>('')
  
  // Exercise metrics cache
  const exerciseMetrics = ref<ExerciseMetrics[]>([])

  // Computed properties
  const totalPages = computed(() => Math.ceil(totalWorkouts.value / pageSize.value))
  const hasNextPage = computed(() => currentPage.value < totalPages.value)
  const hasPrevPage = computed(() => currentPage.value > 1)

  // Load workouts for current page
  async function loadWorkouts() {
    isLoading.value = true
    try {
      totalWorkouts.value = await workoutDb.getCompletedWorkoutCount()
      workouts.value = await workoutDb.getCompletedWorkoutsPaginated(
        currentPage.value,
        pageSize.value
      )
    } finally {
      isLoading.value = false
    }
  }

  // Navigate to next page
  async function nextPage() {
    if (hasNextPage.value) {
      currentPage.value++
      await loadWorkouts()
    }
  }

  // Navigate to previous page
  async function prevPage() {
    if (hasPrevPage.value) {
      currentPage.value--
      await loadWorkouts()
    }
  }

  // Go to specific page
  async function goToPage(page: number) {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
      await loadWorkouts()
    }
  }

  // Select a workout for detail view
  function selectWorkout(workout: Workout) {
    selectedWorkout.value = workout
  }

  // Clear selected workout
  function clearSelectedWorkout() {
    selectedWorkout.value = null
  }

  // Select exercise/machine for analysis
  async function selectExerciseForAnalysis(machineId: string, machineName: string, formula: E1RMFormula = 'brzycki') {
    selectedMachineId.value = machineId
    selectedMachineName.value = machineName
    
    // Load all workouts for this machine to build progress chart
    const machineWorkouts = await workoutDb.getWorkoutsWithMachine(machineId)
    
    // Sort by date ascending for proper chart display
    machineWorkouts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Calculate metrics
    exerciseMetrics.value = getExerciseProgressMetrics(machineWorkouts, machineId, formula)
  }

  // Clear exercise analysis
  function clearExerciseAnalysis() {
    selectedMachineId.value = null
    selectedMachineName.value = ''
    exerciseMetrics.value = []
  }

  // Reset store state
  function reset() {
    currentPage.value = 1
    workouts.value = []
    totalWorkouts.value = 0
    selectedWorkout.value = null
    selectedMachineId.value = null
    selectedMachineName.value = ''
    exerciseMetrics.value = []
  }

  // Helper functions for workout summaries
  function getWorkoutSummary(workout: Workout) {
    return {
      id: workout.id,
      date: workout.date,
      exerciseCount: workout.exercises.length,
      totalVolume: calculateTotalVolume(workout.exercises),
      duration: calculateWorkoutDuration(workout),
      completedSets: countCompletedSets(workout.exercises)
    }
  }

  // Get unique machines from selected workout
  const selectedWorkoutMachines = computed(() => {
    if (!selectedWorkout.value) return []
    
    const machines = new Map<string, { id: string; name: string; count: number }>()
    
    for (const exercise of selectedWorkout.value.exercises) {
      const existing = machines.get(exercise.machineId)
      if (existing) {
        existing.count++
      } else {
        machines.set(exercise.machineId, {
          id: exercise.machineId,
          name: exercise.machineName,
          count: 1
        })
      }
    }
    
    return Array.from(machines.values())
  })

  return {
    // State
    currentPage,
    pageSize,
    totalWorkouts,
    workouts,
    isLoading,
    selectedWorkout,
    selectedMachineId,
    selectedMachineName,
    exerciseMetrics,
    
    // Computed
    totalPages,
    hasNextPage,
    hasPrevPage,
    selectedWorkoutMachines,
    
    // Actions
    loadWorkouts,
    nextPage,
    prevPage,
    goToPage,
    selectWorkout,
    clearSelectedWorkout,
    selectExerciseForAnalysis,
    clearExerciseAnalysis,
    reset,
    getWorkoutSummary
  }
})

