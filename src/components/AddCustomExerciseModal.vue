<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useMachinesStore } from '@/stores/machines'
import type { MachineExercise, MuscleGroup, Attachment } from '@/types/workout'

const props = defineProps<{
  machineId: string
  machineName: string
  attachments: Attachment[]
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  saved: [exercise: MachineExercise]
}>()

const machinesStore = useMachinesStore()

// Form state
const exerciseName = ref('')
const selectedMuscles = ref<MuscleGroup[]>([])
const selectedAttachmentId = ref<string | null>(null)
const isSaving = ref(false)

// All available muscle groups
const allMuscleGroups: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'core', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'hip-flexors'
]

// Validation
const isValid = computed(() => 
  exerciseName.value.trim().length > 0 && selectedMuscles.value.length > 0
)

// Reset form when modal opens/closes
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})

function resetForm() {
  exerciseName.value = ''
  selectedMuscles.value = []
  selectedAttachmentId.value = null
  isSaving.value = false
}

// Generate unique ID for custom exercises
function generateId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`
}

// Toggle muscle selection
function toggleMuscle(muscle: MuscleGroup) {
  const index = selectedMuscles.value.indexOf(muscle)
  if (index >= 0) {
    selectedMuscles.value.splice(index, 1)
  } else {
    selectedMuscles.value.push(muscle)
  }
}

// Format muscle name for display
function formatMuscle(muscle: string): string {
  return muscle.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

// Handle form submission
async function handleSubmit() {
  if (!isValid.value || isSaving.value) return

  isSaving.value = true

  try {
    const exercise: MachineExercise = {
      id: generateId(),
      name: exerciseName.value.trim(),
      muscles: [...selectedMuscles.value],
      requiredAttachment: selectedAttachmentId.value ?? undefined,
      isCustom: true
    }

    await machinesStore.addCustomExercise(props.machineId, exercise)
    
    emit('saved', exercise)
    emit('close')
  } catch (error) {
    console.error('Failed to save custom exercise:', error)
  } finally {
    isSaving.value = false
  }
}

// Handle cancel
function handleCancel() {
  emit('close')
}

// Close on escape key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleCancel()
  }
}
</script>

<template>
  <Teleport to="body">
    <div 
      v-if="isOpen" 
      class="modal-overlay" 
      @click.self="handleCancel"
      @keydown="handleKeydown"
    >
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header class="modal-header">
          <h2 id="modal-title">Add Exercise</h2>
          <button class="close-btn" @click="handleCancel" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>

        <div class="modal-body">
          <p class="machine-context">
            Adding to <strong>{{ machineName }}</strong>
          </p>

          <form @submit.prevent="handleSubmit">
            <!-- Exercise Name -->
            <div class="form-group">
              <label for="exercise-name">Exercise Name <span class="required">*</span></label>
              <input 
                id="exercise-name"
                v-model="exerciseName" 
                type="text" 
                placeholder="e.g., Single Arm Row"
                class="form-input"
                autofocus
              />
            </div>

            <!-- Muscle Selection -->
            <div class="form-group">
              <label>Target Muscles <span class="required">*</span></label>
              <div class="muscle-selector">
                <button
                  v-for="muscle in allMuscleGroups"
                  :key="muscle"
                  type="button"
                  class="muscle-chip"
                  :class="{ active: selectedMuscles.includes(muscle) }"
                  @click="toggleMuscle(muscle)"
                >
                  {{ formatMuscle(muscle) }}
                </button>
              </div>
              <p v-if="selectedMuscles.length === 0" class="field-hint">
                Select at least one muscle group
              </p>
            </div>

            <!-- Optional Attachment -->
            <div v-if="attachments.length > 0" class="form-group">
              <label for="attachment">Required Attachment (optional)</label>
              <select 
                id="attachment"
                v-model="selectedAttachmentId" 
                class="form-select"
              >
                <option :value="null">None</option>
                <option 
                  v-for="attachment in attachments" 
                  :key="attachment.id" 
                  :value="attachment.id"
                >
                  {{ attachment.name }}
                </option>
              </select>
            </div>

            <!-- Actions -->
            <div class="form-actions">
              <button type="button" class="btn-secondary" @click="handleCancel">
                Cancel
              </button>
              <button 
                type="submit" 
                class="btn-primary" 
                :disabled="!isValid || isSaving"
              >
                {{ isSaving ? 'Saving...' : 'Add Exercise' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal {
  background: var(--color-bg-primary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 12px;
  width: 100%;
  max-width: 440px;
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

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.machine-context {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0 0 1.5rem 0;
}

.machine-context strong {
  color: var(--color-gold);
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.required {
  color: var(--color-gold);
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 6px;
  color: var(--color-text-primary);
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-gold);
}

.form-input::placeholder {
  color: var(--color-text-muted);
}

.form-select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238892a0' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  padding-right: 2.5rem;
}

.muscle-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.muscle-chip {
  padding: 0.375rem 0.75rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 20px;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-family: 'Poppins', sans-serif;
  cursor: pointer;
  transition: all 0.15s ease;
}

.muscle-chip:hover {
  border-color: rgba(74, 144, 217, 0.3);
}

.muscle-chip.active {
  background: rgba(74, 144, 217, 0.2);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.field-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin: 0.5rem 0 0 0;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(74, 144, 217, 0.1);
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
</style>

