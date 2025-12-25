/**
 * Workout metrics calculation utilities
 * 
 * Functions to calculate various performance metrics from workout data.
 */

import { calculateE1RM, getBestE1RM, type E1RMFormula } from './e1rm'
import type { Exercise, WorkoutSet, Workout } from '@/types/workout'

/**
 * Calculate total volume for a set of exercises
 * Volume = sum of (weight × reps) for all completed sets
 * 
 * @param exercises - Array of exercises
 * @returns Total volume in weight units
 */
export function calculateTotalVolume(exercises: Exercise[]): number {
  return exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((setTotal, set) => {
      if (set.isCompleted) {
        return setTotal + (set.weight * set.reps)
      }
      return setTotal
    }, 0)
  }, 0)
}

/**
 * Calculate volume for a single exercise
 * 
 * @param exercise - The exercise to calculate volume for
 * @returns Total volume for completed sets
 */
export function calculateExerciseVolume(exercise: Exercise): number {
  return exercise.sets.reduce((total, set) => {
    if (set.isCompleted) {
      return total + (set.weight * set.reps)
    }
    return total
  }, 0)
}

/**
 * Get the maximum weight lifted in completed sets
 * 
 * @param exercises - Array of exercises
 * @returns Maximum weight from all completed sets
 */
export function getMaxWeight(exercises: Exercise[]): number {
  let maxWeight = 0
  
  for (const exercise of exercises) {
    for (const set of exercise.sets) {
      if (set.isCompleted && set.weight > maxWeight) {
        maxWeight = set.weight
      }
    }
  }
  
  return maxWeight
}

/**
 * Get the maximum weight lifted for a specific exercise
 * 
 * @param exercise - The exercise to analyze
 * @returns Maximum weight from completed sets
 */
export function getExerciseMaxWeight(exercise: Exercise): number {
  return Math.max(
    0,
    ...exercise.sets
      .filter(set => set.isCompleted)
      .map(set => set.weight)
  )
}

/**
 * Calculate the best E1RM from an exercise's completed sets
 * 
 * @param exercise - The exercise to analyze
 * @param formula - The E1RM formula to use
 * @returns Best estimated one-rep max
 */
export function getExerciseBestE1RM(
  exercise: Exercise,
  formula: E1RMFormula = 'brzycki'
): number {
  const completedSets = exercise.sets
    .filter(set => set.isCompleted && set.weight > 0 && set.reps > 0)
    .map(set => ({ weight: set.weight, reps: set.reps }))
  
  return getBestE1RM(completedSets, formula)
}

/**
 * Calculate the best E1RM from all exercises in a workout
 * 
 * @param exercises - Array of exercises
 * @param formula - The E1RM formula to use
 * @returns Best estimated one-rep max across all exercises
 */
export function getWorkoutBestE1RM(
  exercises: Exercise[],
  formula: E1RMFormula = 'brzycki'
): number {
  let bestE1RM = 0
  
  for (const exercise of exercises) {
    const exerciseE1RM = getExerciseBestE1RM(exercise, formula)
    if (exerciseE1RM > bestE1RM) {
      bestE1RM = exerciseE1RM
    }
  }
  
  return bestE1RM
}

/**
 * Count total completed sets across all exercises
 * 
 * @param exercises - Array of exercises
 * @returns Number of completed sets
 */
export function countCompletedSets(exercises: Exercise[]): number {
  return exercises.reduce((total, exercise) => {
    return total + exercise.sets.filter(set => set.isCompleted).length
  }, 0)
}

/**
 * Calculate workout duration in minutes
 * 
 * @param workout - The workout to analyze
 * @returns Duration in minutes, or 0 if no end time
 */
export function calculateWorkoutDuration(workout: Workout): number {
  if (!workout.endTime) return 0
  const durationMs = workout.endTime - workout.startTime
  return Math.round(durationMs / 60000)
}

/**
 * Format duration as a human-readable string
 * 
 * @param minutes - Duration in minutes
 * @returns Formatted string like "45 min" or "1h 15min"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) {
    return `${hours}h`
  }
  return `${hours}h ${mins}min`
}

export interface ExerciseMetrics {
  date: string
  volume: number
  maxWeight: number
  bestE1RM: number
  totalSets: number
  totalReps: number
}

/**
 * Extract metrics for a specific machine across multiple workouts
 * Useful for charting progress over time
 * 
 * @param workouts - Array of workouts (should be sorted by date)
 * @param machineId - The machine ID to filter by
 * @param formula - The E1RM formula to use
 * @returns Array of metrics per workout date
 */
export function getExerciseProgressMetrics(
  workouts: Workout[],
  machineId: string,
  formula: E1RMFormula = 'brzycki'
): ExerciseMetrics[] {
  const metrics: ExerciseMetrics[] = []
  
  for (const workout of workouts) {
    // Find exercises for this machine in the workout
    const machineExercises = workout.exercises.filter(ex => ex.machineId === machineId)
    
    if (machineExercises.length === 0) continue
    
    // Aggregate metrics from all instances of this machine in the workout
    let totalVolume = 0
    let maxWeight = 0
    let bestE1RM = 0
    let totalSets = 0
    let totalReps = 0
    
    for (const exercise of machineExercises) {
      totalVolume += calculateExerciseVolume(exercise)
      
      const exerciseMax = getExerciseMaxWeight(exercise)
      if (exerciseMax > maxWeight) {
        maxWeight = exerciseMax
      }
      
      const exerciseE1RM = getExerciseBestE1RM(exercise, formula)
      if (exerciseE1RM > bestE1RM) {
        bestE1RM = exerciseE1RM
      }
      
      const completedSets = exercise.sets.filter(s => s.isCompleted)
      totalSets += completedSets.length
      totalReps += completedSets.reduce((sum, s) => sum + s.reps, 0)
    }
    
    if (totalSets > 0) {
      metrics.push({
        date: workout.date,
        volume: totalVolume,
        maxWeight,
        bestE1RM: Math.round(bestE1RM * 10) / 10,
        totalSets,
        totalReps
      })
    }
  }
  
  return metrics
}

