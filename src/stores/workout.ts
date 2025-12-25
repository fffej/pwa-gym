import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import type { Workout, Exercise, WorkoutSet, GripType } from '@/types/workout'
import { workoutDb, machineDefaultsDb } from '@/services/db'
import { useSettingsStore } from './settings'
import { useMachinesStore } from './machines'

export const useWorkoutStore = defineStore('workout', () => {
  const activeWorkout = ref<Workout | null>(null)
  const isWorkoutActive = computed(() => activeWorkout.value !== null)

  // Generate unique IDs
  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Start a new workout
  function startWorkout(): Workout {
    const now = Date.now()
    const dateStr = new Date(now).toISOString().split('T')[0]
    const workout: Workout = {
      id: generateId(),
      date: dateStr ?? new Date(now).toLocaleDateString('en-CA'),
      startTime: now,
      exercises: []
    }
    activeWorkout.value = workout
    return workout
  }

  // Add an exercise to the active workout
  async function addExercise(
    machineId: string, 
    attachmentId?: string, 
    grip?: GripType
  ): Promise<Exercise | null> {
    if (!activeWorkout.value) return null

    const machinesStore = useMachinesStore()
    const settingsStore = useSettingsStore()
    const machine = machinesStore.getMachineById(machineId)
    if (!machine) return null

    // Get smart defaults from previous usage
    const defaults = await machineDefaultsDb.getDefaults(machineId)
    const defaultWeight = defaults?.lastWeight ?? 0
    const defaultUnit = defaults?.lastWeightUnit ?? settingsStore.settings.defaultWeightUnit
    const defaultReps = defaults?.lastReps ?? 10

    const exercise: Exercise = {
      id: generateId(),
      machineId,
      machineName: machine.name,
      attachmentId: attachmentId ?? defaults?.lastAttachmentId,
      grip: grip ?? defaults?.lastGrip,
      sets: [{
        id: generateId(),
        reps: defaultReps,
        weight: defaultWeight,
        weightUnit: defaultUnit,
        restPeriod: machine.defaultRestPeriod ?? settingsStore.settings.defaultRestPeriod,
        isCompleted: false
      }]
    }

    activeWorkout.value.exercises.push(exercise)
    return exercise
  }

  // Remove an exercise from the workout
  function removeExercise(exerciseId: string): void {
    if (!activeWorkout.value) return
    activeWorkout.value.exercises = activeWorkout.value.exercises.filter(
      e => e.id !== exerciseId
    )
  }

  // Add a set to an exercise
  function addSet(exerciseId: string): WorkoutSet | null {
    if (!activeWorkout.value) return null
    
    const exercise = activeWorkout.value.exercises.find(e => e.id === exerciseId)
    if (!exercise) return null

    const settingsStore = useSettingsStore()
    
    // Copy values from previous set if exists
    const lastSet = exercise.sets[exercise.sets.length - 1]
    const newSet: WorkoutSet = {
      id: generateId(),
      reps: lastSet?.reps ?? 10,
      weight: lastSet?.weight ?? 0,
      weightUnit: lastSet?.weightUnit ?? settingsStore.settings.defaultWeightUnit,
      restPeriod: lastSet?.restPeriod ?? settingsStore.settings.defaultRestPeriod,
      isCompleted: false
    }

    exercise.sets.push(newSet)
    return newSet
  }

  // Remove a set from an exercise
  function removeSet(exerciseId: string, setId: string): void {
    if (!activeWorkout.value) return
    
    const exercise = activeWorkout.value.exercises.find(e => e.id === exerciseId)
    if (!exercise) return

    exercise.sets = exercise.sets.filter(s => s.id !== setId)
  }

  // Update a set
  function updateSet(
    exerciseId: string, 
    setId: string, 
    updates: Partial<WorkoutSet>
  ): void {
    if (!activeWorkout.value) return
    
    const exercise = activeWorkout.value.exercises.find(e => e.id === exerciseId)
    if (!exercise) return

    const set = exercise.sets.find(s => s.id === setId)
    if (!set) return

    Object.assign(set, updates)
  }

  // Mark a set as completed
  async function completeSet(exerciseId: string, setId: string): Promise<void> {
    if (!activeWorkout.value) return
    
    const exercise = activeWorkout.value.exercises.find(e => e.id === exerciseId)
    if (!exercise) return

    const set = exercise.sets.find(s => s.id === setId)
    if (!set) return

    set.isCompleted = true
    set.completedAt = Date.now()

    // Update machine defaults for smart suggestions
    await machineDefaultsDb.updateDefaults({
      machineId: exercise.machineId,
      lastWeight: set.weight,
      lastWeightUnit: set.weightUnit,
      lastReps: set.reps,
      lastAttachmentId: exercise.attachmentId,
      lastGrip: exercise.grip
    })
  }

  // Finish and save the workout
  async function finishWorkout(): Promise<Workout | null> {
    if (!activeWorkout.value) return null

    activeWorkout.value.endTime = Date.now()
    
    // Convert reactive object to plain object for IndexedDB storage
    const workoutToSave: Workout = JSON.parse(JSON.stringify(toRaw(activeWorkout.value)))
    
    // Save to IndexedDB
    await workoutDb.saveWorkout(workoutToSave)
    
    const finishedWorkout = activeWorkout.value
    activeWorkout.value = null
    
    return finishedWorkout
  }

  // Discard the current workout without saving
  function discardWorkout(): void {
    activeWorkout.value = null
  }

  // Get exercise by ID
  function getExercise(exerciseId: string): Exercise | undefined {
    return activeWorkout.value?.exercises.find(e => e.id === exerciseId)
  }

  // Get total sets completed in workout
  const totalSetsCompleted = computed(() => {
    if (!activeWorkout.value) return 0
    return activeWorkout.value.exercises.reduce(
      (sum, ex) => sum + ex.sets.filter(s => s.isCompleted).length,
      0
    )
  })

  // Get total volume (weight × reps) for workout
  const totalVolume = computed(() => {
    if (!activeWorkout.value) return 0
    return activeWorkout.value.exercises.reduce((sum, ex) => {
      return sum + ex.sets.reduce((setSum, set) => {
        if (set.isCompleted) {
          return setSum + (set.weight * set.reps)
        }
        return setSum
      }, 0)
    }, 0)
  })

  return {
    activeWorkout,
    isWorkoutActive,
    startWorkout,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    completeSet,
    finishWorkout,
    discardWorkout,
    getExercise,
    totalSetsCompleted,
    totalVolume
  }
})

