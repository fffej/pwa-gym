<script setup lang="ts">
import { computed } from 'vue'

export interface DataPoint {
  label: string
  value: number
}

const props = withDefaults(defineProps<{
  data: DataPoint[]
  height?: number
  color?: string
  showDots?: boolean
  unit?: string
}>(), {
  height: 200,
  color: '#4a90d9',
  showDots: true,
  unit: ''
})

// Chart dimensions
const chartPadding = { top: 20, right: 20, bottom: 40, left: 50 }
const chartWidth = 320

const innerWidth = computed(() => chartWidth - chartPadding.left - chartPadding.right)
const innerHeight = computed(() => props.height - chartPadding.top - chartPadding.bottom)

// Calculate min and max values with some padding
const minValue = computed(() => {
  if (props.data.length === 0) return 0
  const min = Math.min(...props.data.map(d => d.value))
  return Math.floor(min * 0.9)
})

const maxValue = computed(() => {
  if (props.data.length === 0) return 100
  const max = Math.max(...props.data.map(d => d.value))
  return Math.ceil(max * 1.1)
})

const valueRange = computed(() => maxValue.value - minValue.value || 1)

// Scale functions
function scaleX(index: number): number {
  if (props.data.length <= 1) return chartPadding.left + innerWidth.value / 2
  return chartPadding.left + (index / (props.data.length - 1)) * innerWidth.value
}

function scaleY(value: number): number {
  const normalized = (value - minValue.value) / valueRange.value
  return chartPadding.top + innerHeight.value - (normalized * innerHeight.value)
}

// Generate the line path
const linePath = computed(() => {
  if (props.data.length === 0) return ''
  
  return props.data
    .map((d, i) => {
      const x = scaleX(i)
      const y = scaleY(d.value)
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`
    })
    .join(' ')
})

// Generate area path for gradient fill
const areaPath = computed(() => {
  if (props.data.length === 0) return ''
  
  const baseline = chartPadding.top + innerHeight.value
  const firstX = scaleX(0)
  const lastX = scaleX(props.data.length - 1)
  
  const linePart = props.data
    .map((d, i) => {
      const x = scaleX(i)
      const y = scaleY(d.value)
      return i === 0 ? `M ${firstX} ${baseline} L ${x} ${y}` : `L ${x} ${y}`
    })
    .join(' ')
  
  return `${linePart} L ${lastX} ${baseline} Z`
})

// Y-axis ticks
const yTicks = computed(() => {
  const tickCount = 5
  const step = valueRange.value / (tickCount - 1)
  return Array.from({ length: tickCount }, (_, i) => {
    const value = minValue.value + (step * i)
    return {
      value: Math.round(value),
      y: scaleY(value)
    }
  })
})

// X-axis labels (show only a subset to avoid overlap)
const xLabels = computed(() => {
  if (props.data.length <= 5) {
    return props.data.map((d, i) => ({ label: d.label, x: scaleX(i) }))
  }
  
  // Show first, last, and middle labels
  const indices = [0, Math.floor(props.data.length / 2), props.data.length - 1]
  return indices
    .filter(i => props.data[i] !== undefined)
    .map(i => ({
      label: props.data[i]!.label,
      x: scaleX(i)
    }))
})

// Points for dots
const points = computed(() => {
  return props.data.map((d, i) => ({
    x: scaleX(i),
    y: scaleY(d.value),
    value: d.value,
    label: d.label
  }))
})
</script>

<template>
  <div class="progress-chart">
    <svg 
      :viewBox="`0 0 ${chartWidth} ${height}`" 
      preserveAspectRatio="xMidYMid meet"
      class="chart-svg"
    >
      <defs>
        <linearGradient :id="`gradient-${color.replace('#', '')}`" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" :stop-color="color" stop-opacity="0.3"/>
          <stop offset="100%" :stop-color="color" stop-opacity="0.05"/>
        </linearGradient>
      </defs>

      <!-- Grid lines -->
      <g class="grid-lines">
        <line 
          v-for="tick in yTicks" 
          :key="tick.value"
          :x1="chartPadding.left"
          :y1="tick.y"
          :x2="chartPadding.left + innerWidth"
          :y2="tick.y"
          class="grid-line"
        />
      </g>

      <!-- Y-axis labels -->
      <g class="y-axis">
        <text 
          v-for="tick in yTicks" 
          :key="tick.value"
          :x="chartPadding.left - 8"
          :y="tick.y + 4"
          class="axis-label y-label"
        >
          {{ tick.value }}
        </text>
      </g>

      <!-- X-axis labels -->
      <g class="x-axis">
        <text 
          v-for="label in xLabels" 
          :key="label.label"
          :x="label.x"
          :y="height - 10"
          class="axis-label x-label"
        >
          {{ label.label }}
        </text>
      </g>

      <!-- Area fill -->
      <path 
        v-if="data.length > 0"
        :d="areaPath"
        :fill="`url(#gradient-${color.replace('#', '')})`"
        class="chart-area"
      />

      <!-- Line -->
      <path 
        v-if="data.length > 0"
        :d="linePath"
        fill="none"
        :stroke="color"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="chart-line"
      />

      <!-- Data points -->
      <g v-if="showDots" class="data-points">
        <circle 
          v-for="(point, index) in points" 
          :key="index"
          :cx="point.x"
          :cy="point.y"
          r="4"
          :fill="color"
          class="data-point"
        />
        <circle 
          v-for="(point, index) in points" 
          :key="`inner-${index}`"
          :cx="point.x"
          :cy="point.y"
          r="2"
          fill="var(--color-bg-primary)"
          class="data-point-inner"
        />
      </g>

      <!-- Empty state -->
      <text 
        v-if="data.length === 0"
        :x="chartWidth / 2"
        :y="height / 2"
        class="empty-text"
      >
        No data available
      </text>
    </svg>

    <div v-if="unit" class="chart-unit">{{ unit }}</div>
  </div>
</template>

<style scoped>
.progress-chart {
  position: relative;
  width: 100%;
}

.chart-svg {
  width: 100%;
  height: auto;
}

.grid-line {
  stroke: rgba(74, 144, 217, 0.1);
  stroke-width: 1;
}

.axis-label {
  fill: var(--color-text-muted);
  font-size: 10px;
  font-family: 'Poppins', sans-serif;
}

.y-label {
  text-anchor: end;
}

.x-label {
  text-anchor: middle;
}

.chart-line {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.chart-area {
  opacity: 0.8;
}

.data-point {
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  transition: r 0.2s ease;
}

.data-point:hover {
  r: 6;
}

.empty-text {
  fill: var(--color-text-muted);
  font-size: 14px;
  font-family: 'Poppins', sans-serif;
  text-anchor: middle;
}

.chart-unit {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  font-family: 'Poppins', sans-serif;
}
</style>

