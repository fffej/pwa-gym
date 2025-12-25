import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlansStore } from '@/stores/plans'
import type { Plan, PlanExercise } from '@/types/workout'

// Mock the database operations
vi.mock('@/services/db', () => ({
  plansDb: {
    getAllPlans: vi.fn().mockResolvedValue([]),
    getPlan: vi.fn().mockResolvedValue(undefined),
    savePlan: vi.fn().mockResolvedValue(undefined),
    deletePlan: vi.fn().mockResolvedValue(undefined),
    getPlanCount: vi.fn().mockResolvedValue(0),
    seedPlans: vi.fn().mockResolvedValue(undefined),
  },
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

// Mock the default plans data - data must be inlined inside vi.mock due to hoisting
vi.mock('@/data/default-plans.json', () => ({
  default: {
    plans: [
      {
        id: 'test-upper',
        name: 'Test Upper',
        description: 'Test upper body workout',
        exercises: [
          { machineId: 'bench-press' },
          { machineId: 'lat-pulldown', attachmentId: 'wide-bar', grip: 'pronated' }
        ]
      },
      {
        id: 'test-lower',
        name: 'Test Lower',
        description: 'Test lower body workout',
        exercises: [
          { machineId: 'leg-press' }
        ]
      }
    ]
  }
}))

describe('Plans Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initialization', () => {
    it('starts with empty plans array', () => {
      const store = usePlansStore()
      expect(store.plans).toEqual([])
      expect(store.isLoading).toBe(false)
      expect(store.isInitialized).toBe(false)
    })

    it('seeds default plans when DB is empty', async () => {
      const store = usePlansStore()
      await store.initialize()

      expect(store.isInitialized).toBe(true)
      expect(store.plans.length).toBe(2)
      expect(store.plans[0]?.name).toBe('Test Upper')
      expect(store.plans[1]?.name).toBe('Test Lower')
    })

    it('does not re-initialize if already initialized', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      // Manually clear plans to verify initialize doesn't run again
      const originalPlansCount = store.plans.length
      
      await store.initialize()
      expect(store.plans.length).toBe(originalPlansCount)
    })
  })

  describe('getPlanById', () => {
    it('returns undefined for non-existent plan', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      const result = store.getPlanById('non-existent')
      expect(result).toBeUndefined()
    })

    it('returns plan when found', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      const result = store.getPlanById('test-upper')
      expect(result).toBeDefined()
      expect(result?.name).toBe('Test Upper')
    })
  })

  describe('createPlan', () => {
    it('creates a new plan with name and description', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      const initialCount = store.plans.length
      const plan = await store.createPlan('My New Plan', 'My description')
      
      expect(plan.name).toBe('My New Plan')
      expect(plan.description).toBe('My description')
      expect(plan.id).toBeDefined()
      expect(plan.exercises).toEqual([])
      expect(store.plans.length).toBe(initialCount + 1)
    })

    it('creates a plan without description', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      const plan = await store.createPlan('No Description Plan')
      
      expect(plan.name).toBe('No Description Plan')
      expect(plan.description).toBeUndefined()
    })
  })

  describe('updatePlan', () => {
    it('returns null for non-existent plan', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      const result = await store.updatePlan('non-existent', { name: 'Updated' })
      expect(result).toBeNull()
    })

    it('updates plan name', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      const result = await store.updatePlan('test-upper', { name: 'Updated Upper' })
      
      expect(result).toBeDefined()
      expect(result?.name).toBe('Updated Upper')
      expect(store.getPlanById('test-upper')?.name).toBe('Updated Upper')
    })

    it('updates plan exercises', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      const newExercises: PlanExercise[] = [
        { machineId: 'cable-machine', attachmentId: 'rope', grip: 'neutral' }
      ]
      
      const result = await store.updatePlan('test-upper', { exercises: newExercises })
      
      expect(result?.exercises.length).toBe(1)
      expect(result?.exercises[0]?.machineId).toBe('cable-machine')
    })
  })

  describe('deletePlan', () => {
    it('returns false for non-existent plan', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      const result = await store.deletePlan('non-existent')
      expect(result).toBe(false)
    })

    it('removes plan from store', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      const initialCount = store.plans.length
      const result = await store.deletePlan('test-upper')
      
      expect(result).toBe(true)
      expect(store.plans.length).toBe(initialCount - 1)
      expect(store.getPlanById('test-upper')).toBeUndefined()
    })
  })

  describe('addExerciseToPlan', () => {
    it('returns null for non-existent plan', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      const exercise: PlanExercise = { machineId: 'bench-press' }
      const result = await store.addExerciseToPlan('non-existent', exercise)
      
      expect(result).toBeNull()
    })

    it('adds exercise to plan', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      // Create a fresh plan to test with
      const newPlan = await store.createPlan('Add Exercise Test')
      const exercise: PlanExercise = { machineId: 'shoulder-press' }
      
      const result = await store.addExerciseToPlan(newPlan.id, exercise)
      
      expect(result).toBeDefined()
      expect(result?.exercises.length).toBe(1)
      expect(result?.exercises[0]?.machineId).toBe('shoulder-press')
    })
  })

  describe('removeExerciseFromPlan', () => {
    it('returns null for non-existent plan', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      const result = await store.removeExerciseFromPlan('non-existent', 0)
      expect(result).toBeNull()
    })

    it('returns null for invalid index', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      const result = await store.removeExerciseFromPlan('test-upper', -1)
      expect(result).toBeNull()
      
      const result2 = await store.removeExerciseFromPlan('test-upper', 100)
      expect(result2).toBeNull()
    })

    it('removes exercise at index', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      // Create a plan with exercises to test removal
      const newPlan = await store.createPlan('Remove Exercise Test')
      await store.addExerciseToPlan(newPlan.id, { machineId: 'bench-press' })
      await store.addExerciseToPlan(newPlan.id, { machineId: 'lat-pulldown' })
      
      // Now the plan has 2 exercises
      const result = await store.removeExerciseFromPlan(newPlan.id, 0)
      
      expect(result).toBeDefined()
      expect(result?.exercises.length).toBe(1)
      expect(result?.exercises[0]?.machineId).toBe('lat-pulldown')
    })
  })

  describe('reorderExercises', () => {
    it('returns null for non-existent plan', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      const result = await store.reorderExercises('non-existent', 0, 1)
      expect(result).toBeNull()
    })

    it('reorders exercises correctly', async () => {
      const store = usePlansStore()
      await store.initialize()
      
      // Create a plan with exercises to test reordering
      const newPlan = await store.createPlan('Reorder Test')
      await store.addExerciseToPlan(newPlan.id, { machineId: 'bench-press' })
      await store.addExerciseToPlan(newPlan.id, { machineId: 'lat-pulldown' })
      
      // Verify initial order: bench-press at 0, lat-pulldown at 1
      const beforeReorder = store.getPlanById(newPlan.id)
      expect(beforeReorder?.exercises[0]?.machineId).toBe('bench-press')
      expect(beforeReorder?.exercises[1]?.machineId).toBe('lat-pulldown')
      
      const result = await store.reorderExercises(newPlan.id, 0, 1)
      
      expect(result).toBeDefined()
      expect(result?.exercises[0]?.machineId).toBe('lat-pulldown')
      expect(result?.exercises[1]?.machineId).toBe('bench-press')
    })
  })
})

