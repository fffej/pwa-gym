import { describe, it, expect } from 'vitest'
import machinesData from '@/data/machines.json'
import type { RoomLocation, MuscleGroup, GripType, WeightType } from '@/types/workout'

const validLocations: RoomLocation[] = ['Main Room', 'Leg Room', 'Functional Room']
const validMuscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'hip-flexors'
]
const validGripTypes: GripType[] = ['pronated', 'supinated', 'neutral', 'mixed']
const validWeightTypes: WeightType[] = ['stack', 'plates', 'bodyweight', 'cable']

describe('machines.json data integrity', () => {
  const machines = machinesData.machines

  it('has machines loaded', () => {
    expect(machines).toBeDefined()
    expect(machines.length).toBeGreaterThan(0)
  })

  describe('required fields', () => {
    it('every machine has an id', () => {
      machines.forEach(machine => {
        expect(machine.id, `Machine missing id`).toBeDefined()
        expect(typeof machine.id).toBe('string')
        expect(machine.id.length).toBeGreaterThan(0)
      })
    })

    it('every machine has a name', () => {
      machines.forEach(machine => {
        expect(machine.name, `Machine ${machine.id} missing name`).toBeDefined()
        expect(typeof machine.name).toBe('string')
        expect(machine.name.length).toBeGreaterThan(0)
      })
    })

    it('every machine has a muscles array', () => {
      machines.forEach(machine => {
        expect(machine.muscles, `Machine ${machine.id} missing muscles`).toBeDefined()
        expect(Array.isArray(machine.muscles)).toBe(true)
        expect(machine.muscles.length).toBeGreaterThan(0)
      })
    })

    it('every machine has a location', () => {
      machines.forEach(machine => {
        expect(machine.location, `Machine ${machine.id} missing location`).toBeDefined()
      })
    })

    it('every machine has a weightType', () => {
      machines.forEach(machine => {
        expect(machine.weightType, `Machine ${machine.id} missing weightType`).toBeDefined()
      })
    })

    it('every machine has an attachments array', () => {
      machines.forEach(machine => {
        expect(machine.attachments, `Machine ${machine.id} missing attachments`).toBeDefined()
        expect(Array.isArray(machine.attachments)).toBe(true)
      })
    })
  })

  describe('location values', () => {
    it('all locations match RoomLocation type', () => {
      machines.forEach(machine => {
        expect(
          validLocations.includes(machine.location as RoomLocation),
          `Machine ${machine.id} has invalid location: ${machine.location}`
        ).toBe(true)
      })
    })
  })

  describe('muscle group values', () => {
    it('all muscle groups match MuscleGroup type', () => {
      machines.forEach(machine => {
        machine.muscles.forEach(muscle => {
          expect(
            validMuscleGroups.includes(muscle as MuscleGroup),
            `Machine ${machine.id} has invalid muscle group: ${muscle}`
          ).toBe(true)
        })
      })
    })
  })

  describe('weight type values', () => {
    it('all weight types match WeightType type', () => {
      machines.forEach(machine => {
        expect(
          validWeightTypes.includes(machine.weightType as WeightType),
          `Machine ${machine.id} has invalid weight type: ${machine.weightType}`
        ).toBe(true)
      })
    })
  })

  describe('attachment grip values', () => {
    it('all attachment grips match GripType type', () => {
      machines.forEach(machine => {
        machine.attachments.forEach(attachment => {
          attachment.grips.forEach(grip => {
            expect(
              validGripTypes.includes(grip as GripType),
              `Machine ${machine.id}, attachment ${attachment.id} has invalid grip: ${grip}`
            ).toBe(true)
          })
        })
      })
    })

    it('all attachments have required fields', () => {
      machines.forEach(machine => {
        machine.attachments.forEach(attachment => {
          expect(attachment.id, `Attachment in ${machine.id} missing id`).toBeDefined()
          expect(attachment.name, `Attachment in ${machine.id} missing name`).toBeDefined()
          expect(attachment.grips, `Attachment in ${machine.id} missing grips`).toBeDefined()
          expect(Array.isArray(attachment.grips)).toBe(true)
        })
      })
    })
  })

  describe('unique identifiers', () => {
    it('all machine IDs are unique', () => {
      const ids = machines.map(m => m.id)
      const uniqueIds = new Set(ids)
      expect(ids.length).toBe(uniqueIds.size)
    })
  })

  describe('optional numeric fields', () => {
    it('defaultRestPeriod is a positive number when present', () => {
      machines.forEach(machine => {
        if (machine.defaultRestPeriod !== undefined) {
          expect(typeof machine.defaultRestPeriod).toBe('number')
          expect(machine.defaultRestPeriod).toBeGreaterThan(0)
        }
      })
    })

    it('weightIncrement is a positive number when present', () => {
      machines.forEach(machine => {
        if (machine.weightIncrement !== undefined) {
          expect(typeof machine.weightIncrement).toBe('number')
          expect(machine.weightIncrement).toBeGreaterThan(0)
        }
      })
    })

    it('minWeight is less than or equal to maxWeight when both present', () => {
      machines.forEach(machine => {
        if (machine.minWeight !== undefined && machine.maxWeight !== undefined) {
          expect(
            machine.minWeight <= machine.maxWeight,
            `Machine ${machine.id}: minWeight (${machine.minWeight}) > maxWeight (${machine.maxWeight})`
          ).toBe(true)
        }
      })
    })
  })
})

