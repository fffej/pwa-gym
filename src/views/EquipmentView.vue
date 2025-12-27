<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useMachinesStore } from '@/stores/machines'
import AddCustomExerciseModal from '@/components/AddCustomExerciseModal.vue'
import openingHoursData from '@/data/opening-hours.json'
import type { Machine, MachineExercise } from '@/types/workout'

const router = useRouter()
const machinesStore = useMachinesStore()

// Initialize the machines store
onMounted(async () => {
  await machinesStore.initialize()
})

interface OpeningHours {
  regularHours: { days: string; hours: string }[]
  specialEvents: { date: string; title: string; hours: string }[]
}

const openingHours = ref<OpeningHours>(openingHoursData)

// Selected machine for modal
const selectedMachine = ref<Machine | null>(null)

// Add/Edit exercise modal state
const showAddExerciseModal = ref(false)
const exerciseToEdit = ref<MachineExercise | undefined>(undefined)

function openMachineModal(machine: Machine) {
  selectedMachine.value = machine
}

function closeMachineModal() {
  selectedMachine.value = null
}

function openAddExerciseModal() {
  exerciseToEdit.value = undefined
  showAddExerciseModal.value = true
}

function openEditExerciseModal(exercise: MachineExercise) {
  exerciseToEdit.value = exercise
  showAddExerciseModal.value = true
}

function closeAddExerciseModal() {
  showAddExerciseModal.value = false
  exerciseToEdit.value = undefined
}

function onExerciseSaved() {
  // The machines store is reactive, so the UI will update automatically
  // Just close the add exercise modal
  closeAddExerciseModal()
}

async function deleteCustomExercise(exercise: MachineExercise) {
  if (!selectedMachineWithCustoms.value) return
  
  if (confirm(`Are you sure you want to delete "${exercise.name}"? This will also affect historical workout records.`)) {
    await machinesStore.removeCustomExercise(selectedMachineWithCustoms.value.id, exercise.id)
  }
}

// Close modal on escape key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && selectedMachine.value) {
    closeMachineModal()
  }
}

// Get the base URL for resolving public assets
const baseUrl = import.meta.env.BASE_URL

function getImagePath(picture: string): string {
  // Remove leading slash and prepend base URL
  const cleanPath = picture.startsWith('/') ? picture.slice(1) : picture
  return `${baseUrl}${cleanPath}`
}

// Get unique locations for grouping (using store's merged machines)
const locations = computed(() => {
  const locs = [...new Set(machinesStore.machines.map(m => m.location))]
  return locs.sort()
})

// Group machines by location (using store's merged machines)
const machinesByLocation = computed(() => {
  const grouped: Record<string, Machine[]> = {}
  for (const loc of locations.value) {
    grouped[loc] = machinesStore.machines.filter(m => m.location === loc)
  }
  return grouped
})

// Get selected machine from store (to get merged version with custom exercises)
const selectedMachineWithCustoms = computed(() => {
  if (!selectedMachine.value) return null
  return machinesStore.getMachineById(selectedMachine.value.id) ?? selectedMachine.value
})

// Check for today's special events
const todaySpecialEvent = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return openingHours.value.specialEvents.find(e => e.date === today)
})

// Check for upcoming special events (next 7 days)
const upcomingEvents = computed(() => {
  const today = new Date()
  const weekFromNow = new Date(today)
  weekFromNow.setDate(weekFromNow.getDate() + 7)
  
  return openingHours.value.specialEvents.filter(e => {
    const eventDate = new Date(e.date)
    return eventDate >= today && eventDate <= weekFromNow
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
})

function formatEventDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatWeightType(type: string): string {
  const types: Record<string, string> = {
    'plates': 'Plate Loaded',
    'stack': 'Weight Stack',
    'cable': 'Cable System',
    'assisted': 'Assisted'
  }
  return types[type] || type
}

// Extract YouTube video ID from various URL formats
function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`
    }
  }
  return null
}
</script>

<template>
  <div class="gym-info-view" @keydown="handleKeydown">
    <header class="header">
      <button class="back-btn" @click="router.push('/')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Info</h1>
    </header>

    <!-- Opening Hours Section -->
    <section class="section">
      <h2 class="section-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
        Opening Hours
      </h2>
      
      <!-- Today's special event alert -->
      <div v-if="todaySpecialEvent" class="special-event-alert">
        <div class="alert-badge">Today</div>
        <div class="alert-content">
          <span class="alert-title">{{ todaySpecialEvent.title }}</span>
          <span class="alert-hours">{{ todaySpecialEvent.hours }}</span>
        </div>
      </div>

      <!-- Regular hours -->
      <div class="hours-grid">
        <div v-for="schedule in openingHours.regularHours" :key="schedule.days" class="hours-row">
          <span class="hours-days">{{ schedule.days }}</span>
          <span class="hours-time">{{ schedule.hours }}</span>
        </div>
      </div>

      <!-- Upcoming events -->
      <div v-if="upcomingEvents.length > 0" class="upcoming-events">
        <h3 class="upcoming-title">Upcoming Changes</h3>
        <div v-for="event in upcomingEvents" :key="event.date" class="event-item">
          <span class="event-date">{{ formatEventDate(event.date) }}</span>
          <span class="event-title">{{ event.title }}</span>
          <span class="event-hours">{{ event.hours }}</span>
        </div>
      </div>
    </section>

    <!-- Equipment Browser Section -->
    <section class="section">
      <h2 class="section-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6.5 6.5h11v11h-11z"/>
          <path d="M3 12h3M18 12h3M12 3v3M12 18v3"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
        Equipment
      </h2>

      <div v-for="location in locations" :key="location" class="location-group">
        <h3 class="location-title">{{ location }}</h3>
        <div class="equipment-grid">
          <button 
            v-for="machine in machinesByLocation[location]" 
            :key="machine.id" 
            class="equipment-card"
            @click="openMachineModal(machine)"
          >
            <div class="equipment-image">
              <img :src="getImagePath(machine.picture)" :alt="machine.name" />
            </div>
            <div class="equipment-info">
              <h4 class="equipment-name">{{ machine.name }}</h4>
            </div>
          </button>
        </div>
      </div>
    </section>

    <!-- Machine Detail Modal -->
    <Teleport to="body">
      <div v-if="selectedMachineWithCustoms" class="modal-overlay" @click.self="closeMachineModal">
        <div class="modal-content">
          <button class="modal-close" @click="closeMachineModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <div class="modal-header">
            <div class="modal-image">
              <img :src="getImagePath(selectedMachineWithCustoms.picture)" :alt="selectedMachineWithCustoms.name" />
            </div>
            <div class="modal-title-section">
              <h2 class="modal-title">{{ selectedMachineWithCustoms.name }}</h2>
              <span class="modal-location">{{ selectedMachineWithCustoms.location }}</span>
            </div>
          </div>

          <div class="modal-body">
            <!-- Available Exercises -->
            <div class="modal-section">
              <h3 class="modal-section-title">Available Exercises</h3>
              <div class="exercises-list">
                <div v-for="exercise in selectedMachineWithCustoms.exercises" :key="exercise.id" class="exercise-item">
                  <div class="exercise-content">
                    <div class="exercise-header">
                      <span class="exercise-name">{{ exercise.name }}</span>
                      <span v-if="exercise.isCustom" class="custom-badge">Custom</span>
                    </div>
                    <span class="exercise-muscles">{{ exercise.muscles.join(', ') }}</span>
                  </div>
                  <div v-if="exercise.isCustom" class="exercise-actions">
                    <button class="exercise-action-btn edit-btn" @click="openEditExerciseModal(exercise)" title="Edit exercise">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="exercise-action-btn delete-btn" @click="deleteCustomExercise(exercise)" title="Delete exercise">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Add Exercise Button -->
              <button class="add-exercise-btn" @click="openAddExerciseModal">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Exercise
              </button>
            </div>

            <!-- Equipment details -->
            <div class="modal-section">
              <h3 class="modal-section-title">Equipment Details</h3>
              <div class="modal-details-grid">
                <div class="detail-item">
                  <span class="detail-label">Weight Type</span>
                  <span class="detail-value">{{ formatWeightType(selectedMachineWithCustoms.weightType) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Increment</span>
                  <span class="detail-value">{{ selectedMachineWithCustoms.weightIncrement }}kg</span>
                </div>
                <div v-if="selectedMachineWithCustoms.minWeight" class="detail-item">
                  <span class="detail-label">Min Weight</span>
                  <span class="detail-value">{{ selectedMachineWithCustoms.minWeight }}kg</span>
                </div>
                <div v-if="selectedMachineWithCustoms.maxWeight" class="detail-item">
                  <span class="detail-label">Max Weight</span>
                  <span class="detail-value">{{ selectedMachineWithCustoms.maxWeight }}kg</span>
                </div>
              </div>
            </div>

            <!-- Attachments -->
            <div v-if="selectedMachineWithCustoms.attachments.length > 0" class="modal-section">
              <h3 class="modal-section-title">Available Attachments</h3>
              <div class="attachments-list">
                <div v-for="attachment in selectedMachineWithCustoms.attachments" :key="attachment.id" class="attachment-item">
                  <span class="attachment-name">{{ attachment.name }}</span>
                  <span v-if="attachment.grips.length" class="attachment-grips">
                    {{ attachment.grips.join(', ') }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Usage guidance -->
            <div v-if="selectedMachineWithCustoms.usage" class="modal-section">
              <h3 class="modal-section-title">How to Use</h3>
              <p class="usage-text">{{ selectedMachineWithCustoms.usage }}</p>
            </div>

            <!-- Video demonstration -->
            <div v-if="selectedMachineWithCustoms.videoUrl && getYouTubeEmbedUrl(selectedMachineWithCustoms.videoUrl)" class="modal-section">
              <h3 class="modal-section-title">Video Demonstration</h3>
              <div class="video-container">
                <iframe 
                  :src="getYouTubeEmbedUrl(selectedMachineWithCustoms.videoUrl)!" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Add/Edit Custom Exercise Modal -->
    <AddCustomExerciseModal
      v-if="selectedMachineWithCustoms"
      :machine-id="selectedMachineWithCustoms.id"
      :machine-name="selectedMachineWithCustoms.name"
      :attachments="selectedMachineWithCustoms.attachments"
      :is-open="showAddExerciseModal"
      :existing-exercise="exerciseToEdit"
      @close="closeAddExerciseModal"
      @saved="onExerciseSaved"
    />
  </div>
</template>

<style scoped>
.gym-info-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
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
}

.back-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.4);
}

.header h1 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0;
}

/* Section styling */
.section {
  margin-bottom: 2.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: 'Poppins', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-gold);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.section-title svg {
  flex-shrink: 0;
}

/* Special event alert */
.special-event-alert {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: rgba(224, 122, 95, 0.15);
  border: 1px solid rgba(224, 122, 95, 0.3);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.alert-badge {
  background: var(--color-accent-coral);
  color: white;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.alert-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.alert-title {
  font-weight: 600;
  color: var(--color-text-primary);
}

.alert-hours {
  color: var(--color-accent-coral);
  font-weight: 500;
}

/* Hours grid */
.hours-grid {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  overflow: hidden;
}

.hours-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.hours-row:last-child {
  border-bottom: none;
}

.hours-days {
  font-weight: 500;
  color: var(--color-text-primary);
}

.hours-time {
  color: var(--color-gold);
  font-weight: 600;
}

/* Upcoming events */
.upcoming-events {
  margin-top: 1.5rem;
}

.upcoming-title {
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.event-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--color-bg-secondary);
  border-radius: 6px;
  margin-bottom: 0.5rem;
}

.event-date {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  min-width: 80px;
}

.event-title {
  font-weight: 500;
  color: var(--color-text-primary);
}

.event-hours {
  font-size: 0.85rem;
  color: var(--color-accent-teal);
  font-weight: 500;
}

/* Location groups */
.location-group {
  margin-bottom: 2rem;
}

.location-title {
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 1rem;
  padding-left: 0.5rem;
  border-left: 3px solid var(--color-gold);
}

/* Equipment grid */
.equipment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.equipment-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
  text-align: left;
  padding: 0;
  font-family: inherit;
}

.equipment-card:hover {
  border-color: var(--color-border-hover);
  transform: translateY(-2px);
}

.equipment-image {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: var(--color-bg-tertiary);
}

.equipment-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.equipment-info {
  padding: 0.875rem;
}

.equipment-name {
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.3;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.modal-close:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.modal-header {
  display: flex;
  gap: 1.25rem;
  padding: 1.5rem;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.modal-image {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  background: var(--color-bg-tertiary);
  border-radius: 12px;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.modal-title-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.5rem;
  padding-right: 3rem;
}

.modal-title {
  font-family: 'Poppins', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.3;
}

.modal-location {
  font-size: 0.85rem;
  color: var(--color-gold);
  font-weight: 500;
}

.modal-body {
  padding: 1.5rem;
}

.modal-section {
  margin-bottom: 1.5rem;
}

.modal-section:last-child {
  margin-bottom: 0;
}

.modal-section-title {
  font-family: 'Poppins', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.modal-muscles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.modal-muscle-tag {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-gold);
  background: rgba(74, 144, 217, 0.15);
  padding: 0.4rem 0.75rem;
  border-radius: 6px;
  text-transform: capitalize;
}

.modal-details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.detail-item {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.detail-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.attachments-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.attachment-item {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.exercise-item {
  background: var(--color-bg-secondary);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.exercise-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.exercise-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.exercise-actions {
  display: flex;
  gap: 0.25rem;
  flex-shrink: 0;
}

.exercise-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 4px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.exercise-action-btn.edit-btn:hover {
  background: rgba(74, 144, 217, 0.1);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.exercise-action-btn.delete-btn:hover {
  background: rgba(224, 122, 95, 0.1);
  border-color: var(--color-accent-coral);
  color: var(--color-accent-coral);
}

.exercise-name {
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.custom-badge {
  padding: 0.15rem 0.4rem;
  background: rgba(74, 144, 217, 0.2);
  border-radius: 4px;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.exercise-muscles {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.add-exercise-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  margin-top: 0.75rem;
  background: transparent;
  border: 2px dashed rgba(74, 144, 217, 0.2);
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-exercise-btn:hover {
  background: var(--color-bg-secondary);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.attachment-name {
  font-weight: 500;
  color: var(--color-text-primary);
}

.attachment-grips {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-transform: capitalize;
}

.usage-text {
  font-size: 0.9rem;
  line-height: 1.7;
  color: var(--color-text-secondary);
  margin: 0;
}

.video-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.video-container iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
