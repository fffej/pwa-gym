<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import machinesData from '@/data/machines.json'
import openingHoursData from '@/data/opening-hours.json'

const router = useRouter()

interface MachineExercise {
  id: string
  name: string
  muscles: string[]
  description?: string
  requiredAttachment?: string
  videoUrl?: string
  isCustom?: boolean
}

interface Machine {
  id: string
  name: string
  picture: string
  exercises: MachineExercise[]
  location: string
  weightType: string
  attachments: { id: string; name: string; grips: string[] }[]
  defaultRestPeriod: number
  weightIncrement: number
  minWeight?: number
  maxWeight?: number
  usage?: string
  videoUrl?: string
}

function getMachineMuscles(machine: Machine): string[] {
  const muscles = new Set<string>()
  machine.exercises.forEach(ex => ex.muscles.forEach(m => muscles.add(m)))
  return Array.from(muscles)
}

interface OpeningHours {
  regularHours: { days: string; hours: string }[]
  specialEvents: { date: string; title: string; hours: string }[]
}

const machines = ref<Machine[]>(machinesData.machines)
const openingHours = ref<OpeningHours>(openingHoursData)

// Selected machine for modal
const selectedMachine = ref<Machine | null>(null)

function openMachineModal(machine: Machine) {
  selectedMachine.value = machine
}

function closeMachineModal() {
  selectedMachine.value = null
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

// Get unique locations for grouping
const locations = computed(() => {
  const locs = [...new Set(machines.value.map(m => m.location))]
  return locs.sort()
})

// Group machines by location
const machinesByLocation = computed(() => {
  const grouped: Record<string, Machine[]> = {}
  for (const loc of locations.value) {
    grouped[loc] = machines.value.filter(m => m.location === loc)
  }
  return grouped
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
    'cable': 'Cable System'
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
              <div class="equipment-muscles">
                <span v-for="muscle in getMachineMuscles(machine)" :key="muscle" class="muscle-tag">
                  {{ muscle }}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>

    <!-- Machine Detail Modal -->
    <Teleport to="body">
      <div v-if="selectedMachine" class="modal-overlay" @click.self="closeMachineModal">
        <div class="modal-content">
          <button class="modal-close" @click="closeMachineModal">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <div class="modal-header">
            <div class="modal-image">
              <img :src="getImagePath(selectedMachine.picture)" :alt="selectedMachine.name" />
            </div>
            <div class="modal-title-section">
              <h2 class="modal-title">{{ selectedMachine.name }}</h2>
              <span class="modal-location">{{ selectedMachine.location }}</span>
            </div>
          </div>

          <div class="modal-body">
            <!-- Muscles targeted -->
            <div class="modal-section">
              <h3 class="modal-section-title">Muscles Targeted</h3>
              <div class="modal-muscles">
                <span v-for="muscle in getMachineMuscles(selectedMachine)" :key="muscle" class="modal-muscle-tag">
                  {{ muscle }}
                </span>
              </div>
            </div>

            <!-- Available Exercises -->
            <div v-if="selectedMachine.exercises.length > 0" class="modal-section">
              <h3 class="modal-section-title">Available Exercises</h3>
              <div class="exercises-list">
                <div v-for="exercise in selectedMachine.exercises" :key="exercise.id" class="exercise-item">
                  <span class="exercise-name">{{ exercise.name }}</span>
                  <span class="exercise-muscles">{{ exercise.muscles.join(', ') }}</span>
                </div>
              </div>
            </div>

            <!-- Equipment details -->
            <div class="modal-section">
              <h3 class="modal-section-title">Equipment Details</h3>
              <div class="modal-details-grid">
                <div class="detail-item">
                  <span class="detail-label">Weight Type</span>
                  <span class="detail-value">{{ formatWeightType(selectedMachine.weightType) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Increment</span>
                  <span class="detail-value">{{ selectedMachine.weightIncrement }}kg</span>
                </div>
                <div v-if="selectedMachine.minWeight" class="detail-item">
                  <span class="detail-label">Min Weight</span>
                  <span class="detail-value">{{ selectedMachine.minWeight }}kg</span>
                </div>
                <div v-if="selectedMachine.maxWeight" class="detail-item">
                  <span class="detail-label">Max Weight</span>
                  <span class="detail-value">{{ selectedMachine.maxWeight }}kg</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Rest Period</span>
                  <span class="detail-value">{{ selectedMachine.defaultRestPeriod }}s</span>
                </div>
              </div>
            </div>

            <!-- Attachments -->
            <div v-if="selectedMachine.attachments.length > 0" class="modal-section">
              <h3 class="modal-section-title">Available Attachments</h3>
              <div class="attachments-list">
                <div v-for="attachment in selectedMachine.attachments" :key="attachment.id" class="attachment-item">
                  <span class="attachment-name">{{ attachment.name }}</span>
                  <span v-if="attachment.grips.length" class="attachment-grips">
                    {{ attachment.grips.join(', ') }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Usage guidance -->
            <div v-if="selectedMachine.usage" class="modal-section">
              <h3 class="modal-section-title">How to Use</h3>
              <p class="usage-text">{{ selectedMachine.usage }}</p>
            </div>

            <!-- Video demonstration -->
            <div v-if="selectedMachine.videoUrl && getYouTubeEmbedUrl(selectedMachine.videoUrl)" class="modal-section">
              <h3 class="modal-section-title">Video Demonstration</h3>
              <div class="video-container">
                <iframe 
                  :src="getYouTubeEmbedUrl(selectedMachine.videoUrl)!" 
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
  margin: 0 0 0.5rem 0;
  line-height: 1.3;
}

.equipment-muscles {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.muscle-tag {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--color-gold);
  background: rgba(74, 144, 217, 0.15);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  text-transform: capitalize;
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
  flex-direction: column;
  gap: 0.25rem;
}

.exercise-name {
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.exercise-muscles {
  font-size: 0.75rem;
  color: var(--color-text-muted);
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
