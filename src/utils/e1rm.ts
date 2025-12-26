/**
 * Estimated One-Rep Max (E1RM) calculation formulas
 * 
 * These formulas predict your maximum lift based on a submaximal effort.
 * Reference: https://maxcalculator.com/guides/1rm-formulas
 */

export type E1RMFormula = 'brzycki' | 'epley'

/**
 * Brzycki Formula - Best for 3-8 reps, validated for bench press and squat
 * Origin: Matt Brzycki, 1993, Journal of Physical Education, Recreation & Dance
 * 
 * Formula: 1RM = weight × (36 / (37 - reps))
 * 
 * @param weight - The weight lifted
 * @param reps - Number of repetitions performed (must be less than 37)
 * @returns Estimated one-rep max
 */
export function calculateBrzycki(weight: number, reps: number): number {
  if (reps <= 0 || reps >= 37) return weight
  if (reps === 1) return weight
  return weight * (36 / (37 - reps))
}

/**
 * Epley Formula - Best for 2-10 reps, widely used for squat and deadlift
 * Origin: Boyd Epley, 1985, Boyd Epley Workout
 * 
 * Formula: 1RM = weight × (1 + reps / 30)
 * 
 * @param weight - The weight lifted
 * @param reps - Number of repetitions performed
 * @returns Estimated one-rep max
 */
export function calculateEpley(weight: number, reps: number): number {
  if (reps <= 0) return weight
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

/**
 * Calculate E1RM using the specified formula
 * Defaults to Brzycki as it's most accurate for moderate rep ranges (3-8)
 * 
 * @param weight - The weight lifted
 * @param reps - Number of repetitions performed
 * @param formula - The formula to use (default: 'brzycki')
 * @returns Estimated one-rep max, rounded to 1 decimal place
 */
export function calculateE1RM(
  weight: number,
  reps: number,
  formula: E1RMFormula = 'brzycki'
): number {
  if (weight <= 0 || reps <= 0) return 0
  
  let e1rm: number
  
  switch (formula) {
    case 'epley':
      e1rm = calculateEpley(weight, reps)
      break
    case 'brzycki':
    default:
      e1rm = calculateBrzycki(weight, reps)
      break
  }
  
  // Round to 1 decimal place
  return Math.round(e1rm * 10) / 10
}

/**
 * Get the best E1RM from multiple sets
 * Useful for finding the peak estimated max from a workout
 * 
 * @param sets - Array of { weight, reps } objects
 * @param formula - The formula to use (default: 'brzycki')
 * @returns The highest E1RM value from all sets
 */
export function getBestE1RM(
  sets: Array<{ weight: number; reps: number }>,
  formula: E1RMFormula = 'brzycki'
): number {
  if (sets.length === 0) return 0
  
  return Math.max(...sets.map(set => calculateE1RM(set.weight, set.reps, formula)))
}


