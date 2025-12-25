import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkoutStore } from '@/stores/workout'
import type { Exercise } from '@/types/workout'

// Mock the database operations
vi.mock('@/services/db', () => ({
  workoutDb: {
    saveWorkout: vi.fn().mockResolvedValue(undefined),
    getWorkout: vi.fn().mockResolvedValue(undefined),
    getAllWorkouts: vi.fn().mockResolvedValue([]),
  },
  machineDefaultsDb: {
    getDefaults: vi.fn().mockResolvedValue(undefined),
    updateDefaults: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('Workout Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('startWorkout', () => {
    it('creates a workout with correct structure', () => {
      const store = useWorkoutStore()
      const workout = store.startWorkout()

      expect(workout).toBeDefined()
      expect(workout.id).toBeDefined()
      expect(workout.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(workout.startTime).toBeDefined()
      expect(workout.exercises).toEqual([])
    })

    it('sets isWorkoutActive to true', () => {
      const store = useWorkoutStore()
      expect(store.isWorkoutActive).toBe(false)
      
      store.startWorkout()
      expect(store.isWorkoutActive).toBe(true)
    })

    it('stores the workout in activeWorkout', () => {
      const store = useWorkoutStore()
      const workout = store.startWorkout()
      
      expect(store.activeWorkout?.id).toBe(workout.id)
      expect(store.activeWorkout?.date).toBe(workout.date)
    })
  })

  describe('addSet', () => {
    it('returns null when no active workout', () => {
      const store = useWorkoutStore()
      const result = store.addSet('some-exercise-id')
      expect(result).toBeNull()
    })

    it('returns null when exercise does not exist', () => {
      const store = useWorkoutStore()
      store.startWorkout()
      const result = store.addSet('non-existent-id')
      expect(result).toBeNull()
    })
  })

  describe('removeSet', () => {
    it('does nothing when no active workout', () => {
      const store = useWorkoutStore()
      // Should not throw
      expect(() => store.removeSet('ex-id', 'set-id')).not.toThrow()
    })
  })

  describe('updateSet', () => {
    it('does nothing when no active workout', () => {
      const store = useWorkoutStore()
      // Should not throw
      expect(() => store.updateSet('ex-id', 'set-id', { reps: 10 })).not.toThrow()
    })
  })

  describe('removeExercise', () => {
    it('does nothing when no active workout', () => {
      const store = useWorkoutStore()
      // Should not throw
      expect(() => store.removeExercise('some-id')).not.toThrow()
    })
  })

  describe('getExercise', () => {
    it('returns undefined when no active workout', () => {
      const store = useWorkoutStore()
      const result = store.getExercise('some-id')
      expect(result).toBeUndefined()
    })
  })

  describe('discardWorkout', () => {
    it('clears the active workout', () => {
      const store = useWorkoutStore()
      store.startWorkout()
      expect(store.isWorkoutActive).toBe(true)

      store.discardWorkout()
      expect(store.isWorkoutActive).toBe(false)
      expect(store.activeWorkout).toBeNull()
    })
  })

  describe('totalSetsCompleted', () => {
    it('returns 0 when no active workout', () => {
      const store = useWorkoutStore()
      expect(store.totalSetsCompleted).toBe(0)
    })

    it('counts only completed sets', () => {
      const store = useWorkoutStore()
      store.startWorkout()

      // Manually add exercises with sets for testing
      const exercise: Exercise = {
        id: 'test-ex',
        machineId: 'bench-press',
        machineName: 'Bench Press',
        sets: [
          { id: 'set1', reps: 10, weight: 50, weightUnit: 'kg', restPeriod: 60, isCompleted: true },
          { id: 'set2', reps: 10, weight: 50, weightUnit: 'kg', restPeriod: 60, isCompleted: false },
          { id: 'set3', reps: 10, weight: 50, weightUnit: 'kg', restPeriod: 60, isCompleted: true },
        ]
      }
      store.activeWorkout!.exercises.push(exercise)

      expect(store.totalSetsCompleted).toBe(2)
    })
  })

  describe('totalVolume', () => {
    it('returns 0 when no active workout', () => {
      const store = useWorkoutStore()
      expect(store.totalVolume).toBe(0)
    })

    it('calculates volume as weight * reps for completed sets only', () => {
      const store = useWorkoutStore()
      store.startWorkout()

      const exercise: Exercise = {
        id: 'test-ex',
        machineId: 'bench-press',
        machineName: 'Bench Press',
        sets: [
          { id: 'set1', reps: 10, weight: 50, weightUnit: 'kg', restPeriod: 60, isCompleted: true },  // 500
          { id: 'set2', reps: 8, weight: 60, weightUnit: 'kg', restPeriod: 60, isCompleted: false },  // 0 (not completed)
          { id: 'set3', reps: 12, weight: 40, weightUnit: 'kg', restPeriod: 60, isCompleted: true },  // 480
        ]
      }
      store.activeWorkout!.exercises.push(exercise)

      expect(store.totalVolume).toBe(500 + 480)
    })

    it('sums volume across multiple exercises', () => {
      const store = useWorkoutStore()
      store.startWorkout()

      const exercise1: Exercise = {
        id: 'ex1',
        machineId: 'bench-press',
        machineName: 'Bench Press',
        sets: [
          { id: 'set1', reps: 10, weight: 50, weightUnit: 'kg', restPeriod: 60, isCompleted: true },  // 500
        ]
      }
      const exercise2: Exercise = {
        id: 'ex2',
        machineId: 'squat',
        machineName: 'Squat',
        sets: [
          { id: 'set2', reps: 5, weight: 100, weightUnit: 'kg', restPeriod: 90, isCompleted: true },  // 500
        ]
      }
      store.activeWorkout!.exercises.push(exercise1, exercise2)

      expect(store.totalVolume).toBe(1000)
    })
  })

  describe('finishWorkout', () => {
    it('returns null when no active workout', async () => {
      const store = useWorkoutStore()
      const result = await store.finishWorkout()
      expect(result).toBeNull()
    })

    it('sets endTime and clears active workout', async () => {
      const store = useWorkoutStore()
      store.startWorkout()
      
      const beforeFinish = Date.now()
      const finishedWorkout = await store.finishWorkout()
      const afterFinish = Date.now()

      expect(finishedWorkout).toBeDefined()
      expect(finishedWorkout!.endTime).toBeGreaterThanOrEqual(beforeFinish)
      expect(finishedWorkout!.endTime).toBeLessThanOrEqual(afterFinish)
      expect(store.activeWorkout).toBeNull()
      expect(store.isWorkoutActive).toBe(false)
    })
  })
})

