import { ref, readonly } from 'vue'
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  writeBatch
} from 'firebase/firestore'
import { firestore } from './firebase'
import { db, settingsDb, machineCustomizationsDb } from './db'
import type { Workout, UserSettings, MachineDefaults, Plan, UserMachineCustomization } from '@/types/workout'

// Sync status
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline'

const syncStatus = ref<SyncStatus>('idle')
const lastSyncTime = ref<number | null>(null)
const syncError = ref<string | null>(null)
const isOnline = ref(navigator.onLine)

// Export readonly refs for components
export const useSyncStatus = () => ({
  status: readonly(syncStatus),
  lastSyncTime: readonly(lastSyncTime),
  error: readonly(syncError),
  isOnline: readonly(isOnline)
})

// Listen for online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline.value = true
  })
  window.addEventListener('offline', () => {
    isOnline.value = false
    syncStatus.value = 'offline'
  })
}

// Collection paths helper
function getUserCollectionPath(userId: string, collectionName: string) {
  return `users/${userId}/${collectionName}`
}

// Generic sync function for a collection
async function syncCollection<T extends { updatedAt?: number }>(
  userId: string,
  collectionName: string,
  getLocalItems: () => Promise<T[]>,
  getItemId: (item: T) => string,
  saveLocalItem: (item: T) => Promise<void>
): Promise<void> {
  const collectionPath = getUserCollectionPath(userId, collectionName)
  const collectionRef = collection(firestore, collectionPath)
  
  // Get local items
  const localItems = await getLocalItems()
  const localMap = new Map(localItems.map(item => [getItemId(item), item]))
  
  // Get remote items
  const remoteSnapshot = await getDocs(collectionRef)
  const remoteItems: T[] = []
  remoteSnapshot.forEach(docSnap => {
    remoteItems.push({ ...docSnap.data(), id: docSnap.id } as unknown as T)
  })
  const remoteMap = new Map(remoteItems.map(item => [getItemId(item), item]))
  
  // Merge: last write wins
  const batch = writeBatch(firestore)
  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()])
  
  for (const id of allIds) {
    const local = localMap.get(id)
    const remote = remoteMap.get(id)
    
    if (local && remote) {
      // Both exist: last write wins
      const localTime = local.updatedAt || 0
      const remoteTime = remote.updatedAt || 0
      
      if (localTime > remoteTime) {
        // Push local to remote
        const docRef = doc(firestore, collectionPath, id)
        batch.set(docRef, local)
      } else if (remoteTime > localTime) {
        // Pull remote to local
        await saveLocalItem(remote)
      }
      // If equal, no action needed
    } else if (local && !remote) {
      // Only local: push to remote
      const docRef = doc(firestore, collectionPath, id)
      batch.set(docRef, local)
    } else if (!local && remote) {
      // Only remote: pull to local
      await saveLocalItem(remote)
    }
  }
  
  await batch.commit()
}

// Sync workouts
async function syncWorkouts(userId: string): Promise<void> {
  await syncCollection<Workout>(
    userId,
    'workouts',
    () => db.workouts.toArray(),
    (workout) => workout.id,
    async (workout) => {
      await db.workouts.put(workout)
    }
  )
}

// Sync settings (special case: single record with id=1)
async function syncSettings(userId: string): Promise<void> {
  const collectionPath = getUserCollectionPath(userId, 'settings')
  const docRef = doc(firestore, collectionPath, 'user-settings')
  
  // Get local settings
  const localSettings = await settingsDb.getSettings()
  
  // Get remote settings
  const remoteSnapshot = await getDocs(collection(firestore, collectionPath))
  let remoteSettings: UserSettings | null = null
  let remoteTime = 0
  remoteSnapshot.forEach(docSnap => {
    if (docSnap.id === 'user-settings') {
      const data = docSnap.data() as UserSettings
      remoteSettings = data
      remoteTime = data.updatedAt || 0
    }
  })
  
  const localTime = localSettings.updatedAt || 0
  
  if (!remoteSettings || localTime > remoteTime) {
    // Push local to remote
    await setDoc(docRef, localSettings)
  } else if (remoteTime > localTime && remoteSettings) {
    // Pull remote to local
    await db.settings.put(remoteSettings, 1)
  }
}

// Sync machine defaults
async function syncMachineDefaults(userId: string): Promise<void> {
  await syncCollection<MachineDefaults>(
    userId,
    'machineDefaults',
    () => db.machineDefaults.toArray(),
    (defaults) => defaults.machineId,
    async (defaults) => {
      await db.machineDefaults.put(defaults)
    }
  )
}

// Sync plans
async function syncPlans(userId: string): Promise<void> {
  await syncCollection<Plan>(
    userId,
    'plans',
    () => db.plans.toArray(),
    (plan) => plan.id,
    async (plan) => {
      await db.plans.put(plan)
    }
  )
}

// Sync machine customizations
async function syncMachineCustomizations(userId: string): Promise<void> {
  await syncCollection<UserMachineCustomization>(
    userId,
    'machineCustomizations',
    () => machineCustomizationsDb.getAllCustomizations(),
    (customization) => customization.machineId,
    async (customization) => {
      await machineCustomizationsDb.saveCustomization(customization)
    }
  )
}

// Perform full bidirectional sync
export async function performFullSync(userId: string): Promise<boolean> {
  if (!isOnline.value) {
    syncStatus.value = 'offline'
    return false
  }
  
  try {
    syncStatus.value = 'syncing'
    syncError.value = null
    
    // Sync all collections
    await Promise.all([
      syncWorkouts(userId),
      syncSettings(userId),
      syncMachineDefaults(userId),
      syncPlans(userId),
      syncMachineCustomizations(userId)
    ])
    
    lastSyncTime.value = Date.now()
    syncStatus.value = 'idle'
    return true
  } catch (error) {
    console.error('Sync failed:', error)
    syncError.value = error instanceof Error ? error.message : 'Sync failed'
    syncStatus.value = 'error'
    return false
  }
}

// Push a single workout to Firestore (for real-time sync on save)
export async function pushWorkout(userId: string, workout: Workout): Promise<boolean> {
  if (!isOnline.value) return false
  
  try {
    const docRef = doc(firestore, getUserCollectionPath(userId, 'workouts'), workout.id)
    await setDoc(docRef, workout)
    return true
  } catch (error) {
    console.error('Failed to push workout:', error)
    return false
  }
}

// Push settings to Firestore
export async function pushSettings(userId: string, settings: UserSettings): Promise<boolean> {
  if (!isOnline.value) return false
  
  try {
    const docRef = doc(firestore, getUserCollectionPath(userId, 'settings'), 'user-settings')
    await setDoc(docRef, settings)
    return true
  } catch (error) {
    console.error('Failed to push settings:', error)
    return false
  }
}

// Push machine defaults to Firestore
export async function pushMachineDefaults(userId: string, defaults: MachineDefaults): Promise<boolean> {
  if (!isOnline.value) return false
  
  try {
    const docRef = doc(firestore, getUserCollectionPath(userId, 'machineDefaults'), defaults.machineId)
    await setDoc(docRef, defaults)
    return true
  } catch (error) {
    console.error('Failed to push machine defaults:', error)
    return false
  }
}

// Push a plan to Firestore
export async function pushPlan(userId: string, plan: Plan): Promise<boolean> {
  if (!isOnline.value) return false
  
  try {
    const docRef = doc(firestore, getUserCollectionPath(userId, 'plans'), plan.id)
    await setDoc(docRef, plan)
    return true
  } catch (error) {
    console.error('Failed to push plan:', error)
    return false
  }
}

// Push a machine customization to Firestore
export async function pushMachineCustomization(userId: string, customization: UserMachineCustomization): Promise<boolean> {
  if (!isOnline.value) return false
  
  try {
    const docRef = doc(firestore, getUserCollectionPath(userId, 'machineCustomizations'), customization.machineId)
    await setDoc(docRef, customization)
    return true
  } catch (error) {
    console.error('Failed to push machine customization:', error)
    return false
  }
}

// Auto-sync on reconnection
let autoSyncUserId: string | null = null

export function enableAutoSync(userId: string) {
  autoSyncUserId = userId
  
  // Sync immediately if online
  if (isOnline.value) {
    performFullSync(userId)
  }
}

export function disableAutoSync() {
  autoSyncUserId = null
}

// Listen for online event to trigger sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    if (autoSyncUserId) {
      await performFullSync(autoSyncUserId)
    }
  })
}
