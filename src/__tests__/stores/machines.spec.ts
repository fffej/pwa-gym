import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMachinesStore } from '@/stores/machines'

describe('Machines Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('getMachineById', () => {
    it('returns correct machine for valid ID', () => {
      const store = useMachinesStore()
      const machine = store.getMachineById('bench-press')
      
      expect(machine).toBeDefined()
      expect(machine?.id).toBe('bench-press')
      expect(machine?.name).toBe('Bench Press')
    })

    it('returns undefined for non-existent ID', () => {
      const store = useMachinesStore()
      const machine = store.getMachineById('non-existent-machine')
      
      expect(machine).toBeUndefined()
    })
  })

  describe('getExerciseById', () => {
    it('returns correct exercise for valid ID', () => {
      const store = useMachinesStore()
      const exercise = store.getExerciseById('bench-press-flat')
      
      expect(exercise).toBeDefined()
      expect(exercise?.id).toBe('bench-press-flat')
      expect(exercise?.name).toBe('Flat Bench Press')
    })

    it('returns undefined for non-existent ID', () => {
      const store = useMachinesStore()
      const exercise = store.getExerciseById('non-existent-exercise')
      
      expect(exercise).toBeUndefined()
    })
  })

  describe('getMachinesByLocation', () => {
    it('filters machines by Main Room location', () => {
      const store = useMachinesStore()
      const machines = store.getMachinesByLocation('Main Room')
      
      expect(machines.length).toBeGreaterThan(0)
      expect(machines.every(m => m.location === 'Main Room')).toBe(true)
    })

    it('filters machines by Leg Room location', () => {
      const store = useMachinesStore()
      const machines = store.getMachinesByLocation('Leg Room')
      
      expect(machines.length).toBeGreaterThan(0)
      expect(machines.every(m => m.location === 'Leg Room')).toBe(true)
    })

    it('filters machines by Functional Room location', () => {
      const store = useMachinesStore()
      const machines = store.getMachinesByLocation('Functional Room')
      
      expect(machines.length).toBeGreaterThan(0)
      expect(machines.every(m => m.location === 'Functional Room')).toBe(true)
    })
  })

  describe('getMachinesByMuscle', () => {
    it('filters machines with exercises targeting chest', () => {
      const store = useMachinesStore()
      const machines = store.getMachinesByMuscle('chest')
      
      expect(machines.length).toBeGreaterThan(0)
      // Check that at least one exercise targets chest
      expect(machines.every(m => m.exercises.some(e => e.muscles.includes('chest')))).toBe(true)
    })

    it('filters machines with exercises targeting quadriceps', () => {
      const store = useMachinesStore()
      const machines = store.getMachinesByMuscle('quadriceps')
      
      expect(machines.length).toBeGreaterThan(0)
      expect(machines.every(m => m.exercises.some(e => e.muscles.includes('quadriceps')))).toBe(true)
    })

    it('filters machines with exercises targeting back', () => {
      const store = useMachinesStore()
      const machines = store.getMachinesByMuscle('back')
      
      expect(machines.length).toBeGreaterThan(0)
      expect(machines.every(m => m.exercises.some(e => e.muscles.includes('back')))).toBe(true)
    })
  })

  describe('getExercisesByMuscle', () => {
    it('filters exercises targeting chest', () => {
      const store = useMachinesStore()
      const exercises = store.getExercisesByMuscle('chest')
      
      expect(exercises.length).toBeGreaterThan(0)
      expect(exercises.every(e => e.muscles.includes('chest'))).toBe(true)
    })

    it('includes machine info with exercises', () => {
      const store = useMachinesStore()
      const exercises = store.getExercisesByMuscle('chest')
      
      expect(exercises.length).toBeGreaterThan(0)
      exercises.forEach(e => {
        expect(e.machineId).toBeDefined()
        expect(e.machineName).toBeDefined()
      })
    })
  })

  describe('searchMachines', () => {
    it('finds machine by exact name', () => {
      const store = useMachinesStore()
      const results = store.searchMachines('Bench Press')
      
      expect(results.some(m => m.name === 'Bench Press')).toBe(true)
    })

    it('finds machine by partial name (case insensitive)', () => {
      const store = useMachinesStore()
      const results = store.searchMachines('bench')
      
      expect(results.some(m => m.name.toLowerCase().includes('bench'))).toBe(true)
    })

    it('finds machines by exercise name', () => {
      const store = useMachinesStore()
      const results = store.searchMachines('Tricep Pushdown')
      
      expect(results.length).toBeGreaterThan(0)
    })

    it('returns empty array for no matches', () => {
      const store = useMachinesStore()
      const results = store.searchMachines('xyznonsense123')
      
      expect(results).toEqual([])
    })

    it('search is case insensitive', () => {
      const store = useMachinesStore()
      const upperResults = store.searchMachines('LAT PULLDOWN')
      const lowerResults = store.searchMachines('lat pulldown')
      
      expect(upperResults).toEqual(lowerResults)
    })
  })

  describe('searchExercises', () => {
    it('finds exercise by name', () => {
      const store = useMachinesStore()
      const results = store.searchExercises('Flat Bench Press')
      
      expect(results.some(e => e.name === 'Flat Bench Press')).toBe(true)
    })

    it('finds exercises by muscle group', () => {
      const store = useMachinesStore()
      const results = store.searchExercises('chest')
      
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(e => e.muscles.includes('chest'))).toBe(true)
    })
  })

  describe('computed properties', () => {
    it('locations returns all unique locations', () => {
      const store = useMachinesStore()
      
      expect(store.locations).toContain('Main Room')
      expect(store.locations).toContain('Leg Room')
      expect(store.locations).toContain('Functional Room')
      expect(store.locations.length).toBe(3)
    })

    it('muscleGroups returns unique muscle groups from exercises', () => {
      const store = useMachinesStore()
      
      expect(store.muscleGroups.length).toBeGreaterThan(0)
      // Check for some expected muscle groups
      expect(store.muscleGroups).toContain('chest')
      expect(store.muscleGroups).toContain('back')
      expect(store.muscleGroups).toContain('quadriceps')
    })

    it('allExercises returns flattened list with machine info', () => {
      const store = useMachinesStore()
      
      expect(store.allExercises.length).toBeGreaterThan(0)
      store.allExercises.forEach(e => {
        expect(e.id).toBeDefined()
        expect(e.name).toBeDefined()
        expect(e.machineId).toBeDefined()
        expect(e.machineName).toBeDefined()
      })
    })
  })

  describe('machines data', () => {
    it('has machines loaded', () => {
      const store = useMachinesStore()
      expect(store.machines.length).toBeGreaterThan(0)
    })

    it('each machine has exercises', () => {
      const store = useMachinesStore()
      store.machines.forEach(m => {
        expect(m.exercises.length).toBeGreaterThan(0)
      })
    })
  })

  describe('custom exercise operations', () => {
    // Note: These tests verify the store has the methods available
    // Full integration tests with IndexedDB would require a proper mock setup
    
    it('store has addCustomExercise method', () => {
      const store = useMachinesStore()
      expect(typeof store.addCustomExercise).toBe('function')
    })

    it('store has removeCustomExercise method', () => {
      const store = useMachinesStore()
      expect(typeof store.removeCustomExercise).toBe('function')
    })

    it('store has updateCustomExercise method', () => {
      const store = useMachinesStore()
      expect(typeof store.updateCustomExercise).toBe('function')
    })
  })
})
