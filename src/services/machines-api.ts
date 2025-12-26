import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore'
import { firestore } from './firebase'
import type { Machine, UserMachineCustomization, MachineExercise, Attachment } from '@/types/workout'
import { machineCustomizationsDb } from './db'
import machinesData from '@/data/machines.json'

// Collection names
const MACHINES_COLLECTION = 'machines'
const CUSTOMIZATIONS_COLLECTION = 'machineCustomizations'

// Get the user's customizations subcollection path
function getUserCustomizationsPath(userId: string): string {
  return `users/${userId}/${CUSTOMIZATIONS_COLLECTION}`
}

// Global machines API (read-only for regular users)
export const globalMachinesApi = {
  // Fetch all machines from Firestore
  async fetchAllMachines(): Promise<Machine[]> {
    try {
      const machinesRef = collection(firestore, MACHINES_COLLECTION)
      const snapshot = await getDocs(machinesRef)
      
      if (snapshot.empty) {
        // Fall back to local JSON if Firestore is empty
        console.log('Firestore machines collection empty, using local data')
        return machinesData.machines as Machine[]
      }
      
      const machines: Machine[] = []
      snapshot.forEach(doc => {
        machines.push({ ...doc.data(), id: doc.id } as Machine)
      })
      
      return machines
    } catch (error) {
      console.warn('Failed to fetch machines from Firestore, using local data:', error)
      // Fall back to local JSON on error (e.g., offline)
      return machinesData.machines as Machine[]
    }
  },

  // Get a single machine by ID
  async getMachine(machineId: string): Promise<Machine | undefined> {
    try {
      const machineRef = doc(firestore, MACHINES_COLLECTION, machineId)
      const snapshot = await getDoc(machineRef)
      
      if (snapshot.exists()) {
        return { ...snapshot.data(), id: snapshot.id } as Machine
      }
      
      // Fall back to local JSON
      return (machinesData.machines as Machine[]).find(m => m.id === machineId)
    } catch (error) {
      console.warn('Failed to fetch machine from Firestore, using local data:', error)
      return (machinesData.machines as Machine[]).find(m => m.id === machineId)
    }
  },

  // Seed Firestore with local machines data (admin function)
  async seedMachines(): Promise<void> {
    const batch = writeBatch(firestore)
    
    for (const machine of machinesData.machines) {
      const machineRef = doc(firestore, MACHINES_COLLECTION, machine.id)
      batch.set(machineRef, machine)
    }
    
    await batch.commit()
    console.log('Successfully seeded machines to Firestore')
  }
}

// User customizations API
export const userCustomizationsApi = {
  // Fetch all customizations for a user from Firestore
  async fetchAllCustomizations(userId: string): Promise<UserMachineCustomization[]> {
    try {
      const customizationsRef = collection(firestore, getUserCustomizationsPath(userId))
      const snapshot = await getDocs(customizationsRef)
      
      const customizations: UserMachineCustomization[] = []
      snapshot.forEach(doc => {
        customizations.push({ ...doc.data(), machineId: doc.id } as UserMachineCustomization)
      })
      
      return customizations
    } catch (error) {
      console.warn('Failed to fetch customizations from Firestore:', error)
      // Fall back to local IndexedDB
      return await machineCustomizationsDb.getAllCustomizations()
    }
  },

  // Get customization for a specific machine
  async getCustomization(userId: string, machineId: string): Promise<UserMachineCustomization | undefined> {
    try {
      const customizationRef = doc(firestore, getUserCustomizationsPath(userId), machineId)
      const snapshot = await getDoc(customizationRef)
      
      if (snapshot.exists()) {
        return { ...snapshot.data(), machineId: snapshot.id } as UserMachineCustomization
      }
      
      return undefined
    } catch (error) {
      console.warn('Failed to fetch customization from Firestore:', error)
      return await machineCustomizationsDb.getCustomization(machineId)
    }
  },

  // Save a customization to Firestore
  async saveCustomization(userId: string, customization: UserMachineCustomization): Promise<void> {
    const customizationRef = doc(firestore, getUserCustomizationsPath(userId), customization.machineId)
    await setDoc(customizationRef, { ...customization, updatedAt: Date.now() })
    
    // Also save to local IndexedDB
    await machineCustomizationsDb.saveCustomization(customization)
  },

  // Delete a customization
  async deleteCustomization(userId: string, machineId: string): Promise<void> {
    const customizationRef = doc(firestore, getUserCustomizationsPath(userId), machineId)
    await deleteDoc(customizationRef)
    
    // Also delete from local IndexedDB
    await machineCustomizationsDb.deleteCustomization(machineId)
  },

  // Add a custom exercise to a machine
  async addCustomExercise(
    userId: string, 
    machineId: string, 
    exercise: MachineExercise
  ): Promise<void> {
    const existing = await this.getCustomization(userId, machineId)
    
    const customization: UserMachineCustomization = {
      machineId,
      customExercises: existing?.customExercises ?? [],
      customAttachments: existing?.customAttachments ?? [],
      overrides: existing?.overrides ?? {},
      updatedAt: Date.now()
    }
    
    // Add the new exercise (marked as custom)
    customization.customExercises.push({ ...exercise, isCustom: true })
    
    await this.saveCustomization(userId, customization)
  },

  // Remove a custom exercise from a machine
  async removeCustomExercise(
    userId: string, 
    machineId: string, 
    exerciseId: string
  ): Promise<void> {
    const existing = await this.getCustomization(userId, machineId)
    if (!existing) return
    
    existing.customExercises = existing.customExercises.filter(e => e.id !== exerciseId)
    existing.updatedAt = Date.now()
    
    await this.saveCustomization(userId, existing)
  },

  // Add a custom attachment to a machine
  async addCustomAttachment(
    userId: string, 
    machineId: string, 
    attachment: Attachment
  ): Promise<void> {
    const existing = await this.getCustomization(userId, machineId)
    
    const customization: UserMachineCustomization = {
      machineId,
      customExercises: existing?.customExercises ?? [],
      customAttachments: existing?.customAttachments ?? [],
      overrides: existing?.overrides ?? {},
      updatedAt: Date.now()
    }
    
    customization.customAttachments.push(attachment)
    
    await this.saveCustomization(userId, customization)
  },

  // Remove a custom attachment
  async removeCustomAttachment(
    userId: string, 
    machineId: string, 
    attachmentId: string
  ): Promise<void> {
    const existing = await this.getCustomization(userId, machineId)
    if (!existing) return
    
    existing.customAttachments = existing.customAttachments.filter(a => a.id !== attachmentId)
    existing.updatedAt = Date.now()
    
    await this.saveCustomization(userId, existing)
  },

  // Update machine overrides
  async updateOverrides(
    userId: string, 
    machineId: string, 
    overrides: UserMachineCustomization['overrides']
  ): Promise<void> {
    const existing = await this.getCustomization(userId, machineId)
    
    const customization: UserMachineCustomization = {
      machineId,
      customExercises: existing?.customExercises ?? [],
      customAttachments: existing?.customAttachments ?? [],
      overrides: { ...existing?.overrides, ...overrides },
      updatedAt: Date.now()
    }
    
    await this.saveCustomization(userId, customization)
  }
}

// Merge global machines with user customizations
export function mergeMachinesWithCustomizations(
  machines: Machine[],
  customizations: UserMachineCustomization[]
): Machine[] {
  const customizationMap = new Map(customizations.map(c => [c.machineId, c]))
  
  return machines.map(machine => {
    const customization = customizationMap.get(machine.id)
    
    if (!customization) {
      return machine
    }
    
    // Merge custom exercises
    const mergedExercises = [
      ...machine.exercises,
      ...customization.customExercises
    ]
    
    // Merge custom attachments
    const mergedAttachments = [
      ...machine.attachments,
      ...customization.customAttachments
    ]
    
    // Apply overrides
    return {
      ...machine,
      exercises: mergedExercises,
      attachments: mergedAttachments,
      defaultRestPeriod: customization.overrides.defaultRestPeriod ?? machine.defaultRestPeriod,
      weightIncrement: customization.overrides.weightIncrement ?? machine.weightIncrement
    }
  })
}

