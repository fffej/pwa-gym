import Dexie, { type Table } from 'dexie'
import type { Workout, UserSettings, MachineDefaults, Plan, UserMachineCustomization } from '@/types/workout'

// Database class extending Dexie
class GymDatabase extends Dexie {
  workouts!: Table<Workout, string>
  settings!: Table<UserSettings, number>
  machineDefaults!: Table<MachineDefaults, string>
  plans!: Table<Plan, string>
  machineCustomizations!: Table<UserMachineCustomization, string>

  constructor() {
    super('GymDatabase')
    
    this.version(1).stores({
      // Primary key is id, index on date for querying
      workouts: 'id, date, startTime',
      // Single settings record with key 1
      settings: '++id',
      // Machine defaults keyed by machineId
      machineDefaults: 'machineId'
    })

    // Version 2: Add plans table
    this.version(2).stores({
      workouts: 'id, date, startTime',
      settings: '++id',
      machineDefaults: 'machineId',
      plans: 'id, name'
    })

    // Version 3: Add updatedAt for sync
    this.version(3).stores({
      workouts: 'id, date, startTime, updatedAt',
      settings: '++id',
      machineDefaults: 'machineId, updatedAt',
      plans: 'id, name, updatedAt'
    })

    // Version 4: Add machineCustomizations, new exercise model (clears old data)
    this.version(4).stores({
      workouts: 'id, date, startTime, updatedAt',
      settings: '++id',
      machineDefaults: 'machineId, updatedAt',
      plans: 'id, name, updatedAt',
      machineCustomizations: 'machineId, updatedAt'
    }).upgrade(tx => {
      // Clear old data since we're changing the data model
      tx.table('workouts').clear()
      tx.table('machineDefaults').clear()
      tx.table('plans').clear()
    })
  }
}

// Database instance
export const db = new GymDatabase()

// Default user settings
const defaultSettings: UserSettings = {
  defaultWeightUnit: 'kg',
  defaultRestPeriod: 60,
  availablePlates: [
    { weight: 1.25, unit: 'kg' },
    { weight: 2.5, unit: 'kg' },
    { weight: 5, unit: 'kg' },
    { weight: 10, unit: 'kg' },
    { weight: 15, unit: 'kg' },
    { weight: 20, unit: 'kg' },
    { weight: 25, unit: 'kg' }
  ],
  timerBehavior: 'auto'
}

// Workout operations
export const workoutDb = {
  // Save a workout (create or update)
  async saveWorkout(workout: Workout): Promise<void> {
    await db.workouts.put({ ...workout, updatedAt: Date.now() })
  },

  // Get a workout by ID
  async getWorkout(id: string): Promise<Workout | undefined> {
    return await db.workouts.get(id)
  },

  // Get all workouts, sorted by date (newest first)
  async getAllWorkouts(): Promise<Workout[]> {
    return await db.workouts.orderBy('startTime').reverse().toArray()
  },

  // Get workouts within a date range
  async getWorkoutsByDateRange(startDate: string, endDate: string): Promise<Workout[]> {
    return await db.workouts
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray()
  },

  // Delete a workout
  async deleteWorkout(id: string): Promise<void> {
    await db.workouts.delete(id)
  },

  // Get workouts containing a specific machine (for progress tracking)
  async getWorkoutsWithMachine(machineId: string): Promise<Workout[]> {
    const allWorkouts = await db.workouts.toArray()
    return allWorkouts.filter(workout => 
      workout.exercises.some(ex => ex.machineId === machineId)
    )
  },

  // Get workouts containing a specific exercise
  async getWorkoutsWithExercise(exerciseId: string): Promise<Workout[]> {
    const allWorkouts = await db.workouts.toArray()
    return allWorkouts.filter(workout => 
      workout.exercises.some(ex => ex.exerciseId === exerciseId)
    )
  },

  // Get total count of workouts (for pagination)
  async getWorkoutCount(): Promise<number> {
    return await db.workouts.count()
  },

  // Get paginated workouts, sorted by date (newest first)
  async getWorkoutsPaginated(page: number, limit: number = 10): Promise<Workout[]> {
    const offset = (page - 1) * limit
    return await db.workouts
      .orderBy('startTime')
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray()
  },

  // Get only completed workouts (those with an endTime)
  async getCompletedWorkouts(): Promise<Workout[]> {
    const allWorkouts = await db.workouts.orderBy('startTime').reverse().toArray()
    return allWorkouts.filter(workout => workout.endTime !== undefined)
  },

  // Get completed workouts with pagination
  async getCompletedWorkoutsPaginated(page: number, limit: number = 10): Promise<Workout[]> {
    const offset = (page - 1) * limit
    const allCompleted = await this.getCompletedWorkouts()
    return allCompleted.slice(offset, offset + limit)
  },

  // Get count of completed workouts
  async getCompletedWorkoutCount(): Promise<number> {
    const allWorkouts = await db.workouts.toArray()
    return allWorkouts.filter(workout => workout.endTime !== undefined).length
  }
}

// Settings operations
export const settingsDb = {
  // Get user settings (creates default if none exist)
  async getSettings(): Promise<UserSettings> {
    const settings = await db.settings.get(1)
    if (!settings) {
      await db.settings.put({ ...defaultSettings }, 1)
      return defaultSettings
    }
    return settings
  },

  // Update user settings
  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    const current = await this.getSettings()
    await db.settings.put({ ...current, ...settings, updatedAt: Date.now() }, 1)
  }
}

// Machine defaults operations (for smart defaults)
export const machineDefaultsDb = {
  // Get defaults for a machine/exercise combination
  async getDefaults(machineId: string, exerciseId?: string): Promise<MachineDefaults | undefined> {
    if (exerciseId) {
      // Try to find exercise-specific defaults first
      const all = await db.machineDefaults.toArray()
      const exerciseDefault = all.find(d => d.machineId === machineId && d.exerciseId === exerciseId)
      if (exerciseDefault) return exerciseDefault
    }
    // Fall back to machine-level defaults
    return await db.machineDefaults.get(machineId)
  },

  // Update defaults for a machine (called after completing a set)
  async updateDefaults(defaults: MachineDefaults): Promise<void> {
    await db.machineDefaults.put({ ...defaults, updatedAt: Date.now() })
  },

  // Get all machine defaults
  async getAllDefaults(): Promise<MachineDefaults[]> {
    return await db.machineDefaults.toArray()
  }
}

// Machine customizations operations
export const machineCustomizationsDb = {
  // Get customizations for a specific machine
  async getCustomization(machineId: string): Promise<UserMachineCustomization | undefined> {
    return await db.machineCustomizations.get(machineId)
  },

  // Get all customizations
  async getAllCustomizations(): Promise<UserMachineCustomization[]> {
    return await db.machineCustomizations.toArray()
  },

  // Save a customization
  async saveCustomization(customization: UserMachineCustomization): Promise<void> {
    await db.machineCustomizations.put({ ...customization, updatedAt: Date.now() })
  },

  // Delete a customization
  async deleteCustomization(machineId: string): Promise<void> {
    await db.machineCustomizations.delete(machineId)
  }
}

// Plan operations
export const plansDb = {
  // Get all plans
  async getAllPlans(): Promise<Plan[]> {
    return await db.plans.toArray()
  },

  // Get a plan by ID
  async getPlan(id: string): Promise<Plan | undefined> {
    return await db.plans.get(id)
  },

  // Save a plan (create or update)
  async savePlan(plan: Plan): Promise<void> {
    await db.plans.put({ ...plan, updatedAt: Date.now() })
  },

  // Delete a plan
  async deletePlan(id: string): Promise<void> {
    await db.plans.delete(id)
  },

  // Get count of plans
  async getPlanCount(): Promise<number> {
    return await db.plans.count()
  },

  // Seed plans (for initial setup with default plans)
  async seedPlans(plans: Plan[]): Promise<void> {
    const now = Date.now()
    const plansWithTimestamp = plans.map(plan => ({ ...plan, updatedAt: now }))
    await db.plans.bulkPut(plansWithTimestamp)
  }
}

export default db
