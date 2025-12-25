<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useMachinesStore } from '@/stores/machines'
import { useWorkoutStore } from '@/stores/workout'
import type { Machine, RoomLocation, MuscleGroup, GripType } from '@/types/workout'

const router = useRouter()
const machinesStore = useMachinesStore()
const workoutStore = useWorkoutStore()

const searchQuery = ref('')
const selectedLocation = ref<RoomLocation | null>(null)
const selectedMuscle = ref<MuscleGroup | null>(null)
const selectedMachine = ref<Machine | null>(null)
const selectedAttachmentId = ref<string | null>(null)
const selectedGrip = ref<GripType | null>(null)

const filteredMachines = computed(() => {
  let machines = machinesStore.machines

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    machines = machines.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.muscles.some(muscle => muscle.toLowerCase().includes(query))
    )
  }

  // Filter by location
  if (selectedLocation.value) {
    machines = machines.filter(m => m.location === selectedLocation.value)
  }

  // Filter by muscle group
  if (selectedMuscle.value) {
    machines = machines.filter(m => m.muscles.includes(selectedMuscle.value!))
  }

  return machines
})

const hasAttachments = computed(() => 
  selectedMachine.value !== null && selectedMachine.value.attachments.length > 0
)

const selectedAttachment = computed(() => {
  if (!selectedMachine.value || !selectedAttachmentId.value) return null
  return selectedMachine.value.attachments.find(a => a.id === selectedAttachmentId.value)
})

function selectLocation(location: RoomLocation | null) {
  selectedLocation.value = selectedLocation.value === location ? null : location
}

function selectMuscle(muscle: MuscleGroup | null) {
  selectedMuscle.value = selectedMuscle.value === muscle ? null : muscle
}

function selectMachine(machine: Machine) {
  selectedMachine.value = machine
  selectedAttachmentId.value = null
  selectedGrip.value = null
  
  // If no attachments, go straight to adding
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

async function addExercise() {
  if (!selectedMachine.value) return
  
  await workoutStore.addExercise(
    selectedMachine.value.id,
    selectedAttachmentId.value ?? undefined,
    selectedGrip.value ?? undefined
  )
  
  router.push('/workout')
}

function goBack() {
  if (selectedMachine.value) {
    selectedMachine.value = null
    selectedAttachmentId.value = null
    selectedGrip.value = null
  } else {
    router.push('/workout')
  }
}

function formatMuscle(muscle: string): string {
  return muscle.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
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
      <h1>{{ selectedMachine ? 'Configure' : 'Add Exercise' }}</h1>
    </header>

    <!-- Machine Selection View -->
    <div v-if="!selectedMachine" class="selection-view">
      <!-- Search -->
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

      <!-- Location Filter -->
      <div class="filter-section">
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

      <!-- Machine List -->
      <div class="machines-list">
        <button
          v-for="machine in filteredMachines"
          :key="machine.id"
          class="machine-card"
          @click="selectMachine(machine)"
        >
          <div class="machine-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M6.5 6.5h11v11h-11z"/>
              <path d="M3 12h3M18 12h3M12 3v3M12 18v3"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <div class="machine-info">
            <span class="machine-name">{{ machine.name }}</span>
            <span class="machine-meta">
              {{ machine.location }} · {{ machine.muscles.slice(0, 2).map(formatMuscle).join(', ') }}
            </span>
          </div>
          <div class="machine-arrow">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </button>

        <div v-if="filteredMachines.length === 0" class="no-results">
          <p>No exercises found</p>
        </div>
      </div>
    </div>

    <!-- Attachment/Grip Selection View -->
    <div v-else class="config-view">
      <div class="selected-machine">
        <div class="machine-icon large">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6.5 6.5h11v11h-11z"/>
            <path d="M3 12h3M18 12h3M12 3v3M12 18v3"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
        <h2>{{ selectedMachine.name }}</h2>
        <p>{{ selectedMachine.muscles.map(formatMuscle).join(', ') }}</p>
      </div>

      <!-- Attachment Selection -->
      <div v-if="hasAttachments" class="config-section">
        <h3>Select Attachment</h3>
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

      <!-- Grip Selection -->
      <div v-if="selectedAttachment && selectedAttachment.grips.length > 1" class="config-section">
        <h3>Select Grip</h3>
        <div class="option-grid">
          <button
            v-for="grip in selectedAttachment.grips"
            :key="grip"
            class="option-btn"
            :class="{ active: selectedGrip === grip }"
            @click="selectedGrip = grip"
          >
            {{ grip.charAt(0).toUpperCase() + grip.slice(1) }}
          </button>
        </div>
      </div>

      <!-- Add Button -->
      <button 
        class="add-btn"
        :disabled="hasAttachments && selectedAttachmentId === null"
        @click="addExercise"
      >
        Add to Workout
      </button>
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
  font-family: 'Cinzel', serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.selection-view {
  flex: 1;
  padding: 1rem 1.5rem;
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
  font-family: 'Raleway', sans-serif;
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
  font-family: 'Raleway', sans-serif;
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

.machines-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.machine-card {
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

.machine-card:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.3);
}

.machine-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(74, 144, 217, 0.1);
  border-radius: 8px;
  color: var(--color-gold);
  flex-shrink: 0;
}

.machine-icon.large {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.machine-info {
  flex: 1;
  min-width: 0;
}

.machine-name {
  display: block;
  font-family: 'Cinzel', serif;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.25rem;
}

.machine-meta {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.machine-arrow {
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.no-results {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
}

/* Config View */
.config-view {
  flex: 1;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
}

.selected-machine {
  text-align: center;
  margin-bottom: 2rem;
}

.selected-machine .machine-icon {
  margin: 0 auto 1rem;
}

.selected-machine h2 {
  font-family: 'Cinzel', serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.5rem 0;
}

.selected-machine p {
  color: var(--color-text-muted);
  font-size: 0.85rem;
  margin: 0;
}

.config-section {
  margin-bottom: 1.5rem;
}

.config-section h3 {
  font-family: 'Cinzel', serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 0.75rem 0;
  letter-spacing: 0.05em;
}

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
  font-family: 'Raleway', sans-serif;
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

.add-btn {
  margin-top: auto;
  padding: 1rem;
  background: var(--color-gold);
  border: none;
  border-radius: 8px;
  color: var(--color-bg-primary);
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-btn:hover:not(:disabled) {
  background: var(--color-gold-light);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

