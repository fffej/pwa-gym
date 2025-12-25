import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Machine, RoomLocation, MuscleGroup } from '@/types/workout'
import machinesData from '@/data/machines.json'

export const useMachinesStore = defineStore('machines', () => {
  const machines = ref<Machine[]>(machinesData.machines as Machine[])

  // Get all unique locations
  const locations = computed<RoomLocation[]>(() => {
    const locs = new Set(machines.value.map(m => m.location))
    return Array.from(locs) as RoomLocation[]
  })

  // Get all unique muscle groups
  const muscleGroups = computed<MuscleGroup[]>(() => {
    const muscles = new Set<MuscleGroup>()
    machines.value.forEach(m => m.muscles.forEach(muscle => muscles.add(muscle)))
    return Array.from(muscles)
  })

  // Get machine by ID
  function getMachineById(id: string): Machine | undefined {
    return machines.value.find(m => m.id === id)
  }

  // Filter machines by location
  function getMachinesByLocation(location: RoomLocation): Machine[] {
    return machines.value.filter(m => m.location === location)
  }

  // Filter machines by muscle group
  function getMachinesByMuscle(muscle: MuscleGroup): Machine[] {
    return machines.value.filter(m => m.muscles.includes(muscle))
  }

  // Search machines by name
  function searchMachines(query: string): Machine[] {
    const lowerQuery = query.toLowerCase()
    return machines.value.filter(m => 
      m.name.toLowerCase().includes(lowerQuery) ||
      m.muscles.some(muscle => muscle.toLowerCase().includes(lowerQuery))
    )
  }

  return {
    machines,
    locations,
    muscleGroups,
    getMachineById,
    getMachinesByLocation,
    getMachinesByMuscle,
    searchMachines
  }
})

