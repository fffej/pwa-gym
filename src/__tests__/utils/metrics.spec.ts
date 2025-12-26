import { describe, it, expect } from 'vitest'
import {
  calculateTotalVolume,
  calculateExerciseVolume,
  getMaxWeight,
  getExerciseMaxWeight,
  getExerciseBestE1RM,
  getWorkoutBestE1RM,
  countCompletedSets,
  calculateWorkoutDuration,
  formatDuration,
  getExerciseProgressMetrics
} from '@/utils/metrics'
import type { Exercise, Workout } from '@/types/workout'

// Helper to create test exercises
function createExercise(
  machineId: string,
  machineName: string,
  sets: Array<{ weight: number; reps: number; isCompleted: boolean }>
): Exercise {
  return {
    id: `exercise-${Math.random().toString(36).substr(2, 9)}`,
    machineId,
    machineName,
    sets: sets.map((s, i) => ({
      id: `set-${i}`,
      weight: s.weight,
      reps: s.reps,
      weightUnit: 'kg' as const,
      restPeriod: 60,
      isCompleted: s.isCompleted
    }))
  }
}

// Helper to create test workout
function createWorkout(
  date: string,
  exercises: Exercise[],
  durationMinutes?: number
): Workout {
  const startTime = new Date(date).getTime()
  return {
    id: `workout-${Math.random().toString(36).substr(2, 9)}`,
    date,
    startTime,
    endTime: durationMinutes ? startTime + durationMinutes * 60000 : undefined,
    exercises
  }
}

describe('Metrics Calculations', () => {
  describe('calculateTotalVolume', () => {
    it('returns 0 for empty exercises array', () => {
      expect(calculateTotalVolume([])).toBe(0)
    })

    it('calculates volume for single exercise with completed sets', () => {
      const exercises = [
        createExercise('bench', 'Bench Press', [
          { weight: 80, reps: 10, isCompleted: true },  // 800
          { weight: 80, reps: 8, isCompleted: true },   // 640
        ])
      ]
      expect(calculateTotalVolume(exercises)).toBe(1440)
    })

    it('ignores incomplete sets', () => {
      const exercises = [
        createExercise('bench', 'Bench Press', [
          { weight: 80, reps: 10, isCompleted: true },   // 800
          { weight: 80, reps: 8, isCompleted: false },   // 0 (not counted)
        ])
      ]
      expect(calculateTotalVolume(exercises)).toBe(800)
    })

    it('sums volume across multiple exercises', () => {
      const exercises = [
        createExercise('bench', 'Bench Press', [
          { weight: 80, reps: 10, isCompleted: true }  // 800
        ]),
        createExercise('squat', 'Squat', [
          { weight: 100, reps: 5, isCompleted: true }  // 500
        ])
      ]
      expect(calculateTotalVolume(exercises)).toBe(1300)
    })
  })

  describe('calculateExerciseVolume', () => {
    it('calculates volume for single exercise', () => {
      const exercise = createExercise('bench', 'Bench Press', [
        { weight: 60, reps: 12, isCompleted: true },  // 720
        { weight: 70, reps: 10, isCompleted: true },  // 700
        { weight: 80, reps: 8, isCompleted: true },   // 640
      ])
      expect(calculateExerciseVolume(exercise)).toBe(2060)
    })
  })

  describe('getMaxWeight', () => {
    it('returns 0 for empty exercises', () => {
      expect(getMaxWeight([])).toBe(0)
    })

    it('finds max weight across all exercises', () => {
      const exercises = [
        createExercise('bench', 'Bench Press', [
          { weight: 80, reps: 5, isCompleted: true }
        ]),
        createExercise('squat', 'Squat', [
          { weight: 120, reps: 5, isCompleted: true }
        ])
      ]
      expect(getMaxWeight(exercises)).toBe(120)
    })

    it('only considers completed sets', () => {
      const exercises = [
        createExercise('bench', 'Bench Press', [
          { weight: 80, reps: 5, isCompleted: true },
          { weight: 100, reps: 3, isCompleted: false }  // Not counted
        ])
      ]
      expect(getMaxWeight(exercises)).toBe(80)
    })
  })

  describe('getExerciseMaxWeight', () => {
    it('returns 0 for exercise with no completed sets', () => {
      const exercise = createExercise('bench', 'Bench Press', [
        { weight: 80, reps: 5, isCompleted: false }
      ])
      expect(getExerciseMaxWeight(exercise)).toBe(0)
    })

    it('finds max weight in exercise', () => {
      const exercise = createExercise('bench', 'Bench Press', [
        { weight: 60, reps: 10, isCompleted: true },
        { weight: 80, reps: 5, isCompleted: true },
        { weight: 70, reps: 8, isCompleted: true }
      ])
      expect(getExerciseMaxWeight(exercise)).toBe(80)
    })
  })

  describe('getExerciseBestE1RM', () => {
    it('calculates best E1RM from exercise sets', () => {
      const exercise = createExercise('bench', 'Bench Press', [
        { weight: 80, reps: 8, isCompleted: true },   // E1RM ≈ 99.3
        { weight: 90, reps: 4, isCompleted: true },   // E1RM ≈ 98.2
        { weight: 70, reps: 12, isCompleted: true },  // E1RM ≈ 100.8
      ])
      const result = getExerciseBestE1RM(exercise)
      // 70 × 12 gives the best E1RM in this case
      expect(result).toBeGreaterThan(99)
      expect(result).toBeLessThan(105)
    })

    it('returns 0 for no completed sets', () => {
      const exercise = createExercise('bench', 'Bench Press', [
        { weight: 80, reps: 8, isCompleted: false }
      ])
      expect(getExerciseBestE1RM(exercise)).toBe(0)
    })
  })

  describe('countCompletedSets', () => {
    it('returns 0 for empty exercises', () => {
      expect(countCompletedSets([])).toBe(0)
    })

    it('counts only completed sets', () => {
      const exercises = [
        createExercise('bench', 'Bench Press', [
          { weight: 80, reps: 8, isCompleted: true },
          { weight: 80, reps: 8, isCompleted: false },
          { weight: 80, reps: 8, isCompleted: true }
        ]),
        createExercise('squat', 'Squat', [
          { weight: 100, reps: 5, isCompleted: true }
        ])
      ]
      expect(countCompletedSets(exercises)).toBe(3)
    })
  })

  describe('calculateWorkoutDuration', () => {
    it('returns 0 when no endTime', () => {
      const workout = createWorkout('2024-01-01', [])
      expect(calculateWorkoutDuration(workout)).toBe(0)
    })

    it('calculates duration in minutes', () => {
      const workout = createWorkout('2024-01-01', [], 45)
      expect(calculateWorkoutDuration(workout)).toBe(45)
    })

    it('rounds to nearest minute', () => {
      const startTime = Date.now()
      const workout: Workout = {
        id: 'test',
        date: '2024-01-01',
        startTime,
        endTime: startTime + (45.6 * 60000),  // 45.6 minutes
        exercises: []
      }
      expect(calculateWorkoutDuration(workout)).toBe(46)
    })
  })

  describe('formatDuration', () => {
    it('formats minutes under 60', () => {
      expect(formatDuration(45)).toBe('45 min')
      expect(formatDuration(5)).toBe('5 min')
    })

    it('formats hours with no remaining minutes', () => {
      expect(formatDuration(60)).toBe('1h')
      expect(formatDuration(120)).toBe('2h')
    })

    it('formats hours and minutes', () => {
      expect(formatDuration(75)).toBe('1h 15min')
      expect(formatDuration(90)).toBe('1h 30min')
    })
  })

  describe('getExerciseProgressMetrics', () => {
    it('returns empty array for no workouts', () => {
      expect(getExerciseProgressMetrics([], 'bench')).toEqual([])
    })

    it('returns empty array when machine not found in workouts', () => {
      const workout = createWorkout('2024-01-01', [
        createExercise('squat', 'Squat', [
          { weight: 100, reps: 5, isCompleted: true }
        ])
      ])
      expect(getExerciseProgressMetrics([workout], 'bench')).toEqual([])
    })

    it('extracts metrics for specific machine across workouts', () => {
      const workouts = [
        createWorkout('2024-01-01', [
          createExercise('bench', 'Bench Press', [
            { weight: 60, reps: 10, isCompleted: true },
            { weight: 60, reps: 10, isCompleted: true }
          ])
        ]),
        createWorkout('2024-01-08', [
          createExercise('bench', 'Bench Press', [
            { weight: 65, reps: 10, isCompleted: true },
            { weight: 65, reps: 10, isCompleted: true }
          ])
        ])
      ]

      const metrics = getExerciseProgressMetrics(workouts, 'bench')
      
      expect(metrics).toHaveLength(2)
      expect(metrics[0].date).toBe('2024-01-01')
      expect(metrics[0].volume).toBe(1200)  // 60 × 10 × 2
      expect(metrics[0].maxWeight).toBe(60)
      expect(metrics[1].date).toBe('2024-01-08')
      expect(metrics[1].volume).toBe(1300)  // 65 × 10 × 2
      expect(metrics[1].maxWeight).toBe(65)
    })

    it('aggregates metrics from multiple instances of same machine in workout', () => {
      const workout = createWorkout('2024-01-01', [
        createExercise('bench', 'Bench Press', [
          { weight: 60, reps: 10, isCompleted: true }  // 600
        ]),
        createExercise('bench', 'Incline Bench Press', [
          { weight: 50, reps: 10, isCompleted: true }  // 500
        ])
      ])

      const metrics = getExerciseProgressMetrics([workout], 'bench')
      
      expect(metrics).toHaveLength(1)
      expect(metrics[0].volume).toBe(1100)  // Combined
      expect(metrics[0].maxWeight).toBe(60)  // Max of both
      expect(metrics[0].totalSets).toBe(2)
    })
  })
})

describe('10-Week Progress Simulation', () => {
  // Generate 10 weeks of simulated workout data
  function generateProgressiveWorkouts(): Workout[] {
    const workouts: Workout[] = []
    const startDate = new Date('2024-01-01')
    
    // Simulate 3 workouts per week for 10 weeks = 30 workouts
    for (let week = 0; week < 10; week++) {
      for (let day = 0; day < 3; day++) {
        const workoutDate = new Date(startDate)
        workoutDate.setDate(startDate.getDate() + (week * 7) + (day * 2))
        const dateStr = workoutDate.toISOString().split('T')[0]
        
        // Progressive overload: increase weight by ~2kg per week for bench
        const benchWeight = 60 + (week * 2)
        // Reps may vary slightly
        const benchReps = 8 + (day % 2)
        
        // Squat progresses faster
        const squatWeight = 80 + (week * 2.5)
        const squatReps = 5
        
        // Deadlift even faster
        const deadliftWeight = 100 + (week * 3)
        const deadliftReps = 5
        
        const exercises = [
          createExercise('bench-press', 'Bench Press', [
            { weight: benchWeight - 20, reps: 10, isCompleted: true },  // Warm-up
            { weight: benchWeight, reps: benchReps, isCompleted: true },
            { weight: benchWeight, reps: benchReps - 1, isCompleted: true },
            { weight: benchWeight, reps: benchReps - 2, isCompleted: true }
          ]),
          createExercise('squat', 'Squat', [
            { weight: squatWeight - 20, reps: 8, isCompleted: true },  // Warm-up
            { weight: squatWeight, reps: squatReps, isCompleted: true },
            { weight: squatWeight, reps: squatReps, isCompleted: true },
            { weight: squatWeight + 5, reps: 3, isCompleted: true }  // Heavy single
          ]),
          createExercise('deadlift', 'Deadlift', [
            { weight: deadliftWeight, reps: deadliftReps, isCompleted: true },
            { weight: deadliftWeight, reps: deadliftReps, isCompleted: true }
          ])
        ]
        
        workouts.push(createWorkout(dateStr, exercises, 60 + Math.floor(Math.random() * 30)))
      }
    }
    
    return workouts
  }

  it('shows progressive increase in bench press E1RM over 10 weeks', () => {
    const workouts = generateProgressiveWorkouts()
    const benchMetrics = getExerciseProgressMetrics(workouts, 'bench-press')
    
    expect(benchMetrics.length).toBe(30)  // 3 workouts × 10 weeks
    
    // First week E1RM should be around 75-80kg (60kg for 8 reps)
    const firstWeekE1RM = benchMetrics[0].bestE1RM
    expect(firstWeekE1RM).toBeGreaterThan(70)
    expect(firstWeekE1RM).toBeLessThan(85)
    
    // Last week E1RM should be around 95-100kg (78kg for 8 reps)
    const lastWeekE1RM = benchMetrics[benchMetrics.length - 1].bestE1RM
    expect(lastWeekE1RM).toBeGreaterThan(90)
    expect(lastWeekE1RM).toBeLessThan(110)
    
    // There should be clear progression
    expect(lastWeekE1RM).toBeGreaterThan(firstWeekE1RM)
  })

  it('shows progressive increase in squat max weight', () => {
    const workouts = generateProgressiveWorkouts()
    const squatMetrics = getExerciseProgressMetrics(workouts, 'squat')
    
    expect(squatMetrics.length).toBe(30)
    
    // First week max weight: 80 + 5 = 85kg (including heavy set)
    const firstWeekMax = squatMetrics[0].maxWeight
    expect(firstWeekMax).toBe(85)
    
    // Last week max weight: 80 + (9 × 2.5) + 5 = 107.5kg
    const lastWeekMax = squatMetrics[squatMetrics.length - 1].maxWeight
    expect(lastWeekMax).toBe(107.5)
    
    // Progression
    expect(lastWeekMax).toBeGreaterThan(firstWeekMax)
  })

  it('shows progressive increase in deadlift volume', () => {
    const workouts = generateProgressiveWorkouts()
    const deadliftMetrics = getExerciseProgressMetrics(workouts, 'deadlift')
    
    expect(deadliftMetrics.length).toBe(30)
    
    // First week volume: 100 × 5 × 2 = 1000kg
    const firstWeekVolume = deadliftMetrics[0].volume
    expect(firstWeekVolume).toBe(1000)
    
    // Last week volume: (100 + 27) × 5 × 2 = 1270kg
    const lastWeekVolume = deadliftMetrics[deadliftMetrics.length - 1].volume
    expect(lastWeekVolume).toBe(1270)
  })

  it('calculates realistic E1RM values throughout the simulation', () => {
    const workouts = generateProgressiveWorkouts()
    const benchMetrics = getExerciseProgressMetrics(workouts, 'bench-press')
    
    // All E1RM values should be reasonable (not negative, not astronomical)
    for (const metric of benchMetrics) {
      expect(metric.bestE1RM).toBeGreaterThan(0)
      expect(metric.bestE1RM).toBeLessThan(200)  // Reasonable upper bound
    }
  })

  it('tracks total sets correctly', () => {
    const workouts = generateProgressiveWorkouts()
    const benchMetrics = getExerciseProgressMetrics(workouts, 'bench-press')
    
    // Each bench workout has 4 sets
    for (const metric of benchMetrics) {
      expect(metric.totalSets).toBe(4)
    }
  })

  it('tracks total reps correctly', () => {
    const workouts = generateProgressiveWorkouts()
    const squatMetrics = getExerciseProgressMetrics(workouts, 'squat')
    
    // Each squat workout: warm-up 8 + working 5 + working 5 + heavy 3 = 21
    for (const metric of squatMetrics) {
      expect(metric.totalReps).toBe(21)
    }
  })
})



