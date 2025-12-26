import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSettingsStore } from '@/stores/settings'

describe('Settings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('convertWeight', () => {
    it('converts kg to lbs correctly', () => {
      const store = useSettingsStore()
      const result = store.convertWeight(10, 'kg', 'lbs')
      expect(result).toBeCloseTo(22.0, 1)
    })

    it('converts lbs to kg correctly', () => {
      const store = useSettingsStore()
      const result = store.convertWeight(22, 'lbs', 'kg')
      expect(result).toBeCloseTo(10.0, 1)
    })

    it('returns same value when units are the same (kg to kg)', () => {
      const store = useSettingsStore()
      const result = store.convertWeight(50, 'kg', 'kg')
      expect(result).toBe(50)
    })

    it('returns same value when units are the same (lbs to lbs)', () => {
      const store = useSettingsStore()
      const result = store.convertWeight(100, 'lbs', 'lbs')
      expect(result).toBe(100)
    })

    it('rounds to one decimal place when converting kg to lbs', () => {
      const store = useSettingsStore()
      // 7.5 kg = 16.5347 lbs, should round to 16.5
      const result = store.convertWeight(7.5, 'kg', 'lbs')
      expect(result).toBe(Math.round(7.5 * 2.20462 * 10) / 10)
    })

    it('rounds to one decimal place when converting lbs to kg', () => {
      const store = useSettingsStore()
      // 15 lbs = 6.8039 kg, should round to 6.8
      const result = store.convertWeight(15, 'lbs', 'kg')
      expect(result).toBe(Math.round(15 / 2.20462 * 10) / 10)
    })

    it('handles zero weight', () => {
      const store = useSettingsStore()
      expect(store.convertWeight(0, 'kg', 'lbs')).toBe(0)
      expect(store.convertWeight(0, 'lbs', 'kg')).toBe(0)
    })
  })

  describe('default settings', () => {
    it('has correct default weight unit', () => {
      const store = useSettingsStore()
      expect(store.settings.defaultWeightUnit).toBe('kg')
    })
  })
})

