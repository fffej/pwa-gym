<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePlansStore } from '@/stores/plans'
import { useMachinesStore } from '@/stores/machines'
import type { PlanExercise, Machine, GripType } from '@/types/workout'

const router = useRouter()
const route = useRoute()
const plansStore = usePlansStore()
const machinesStore = useMachinesStore()

const isNewPlan = computed(() => route.path.endsWith('/plans/new') || route.name === 'plan-new' || route.params.id === 'new')
const planId = computed(() => isNewPlan.value ? null : route.params.id as string)

const planName = ref('')
const planDescription = ref('')
const exercises = ref<PlanExercise[]>([])
const isSaving = ref(false)
const hasChanges = ref(false)

// Machine picker state
const showMachinePicker = ref(false)
const searchQuery = ref('')
const selectedMachine = ref<Machine | null>(null)
const selectedAttachmentId = ref<string | null>(null)
const selectedGrip = ref<GripType | null>(null)

const filteredMachines = computed(() => {
  if (!searchQuery.value) return machinesStore.machines
  const query = searchQuery.value.toLowerCase()
  return machinesStore.machines.filter(m =>
    m.name.toLowerCase().includes(query) ||
    m.muscles.some(muscle => muscle.toLowerCase().includes(query))
  )
})

const hasAttachments = computed(() =>
  selectedMachine.value !== null && selectedMachine.value.attachments.length > 0
)

const selectedAttachment = computed(() => {
  if (!selectedMachine.value || !selectedAttachmentId.value) return null
  return selectedMachine.value.attachments.find(a => a.id === selectedAttachmentId.value)
})

onMounted(async () => {
  await plansStore.initialize()
  
  if (!isNewPlan.value && planId.value) {
    const existingPlan = plansStore.getPlanById(planId.value)
    if (existingPlan) {
      planName.value = existingPlan.name
      planDescription.value = existingPlan.description ?? ''
      exercises.value = [...existingPlan.exercises]
    } else {
      // Plan not found, redirect to plans list
      router.push('/plans')
    }
  }
})

// Track changes
watch([planName, planDescription, exercises], () => {
  hasChanges.value = true
}, { deep: true })

function goBack() {
  if (hasChanges.value && (planName.value || exercises.value.length > 0)) {
    if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
      router.push('/plans')
    }
  } else {
    router.push('/plans')
  }
}

function getMachineName(machineId: string): string {
  const machine = machinesStore.getMachineById(machineId)
  return machine?.name ?? machineId
}

function getAttachmentName(machineId: string, attachmentId?: string): string {
  if (!attachmentId) return ''
  const machine = machinesStore.getMachineById(machineId)
  const attachment = machine?.attachments.find(a => a.id === attachmentId)
  return attachment?.name ?? ''
}

function formatGrip(grip?: GripType): string {
  if (!grip) return ''
  return grip.charAt(0).toUpperCase() + grip.slice(1)
}

function openMachinePicker() {
  showMachinePicker.value = true
  searchQuery.value = ''
  selectedMachine.value = null
  selectedAttachmentId.value = null
  selectedGrip.value = null
}

function closeMachinePicker() {
  showMachinePicker.value = false
  selectedMachine.value = null
  selectedAttachmentId.value = null
  selectedGrip.value = null
}

function selectMachine(machine: Machine) {
  selectedMachine.value = machine
  selectedAttachmentId.value = null
  selectedGrip.value = null
  
  if (machine.attachments.length === 0) {
    addExercise()
  }
}

function selectAttachment(attachmentId: string) {
  selectedAttachmentId.value = attachmentId
  const attachment = selectedMachine.value?.attachments.find(a => a.id === attachmentId)
  if (attachment && attachment.grips.length === 1) {
    selectedGrip.value = attachment.grips[0] ?? null
  } else {
    selectedGrip.value = null
  }
}

function addExercise() {
  if (!selectedMachine.value) return
  
  const exercise: PlanExercise = {
    machineId: selectedMachine.value.id,
    attachmentId: selectedAttachmentId.value ?? undefined,
    grip: selectedGrip.value ?? undefined
  }
  
  exercises.value.push(exercise)
  closeMachinePicker()
}

function removeExercise(index: number) {
  exercises.value.splice(index, 1)
}

function moveExercise(index: number, direction: 'up' | 'down') {
  const newIndex = direction === 'up' ? index - 1 : index + 1
  if (newIndex < 0 || newIndex >= exercises.value.length) return
  
  const temp = exercises.value[index]
  const other = exercises.value[newIndex]
  if (temp && other) {
    exercises.value[index] = other
    exercises.value[newIndex] = temp
  }
}

async function savePlan() {
  if (!planName.value.trim()) {
    alert('Please enter a plan name')
    return
  }
  
  isSaving.value = true
  try {
    if (isNewPlan.value) {
      const plan = await plansStore.createPlan(planName.value.trim(), planDescription.value.trim() || undefined)
      await plansStore.updatePlan(plan.id, { exercises: exercises.value })
    } else if (planId.value) {
      await plansStore.updatePlan(planId.value, {
        name: planName.value.trim(),
        description: planDescription.value.trim() || undefined,
        exercises: exercises.value
      })
    }
    hasChanges.value = false
    router.push('/plans')
  } finally {
    isSaving.value = false
  }
}

function formatMuscle(muscle: string): string {
  return muscle.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}
</script>

<template>
  <div class="plan-editor">
    <header class="header">
      <button class="back-btn" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>{{ isNewPlan ? 'New Plan' : 'Edit Plan' }}</h1>
    </header>

    <div class="content">
      <!-- Plan Details -->
      <div class="form-section">
        <label class="form-label" for="plan-name">Plan Name</label>
        <input
          id="plan-name"
          v-model="planName"
          type="text"
          class="form-input"
          placeholder="e.g., Upper Body, Push Day..."
        />
      </div>

      <div class="form-section">
        <label class="form-label" for="plan-description">Description (optional)</label>
        <input
          id="plan-description"
          v-model="planDescription"
          type="text"
          class="form-input"
          placeholder="Brief description of the workout..."
        />
      </div>

      <!-- Exercises List -->
      <div class="exercises-section">
        <div class="section-header">
          <h2>Exercises</h2>
          <span class="exercise-count">{{ exercises.length }}</span>
        </div>

        <div v-if="exercises.length === 0" class="empty-exercises">
          <p>No exercises added yet</p>
        </div>

        <div v-else class="exercises-list">
          <div
            v-for="(exercise, index) in exercises"
            :key="index"
            class="exercise-item"
          >
            <div class="exercise-info">
              <span class="exercise-number">{{ index + 1 }}</span>
              <div class="exercise-details">
                <span class="exercise-name">{{ getMachineName(exercise.machineId) }}</span>
                <span v-if="exercise.attachmentId || exercise.grip" class="exercise-config">
                  {{ getAttachmentName(exercise.machineId, exercise.attachmentId) }}
                  <template v-if="exercise.attachmentId && exercise.grip"> · </template>
                  {{ formatGrip(exercise.grip) }}
                </span>
              </div>
            </div>
            <div class="exercise-actions">
              <button
                class="action-btn"
                :disabled="index === 0"
                @click="moveExercise(index, 'up')"
                title="Move up"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 15l-6-6-6 6"/>
                </svg>
              </button>
              <button
                class="action-btn"
                :disabled="index === exercises.length - 1"
                @click="moveExercise(index, 'down')"
                title="Move down"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              <button
                class="action-btn delete"
                @click="removeExercise(index)"
                title="Remove"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button class="add-exercise-btn" @click="openMachinePicker">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Exercise
        </button>
      </div>

      <button
        class="save-btn"
        :disabled="isSaving || !planName.trim()"
        @click="savePlan"
      >
        {{ isSaving ? 'Saving...' : 'Save Plan' }}
      </button>
    </div>

    <!-- Machine Picker Modal -->
    <div v-if="showMachinePicker" class="modal-overlay" @click="closeMachinePicker">
      <div class="modal picker-modal" @click.stop>
        <div class="picker-header">
          <h3>{{ selectedMachine ? 'Configure Exercise' : 'Select Exercise' }}</h3>
          <button class="close-btn" @click="closeMachinePicker">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <!-- Machine Selection -->
        <div v-if="!selectedMachine" class="picker-content">
          <div class="search-container">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search exercises..."
              class="search-input"
            />
          </div>

          <div class="machines-list">
            <button
              v-for="machine in filteredMachines"
              :key="machine.id"
              class="machine-item"
              @click="selectMachine(machine)"
            >
              <span class="machine-name">{{ machine.name }}</span>
              <span class="machine-muscles">{{ machine.muscles.slice(0, 2).map(formatMuscle).join(', ') }}</span>
            </button>
          </div>
        </div>

        <!-- Attachment/Grip Selection -->
        <div v-else class="picker-content">
          <div class="selected-machine-info">
            <h4>{{ selectedMachine.name }}</h4>
            <p>{{ selectedMachine.muscles.map(formatMuscle).join(', ') }}</p>
          </div>

          <div v-if="hasAttachments" class="config-section">
            <h5>Select Attachment</h5>
            <div class="option-grid">
              <button
                v-for="attachment in selectedMachine.attachments"
                :key="attachment.id"
                class="option-btn"
                :class="{ active: selectedAttachmentId === attachment.id }"
                @click="selectAttachment(attachment.id)"
              >
                {{ attachment.name }}
              </button>
            </div>
          </div>

          <div v-if="selectedAttachment && selectedAttachment.grips.length > 1" class="config-section">
            <h5>Select Grip</h5>
            <div class="option-grid">
              <button
                v-for="grip in selectedAttachment.grips"
                :key="grip"
                class="option-btn"
                :class="{ active: selectedGrip === grip }"
                @click="selectedGrip = grip"
              >
                {{ formatGrip(grip) }}
              </button>
            </div>
          </div>

          <div class="picker-actions">
            <button class="picker-back-btn" @click="selectedMachine = null">
              Back
            </button>
            <button
              class="picker-add-btn"
              :disabled="hasAttachments && selectedAttachmentId === null"
              @click="addExercise"
            >
              Add to Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plan-editor {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--color-bg-primary);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid rgba(74, 144, 217, 0.1);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 4px;
  color: var(--color-gold);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.4);
}

.header h1 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.content {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.form-section {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  font-family: 'Poppins', sans-serif;
}

.form-input::placeholder {
  color: var(--color-text-muted);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-gold);
}

.exercises-section {
  flex: 1;
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.section-header h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin: 0;
}

.exercise-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 0.5rem;
  background: rgba(74, 144, 217, 0.15);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-gold);
}

.empty-exercises {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
  background: var(--color-bg-secondary);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.exercise-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.1);
  border-radius: 8px;
}

.exercise-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
  flex: 1;
}

.exercise-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: rgba(74, 144, 217, 0.1);
  border-radius: 50%;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-gold);
  flex-shrink: 0;
}

.exercise-details {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.exercise-name {
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.exercise-config {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.exercise-actions {
  display: flex;
  gap: 0.25rem;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: rgba(74, 144, 217, 0.1);
  color: var(--color-gold);
}

.action-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.action-btn.delete:hover {
  background: rgba(224, 122, 95, 0.1);
  color: var(--color-accent-coral);
}

.add-exercise-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: transparent;
  border: 2px dashed rgba(74, 144, 217, 0.3);
  border-radius: 8px;
  color: var(--color-gold);
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.add-exercise-btn:hover {
  background: rgba(74, 144, 217, 0.05);
  border-color: var(--color-gold);
}

.save-btn {
  padding: 1rem;
  background: var(--color-gold);
  border: none;
  border-radius: 8px;
  color: var(--color-bg-primary);
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: auto;
}

.save-btn:hover:not(:disabled) {
  background: var(--color-gold-light);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--color-bg-primary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(74, 144, 217, 0.1);
}

.picker-header h3 {
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
  transition: color 0.2s;
}

.close-btn:hover {
  color: var(--color-text-primary);
}

.picker-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.5rem 1.5rem;
}

.search-container {
  position: relative;
  margin-bottom: 1rem;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
}

.search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 8px;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  font-family: 'Poppins', sans-serif;
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--color-gold);
}

.machines-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 50vh;
  overflow-y: auto;
}

.machine-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.875rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
}

.machine-item:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.3);
}

.machine-name {
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.machine-muscles {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.selected-machine-info {
  text-align: center;
  margin-bottom: 1.5rem;
}

.selected-machine-info h4 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.25rem 0;
}

.selected-machine-info p {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  margin: 0;
}

.config-section {
  margin-bottom: 1.25rem;
}

.config-section h5 {
  font-family: 'Poppins', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 0.75rem 0;
  letter-spacing: 0.05em;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}

.option-btn {
  padding: 0.75rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-family: 'Poppins', sans-serif;
  cursor: pointer;
  transition: all 0.15s ease;
}

.option-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.3);
}

.option-btn.active {
  background: rgba(74, 144, 217, 0.15);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.picker-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.picker-back-btn {
  flex: 1;
  padding: 0.875rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.picker-back-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.4);
}

.picker-add-btn {
  flex: 2;
  padding: 0.875rem;
  background: var(--color-gold);
  border: none;
  border-radius: 8px;
  color: var(--color-bg-primary);
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.picker-add-btn:hover:not(:disabled) {
  background: var(--color-gold-light);
}

.picker-add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

