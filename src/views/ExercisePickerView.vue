<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMachinesStore } from '@/stores/machines'
import { useWorkoutStore } from '@/stores/workout'
import AddCustomExerciseModal from '@/components/AddCustomExerciseModal.vue'
import type { Machine, MachineExercise, RoomLocation, MuscleGroup, GripType } from '@/types/workout'

const router = useRouter()
const machinesStore = useMachinesStore()
const workoutStore = useWorkoutStore()

// Base URL for image paths
const baseUrl = import.meta.env.BASE_URL

function getImagePath(picture: string): string {
  // Remove leading slash and prepend base URL
  const cleanPath = picture.startsWith('/') ? picture.slice(1) : picture
  return `${baseUrl}${cleanPath}`
}

// View mode: 'machines' or 'exercises'
type ViewMode = 'machines' | 'exercises'
const viewMode = ref<ViewMode>('machines')

// Search and filters
const searchQuery = ref('')
const selectedLocation = ref<RoomLocation | null>(null)
const selectedMuscle = ref<MuscleGroup | null>(null)

// Selection state - store machine ID and get machine from store reactively
const selectedMachineId = ref<string | null>(null)
const selectedExercise = ref<MachineExercise | null>(null)
const selectedAttachmentId = ref<string | null>(null)
const selectedGrip = ref<GripType | null>(null)

// Get the selected machine from the store (reactive to store updates)
const selectedMachine = computed(() => {
  if (!selectedMachineId.value) return null
  return machinesStore.getMachineById(selectedMachineId.value) ?? null
})

// Current step in the flow
type SelectionStep = 'browse' | 'exercise' | 'attachment' | 'grip'
const currentStep = ref<SelectionStep>('browse')

// Add exercise modal state
const showAddExerciseModal = ref(false)

// Initialize store on mount
onMounted(async () => {
  await machinesStore.initialize()
})

// Filtered machines (for machine-first view)
const filteredMachines = computed(() => {
  let machines = machinesStore.machines

  if (searchQuery.value) {
    machines = machinesStore.searchMachines(searchQuery.value)
  }

  if (selectedLocation.value) {
    machines = machines.filter(m => m.location === selectedLocation.value)
  }

  if (selectedMuscle.value) {
    machines = machines.filter(m => 
      m.exercises.some(ex => ex.muscles.includes(selectedMuscle.value!))
    )
  }

  return machines
})

// Filtered exercises (for browse-by-muscle view)
const filteredExercises = computed(() => {
  let exercises = machinesStore.allExercises

  if (searchQuery.value) {
    exercises = machinesStore.searchExercises(searchQuery.value)
  }

  if (selectedMuscle.value) {
    exercises = exercises.filter(ex => ex.muscles.includes(selectedMuscle.value!))
  }

  return exercises
})

// Check if machine has attachments
const machineHasAttachments = computed(() => 
  selectedMachine.value !== null && selectedMachine.value.attachments.length > 0
)

// Get the selected attachment
const selectedAttachment = computed(() => {
  if (!selectedMachine.value || !selectedAttachmentId.value) return null
  return selectedMachine.value.attachments.find(a => a.id === selectedAttachmentId.value)
})

// View mode switching
function setViewMode(mode: ViewMode) {
  viewMode.value = mode
  resetSelection()
}

// Reset selection state
function resetSelection() {
  selectedMachineId.value = null
  selectedExercise.value = null
  selectedAttachmentId.value = null
  selectedGrip.value = null
  currentStep.value = 'browse'
}

// Filter helpers
function selectLocation(location: RoomLocation | null) {
  selectedLocation.value = selectedLocation.value === location ? null : location
}

function selectMuscle(muscle: MuscleGroup | null) {
  selectedMuscle.value = selectedMuscle.value === muscle ? null : muscle
}

// Machine selection (machine-first flow)
function selectMachine(machine: Machine) {
  selectedMachineId.value = machine.id
  currentStep.value = 'exercise'
  
  // If machine has only one exercise, auto-select it
  if (machine.exercises.length === 1) {
    selectExerciseFromMachine(machine.exercises[0]!)
  }
}

// Exercise selection from machine
function selectExerciseFromMachine(exercise: MachineExercise) {
  selectedExercise.value = exercise
  
  // If exercise requires a specific attachment, auto-select it
  if (exercise.requiredAttachment) {
    selectedAttachmentId.value = exercise.requiredAttachment
    const attachment = selectedMachine.value?.attachments.find(a => a.id === exercise.requiredAttachment)
    if (attachment && attachment.grips.length > 1) {
      currentStep.value = 'grip'
    } else if (attachment && attachment.grips.length === 1) {
      selectedGrip.value = attachment.grips[0] ?? null
      addExercise()
    } else {
      addExercise()
    }
  } else if (machineHasAttachments.value) {
    currentStep.value = 'attachment'
  } else {
    addExercise()
  }
}

// Exercise selection from browse view
function selectExerciseFromBrowse(exercise: MachineExercise & { machineId: string; machineName: string }) {
  const machine = machinesStore.getMachineById(exercise.machineId)
  if (!machine) return
  
  selectedMachineId.value = machine.id
  selectedExercise.value = exercise
  
  // If exercise requires a specific attachment, auto-select it
  if (exercise.requiredAttachment) {
    selectedAttachmentId.value = exercise.requiredAttachment
    const attachment = machine.attachments.find(a => a.id === exercise.requiredAttachment)
    if (attachment && attachment.grips.length > 1) {
      currentStep.value = 'grip'
    } else if (attachment && attachment.grips.length === 1) {
      selectedGrip.value = attachment.grips[0] ?? null
      addExercise()
    } else {
      addExercise()
    }
  } else if (machine.attachments.length > 0) {
    currentStep.value = 'attachment'
  } else {
    addExercise()
  }
}

// Attachment selection
function selectAttachment(attachmentId: string) {
  selectedAttachmentId.value = attachmentId
  const attachment = selectedMachine.value?.attachments.find(a => a.id === attachmentId)
  
  if (attachment && attachment.grips.length > 1) {
    currentStep.value = 'grip'
  } else if (attachment && attachment.grips.length === 1) {
    selectedGrip.value = attachment.grips[0] ?? null
    addExercise()
  } else {
    addExercise()
  }
}

// Add exercise to workout
async function addExercise() {
  if (!selectedMachine.value || !selectedExercise.value) return
  
  await workoutStore.addExercise(
    selectedMachine.value.id,
    selectedExercise.value.id,
    selectedAttachmentId.value ?? undefined,
    selectedGrip.value ?? undefined
  )
  
  router.push('/workout')
}

// Navigation
function goBack() {
  if (currentStep.value === 'grip') {
    currentStep.value = 'attachment'
  } else if (currentStep.value === 'attachment') {
    currentStep.value = 'exercise'
    selectedAttachmentId.value = null
  } else if (currentStep.value === 'exercise') {
    currentStep.value = 'browse'
    selectedMachineId.value = null
    selectedExercise.value = null
  } else {
    router.push('/workout')
  }
}

// Formatting helpers
function formatMuscle(muscle: string): string {
  return muscle.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

function getExerciseMuscles(exercise: MachineExercise): string {
  return exercise.muscles.slice(0, 2).map(formatMuscle).join(', ')
}

// Add exercise modal functions
function openAddExerciseModal() {
  showAddExerciseModal.value = true
}

function closeAddExerciseModal() {
  showAddExerciseModal.value = false
}

function onExerciseSaved() {
  // The machines store is reactive, so the exercise list will update automatically
  closeAddExerciseModal()
}
</script>

<template>
  <div class="exercise-picker">
    <header class="header">
      <button class="back-btn" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>
        <template v-if="currentStep === 'browse'">Add Exercise</template>
        <template v-else-if="currentStep === 'exercise'">Select Exercise</template>
        <template v-else-if="currentStep === 'attachment'">Select Attachment</template>
        <template v-else>Select Grip</template>
      </h1>
    </header>

    <!-- Browse View -->
    <div v-if="currentStep === 'browse'" class="browse-view">
      <!-- View Mode Tabs -->
      <div class="view-tabs">
        <button 
          class="view-tab" 
          :class="{ active: viewMode === 'machines' }"
          @click="setViewMode('machines')"
        >
          By Machine
        </button>
        <button 
          class="view-tab" 
          :class="{ active: viewMode === 'exercises' }"
          @click="setViewMode('exercises')"
        >
          By Muscle
        </button>
      </div>

      <!-- Search -->
      <div class="search-container">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="viewMode === 'machines' ? 'Search machines...' : 'Search exercises...'"
          class="search-input"
        />
      </div>

      <!-- Location Filter (machines view only) -->
      <div v-if="viewMode === 'machines'" class="filter-section">
        <span class="filter-label">Room</span>
        <div class="filter-chips">
          <button
            v-for="location in machinesStore.locations"
            :key="location"
            class="filter-chip"
            :class="{ active: selectedLocation === location }"
            @click="selectLocation(location)"
          >
            {{ location }}
          </button>
        </div>
      </div>

      <!-- Muscle Filter -->
      <div class="filter-section">
        <span class="filter-label">Muscle Group</span>
        <div class="filter-chips scrollable">
          <button
            v-for="muscle in machinesStore.muscleGroups"
            :key="muscle"
            class="filter-chip"
            :class="{ active: selectedMuscle === muscle }"
            @click="selectMuscle(muscle)"
          >
            {{ formatMuscle(muscle) }}
          </button>
        </div>
      </div>

      <!-- Machine List (machines view) -->
      <div v-if="viewMode === 'machines'" class="items-list">
        <button
          v-for="machine in filteredMachines"
          :key="machine.id"
          class="item-card"
          @click="selectMachine(machine)"
        >
          <div class="item-icon">
            <img :src="getImagePath(machine.picture)" :alt="machine.name" class="machine-thumb" />
          </div>
          <div class="item-info">
            <span class="item-name">{{ machine.name }}</span>
            <span class="item-meta">
              {{ machine.location }} · {{ machine.exercises.length }} exercise{{ machine.exercises.length !== 1 ? 's' : '' }}
            </span>
          </div>
          <div class="item-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </button>

        <div v-if="filteredMachines.length === 0" class="no-results">
          <p>No machines found</p>
        </div>
      </div>

      <!-- Exercise List (exercises view) -->
      <div v-else class="items-list">
        <button
          v-for="exercise in filteredExercises"
          :key="exercise.id"
          class="item-card"
          @click="selectExerciseFromBrowse(exercise)"
        >
          <div class="item-icon">
            <img :src="getImagePath(exercise.machinePicture)" :alt="exercise.machineName" class="machine-thumb" />
          </div>
          <div class="item-info">
            <span class="item-name">{{ exercise.name }}</span>
            <span class="item-meta">
              {{ exercise.machineName }} · {{ getExerciseMuscles(exercise) }}
            </span>
          </div>
          <div v-if="exercise.isCustom" class="custom-badge">Custom</div>
          <div class="item-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </button>

        <div v-if="filteredExercises.length === 0" class="no-results">
          <p>No exercises found</p>
        </div>
      </div>
    </div>

    <!-- Exercise Selection View (from machine) -->
    <div v-else-if="currentStep === 'exercise' && selectedMachine" class="selection-view">
      <div class="selected-header">
        <div class="selected-icon">
          <img :src="getImagePath(selectedMachine.picture)" :alt="selectedMachine.name" class="machine-thumb-large" />
        </div>
        <div class="selected-info">
          <h2>{{ selectedMachine.name }}</h2>
          <p>{{ selectedMachine.location }}</p>
        </div>
      </div>

      <div class="exercises-list">
        <button
          v-for="exercise in selectedMachine.exercises"
          :key="exercise.id"
          class="exercise-option"
          @click="selectExerciseFromMachine(exercise)"
        >
          <div class="exercise-details">
            <span class="exercise-name">{{ exercise.name }}</span>
            <span class="exercise-muscles">{{ getExerciseMuscles(exercise) }}</span>
          </div>
          <div v-if="exercise.isCustom" class="custom-badge">Custom</div>
          <div class="item-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </button>

        <!-- Add Exercise Button -->
        <button class="add-exercise-btn" @click="openAddExerciseModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Exercise
        </button>
      </div>

      <!-- Add Custom Exercise Modal -->
      <AddCustomExerciseModal
        :machine-id="selectedMachine.id"
        :machine-name="selectedMachine.name"
        :attachments="selectedMachine.attachments"
        :is-open="showAddExerciseModal"
        @close="closeAddExerciseModal"
        @saved="onExerciseSaved"
      />
    </div>

    <!-- Attachment Selection View -->
    <div v-else-if="currentStep === 'attachment' && selectedMachine && selectedExercise" class="selection-view">
      <div class="selected-header">
        <div class="selected-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        </div>
        <div class="selected-info">
          <h2>{{ selectedExercise.name }}</h2>
          <p>{{ selectedMachine.name }}</p>
        </div>
      </div>

      <h3 class="section-title">Select Attachment</h3>
      <div class="option-grid">
        <button
          v-for="attachment in selectedMachine.attachments"
          :key="attachment.id"
          class="option-btn"
          @click="selectAttachment(attachment.id)"
        >
          {{ attachment.name }}
        </button>
      </div>
    </div>

    <!-- Grip Selection View -->
    <div v-else-if="currentStep === 'grip' && selectedMachine && selectedExercise && selectedAttachment" class="selection-view">
      <div class="selected-header">
        <div class="selected-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        </div>
        <div class="selected-info">
          <h2>{{ selectedExercise.name }}</h2>
          <p>{{ selectedMachine.name }} · {{ selectedAttachment.name }}</p>
        </div>
      </div>

      <h3 class="section-title">Select Grip</h3>
      <div class="option-grid">
        <button
          v-for="grip in selectedAttachment.grips"
          :key="grip"
          class="option-btn"
          :class="{ active: selectedGrip === grip }"
          @click="selectedGrip = grip; addExercise()"
        >
          {{ grip.charAt(0).toUpperCase() + grip.slice(1) }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exercise-picker {
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

/* Browse View */
.browse-view {
  flex: 1;
  padding: 1rem 1.5rem;
}

/* View Mode Tabs */
.view-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  background: var(--color-bg-secondary);
  padding: 0.25rem;
  border-radius: 8px;
}

.view-tab {
  flex: 1;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--color-text-secondary);
  font-family: 'Poppins', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.view-tab:hover {
  color: var(--color-text-primary);
}

.view-tab.active {
  background: var(--color-bg-tertiary);
  color: var(--color-gold);
}

.search-container {
  position: relative;
  margin-bottom: 1.25rem;
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

.filter-section {
  margin-bottom: 1.25rem;
}

.filter-label {
  display: block;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.filter-chips.scrollable {
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch;
}

.filter-chips.scrollable::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  padding: 0.5rem 0.875rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 20px;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-family: 'Poppins', sans-serif;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-chip:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.3);
}

.filter-chip.active {
  background: rgba(74, 144, 217, 0.2);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

/* Items List */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.item-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
}

.item-card:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.3);
}

.item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(74, 144, 217, 0.1);
  border-radius: 8px;
  color: var(--color-gold);
  flex-shrink: 0;
  overflow: hidden;
}

.machine-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.machine-thumb-large {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  display: block;
  font-family: 'Poppins', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.item-meta {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-arrow {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.custom-badge {
  padding: 0.25rem 0.5rem;
  background: rgba(74, 144, 217, 0.2);
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  flex-shrink: 0;
}

.add-exercise-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.875rem 1rem;
  margin-top: 0.5rem;
  background: transparent;
  border: 2px dashed rgba(74, 144, 217, 0.2);
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-exercise-btn:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.no-results {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

/* Selection View */
.selection-view {
  flex: 1;
  padding: 1.5rem;
}

.selected-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.1);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}

.selected-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: rgba(74, 144, 217, 0.15);
  border-radius: 12px;
  color: var(--color-gold);
  flex-shrink: 0;
  overflow: hidden;
}

.selected-info h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.25rem 0;
}

.selected-info p {
  font-size: 0.85rem;
  color: var(--color-text-muted);
  margin: 0;
}

.section-title {
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 1rem 0;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Exercise List */
.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.exercise-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
}

.exercise-option:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.3);
}

.exercise-details {
  flex: 1;
  min-width: 0;
}

.exercise-name {
  display: block;
  font-family: 'Poppins', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.exercise-muscles {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

/* Option Grid */
.option-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.option-btn {
  padding: 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
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
</style>
