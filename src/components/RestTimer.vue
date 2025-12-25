<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'

const props = defineProps<{
  duration: number
  autoStart?: boolean
}>()

const emit = defineEmits<{
  'complete': []
  'dismiss': []
}>()

const timeRemaining = ref(props.duration)
const isRunning = ref(false)
const intervalId = ref<number | null>(null)

const displayTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60)
  const seconds = timeRemaining.value % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

const progress = computed(() => {
  return ((props.duration - timeRemaining.value) / props.duration) * 100
})

function start() {
  if (isRunning.value) return
  isRunning.value = true
  intervalId.value = window.setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
    } else {
      stop()
      emit('complete')
    }
  }, 1000)
}

function stop() {
  isRunning.value = false
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
}

function reset() {
  stop()
  timeRemaining.value = props.duration
}

function addTime(seconds: number) {
  timeRemaining.value = Math.max(0, timeRemaining.value + seconds)
}

function dismiss() {
  stop()
  emit('dismiss')
}

// Auto-start if prop is set
watch(() => props.autoStart, (shouldStart) => {
  if (shouldStart) {
    reset()
    start()
  }
}, { immediate: true })

onUnmounted(() => {
  stop()
})
</script>

<template>
  <div class="rest-timer">
    <div class="timer-header">
      <span class="timer-label">Rest Timer</span>
      <button class="dismiss-btn" @click="dismiss">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <div class="timer-display">
      <div class="progress-ring">
        <svg viewBox="0 0 100 100">
          <circle
            class="ring-bg"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke-width="6"
          />
          <circle
            class="ring-progress"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke-width="6"
            :stroke-dasharray="282.74"
            :stroke-dashoffset="282.74 - (282.74 * progress) / 100"
          />
        </svg>
        <span class="time">{{ displayTime }}</span>
      </div>
    </div>

    <div class="timer-controls">
      <button class="control-btn" @click="addTime(-15)">-15s</button>
      <button class="control-btn primary" @click="isRunning ? stop() : start()">
        <svg v-if="!isRunning" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"/>
          <rect x="14" y="4" width="4" height="16"/>
        </svg>
      </button>
      <button class="control-btn" @click="addTime(15)">+15s</button>
    </div>

    <button class="skip-btn" @click="dismiss">Skip Rest</button>
  </div>
</template>

<style scoped>
.rest-timer {
  background: var(--color-bg-secondary);
  border: 1px solid rgba(201, 169, 98, 0.2);
  border-radius: 12px;
  padding: 1.25rem;
  text-align: center;
}

.timer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.timer-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
}

.dismiss-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.15s ease;
}

.dismiss-btn:hover {
  color: var(--color-text-primary);
}

.timer-display {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.progress-ring {
  position: relative;
  width: 120px;
  height: 120px;
}

.progress-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  stroke: var(--color-bg-tertiary);
}

.ring-progress {
  stroke: var(--color-gold);
  stroke-linecap: round;
  transition: stroke-dashoffset 0.3s ease;
}

.time {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Cinzel', serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.timer-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.control-btn {
  padding: 0.5rem 1rem;
  background: var(--color-bg-tertiary);
  border: 1px solid rgba(201, 169, 98, 0.2);
  border-radius: 4px;
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  font-family: 'Raleway', sans-serif;
  cursor: pointer;
  transition: all 0.15s ease;
}

.control-btn:hover {
  background: rgba(201, 169, 98, 0.15);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.control-btn.primary {
  width: 48px;
  height: 48px;
  padding: 0;
  border-radius: 50%;
  background: var(--color-gold);
  border-color: var(--color-gold);
  color: var(--color-bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-btn.primary:hover {
  background: var(--color-gold-light);
  color: var(--color-bg-primary);
}

.skip-btn {
  padding: 0.5rem 1.5rem;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  font-family: 'Raleway', sans-serif;
  cursor: pointer;
  transition: color 0.15s ease;
}

.skip-btn:hover {
  color: var(--color-text-secondary);
}
</style>

