<script setup lang="ts">
import { ref, computed } from 'vue'
import type { WorkoutSet, WeightUnit } from '@/types/workout'
import RPESlider from './RPESlider.vue'

const props = defineProps<{
  set: WorkoutSet
  setNumber: number
  weightIncrement?: number
}>()

const emit = defineEmits<{
  'update': [updates: Partial<WorkoutSet>]
  'complete': []
  'delete': []
}>()

const showRpe = ref(false)
const increment = computed(() => props.weightIncrement ?? 2.5)

// Long press handling for fast increment
let pressTimer: number | null = null
let pressInterval: number | null = null

function startPress(action: () => void) {
  action()
  pressTimer = window.setTimeout(() => {
    pressInterval = window.setInterval(action, 100)
  }, 400)
}

function endPress() {
  if (pressTimer) {
    clearTimeout(pressTimer)
    pressTimer = null
  }
  if (pressInterval) {
    clearInterval(pressInterval)
    pressInterval = null
  }
}

function incrementWeight() {
  emit('update', { weight: props.set.weight + increment.value })
}

function decrementWeight() {
  const newWeight = Math.max(0, props.set.weight - increment.value)
  emit('update', { weight: newWeight })
}

function incrementReps() {
  emit('update', { reps: props.set.reps + 1 })
}

function decrementReps() {
  const newReps = Math.max(1, props.set.reps - 1)
  emit('update', { reps: newReps })
}

function toggleUnit() {
  const newUnit: WeightUnit = props.set.weightUnit === 'kg' ? 'lbs' : 'kg'
  emit('update', { weightUnit: newUnit })
}

function updateRpe(rpe: number | undefined) {
  emit('update', { rpe })
}

function handleComplete() {
  emit('complete')
}
</script>

<template>
  <div class="set-row" :class="{ completed: set.isCompleted }">
    <div class="set-main">
      <span class="set-number">{{ setNumber }}</span>
      
      <div class="input-column weight-column">
        <span class="input-label">Weight</span>
        <div class="input-group">
          <button 
            class="stepper-btn"
            @mousedown="startPress(decrementWeight)"
            @mouseup="endPress"
            @mouseleave="endPress"
            @touchstart.prevent="startPress(decrementWeight)"
            @touchend="endPress"
            :disabled="set.isCompleted"
          >−</button>
          <div class="value-display">
            <input 
              type="number" 
              :value="set.weight"
              @change="emit('update', { weight: parseFloat(($event.target as HTMLInputElement).value) || 0 })"
              :disabled="set.isCompleted"
              class="value-input"
            />
            <button class="unit-btn" @click="toggleUnit" :disabled="set.isCompleted">
              {{ set.weightUnit }}
            </button>
          </div>
          <button 
            class="stepper-btn"
            @mousedown="startPress(incrementWeight)"
            @mouseup="endPress"
            @mouseleave="endPress"
            @touchstart.prevent="startPress(incrementWeight)"
            @touchend="endPress"
            :disabled="set.isCompleted"
          >+</button>
        </div>
      </div>

      <span class="separator">×</span>

      <div class="input-column reps-column">
        <span class="input-label">Reps</span>
        <div class="input-group">
          <button 
            class="stepper-btn"
            @mousedown="startPress(decrementReps)"
            @mouseup="endPress"
            @mouseleave="endPress"
            @touchstart.prevent="startPress(decrementReps)"
            @touchend="endPress"
            :disabled="set.isCompleted"
          >−</button>
          <input 
            type="number" 
            :value="set.reps"
            @change="emit('update', { reps: parseInt(($event.target as HTMLInputElement).value) || 1 })"
            :disabled="set.isCompleted"
            class="value-input reps-input"
          />
          <button 
            class="stepper-btn"
            @mousedown="startPress(incrementReps)"
            @mouseup="endPress"
            @mouseleave="endPress"
            @touchstart.prevent="startPress(incrementReps)"
            @touchend="endPress"
            :disabled="set.isCompleted"
          >+</button>
        </div>
      </div>
    </div>

    <div class="set-actions">
      <button 
        class="action-btn rpe-toggle" 
        :class="{ active: showRpe || set.rpe !== undefined }"
        @click="showRpe = !showRpe"
        title="RPE"
      >
        <span v-if="set.rpe !== undefined">{{ set.rpe }}</span>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 20h9"/>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
        </svg>
      </button>

      <button 
        v-if="!set.isCompleted"
        class="action-btn complete-btn"
        @click="handleComplete"
        title="Complete set"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </button>
      <div v-else class="completed-check">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      </div>

      <button 
        v-if="!set.isCompleted"
        class="action-btn delete-btn"
        @click="emit('delete')"
        title="Delete set"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>

    <div v-if="showRpe" class="rpe-section">
      <RPESlider :model-value="set.rpe" @update:model-value="updateRpe" />
    </div>
  </div>
</template>

<style scoped>
.set-row {
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.1);
  border-radius: 6px;
  padding: 0.75rem;
  transition: all 0.2s ease;
}

.set-row.completed {
  opacity: 0.7;
  background: rgba(129, 178, 154, 0.1);
  border-color: rgba(129, 178, 154, 0.3);
}

.set-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.set-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(74, 144, 217, 0.08);
}

.set-number {
  min-width: 1.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-align: center;
  align-self: flex-end;
  padding-bottom: 0.5rem;
}

.input-column {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  text-align: center;
}

.input-group {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.weight-column {
  flex: 1.5;
}

.reps-column {
  flex: 1;
}

.stepper-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-tertiary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 1.25rem;
  font-weight: 300;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  -webkit-user-select: none;
}

.stepper-btn:hover:not(:disabled) {
  background: var(--color-gold);
  color: var(--color-bg-primary);
  border-color: var(--color-gold);
}

.stepper-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.stepper-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.value-display {
  display: flex;
  align-items: center;
  background: var(--color-bg-tertiary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.value-input {
  width: 50px;
  padding: 0.4rem 0.25rem;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: 0.95rem;
  font-weight: 500;
  text-align: center;
  font-family: 'Poppins', sans-serif;
  -moz-appearance: textfield;
}

.value-input::-webkit-outer-spin-button,
.value-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.value-input:focus {
  outline: none;
}

.value-input:disabled {
  opacity: 0.7;
}

.reps-input {
  width: 36px;
}

.unit-btn {
  padding: 0.4rem 0.35rem;
  background: rgba(74, 144, 217, 0.15);
  border: none;
  border-left: 1px solid rgba(74, 144, 217, 0.2);
  color: var(--color-gold);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s ease;
}

.unit-btn:hover:not(:disabled) {
  background: rgba(74, 144, 217, 0.25);
}

.unit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.separator {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  padding: 0 0.25rem;
  align-self: flex-end;
  padding-bottom: 0.5rem;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 4px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.action-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  border-color: rgba(74, 144, 217, 0.4);
}

.rpe-toggle.active {
  background: rgba(74, 144, 217, 0.15);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.complete-btn:hover {
  background: rgba(129, 178, 154, 0.2);
  border-color: var(--color-accent-teal);
  color: var(--color-accent-teal);
}

.completed-check {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent-teal);
  flex-shrink: 0;
}

.delete-btn:hover {
  background: rgba(224, 122, 95, 0.2);
  border-color: var(--color-accent-coral);
  color: var(--color-accent-coral);
}

.rpe-section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(74, 144, 217, 0.1);
}
</style>

