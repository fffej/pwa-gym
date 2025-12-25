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
    it('filters machines targeting chest', () => {
      const store = useMachinesStore()
      const machines = store.getMachinesByMuscle('chest')
      
      expect(machines.length).toBeGreaterThan(0)
      expect(machines.every(m => m.muscles.includes('chest'))).toBe(true)
    })

    it('filters machines targeting quadriceps', () => {
      const store = useMachinesStore()
      const machines = store.getMachinesByMuscle('quadriceps')
      
      expect(machines.length).toBeGreaterThan(0)
      expect(machines.every(m => m.muscles.includes('quadriceps'))).toBe(true)
    })

    it('filters machines targeting back', () => {
      const store = useMachinesStore()
      const machines = store.getMachinesByMuscle('back')
      
      expect(machines.length).toBeGreaterThan(0)
      expect(machines.every(m => m.muscles.includes('back'))).toBe(true)
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

    it('finds machines by muscle group', () => {
      const store = useMachinesStore()
      const results = store.searchMachines('chest')
      
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(m => m.muscles.includes('chest'))).toBe(true)
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

  describe('computed properties', () => {
    it('locations returns all unique locations', () => {
      const store = useMachinesStore()
      
      expect(store.locations).toContain('Main Room')
      expect(store.locations).toContain('Leg Room')
      expect(store.locations).toContain('Functional Room')
      expect(store.locations.length).toBe(3)
    })

    it('muscleGroups returns unique muscle groups', () => {
      const store = useMachinesStore()
      
      expect(store.muscleGroups.length).toBeGreaterThan(0)
      // Check for some expected muscle groups
      expect(store.muscleGroups).toContain('chest')
      expect(store.muscleGroups).toContain('back')
      expect(store.muscleGroups).toContain('quadriceps')
    })
  })

  describe('machines data', () => {
    it('has machines loaded', () => {
      const store = useMachinesStore()
      expect(store.machines.length).toBeGreaterThan(0)
    })
  })
})

