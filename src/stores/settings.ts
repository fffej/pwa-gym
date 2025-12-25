import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserSettings, WeightUnit } from '@/types/workout'
import { settingsDb } from '@/services/db'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>({
    defaultWeightUnit: 'kg',
    defaultRestPeriod: 60,
    availablePlates: []
  })
  const isLoaded = ref(false)

  // Load settings from IndexedDB
  async function loadSettings() {
    if (isLoaded.value) return
    settings.value = await settingsDb.getSettings()
    isLoaded.value = true
  }

  // Update weight unit preference
  async function setWeightUnit(unit: WeightUnit) {
    settings.value.defaultWeightUnit = unit
    await settingsDb.updateSettings({ defaultWeightUnit: unit })
  }

  // Update default rest period
  async function setDefaultRestPeriod(seconds: number) {
    settings.value.defaultRestPeriod = seconds
    await settingsDb.updateSettings({ defaultRestPeriod: seconds })
  }

  // Convert weight between units
  function convertWeight(weight: number, from: WeightUnit, to: WeightUnit): number {
    if (from === to) return weight
    if (from === 'kg' && to === 'lbs') return Math.round(weight * 2.20462 * 10) / 10
    if (from === 'lbs' && to === 'kg') return Math.round(weight / 2.20462 * 10) / 10
    return weight
  }

  return {
    settings,
    isLoaded,
    loadSettings,
    setWeightUnit,
    setDefaultRestPeriod,
    convertWeight
  }
})

