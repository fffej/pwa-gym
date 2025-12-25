import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Plan, PlanExercise } from '@/types/workout'
import { plansDb } from '@/services/db'
import defaultPlansData from '@/data/default-plans.json'

export const usePlansStore = defineStore('plans', () => {
  const plans = ref<Plan[]>([])
  const isLoading = ref(false)
  const isInitialized = ref(false)

  // Generate unique IDs
  function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Initialize store - load plans from DB, seed if empty
  async function initialize(): Promise<void> {
    if (isInitialized.value) return
    
    isLoading.value = true
    try {
      // Check if we have any plans in the database
      const existingPlans = await plansDb.getAllPlans()
      
      if (existingPlans.length === 0) {
        // Seed with default plans
        await plansDb.seedPlans(defaultPlansData.plans as Plan[])
        plans.value = defaultPlansData.plans as Plan[]
      } else {
        plans.value = existingPlans
      }
      
      isInitialized.value = true
    } finally {
      isLoading.value = false
    }
  }

  // Refresh plans from database
  async function refreshPlans(): Promise<void> {
    isLoading.value = true
    try {
      plans.value = await plansDb.getAllPlans()
    } finally {
      isLoading.value = false
    }
  }

  // Get a plan by ID
  function getPlanById(id: string): Plan | undefined {
    return plans.value.find(p => p.id === id)
  }

  // Create a new plan
  async function createPlan(name: string, description?: string): Promise<Plan> {
    const plan: Plan = {
      id: generateId(),
      name,
      description,
      exercises: []
    }
    
    await plansDb.savePlan(plan)
    plans.value.push(plan)
    
    return plan
  }

  // Update a plan
  async function updatePlan(id: string, updates: Partial<Omit<Plan, 'id'>>): Promise<Plan | null> {
    const planIndex = plans.value.findIndex(p => p.id === id)
    if (planIndex === -1) return null
    
    const existingPlan = plans.value[planIndex]
    if (!existingPlan) return null
    
    const updatedPlan: Plan = {
      ...existingPlan,
      ...updates
    }
    
    await plansDb.savePlan(updatedPlan)
    plans.value[planIndex] = updatedPlan
    
    return updatedPlan
  }

  // Delete a plan
  async function deletePlan(id: string): Promise<boolean> {
    const planIndex = plans.value.findIndex(p => p.id === id)
    if (planIndex === -1) return false
    
    await plansDb.deletePlan(id)
    plans.value.splice(planIndex, 1)
    
    return true
  }

  // Add an exercise to a plan
  async function addExerciseToPlan(
    planId: string, 
    exercise: PlanExercise
  ): Promise<Plan | null> {
    const plan = getPlanById(planId)
    if (!plan) return null
    
    const updatedExercises = [...plan.exercises, exercise]
    return await updatePlan(planId, { exercises: updatedExercises })
  }

  // Remove an exercise from a plan
  async function removeExerciseFromPlan(
    planId: string, 
    exerciseIndex: number
  ): Promise<Plan | null> {
    const plan = getPlanById(planId)
    if (!plan || exerciseIndex < 0 || exerciseIndex >= plan.exercises.length) {
      return null
    }
    
    const updatedExercises = [...plan.exercises]
    updatedExercises.splice(exerciseIndex, 1)
    return await updatePlan(planId, { exercises: updatedExercises })
  }

  // Reorder exercises in a plan
  async function reorderExercises(
    planId: string, 
    fromIndex: number, 
    toIndex: number
  ): Promise<Plan | null> {
    const plan = getPlanById(planId)
    if (!plan) return null
    
    const exercises = [...plan.exercises]
    const [removed] = exercises.splice(fromIndex, 1)
    if (removed) {
      exercises.splice(toIndex, 0, removed)
    }
    
    return await updatePlan(planId, { exercises })
  }

  return {
    plans,
    isLoading,
    isInitialized,
    initialize,
    refreshPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    addExerciseToPlan,
    removeExerciseFromPlan,
    reorderExercises
  }
})

