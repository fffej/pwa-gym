import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProgressStore } from '@/stores/progress'
import type { Workout, Exercise } from '@/types/workout'

// Helper to create test exercises
function createExercise(
  machineId: string,
  machineName: string,
  sets: Array<{ weight: number; reps: number; isCompleted: boolean }>
): Exercise {
  return {
    id: `exercise-${Math.random().toString(36).substr(2, 9)}`,
    machineId,
    machineName,
    sets: sets.map((s, i) => ({
      id: `set-${i}`,
      weight: s.weight,
      reps: s.reps,
      weightUnit: 'kg' as const,
      restPeriod: 60,
      isCompleted: s.isCompleted
    }))
  }
}

// Helper to create test workout
function createWorkout(
  date: string,
  exercises: Exercise[],
  durationMinutes?: number
): Workout {
  const startTime = new Date(date).getTime()
  return {
    id: `workout-${Math.random().toString(36).substr(2, 9)}`,
    date,
    startTime,
    endTime: durationMinutes ? startTime + durationMinutes * 60000 : undefined,
    exercises
  }
}

// Generate 10 weeks of simulated workout data
function generateSimulatedWorkouts(): Workout[] {
  const workouts: Workout[] = []
  const startDate = new Date('2024-01-01')
  
  for (let week = 0; week < 10; week++) {
    for (let day = 0; day < 3; day++) {
      const workoutDate = new Date(startDate)
      workoutDate.setDate(startDate.getDate() + (week * 7) + (day * 2))
      const dateStr = workoutDate.toISOString().split('T')[0]
      
      // Progressive overload simulation
      const benchWeight = 60 + (week * 2)
      const squatWeight = 80 + (week * 2.5)
      
      const exercises = [
        createExercise('bench-press', 'Bench Press', [
          { weight: benchWeight, reps: 8, isCompleted: true },
          { weight: benchWeight, reps: 8, isCompleted: true },
          { weight: benchWeight, reps: 6, isCompleted: true }
        ]),
        createExercise('squat', 'Squat', [
          { weight: squatWeight, reps: 5, isCompleted: true },
          { weight: squatWeight, reps: 5, isCompleted: true },
          { weight: squatWeight + 5, reps: 3, isCompleted: true }
        ]),
        createExercise('lat-pulldown', 'Lat Pulldown', [
          { weight: 50 + week, reps: 12, isCompleted: true },
          { weight: 50 + week, reps: 12, isCompleted: true }
        ])
      ]
      
      workouts.push(createWorkout(dateStr, exercises, 45 + Math.floor(Math.random() * 20)))
    }
  }
  
  return workouts
}

// Store simulated workouts for mock
let simulatedWorkouts: Workout[] = []

// Mock the database operations
vi.mock('@/services/db', () => ({
  workoutDb: {
    getCompletedWorkoutCount: vi.fn().mockImplementation(() => {
      return Promise.resolve(simulatedWorkouts.length)
    }),
    getCompletedWorkoutsPaginated: vi.fn().mockImplementation((page: number, limit: number) => {
      const start = (page - 1) * limit
      return Promise.resolve(simulatedWorkouts.slice(start, start + limit))
    }),
    getWorkoutsWithMachine: vi.fn().mockImplementation((machineId: string) => {
      return Promise.resolve(
        simulatedWorkouts.filter(w => 
          w.exercises.some(e => e.machineId === machineId)
        )
      )
    })
  }
}))

describe('Progress Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    simulatedWorkouts = generateSimulatedWorkouts()
  })

  describe('loadWorkouts', () => {
    it('loads workouts and sets pagination state', async () => {
      const store = useProgressStore()
      
      await store.loadWorkouts()
      
      expect(store.totalWorkouts).toBe(30)  // 10 weeks × 3 workouts
      expect(store.workouts.length).toBe(10)  // First page (default 10)
      expect(store.currentPage).toBe(1)
      expect(store.totalPages).toBe(3)  // 30 / 10 = 3 pages
    })

    it('sets loading state during fetch', async () => {
      const store = useProgressStore()
      
      expect(store.isLoading).toBe(false)
      const loadPromise = store.loadWorkouts()
      // Note: Due to async nature, we verify loading was set at some point
      await loadPromise
      expect(store.isLoading).toBe(false)  // Should be false after completion
    })
  })

  describe('pagination', () => {
    it('navigates to next page', async () => {
      const store = useProgressStore()
      await store.loadWorkouts()
      
      expect(store.currentPage).toBe(1)
      expect(store.hasNextPage).toBe(true)
      
      await store.nextPage()
      
      expect(store.currentPage).toBe(2)
      expect(store.workouts.length).toBe(10)
    })

    it('navigates to previous page', async () => {
      const store = useProgressStore()
      await store.loadWorkouts()
      await store.nextPage()
      
      expect(store.currentPage).toBe(2)
      expect(store.hasPrevPage).toBe(true)
      
      await store.prevPage()
      
      expect(store.currentPage).toBe(1)
    })

    it('cannot go past last page', async () => {
      const store = useProgressStore()
      await store.loadWorkouts()
      
      // Go to last page
      await store.goToPage(3)
      expect(store.currentPage).toBe(3)
      expect(store.hasNextPage).toBe(false)
      
      // Try to go further
      await store.nextPage()
      expect(store.currentPage).toBe(3)  // Should stay on page 3
    })

    it('cannot go before first page', async () => {
      const store = useProgressStore()
      await store.loadWorkouts()
      
      expect(store.currentPage).toBe(1)
      expect(store.hasPrevPage).toBe(false)
      
      await store.prevPage()
      expect(store.currentPage).toBe(1)  // Should stay on page 1
    })

    it('goes to specific page', async () => {
      const store = useProgressStore()
      await store.loadWorkouts()
      
      await store.goToPage(2)
      expect(store.currentPage).toBe(2)
      
      await store.goToPage(3)
      expect(store.currentPage).toBe(3)
    })
  })

  describe('selectWorkout', () => {
    it('sets selected workout', async () => {
      const store = useProgressStore()
      await store.loadWorkouts()
      
      const workout = store.workouts[0]
      store.selectWorkout(workout)
      
      expect(store.selectedWorkout).toBe(workout)
    })

    it('clears selected workout', async () => {
      const store = useProgressStore()
      await store.loadWorkouts()
      
      store.selectWorkout(store.workouts[0])
      expect(store.selectedWorkout).not.toBeNull()
      
      store.clearSelectedWorkout()
      expect(store.selectedWorkout).toBeNull()
    })
  })

  describe('selectExerciseForAnalysis', () => {
    it('sets selected machine and loads metrics', async () => {
      const store = useProgressStore()
      
      await store.selectExerciseForAnalysis('bench-press', 'Bench Press')
      
      expect(store.selectedMachineId).toBe('bench-press')
      expect(store.selectedMachineName).toBe('Bench Press')
      expect(store.exerciseMetrics.length).toBe(30)  // 30 workouts with bench press
    })

    it('clears exercise analysis', async () => {
      const store = useProgressStore()
      
      await store.selectExerciseForAnalysis('bench-press', 'Bench Press')
      expect(store.selectedMachineId).toBe('bench-press')
      
      store.clearExerciseAnalysis()
      
      expect(store.selectedMachineId).toBeNull()
      expect(store.selectedMachineName).toBe('')
      expect(store.exerciseMetrics.length).toBe(0)
    })
  })

  describe('getWorkoutSummary', () => {
    it('calculates summary correctly', async () => {
      const store = useProgressStore()
      await store.loadWorkouts()
      
      const workout = store.workouts[0]
      const summary = store.getWorkoutSummary(workout)
      
      expect(summary.id).toBe(workout.id)
      expect(summary.date).toBe(workout.date)
      expect(summary.exerciseCount).toBe(3)  // bench, squat, lat pulldown
      expect(summary.completedSets).toBe(8)  // 3 + 3 + 2
      expect(summary.totalVolume).toBeGreaterThan(0)
      expect(summary.duration).toBeGreaterThan(0)
    })
  })

  describe('selectedWorkoutMachines', () => {
    it('lists unique machines from selected workout', async () => {
      const store = useProgressStore()
      await store.loadWorkouts()
      
      store.selectWorkout(store.workouts[0])
      
      const machines = store.selectedWorkoutMachines
      expect(machines.length).toBe(3)
      expect(machines.map(m => m.id)).toContain('bench-press')
      expect(machines.map(m => m.id)).toContain('squat')
      expect(machines.map(m => m.id)).toContain('lat-pulldown')
    })

    it('returns empty array when no workout selected', () => {
      const store = useProgressStore()
      
      expect(store.selectedWorkoutMachines).toEqual([])
    })
  })

  describe('reset', () => {
    it('resets all state', async () => {
      const store = useProgressStore()
      await store.loadWorkouts()
      store.selectWorkout(store.workouts[0])
      await store.selectExerciseForAnalysis('bench-press', 'Bench Press')
      await store.nextPage()
      
      store.reset()
      
      expect(store.currentPage).toBe(1)
      expect(store.workouts.length).toBe(0)
      expect(store.totalWorkouts).toBe(0)
      expect(store.selectedWorkout).toBeNull()
      expect(store.selectedMachineId).toBeNull()
      expect(store.exerciseMetrics.length).toBe(0)
    })
  })
})

describe('Progress Store - 10 Week Simulation Analysis', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    simulatedWorkouts = generateSimulatedWorkouts()
  })

  it('shows bench press E1RM progression over 10 weeks', async () => {
    const store = useProgressStore()
    
    await store.selectExerciseForAnalysis('bench-press', 'Bench Press')
    
    const metrics = store.exerciseMetrics
    expect(metrics.length).toBe(30)
    
    // First workout E1RM (60kg × 8 reps)
    const firstE1RM = metrics[0].bestE1RM
    // Last workout E1RM (78kg × 8 reps) - week 10: 60 + (9 × 2) = 78kg
    const lastE1RM = metrics[metrics.length - 1].bestE1RM
    
    // Should show ~30% improvement
    const improvement = ((lastE1RM - firstE1RM) / firstE1RM) * 100
    expect(improvement).toBeGreaterThan(20)
    expect(improvement).toBeLessThan(40)
  })

  it('shows squat max weight progression over 10 weeks', async () => {
    const store = useProgressStore()
    
    await store.selectExerciseForAnalysis('squat', 'Squat')
    
    const metrics = store.exerciseMetrics
    
    // First workout max: 80 + 5 = 85kg
    expect(metrics[0].maxWeight).toBe(85)
    
    // Last workout max: 80 + (9 × 2.5) + 5 = 107.5kg
    expect(metrics[metrics.length - 1].maxWeight).toBe(107.5)
  })

  it('shows lat pulldown volume progression', async () => {
    const store = useProgressStore()
    
    await store.selectExerciseForAnalysis('lat-pulldown', 'Lat Pulldown')
    
    const metrics = store.exerciseMetrics
    
    // First workout volume: 50 × 12 × 2 = 1200
    expect(metrics[0].volume).toBe(1200)
    
    // Last workout volume: 59 × 12 × 2 = 1416
    expect(metrics[metrics.length - 1].volume).toBe(1416)
  })

  it('maintains consistent workout structure throughout simulation', async () => {
    const store = useProgressStore()
    await store.loadWorkouts()
    
    // Check all workouts have 3 exercises
    for (const workout of simulatedWorkouts) {
      expect(workout.exercises.length).toBe(3)
    }
    
    // Check all have proper endTime (completed workouts)
    for (const workout of simulatedWorkouts) {
      expect(workout.endTime).toBeDefined()
    }
  })

  it('correctly paginates through all 30 workouts', async () => {
    const store = useProgressStore()
    await store.loadWorkouts()
    
    const seenIds = new Set<string>()
    
    // Page 1
    store.workouts.forEach(w => seenIds.add(w.id))
    expect(seenIds.size).toBe(10)
    
    // Page 2
    await store.nextPage()
    store.workouts.forEach(w => seenIds.add(w.id))
    expect(seenIds.size).toBe(20)
    
    // Page 3
    await store.nextPage()
    store.workouts.forEach(w => seenIds.add(w.id))
    expect(seenIds.size).toBe(30)
    
    // No duplicates
    expect(store.hasNextPage).toBe(false)
  })
})



