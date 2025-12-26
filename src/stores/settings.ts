import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserSettings, WeightUnit } from '@/types/workout'
import { settingsDb } from '@/services/db'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<UserSettings>({
    defaultWeightUnit: 'kg',
    availablePlates: []
  })
  const isLoaded = ref(false)

  // Load settings from IndexedDB
  async function loadSettings() {
    if (isLoaded.value) return
    const loaded = await settingsDb.getSettings()
    settings.value = loaded
    isLoaded.value = true
  }

  // Update weight unit preference
  async function setWeightUnit(unit: WeightUnit) {
    settings.value.defaultWeightUnit = unit
    await settingsDb.updateSettings({ defaultWeightUnit: unit })
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
    convertWeight
  }
})
