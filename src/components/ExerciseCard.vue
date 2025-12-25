<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Exercise, WorkoutSet } from '@/types/workout'
import { useMachinesStore } from '@/stores/machines'
import SetRow from './SetRow.vue'

const props = defineProps<{
  exercise: Exercise
}>()

const emit = defineEmits<{
  'add-set': []
  'remove-set': [setId: string]
  'update-set': [setId: string, updates: Partial<WorkoutSet>]
  'complete-set': [setId: string]
  'remove-exercise': []
}>()

const machinesStore = useMachinesStore()
const isCollapsed = ref(false)

const machine = computed(() => machinesStore.getMachineById(props.exercise.machineId))

const completedSets = computed(() => 
  props.exercise.sets.filter(s => s.isCompleted).length
)

const totalSets = computed(() => props.exercise.sets.length)

const attachmentName = computed(() => {
  if (!props.exercise.attachmentId || !machine.value) return null
  const attachment = machine.value.attachments.find(a => a.id === props.exercise.attachmentId)
  return attachment?.name
})

function formatGrip(grip: string | undefined): string {
  if (!grip) return ''
  return grip.charAt(0).toUpperCase() + grip.slice(1)
}
</script>

<template>
  <div class="exercise-card">
    <div class="exercise-header" @click="isCollapsed = !isCollapsed">
      <div class="exercise-info">
        <h3 class="exercise-name">{{ exercise.machineName }}</h3>
        <div class="exercise-meta">
          <span v-if="attachmentName" class="meta-tag">{{ attachmentName }}</span>
          <span v-if="exercise.grip" class="meta-tag">{{ formatGrip(exercise.grip) }}</span>
          <span class="sets-count">{{ completedSets }}/{{ totalSets }} sets</span>
        </div>
      </div>
      <div class="header-actions">
        <button class="collapse-btn" :class="{ collapsed: isCollapsed }">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-show="!isCollapsed" class="exercise-body">
      <div class="sets-list">
        <SetRow
          v-for="(set, index) in exercise.sets"
          :key="set.id"
          :set="set"
          :set-number="index + 1"
          :weight-increment="machine?.weightIncrement"
          @update="(updates) => emit('update-set', set.id, updates)"
          @complete="emit('complete-set', set.id)"
          @delete="emit('remove-set', set.id)"
        />
      </div>

      <div class="exercise-actions">
        <button class="add-set-btn" @click="emit('add-set')">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Set
        </button>
        <button class="remove-exercise-btn" @click="emit('remove-exercise')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Remove
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exercise-card {
  background: var(--color-bg-secondary);
  border: 1px solid rgba(201, 169, 98, 0.15);
  border-radius: 8px;
  overflow: hidden;
}

.exercise-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  cursor: pointer;
  transition: background 0.2s ease;
}

.exercise-header:hover {
  background: rgba(201, 169, 98, 0.05);
}

.exercise-info {
  flex: 1;
  min-width: 0;
}

.exercise-name {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 0.25rem 0;
  letter-spacing: 0.03em;
}

.exercise-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.meta-tag {
  padding: 0.2rem 0.5rem;
  background: rgba(201, 169, 98, 0.15);
  border-radius: 4px;
  font-size: 0.7rem;
  color: var(--color-gold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.sets-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.collapse-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: transform 0.2s ease;
}

.collapse-btn.collapsed {
  transform: rotate(-90deg);
}

.exercise-body {
  padding: 0 1rem 1rem;
}

.sets-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.exercise-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(201, 169, 98, 0.1);
}

.add-set-btn,
.remove-exercise-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: transparent;
  border: 1px solid rgba(201, 169, 98, 0.2);
  border-radius: 4px;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  font-family: 'Raleway', sans-serif;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-set-btn:hover {
  background: rgba(201, 169, 98, 0.1);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.remove-exercise-btn:hover {
  background: rgba(224, 122, 95, 0.1);
  border-color: var(--color-accent-coral);
  color: var(--color-accent-coral);
}
</style>

