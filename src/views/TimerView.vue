<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const presetDurations = [30, 60, 90, 120, 180]
const selectedDuration = ref(60)
const customDuration = ref('')
const timeRemaining = ref(0)
const isRunning = ref(false)
const intervalId = ref<number | null>(null)

const displayTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60)
  const seconds = timeRemaining.value % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

const progress = computed(() => {
  if (selectedDuration.value === 0) return 0
  return ((selectedDuration.value - timeRemaining.value) / selectedDuration.value) * 100
})

function selectDuration(seconds: number) {
  if (isRunning.value) return
  selectedDuration.value = seconds
  timeRemaining.value = seconds
  customDuration.value = ''
}

function setCustomDuration() {
  const seconds = parseInt(customDuration.value)
  if (!isNaN(seconds) && seconds > 0) {
    selectedDuration.value = seconds
    timeRemaining.value = seconds
  }
}

function startTimer() {
  if (timeRemaining.value <= 0) {
    timeRemaining.value = selectedDuration.value
  }
  isRunning.value = true
  intervalId.value = window.setInterval(() => {
    if (timeRemaining.value > 0) {
      timeRemaining.value--
    } else {
      pauseTimer()
    }
  }, 1000)
}

function pauseTimer() {
  isRunning.value = false
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
}

function resetTimer() {
  pauseTimer()
  timeRemaining.value = selectedDuration.value
}

function toggleTimer() {
  if (isRunning.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})
</script>

<template>
  <div class="timer-view">
    <header class="header">
      <button class="back-btn" @click="router.push('/')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Set Timer</h1>
    </header>

    <div class="timer-display">
      <div class="timer-ring">
        <svg viewBox="0 0 120 120">
          <circle
            class="ring-bg"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke-width="8"
          />
          <circle
            class="ring-progress"
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke-width="8"
            :stroke-dasharray="339.292"
            :stroke-dashoffset="339.292 - (339.292 * progress) / 100"
          />
        </svg>
        <span class="time">{{ displayTime }}</span>
      </div>
    </div>

    <div class="controls">
      <button class="control-btn reset-btn" @click="resetTimer" :disabled="timeRemaining === selectedDuration && !isRunning">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
      <button class="control-btn play-btn" @click="toggleTimer">
        <svg v-if="!isRunning" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"/>
          <rect x="14" y="4" width="4" height="16"/>
        </svg>
      </button>
      <div class="control-spacer"></div>
    </div>

    <div class="presets">
      <p class="presets-label">Quick Select (seconds)</p>
      <div class="preset-buttons">
        <button
          v-for="duration in presetDurations"
          :key="duration"
          class="preset-btn"
          :class="{ active: selectedDuration === duration && !customDuration }"
          @click="selectDuration(duration)"
          :disabled="isRunning"
        >
          {{ duration }}s
        </button>
      </div>
      <div class="custom-input">
        <input
          type="number"
          v-model="customDuration"
          placeholder="Custom (seconds)"
          @keyup.enter="setCustomDuration"
          :disabled="isRunning"
        />
        <button class="set-btn" @click="setCustomDuration" :disabled="isRunning || !customDuration">
          Set
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timer-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1.5rem;
  max-width: 480px;
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
  border: 1px solid rgba(201, 169, 98, 0.2);
  border-radius: 4px;
  color: var(--color-gold);
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(201, 169, 98, 0.4);
}

.header h1 {
  font-family: 'Cinzel', serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0;
}

.timer-display {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.timer-ring {
  position: relative;
  width: 280px;
  height: 280px;
}

.timer-ring svg {
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
  font-size: 3.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.05em;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 1.5rem 0;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s, opacity 0.2s;
}

.control-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.control-btn:not(:disabled):hover {
  transform: scale(1.05);
}

.reset-btn {
  width: 56px;
  height: 56px;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(201, 169, 98, 0.2);
  color: var(--color-text-secondary);
}

.play-btn {
  width: 80px;
  height: 80px;
  background: var(--color-gold);
  color: var(--color-bg-primary);
  box-shadow: 0 4px 20px rgba(201, 169, 98, 0.3);
}

.play-btn:not(:disabled):hover {
  box-shadow: 0 6px 25px rgba(201, 169, 98, 0.4);
}

.control-spacer {
  width: 56px;
}

.presets {
  padding: 1.5rem 0;
}

.presets-label {
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  margin-bottom: 1rem;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-family: 'Raleway', sans-serif;
}

.preset-buttons {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

.preset-btn {
  padding: 0.75rem 1.25rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(201, 169, 98, 0.2);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Raleway', sans-serif;
}

.preset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preset-btn:not(:disabled):hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(201, 169, 98, 0.4);
}

.preset-btn.active {
  border-color: var(--color-gold);
  background: rgba(201, 169, 98, 0.15);
  color: var(--color-gold);
}

.custom-input {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.custom-input input {
  width: 160px;
  padding: 0.75rem 1rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(201, 169, 98, 0.2);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 0.9rem;
  text-align: center;
  font-family: 'Raleway', sans-serif;
}

.custom-input input::placeholder {
  color: var(--color-text-muted);
}

.custom-input input:focus {
  outline: none;
  border-color: var(--color-gold);
}

.custom-input input:disabled {
  opacity: 0.5;
}

.set-btn {
  padding: 0.75rem 1.5rem;
  background: var(--color-gold);
  border: none;
  border-radius: 4px;
  color: var(--color-bg-primary);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Raleway', sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.set-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.set-btn:not(:disabled):hover {
  background: var(--color-gold-light);
}
</style>

