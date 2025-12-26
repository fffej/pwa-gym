<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue?: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const trackRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)

const rpeLabels: Record<number, string> = {
  0: 'No effort',
  1: 'Very light',
  2: 'Light',
  3: 'Light',
  4: 'Moderate',
  5: 'Moderate',
  6: 'Moderate',
  7: 'Hard',
  8: 'Hard',
  9: 'Very hard',
  10: 'Max effort'
}

const currentValue = computed(() => props.modelValue ?? 5)
const hasValue = computed(() => props.modelValue !== undefined)

const thumbPosition = computed(() => {
  return `${(currentValue.value / 10) * 100}%`
})

// Get color based on RPE value (for the thumb and value display)
const rpeColor = computed(() => {
  const val = currentValue.value
  if (val <= 3) return 'var(--color-accent-teal)'
  if (val <= 6) return 'var(--color-gold)'
  if (val <= 8) return 'var(--color-accent-coral)'
  return '#e05555'
})

function getValueFromPosition(clientX: number): number {
  if (!trackRef.value) return 5
  
  const rect = trackRef.value.getBoundingClientRect()
  const x = clientX - rect.left
  const percentage = Math.max(0, Math.min(1, x / rect.width))
  return Math.round(percentage * 10)
}

function handleTrackClick(event: MouseEvent | TouchEvent) {
  if (props.disabled) return
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const value = getValueFromPosition(clientX)
  emit('update:modelValue', value)
}

function handleDragStart(event: MouseEvent | TouchEvent) {
  if (props.disabled) return
  event.preventDefault()
  isDragging.value = true
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const value = getValueFromPosition(clientX)
  emit('update:modelValue', value)
}

function handleDragMove(event: MouseEvent | TouchEvent) {
  if (!isDragging.value || props.disabled) return
  
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
  const value = getValueFromPosition(clientX)
  emit('update:modelValue', value)
}

function handleDragEnd() {
  isDragging.value = false
}

onMounted(() => {
  document.addEventListener('mousemove', handleDragMove)
  document.addEventListener('mouseup', handleDragEnd)
  document.addEventListener('touchmove', handleDragMove, { passive: true })
  document.addEventListener('touchend', handleDragEnd)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDragMove)
  document.removeEventListener('mouseup', handleDragEnd)
  document.removeEventListener('touchmove', handleDragMove)
  document.removeEventListener('touchend', handleDragEnd)
})
</script>

<template>
  <div class="rpe-slider" :class="{ disabled, dragging: isDragging }">
    <div class="rpe-row">
      <span class="rpe-label">RPE</span>
      
      <div 
        ref="trackRef"
        class="rpe-track"
        @mousedown="handleDragStart"
        @touchstart.prevent="handleDragStart"
        @click="handleTrackClick"
      >
        <div class="track-gradient"></div>
        <div class="track-markers">
          <span v-for="n in 11" :key="n - 1" class="marker">{{ n - 1 }}</span>
        </div>
        <div 
          class="thumb"
          :class="{ active: hasValue }"
          :style="{ left: thumbPosition, borderColor: rpeColor }"
        >
          <span class="thumb-value" :style="{ color: rpeColor }">{{ currentValue }}</span>
        </div>
      </div>
      
      <span class="rpe-description" :style="{ color: rpeColor }">
        {{ hasValue ? rpeLabels[currentValue] : 'Tap to set' }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.rpe-slider {
  padding: 0.5rem 0;
  user-select: none;
  -webkit-user-select: none;
}

.rpe-slider.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.rpe-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.rpe-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  flex-shrink: 0;
  min-width: 2rem;
}

.rpe-track {
  position: relative;
  flex: 1;
  height: 32px;
  cursor: pointer;
  touch-action: none;
}

.track-gradient {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 8px;
  transform: translateY(-50%);
  border-radius: 4px;
  background: linear-gradient(
    to right,
    #81b29a 0%,      /* green - easy */
    #81b29a 20%,
    #c9b44a 40%,     /* yellow - moderate */
    #e0a86e 60%,     /* orange - getting hard */
    #e07a5f 75%,     /* coral - hard */
    #e05555 100%     /* red - max effort */
  );
  opacity: 0.8;
}

.track-markers {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(8px);
  display: flex;
  justify-content: space-between;
  padding: 0 2px;
}

.marker {
  font-size: 0.6rem;
  color: var(--color-text-muted);
  opacity: 0.6;
  width: 12px;
  text-align: center;
}

.thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 28px;
  height: 28px;
  background: var(--color-bg-primary);
  border: 3px solid var(--color-gold);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s ease, box-shadow 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.thumb.active {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

.rpe-slider.dragging .thumb {
  transform: translate(-50%, -50%) scale(1.1);
}

.thumb-value {
  font-size: 0.75rem;
  font-weight: 700;
  font-family: 'Poppins', sans-serif;
}

.rpe-description {
  font-size: 0.7rem;
  font-weight: 500;
  flex-shrink: 0;
  min-width: 4.5rem;
  text-align: right;
}
</style>
