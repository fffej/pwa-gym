import Dexie, { type Table } from 'dexie'
import type { Workout, UserSettings, MachineDefaults } from '@/types/workout'

// Database class extending Dexie
class GymDatabase extends Dexie {
  workouts!: Table<Workout, string>
  settings!: Table<UserSettings, number>
  machineDefaults!: Table<MachineDefaults, string>

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
  ]
}

// Workout operations
export const workoutDb = {
  // Save a workout (create or update)
  async saveWorkout(workout: Workout): Promise<void> {
    await db.workouts.put(workout)
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
    await db.settings.put({ ...current, ...settings }, 1)
  }
}

// Machine defaults operations (for smart defaults)
export const machineDefaultsDb = {
  // Get defaults for a machine
  async getDefaults(machineId: string): Promise<MachineDefaults | undefined> {
    return await db.machineDefaults.get(machineId)
  },

  // Update defaults for a machine (called after completing a set)
  async updateDefaults(defaults: MachineDefaults): Promise<void> {
    await db.machineDefaults.put(defaults)
  },

  // Get all machine defaults
  async getAllDefaults(): Promise<MachineDefaults[]> {
    return await db.machineDefaults.toArray()
  }
}

export default db

