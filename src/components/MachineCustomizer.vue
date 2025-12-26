<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMachinesStore } from '@/stores/machines'
import type { Machine, MachineExercise, Attachment, MuscleGroup, GripType } from '@/types/workout'

const props = defineProps<{
  machine: Machine
}>()

const emit = defineEmits<{
  close: []
}>()

const machinesStore = useMachinesStore()

// Tabs
type TabType = 'exercises' | 'attachments' | 'settings'
const activeTab = ref<TabType>('exercises')

// Add exercise form
const showAddExercise = ref(false)
const newExerciseName = ref('')
const newExerciseMuscles = ref<MuscleGroup[]>([])
const newExerciseDescription = ref('')

// Add attachment form
const showAddAttachment = ref(false)
const newAttachmentName = ref('')
const newAttachmentGrips = ref<GripType[]>([])

// Settings form
const restPeriodOverride = ref<number | null>(props.machine.defaultRestPeriod ?? null)
const weightIncrementOverride = ref<number | null>(props.machine.weightIncrement ?? null)

// Available options
const allMuscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'hip-flexors'
]

const allGripTypes: GripType[] = ['pronated', 'supinated', 'neutral', 'mixed']

// Custom exercises
const customExercises = computed(() => 
  props.machine.exercises.filter(e => e.isCustom)
)

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// Toggle muscle selection
function toggleMuscle(muscle: MuscleGroup) {
  const index = newExerciseMuscles.value.indexOf(muscle)
  if (index >= 0) {
    newExerciseMuscles.value.splice(index, 1)
  } else {
    newExerciseMuscles.value.push(muscle)
  }
}

// Toggle grip selection
function toggleGrip(grip: GripType) {
  const index = newAttachmentGrips.value.indexOf(grip)
  if (index >= 0) {
    newAttachmentGrips.value.splice(index, 1)
  } else {
    newAttachmentGrips.value.push(grip)
  }
}

// Add custom exercise
async function addExercise() {
  if (!newExerciseName.value.trim() || newExerciseMuscles.value.length === 0) return

  const exercise: MachineExercise = {
    id: `custom-${generateId()}`,
    name: newExerciseName.value.trim(),
    muscles: [...newExerciseMuscles.value],
    description: newExerciseDescription.value.trim() || undefined,
    isCustom: true
  }

  await machinesStore.addCustomExercise(props.machine.id, exercise)

  // Reset form
  newExerciseName.value = ''
  newExerciseMuscles.value = []
  newExerciseDescription.value = ''
  showAddExercise.value = false
}

// Remove custom exercise
async function removeExercise(exerciseId: string) {
  await machinesStore.removeCustomExercise(props.machine.id, exerciseId)
}

// Add custom attachment
async function addAttachment() {
  if (!newAttachmentName.value.trim()) return

  const attachment: Attachment = {
    id: `custom-${generateId()}`,
    name: newAttachmentName.value.trim(),
    grips: [...newAttachmentGrips.value]
  }

  await machinesStore.addCustomAttachment(props.machine.id, attachment)

  // Reset form
  newAttachmentName.value = ''
  newAttachmentGrips.value = []
  showAddAttachment.value = false
}

// Save settings
async function saveSettings() {
  await machinesStore.updateMachineOverrides(props.machine.id, {
    defaultRestPeriod: restPeriodOverride.value ?? undefined,
    weightIncrement: weightIncrementOverride.value ?? undefined
  })
}

// Format muscle name
function formatMuscle(muscle: string): string {
  return muscle.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}
</script>

<template>
  <div class="customizer-overlay" @click.self="emit('close')">
    <div class="customizer-modal">
      <header class="modal-header">
        <h2>Customize {{ machine.name }}</h2>
        <button class="close-btn" @click="emit('close')">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button 
          class="tab" 
          :class="{ active: activeTab === 'exercises' }"
          @click="activeTab = 'exercises'"
        >
          Exercises
        </button>
        <button 
          class="tab" 
          :class="{ active: activeTab === 'attachments' }"
          @click="activeTab = 'attachments'"
        >
          Attachments
        </button>
        <button 
          class="tab" 
          :class="{ active: activeTab === 'settings' }"
          @click="activeTab = 'settings'"
        >
          Settings
        </button>
      </div>

      <div class="modal-content">
        <!-- Exercises Tab -->
        <div v-if="activeTab === 'exercises'" class="tab-content">
          <p class="tab-description">
            Add custom exercises for this machine. These are personal and won't affect other users.
          </p>

          <!-- Custom Exercises List -->
          <div v-if="customExercises.length > 0" class="custom-list">
            <div 
              v-for="exercise in customExercises" 
              :key="exercise.id" 
              class="custom-item"
            >
              <div class="custom-item-info">
                <span class="custom-item-name">{{ exercise.name }}</span>
                <span class="custom-item-meta">
                  {{ exercise.muscles.map(formatMuscle).join(', ') }}
                </span>
              </div>
              <button class="remove-btn" @click="removeExercise(exercise.id)">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Add Exercise Form -->
          <div v-if="showAddExercise" class="add-form">
            <div class="form-group">
              <label>Exercise Name</label>
              <input 
                v-model="newExerciseName" 
                type="text" 
                placeholder="e.g., Single Arm Row"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Target Muscles</label>
              <div class="chip-selector">
                <button
                  v-for="muscle in allMuscleGroups"
                  :key="muscle"
                  class="chip"
                  :class="{ active: newExerciseMuscles.includes(muscle) }"
                  @click="toggleMuscle(muscle)"
                >
                  {{ formatMuscle(muscle) }}
                </button>
              </div>
            </div>

            <div class="form-group">
              <label>Description (optional)</label>
              <textarea 
                v-model="newExerciseDescription" 
                placeholder="How to perform this exercise..."
                class="form-textarea"
                rows="3"
              />
            </div>

            <div class="form-actions">
              <button class="btn-secondary" @click="showAddExercise = false">Cancel</button>
              <button 
                class="btn-primary" 
                :disabled="!newExerciseName.trim() || newExerciseMuscles.length === 0"
                @click="addExercise"
              >
                Add Exercise
              </button>
            </div>
          </div>

          <button 
            v-else 
            class="add-btn"
            @click="showAddExercise = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Custom Exercise
          </button>
        </div>

        <!-- Attachments Tab -->
        <div v-if="activeTab === 'attachments'" class="tab-content">
          <p class="tab-description">
            Add custom attachments that you use with this machine.
          </p>

          <!-- Current Attachments -->
          <div class="attachments-list">
            <div 
              v-for="attachment in machine.attachments" 
              :key="attachment.id" 
              class="attachment-item"
            >
              <span class="attachment-name">{{ attachment.name }}</span>
              <span class="attachment-grips">
                {{ attachment.grips.length > 0 ? attachment.grips.join(', ') : 'No grips' }}
              </span>
            </div>
          </div>

          <!-- Add Attachment Form -->
          <div v-if="showAddAttachment" class="add-form">
            <div class="form-group">
              <label>Attachment Name</label>
              <input 
                v-model="newAttachmentName" 
                type="text" 
                placeholder="e.g., MAG Grip"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label>Available Grips</label>
              <div class="chip-selector">
                <button
                  v-for="grip in allGripTypes"
                  :key="grip"
                  class="chip"
                  :class="{ active: newAttachmentGrips.includes(grip) }"
                  @click="toggleGrip(grip)"
                >
                  {{ grip.charAt(0).toUpperCase() + grip.slice(1) }}
                </button>
              </div>
            </div>

            <div class="form-actions">
              <button class="btn-secondary" @click="showAddAttachment = false">Cancel</button>
              <button 
                class="btn-primary" 
                :disabled="!newAttachmentName.trim()"
                @click="addAttachment"
              >
                Add Attachment
              </button>
            </div>
          </div>

          <button 
            v-else 
            class="add-btn"
            @click="showAddAttachment = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Custom Attachment
          </button>
        </div>

        <!-- Settings Tab -->
        <div v-if="activeTab === 'settings'" class="tab-content">
          <p class="tab-description">
            Override default settings for this machine.
          </p>

          <div class="form-group">
            <label>Default Rest Period (seconds)</label>
            <input 
              v-model.number="restPeriodOverride" 
              type="number" 
              min="0"
              step="15"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Weight Increment (kg)</label>
            <input 
              v-model.number="weightIncrementOverride" 
              type="number" 
              min="0"
              step="0.5"
              class="form-input"
            />
          </div>

          <button class="btn-primary" @click="saveSettings">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.customizer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.customizer-modal {
  background: var(--color-bg-primary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 12px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(74, 144, 217, 0.1);
}

.modal-header h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.tabs {
  display: flex;
  border-bottom: 1px solid rgba(74, 144, 217, 0.1);
}

.tab {
  flex: 1;
  padding: 0.875rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-secondary);
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab:hover {
  color: var(--color-text-primary);
}

.tab.active {
  color: var(--color-gold);
  border-bottom-color: var(--color-gold);
}

.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.tab-description {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0;
}

.custom-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.custom-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.1);
  border-radius: 8px;
}

.custom-item-info {
  flex: 1;
  min-width: 0;
}

.custom-item-name {
  display: block;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.125rem;
}

.custom-item-meta {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.attachment-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.1);
  border-radius: 8px;
}

.attachment-name {
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  color: var(--color-text-primary);
}

.attachment-grips {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.add-form {
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.1);
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-input,
.form-textarea {
  padding: 0.75rem 1rem;
  background: var(--color-bg-tertiary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 6px;
  color: var(--color-text-primary);
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--color-gold);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.chip-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip {
  padding: 0.375rem 0.75rem;
  background: var(--color-bg-tertiary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 20px;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-family: 'Poppins', sans-serif;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chip:hover {
  border-color: rgba(74, 144, 217, 0.3);
}

.chip.active {
  background: rgba(74, 144, 217, 0.2);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
  padding: 0.625rem 1.25rem;
  border-radius: 6px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary {
  background: var(--color-gold);
  border: none;
  color: var(--color-bg-primary);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-gold-light);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  border: 1px solid rgba(74, 144, 217, 0.2);
  color: var(--color-text-secondary);
}

.btn-secondary:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.3);
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: transparent;
  border: 2px dashed rgba(74, 144, 217, 0.2);
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-btn:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-gold);
  color: var(--color-gold);
}
</style>

