import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Machine, RoomLocation, MuscleGroup, MachineExercise, UserMachineCustomization, Attachment } from '@/types/workout'
import { 
  globalMachinesApi, 
  userCustomizationsApi, 
  mergeMachinesWithCustomizations 
} from '@/services/machines-api'
import { machineCustomizationsDb } from '@/services/db'
import machinesData from '@/data/machines.json'

export const useMachinesStore = defineStore('machines', () => {
  // State
  const machines = ref<Machine[]>(machinesData.machines as Machine[])
  const customizations = ref<UserMachineCustomization[]>([])
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const currentUserId = ref<string | null>(null)

  // Merged machines (global + user customizations)
  const mergedMachines = computed(() => {
    return mergeMachinesWithCustomizations(machines.value, customizations.value)
  })

  // Get all unique locations
  const locations = computed<RoomLocation[]>(() => {
    const locs = new Set(mergedMachines.value.map(m => m.location))
    return Array.from(locs) as RoomLocation[]
  })

  // Get all unique muscle groups (from exercises)
  const muscleGroups = computed<MuscleGroup[]>(() => {
    const muscles = new Set<MuscleGroup>()
    mergedMachines.value.forEach(m => {
      m.exercises.forEach(ex => {
        ex.muscles.forEach(muscle => muscles.add(muscle))
      })
    })
    return Array.from(muscles)
  })

  // Get all exercises across all machines (flattened)
  const allExercises = computed(() => {
    const exercises: Array<MachineExercise & { machineId: string; machineName: string }> = []
    mergedMachines.value.forEach(machine => {
      machine.exercises.forEach(exercise => {
        exercises.push({
          ...exercise,
          machineId: machine.id,
          machineName: machine.name
        })
      })
    })
    return exercises
  })

  // Initialize store - fetch from Firestore
  async function initialize(userId?: string): Promise<void> {
    if (isInitialized.value && currentUserId.value === userId) return
    
    isLoading.value = true
    currentUserId.value = userId ?? null
    
    try {
      // Fetch global machines from Firestore (or local fallback)
      const fetchedMachines = await globalMachinesApi.fetchAllMachines()
      machines.value = fetchedMachines
      
      // If user is logged in, fetch their customizations
      if (userId) {
        const fetchedCustomizations = await userCustomizationsApi.fetchAllCustomizations(userId)
        customizations.value = fetchedCustomizations
      } else {
        // Load from local IndexedDB for offline/anonymous use
        customizations.value = await machineCustomizationsDb.getAllCustomizations()
      }
      
      isInitialized.value = true
    } catch (error) {
      console.error('Failed to initialize machines store:', error)
      // Keep using local data as fallback
    } finally {
      isLoading.value = false
    }
  }

  // Refresh machines from Firestore
  async function refresh(): Promise<void> {
    isLoading.value = true
    try {
      machines.value = await globalMachinesApi.fetchAllMachines()
      
      if (currentUserId.value) {
        customizations.value = await userCustomizationsApi.fetchAllCustomizations(currentUserId.value)
      }
    } finally {
      isLoading.value = false
    }
  }

  // Get machine by ID (returns merged version)
  function getMachineById(id: string): Machine | undefined {
    return mergedMachines.value.find(m => m.id === id)
  }

  // Get exercise by ID
  function getExerciseById(exerciseId: string): (MachineExercise & { machineId: string; machineName: string }) | undefined {
    return allExercises.value.find(e => e.id === exerciseId)
  }

  // Get exercises for a specific machine
  function getExercisesForMachine(machineId: string): MachineExercise[] {
    const machine = getMachineById(machineId)
    return machine?.exercises ?? []
  }

  // Filter machines by location
  function getMachinesByLocation(location: RoomLocation): Machine[] {
    return mergedMachines.value.filter(m => m.location === location)
  }

  // Filter machines by muscle group (checks exercises)
  function getMachinesByMuscle(muscle: MuscleGroup): Machine[] {
    return mergedMachines.value.filter(m => 
      m.exercises.some(ex => ex.muscles.includes(muscle))
    )
  }

  // Get exercises by muscle group
  function getExercisesByMuscle(muscle: MuscleGroup): Array<MachineExercise & { machineId: string; machineName: string }> {
    return allExercises.value.filter(ex => ex.muscles.includes(muscle))
  }

  // Search machines by name
  function searchMachines(query: string): Machine[] {
    const lowerQuery = query.toLowerCase()
    return mergedMachines.value.filter(m => 
      m.name.toLowerCase().includes(lowerQuery) ||
      m.exercises.some(ex => 
        ex.name.toLowerCase().includes(lowerQuery) ||
        ex.muscles.some(muscle => muscle.toLowerCase().includes(lowerQuery))
      )
    )
  }

  // Search exercises
  function searchExercises(query: string): Array<MachineExercise & { machineId: string; machineName: string }> {
    const lowerQuery = query.toLowerCase()
    return allExercises.value.filter(ex => 
      ex.name.toLowerCase().includes(lowerQuery) ||
      ex.muscles.some(muscle => muscle.toLowerCase().includes(lowerQuery))
    )
  }

  // Add a custom exercise to a machine
  async function addCustomExercise(machineId: string, exercise: MachineExercise): Promise<void> {
    if (currentUserId.value) {
      await userCustomizationsApi.addCustomExercise(currentUserId.value, machineId, exercise)
      // Refresh customizations
      customizations.value = await userCustomizationsApi.fetchAllCustomizations(currentUserId.value)
    } else {
      // Save to local IndexedDB only
      const existing = await machineCustomizationsDb.getCustomization(machineId)
      const customization: UserMachineCustomization = {
        machineId,
        customExercises: [...(existing?.customExercises ?? []), { ...exercise, isCustom: true }],
        customAttachments: existing?.customAttachments ?? [],
        overrides: existing?.overrides ?? {},
        updatedAt: Date.now()
      }
      await machineCustomizationsDb.saveCustomization(customization)
      customizations.value = await machineCustomizationsDb.getAllCustomizations()
    }
  }

  // Remove a custom exercise
  async function removeCustomExercise(machineId: string, exerciseId: string): Promise<void> {
    if (currentUserId.value) {
      await userCustomizationsApi.removeCustomExercise(currentUserId.value, machineId, exerciseId)
      customizations.value = await userCustomizationsApi.fetchAllCustomizations(currentUserId.value)
    } else {
      const existing = await machineCustomizationsDb.getCustomization(machineId)
      if (existing) {
        existing.customExercises = existing.customExercises.filter(e => e.id !== exerciseId)
        await machineCustomizationsDb.saveCustomization(existing)
        customizations.value = await machineCustomizationsDb.getAllCustomizations()
      }
    }
  }

  // Update a custom exercise
  async function updateCustomExercise(machineId: string, exercise: MachineExercise): Promise<void> {
    if (currentUserId.value) {
      // For Firestore: remove old and add updated version
      await userCustomizationsApi.removeCustomExercise(currentUserId.value, machineId, exercise.id)
      await userCustomizationsApi.addCustomExercise(currentUserId.value, machineId, exercise)
      customizations.value = await userCustomizationsApi.fetchAllCustomizations(currentUserId.value)
    } else {
      const existing = await machineCustomizationsDb.getCustomization(machineId)
      if (existing) {
        const index = existing.customExercises.findIndex(e => e.id === exercise.id)
        if (index >= 0) {
          existing.customExercises[index] = { ...exercise, isCustom: true }
          existing.updatedAt = Date.now()
          await machineCustomizationsDb.saveCustomization(existing)
          customizations.value = await machineCustomizationsDb.getAllCustomizations()
        }
      }
    }
  }

  // Add a custom attachment
  async function addCustomAttachment(machineId: string, attachment: Attachment): Promise<void> {
    if (currentUserId.value) {
      await userCustomizationsApi.addCustomAttachment(currentUserId.value, machineId, attachment)
      customizations.value = await userCustomizationsApi.fetchAllCustomizations(currentUserId.value)
    } else {
      const existing = await machineCustomizationsDb.getCustomization(machineId)
      const customization: UserMachineCustomization = {
        machineId,
        customExercises: existing?.customExercises ?? [],
        customAttachments: [...(existing?.customAttachments ?? []), attachment],
        overrides: existing?.overrides ?? {},
        updatedAt: Date.now()
      }
      await machineCustomizationsDb.saveCustomization(customization)
      customizations.value = await machineCustomizationsDb.getAllCustomizations()
    }
  }

  // Remove a custom attachment
  async function removeCustomAttachment(machineId: string, attachmentId: string): Promise<void> {
    if (currentUserId.value) {
      await userCustomizationsApi.removeCustomAttachment(currentUserId.value, machineId, attachmentId)
      customizations.value = await userCustomizationsApi.fetchAllCustomizations(currentUserId.value)
    } else {
      const existing = await machineCustomizationsDb.getCustomization(machineId)
      if (existing) {
        existing.customAttachments = existing.customAttachments.filter(a => a.id !== attachmentId)
        await machineCustomizationsDb.saveCustomization(existing)
        customizations.value = await machineCustomizationsDb.getAllCustomizations()
      }
    }
  }

  // Update machine overrides
  async function updateMachineOverrides(
    machineId: string, 
    overrides: UserMachineCustomization['overrides']
  ): Promise<void> {
    if (currentUserId.value) {
      await userCustomizationsApi.updateOverrides(currentUserId.value, machineId, overrides)
      customizations.value = await userCustomizationsApi.fetchAllCustomizations(currentUserId.value)
    } else {
      const existing = await machineCustomizationsDb.getCustomization(machineId)
      const customization: UserMachineCustomization = {
        machineId,
        customExercises: existing?.customExercises ?? [],
        customAttachments: existing?.customAttachments ?? [],
        overrides: { ...existing?.overrides, ...overrides },
        updatedAt: Date.now()
      }
      await machineCustomizationsDb.saveCustomization(customization)
      customizations.value = await machineCustomizationsDb.getAllCustomizations()
    }
  }

  return {
    // State
    machines: mergedMachines,
    isLoading,
    isInitialized,
    
    // Computed
    locations,
    muscleGroups,
    allExercises,
    
    // Actions
    initialize,
    refresh,
    getMachineById,
    getExerciseById,
    getExercisesForMachine,
    getMachinesByLocation,
    getMachinesByMuscle,
    getExercisesByMuscle,
    searchMachines,
    searchExercises,
    
    // Customization actions
    addCustomExercise,
    removeCustomExercise,
    updateCustomExercise,
    addCustomAttachment,
    removeCustomAttachment,
    updateMachineOverrides
  }
})
