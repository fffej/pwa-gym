// Weight unit types
export type WeightUnit = 'kg' | 'lbs'

// Machine weight types
export type WeightType = 'stack' | 'plates' | 'bodyweight' | 'cable'

// Grip types for attachments
export type GripType = 'pronated' | 'supinated' | 'neutral' | 'mixed'

// Room locations
export type RoomLocation = 'Main Room' | 'Leg Room' | 'Functional Room'

// Muscle groups
export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'biceps' 
  | 'triceps' 
  | 'forearms'
  | 'core'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'hip-flexors'

// Plate configuration for plate-loaded machines
export interface PlateConfig {
  plates: { weight: number; count: number }[]
  unit: WeightUnit
  barWeight?: number
}

// Attachment for cable machines and similar
export interface Attachment {
  id: string
  name: string
  grips: GripType[]
}

// Machine/Equipment configuration (from JSON)
export interface Machine {
  id: string
  name: string
  picture: string
  muscles: MuscleGroup[]
  location: RoomLocation
  weightType: WeightType
  attachments: Attachment[]
  defaultRestPeriod?: number
  weightIncrement?: number
  minWeight?: number
  maxWeight?: number
}

// A single set within an exercise
export interface WorkoutSet {
  id: string
  reps: number
  weight: number
  weightUnit: WeightUnit
  rpe?: number
  plates?: PlateConfig
  restPeriod: number
  completedAt?: number
  isCompleted: boolean
}

// An exercise within a workout
export interface Exercise {
  id: string
  machineId: string
  machineName: string
  attachmentId?: string
  grip?: GripType
  sets: WorkoutSet[]
  notes?: string
}

// A complete workout session
export interface Workout {
  id: string
  date: string
  startTime: number
  endTime?: number
  exercises: Exercise[]
  notes?: string
  updatedAt?: number // For sync conflict resolution
}

// User settings/preferences
export interface UserSettings {
  defaultWeightUnit: WeightUnit
  defaultRestPeriod: number
  availablePlates: { weight: number; unit: WeightUnit }[]
  updatedAt?: number // For sync conflict resolution
}

// For tracking last used values per machine (smart defaults)
export interface MachineDefaults {
  machineId: string
  lastWeight: number
  lastWeightUnit: WeightUnit
  lastReps: number
  lastAttachmentId?: string
  lastGrip?: GripType
  updatedAt?: number // For sync conflict resolution
}

// An exercise within a plan (template without set data)
export interface PlanExercise {
  machineId: string
  attachmentId?: string
  grip?: GripType
}

// A workout plan/template
export interface Plan {
  id: string
  name: string
  description?: string
  exercises: PlanExercise[]
  updatedAt?: number // For sync conflict resolution
}

