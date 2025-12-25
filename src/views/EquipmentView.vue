<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import machinesData from '@/data/machines.json'
import openingHoursData from '@/data/opening-hours.json'

const router = useRouter()

interface Machine {
  id: string
  name: string
  picture: string
  muscles: string[]
  location: string
  weightType: string
  attachments: { id: string; name: string; grips: string[] }[]
  defaultRestPeriod: number
  weightIncrement: number
  minWeight?: number
  maxWeight?: number
}

interface OpeningHours {
  regularHours: { days: string; hours: string }[]
  specialEvents: { date: string; title: string; hours: string }[]
}

const machines = ref<Machine[]>(machinesData.machines)
const openingHours = ref<OpeningHours>(openingHoursData)

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
</script>

<template>
  <div class="gym-info-view">
    <header class="header">
      <button class="back-btn" @click="router.push('/')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Gym Info</h1>
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
          <div v-for="machine in machinesByLocation[location]" :key="machine.id" class="equipment-card">
            <div class="equipment-image">
              <img :src="getImagePath(machine.picture)" :alt="machine.name" />
            </div>
            <div class="equipment-info">
              <h4 class="equipment-name">{{ machine.name }}</h4>
              <div class="equipment-muscles">
                <span v-for="muscle in machine.muscles" :key="muscle" class="muscle-tag">
                  {{ muscle }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
</style>
