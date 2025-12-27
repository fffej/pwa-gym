import { describe, it, expect } from 'vitest'
import { 
  calculateBrzycki, 
  calculateEpley, 
  calculateE1RM, 
  getBestE1RM 
} from '@/utils/e1rm'

describe('E1RM Calculations', () => {
  describe('calculateBrzycki', () => {
    it('returns the input weight for 1 rep', () => {
      expect(calculateBrzycki(100, 1)).toBe(100)
    })

    it('returns the input weight for 0 or negative reps', () => {
      expect(calculateBrzycki(100, 0)).toBe(100)
      expect(calculateBrzycki(100, -1)).toBe(100)
    })

    it('returns the input weight for reps >= 37', () => {
      expect(calculateBrzycki(100, 37)).toBe(100)
      expect(calculateBrzycki(100, 40)).toBe(100)
    })

    it('calculates correctly for 5 reps (known value from reference)', () => {
      // From maxcalculator.com: 225 lbs × 5 reps = 253 lbs
      // Formula: 225 × (36 / (37 - 5)) = 225 × (36/32) = 253.125
      const result = calculateBrzycki(225, 5)
      expect(result).toBeCloseTo(253.125, 2)
    })

    it('calculates correctly for 10 reps', () => {
      // 100 × (36 / (37 - 10)) = 100 × (36/27) = 133.33
      const result = calculateBrzycki(100, 10)
      expect(result).toBeCloseTo(133.33, 2)
    })

    it('calculates correctly for 8 reps (common training rep range)', () => {
      // 80kg × (36 / (37 - 8)) = 80 × (36/29) = 99.31
      const result = calculateBrzycki(80, 8)
      expect(result).toBeCloseTo(99.31, 2)
    })
  })

  describe('calculateEpley', () => {
    it('returns the input weight for 1 rep', () => {
      expect(calculateEpley(100, 1)).toBe(100)
    })

    it('returns the input weight for 0 or negative reps', () => {
      expect(calculateEpley(100, 0)).toBe(100)
      expect(calculateEpley(100, -1)).toBe(100)
    })

    it('calculates correctly for 5 reps (known value from reference)', () => {
      // From maxcalculator.com: 225 lbs × 5 reps = 262 lbs
      // Formula: 225 × (1 + 5/30) = 225 × 1.1667 = 262.5
      const result = calculateEpley(225, 5)
      expect(result).toBeCloseTo(262.5, 2)
    })

    it('calculates correctly for 10 reps', () => {
      // 100 × (1 + 10/30) = 100 × 1.333 = 133.33
      const result = calculateEpley(100, 10)
      expect(result).toBeCloseTo(133.33, 2)
    })
  })

  describe('calculateE1RM', () => {
    it('returns 0 for 0 weight', () => {
      expect(calculateE1RM(0, 5)).toBe(0)
    })

    it('returns 0 for 0 reps', () => {
      expect(calculateE1RM(100, 0)).toBe(0)
    })

    it('uses Brzycki by default', () => {
      const result = calculateE1RM(100, 5)
      const brzycki = calculateBrzycki(100, 5)
      expect(result).toBeCloseTo(brzycki, 1)
    })

    it('uses Epley when specified', () => {
      const result = calculateE1RM(100, 5, 'epley')
      const epley = calculateEpley(100, 5)
      expect(result).toBeCloseTo(epley, 1)
    })

    it('rounds to 1 decimal place', () => {
      const result = calculateE1RM(100, 5)
      const decimalPlaces = (result.toString().split('.')[1] || '').length
      expect(decimalPlaces).toBeLessThanOrEqual(1)
    })
  })

  describe('getBestE1RM', () => {
    it('returns 0 for empty array', () => {
      expect(getBestE1RM([])).toBe(0)
    })

    it('returns the single value for single set', () => {
      const sets = [{ weight: 100, reps: 1 }]
      expect(getBestE1RM(sets)).toBe(100)
    })

    it('finds the highest E1RM from multiple sets', () => {
      const sets = [
        { weight: 80, reps: 10 },  // E1RM ≈ 106.7
        { weight: 100, reps: 5 },  // E1RM ≈ 112.5
        { weight: 90, reps: 8 },   // E1RM ≈ 111.7
      ]
      const result = getBestE1RM(sets)
      // 100kg × 5 reps gives highest E1RM
      expect(result).toBeCloseTo(calculateE1RM(100, 5), 1)
    })

    it('handles real workout scenario with progressive sets', () => {
      // Simulating a typical bench press workout with warm-up and working sets
      const sets = [
        { weight: 40, reps: 10 },  // Warm-up
        { weight: 60, reps: 8 },   // Warm-up
        { weight: 80, reps: 5 },   // Working set
        { weight: 85, reps: 4 },   // Working set
        { weight: 90, reps: 2 },   // Heavy set
      ]
      const result = getBestE1RM(sets)
      // All should give similar E1RM if programmed correctly
      // 90kg × 2 = 90 × (36/35) = 92.57
      // 85kg × 4 = 85 × (36/33) = 92.73
      // 80kg × 5 = 80 × (36/32) = 90
      // Best should be around 92-93
      expect(result).toBeGreaterThan(90)
      expect(result).toBeLessThan(100)
    })
  })

  describe('E1RM Formula Comparison', () => {
    it('Brzycki and Epley give similar results for moderate reps', () => {
      const weight = 100
      for (const reps of [3, 4, 5, 6, 7, 8]) {
        const brzycki = calculateE1RM(weight, reps, 'brzycki')
        const epley = calculateE1RM(weight, reps, 'epley')
        // They should be within 5% of each other for moderate reps
        const percentDiff = Math.abs(brzycki - epley) / brzycki * 100
        expect(percentDiff).toBeLessThan(5)
      }
    })

    it('formulas diverge more for high reps', () => {
      const weight = 100
      const reps = 15
      const brzycki = calculateE1RM(weight, reps, 'brzycki')
      const epley = calculateE1RM(weight, reps, 'epley')
      // They should differ more for high reps
      const percentDiff = Math.abs(brzycki - epley) / brzycki * 100
      expect(percentDiff).toBeGreaterThan(3)
    })
  })
})





