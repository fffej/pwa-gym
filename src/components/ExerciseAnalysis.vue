<script setup lang="ts">
import { ref, computed } from 'vue'
import ProgressChart, { type DataPoint } from './ProgressChart.vue'
import type { ExerciseMetrics } from '@/utils/metrics'

const props = defineProps<{
  machineName: string
  metrics: ExerciseMetrics[]
}>()

const emit = defineEmits<{
  'back': []
}>()

type MetricType = 'volume' | 'maxWeight' | 'bestE1RM'

const selectedMetric = ref<MetricType>('bestE1RM')

const metricOptions: { value: MetricType; label: string; color: string; unit: string }[] = [
  { value: 'bestE1RM', label: 'Est. 1RM', color: '#5ecc97', unit: 'kg' },
  { value: 'maxWeight', label: 'Max Weight', color: '#4a90d9', unit: 'kg' },
  { value: 'volume', label: 'Volume', color: '#e07a5f', unit: 'kg' }
]

const currentMetricOption = computed(() => 
  metricOptions.find(m => m.value === selectedMetric.value)!
)

// Format date for chart labels
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Chart data based on selected metric
const chartData = computed<DataPoint[]>(() => {
  return props.metrics.map(m => ({
    label: formatDateLabel(m.date),
    value: m[selectedMetric.value]
  }))
})

// Summary statistics
const stats = computed(() => {
  if (props.metrics.length === 0) {
    return { current: 0, peak: 0, average: 0, trend: 0, workoutCount: 0 }
  }
  
  const values = props.metrics.map(m => m[selectedMetric.value])
  const current = values[values.length - 1]
  const peak = Math.max(...values)
  const average = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
  
  // Calculate trend (percentage change from first to last)
  let trend = 0
  if (values.length >= 2 && values[0] > 0) {
    trend = Math.round(((current - values[0]) / values[0]) * 100)
  }
  
  return {
    current,
    peak,
    average,
    trend,
    workoutCount: props.metrics.length
  }
})

// Format large numbers
function formatValue(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }
  return value.toFixed(1)
}
</script>

<template>
  <div class="exercise-analysis">
    <div class="analysis-header">
      <button class="back-btn" @click="emit('back')">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <div class="header-info">
        <h2>{{ machineName }}</h2>
        <span class="workout-count">{{ stats.workoutCount }} workouts tracked</span>
      </div>
    </div>

    <div v-if="metrics.length === 0" class="no-data">
      <div class="no-data-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 3v18h18"/>
          <path d="M18 17V9"/>
          <path d="M13 17V5"/>
          <path d="M8 17v-3"/>
        </svg>
      </div>
      <p>Not enough data to show progress yet.</p>
      <p class="hint">Complete more workouts with this exercise to see trends.</p>
    </div>

    <template v-else>
      <!-- Metric selector -->
      <div class="metric-tabs">
        <button 
          v-for="option in metricOptions" 
          :key="option.value"
          class="metric-tab"
          :class="{ active: selectedMetric === option.value }"
          :style="{ '--tab-color': option.color }"
          @click="selectedMetric = option.value"
        >
          {{ option.label }}
        </button>
      </div>

      <!-- Stats cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-label">Current</span>
          <span class="stat-value" :style="{ color: currentMetricOption.color }">
            {{ formatValue(stats.current) }}
            <span class="stat-unit">{{ currentMetricOption.unit }}</span>
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Peak</span>
          <span class="stat-value">
            {{ formatValue(stats.peak) }}
            <span class="stat-unit">{{ currentMetricOption.unit }}</span>
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Average</span>
          <span class="stat-value">
            {{ formatValue(stats.average) }}
            <span class="stat-unit">{{ currentMetricOption.unit }}</span>
          </span>
        </div>
        <div class="stat-card">
          <span class="stat-label">Trend</span>
          <span 
            class="stat-value trend"
            :class="{ positive: stats.trend > 0, negative: stats.trend < 0 }"
          >
            <template v-if="stats.trend > 0">+</template>{{ stats.trend }}%
          </span>
        </div>
      </div>

      <!-- Chart -->
      <div class="chart-container">
        <h3 class="chart-title">Progress Over Time</h3>
        <ProgressChart 
          :data="chartData"
          :color="currentMetricOption.color"
          :height="220"
          :unit="currentMetricOption.unit"
        />
      </div>

      <!-- Recent sessions -->
      <div class="recent-sessions">
        <h3>Recent Sessions</h3>
        <div class="sessions-list">
          <div 
            v-for="(metric, index) in [...metrics].reverse().slice(0, 5)" 
            :key="metric.date"
            class="session-row"
          >
            <span class="session-date">{{ formatDateLabel(metric.date) }}</span>
            <div class="session-stats">
              <span class="session-stat">
                <strong>{{ metric.totalSets }}</strong> sets
              </span>
              <span class="session-stat">
                <strong>{{ metric.maxWeight }}</strong> kg max
              </span>
              <span class="session-stat e1rm">
                <strong>{{ metric.bestE1RM }}</strong> e1RM
              </span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.exercise-analysis {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
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

.header-info h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.workout-count {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 1rem;
}

.no-data-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--color-bg-secondary);
  border-radius: 50%;
  color: var(--color-text-muted);
  margin-bottom: 1rem;
}

.no-data p {
  color: var(--color-text-secondary);
  margin: 0.25rem 0;
}

.no-data .hint {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.metric-tabs {
  display: flex;
  gap: 0.5rem;
  background: var(--color-bg-secondary);
  padding: 0.35rem;
  border-radius: 8px;
}

.metric-tab {
  flex: 1;
  padding: 0.6rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  font-size: 0.8rem;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.metric-tab:hover:not(.active) {
  background: rgba(255, 255, 255, 0.05);
}

.metric-tab.active {
  background: var(--color-bg-tertiary);
  color: var(--tab-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 8px;
  padding: 0.75rem 1rem;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-family: 'Poppins', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.stat-unit {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--color-text-muted);
}

.stat-value.trend.positive {
  color: var(--color-accent-teal);
}

.stat-value.trend.negative {
  color: var(--color-accent-coral);
}

.chart-container {
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 8px;
  padding: 1rem;
}

.chart-title {
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 1rem 0;
}

.recent-sessions {
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 8px;
  padding: 1rem;
}

.recent-sessions h3 {
  font-family: 'Poppins', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.75rem 0;
}

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.session-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(74, 144, 217, 0.1);
}

.session-row:last-child {
  border-bottom: none;
}

.session-date {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  min-width: 60px;
}

.session-stats {
  display: flex;
  gap: 1rem;
}

.session-stat {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.session-stat strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

.session-stat.e1rm strong {
  color: var(--color-accent-teal);
}
</style>

