<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
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

// Edit mode states
const editingWeight = ref(false)
const editingReps = ref(false)
const isEditingCompleted = ref(false)
const weightInputRef = ref<HTMLInputElement | null>(null)
const repsInputRef = ref<HTMLInputElement | null>(null)

// Temporary edit values
const tempWeight = ref(props.set.weight)
const tempReps = ref(props.set.reps)

// Whether the set is currently editable (not completed, or editing a completed set)
const isEditable = computed(() => !props.set.isCompleted || isEditingCompleted.value)

function enableEditing() {
  isEditingCompleted.value = true
}

async function startEditWeight() {
  if (!isEditable.value) return
  tempWeight.value = props.set.weight
  editingWeight.value = true
  await nextTick()
  weightInputRef.value?.focus()
  weightInputRef.value?.select()
}

async function startEditReps() {
  if (!isEditable.value) return
  tempReps.value = props.set.reps
  editingReps.value = true
  await nextTick()
  repsInputRef.value?.focus()
  repsInputRef.value?.select()
}

function finishEditWeight() {
  const newWeight = parseFloat(String(tempWeight.value)) || 0
  emit('update', { weight: Math.max(0, newWeight) })
  editingWeight.value = false
}

function finishEditReps() {
  const newReps = parseInt(String(tempReps.value)) || 1
  emit('update', { reps: Math.max(1, newReps) })
  editingReps.value = false
}

function handleWeightKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    finishEditWeight()
  } else if (e.key === 'Escape') {
    editingWeight.value = false
  }
}

function handleRepsKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    finishEditReps()
  } else if (e.key === 'Escape') {
    editingReps.value = false
  }
}

function toggleUnit() {
  if (!isEditable.value) return
  const newUnit: WeightUnit = props.set.weightUnit === 'kg' ? 'lbs' : 'kg'
  emit('update', { weightUnit: newUnit })
}

function updateRpe(rpe: number | undefined) {
  emit('update', { rpe })
}

function handleComplete() {
  // If we were editing a completed set, just exit edit mode
  if (isEditingCompleted.value) {
    isEditingCompleted.value = false
  } else {
    emit('complete')
  }
}
</script>

<template>
  <div class="set-row" :class="{ completed: set.isCompleted, editing: isEditingCompleted }">
    <!-- Main row: set number, weight × reps, complete button -->
    <div class="set-main">
      <span class="set-number">{{ setNumber }}</span>
      
      <!-- Weight display/edit -->
      <div class="value-cell weight-cell" :class="{ editable: isEditable }" @click="startEditWeight">
        <template v-if="editingWeight">
          <input 
            ref="weightInputRef"
            v-model="tempWeight"
            type="number"
            inputmode="decimal"
            class="inline-input weight-input"
            @blur="finishEditWeight"
            @keydown="handleWeightKeydown"
          />
        </template>
        <template v-else>
          <span class="value-text">{{ set.weight }}</span>
        </template>
        <button 
          class="unit-badge" 
          @click.stop="toggleUnit"
          :disabled="!isEditable"
        >
          {{ set.weightUnit }}
        </button>
      </div>

      <span class="separator">×</span>

      <!-- Reps display/edit -->
      <div class="value-cell reps-cell" :class="{ editable: isEditable }" @click="startEditReps">
        <template v-if="editingReps">
          <input 
            ref="repsInputRef"
            v-model="tempReps"
            type="number"
            inputmode="numeric"
            class="inline-input reps-input"
            @blur="finishEditReps"
            @keydown="handleRepsKeydown"
          />
        </template>
        <template v-else>
          <span class="value-text">{{ set.reps }}</span>
          <span class="value-label">reps</span>
        </template>
      </div>

      <!-- Action buttons container - always on far right -->
      <div class="action-buttons">
        <!-- Edit button for completed sets (not in edit mode) -->
        <button 
          v-if="set.isCompleted && !isEditingCompleted"
          class="edit-btn"
          @click="enableEditing"
          title="Edit set"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            <path d="m15 5 4 4"/>
          </svg>
        </button>

        <!-- Complete button: shown for incomplete sets OR when editing a completed set -->
        <button 
          v-if="!set.isCompleted || isEditingCompleted"
          class="complete-btn"
          @click="handleComplete"
          :title="isEditingCompleted ? 'Done editing' : 'Complete set'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
        
        <!-- Static completed check: only when completed and NOT editing -->
        <div v-if="set.isCompleted && !isEditingCompleted" class="completed-check">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- RPE Slider - always visible -->
    <div class="rpe-row">
      <RPESlider 
        :model-value="set.rpe" 
        :disabled="!isEditable"
        @update:model-value="updateRpe" 
      />
    </div>
  </div>
</template>

<style scoped>
.set-row {
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.1);
  border-radius: 8px;
  padding: 0.75rem;
  transition: all 0.2s ease;
}

.set-row.completed {
  opacity: 0.7;
  background: rgba(129, 178, 154, 0.08);
  border-color: rgba(129, 178, 154, 0.25);
}

.set-main {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.set-number {
  min-width: 1.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-muted);
  text-align: center;
}

.value-cell {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.6rem;
  background: var(--color-bg-tertiary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 40px;
}

.value-cell.editable:hover {
  border-color: var(--color-gold);
  background: rgba(74, 144, 217, 0.08);
}

.value-cell:not(.editable) {
  cursor: default;
}

.weight-cell {
  min-width: 85px;
}

.reps-cell {
  min-width: 70px;
}

.value-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: 'Poppins', sans-serif;
}

.value-label {
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: lowercase;
}

.unit-badge {
  padding: 0.2rem 0.4rem;
  background: rgba(74, 144, 217, 0.15);
  border: none;
  border-radius: 4px;
  color: var(--color-gold);
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s ease;
}

.unit-badge:hover:not(:disabled) {
  background: rgba(74, 144, 217, 0.25);
}

.unit-badge:disabled {
  opacity: 0.6;
  cursor: default;
}

.inline-input {
  width: 100%;
  padding: 0;
  background: transparent;
  border: none;
  color: var(--color-text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  -moz-appearance: textfield;
  text-align: left;
}

.inline-input::-webkit-outer-spin-button,
.inline-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.inline-input:focus {
  outline: none;
}

.weight-input {
  max-width: 50px;
}

.reps-input {
  max-width: 40px;
}

.separator {
  color: var(--color-text-muted);
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0 0.15rem;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  flex-shrink: 0;
}

.edit-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(74, 144, 217, 0.15);
  border: 2px solid var(--color-gold);
  border-radius: 50%;
  color: var(--color-gold);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.edit-btn:hover {
  background: var(--color-gold);
  border-color: var(--color-gold);
  color: var(--color-bg-primary);
  transform: scale(1.05);
}

.edit-btn:active {
  transform: scale(0.95);
}

.complete-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(129, 178, 154, 0.15);
  border: 2px solid var(--color-accent-teal);
  border-radius: 50%;
  color: var(--color-accent-teal);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.complete-btn:hover {
  background: var(--color-accent-teal);
  color: var(--color-bg-primary);
  transform: scale(1.05);
}

.complete-btn:active {
  transform: scale(0.95);
}

.completed-check {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(129, 178, 154, 0.2);
  border-radius: 50%;
  color: var(--color-accent-teal);
  flex-shrink: 0;
}

/* When editing a completed set, restore full opacity and show editing state */
.set-row.completed.editing {
  opacity: 1;
  border-color: var(--color-gold);
}

.rpe-row {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(74, 144, 217, 0.08);
}
</style>
