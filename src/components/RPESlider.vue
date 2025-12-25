<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()

const rpeValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

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

const rpeColor = computed(() => {
  if (rpeValue.value === undefined) return 'var(--color-text-muted)'
  if (rpeValue.value <= 3) return 'var(--color-accent-teal)'
  if (rpeValue.value <= 6) return 'var(--color-gold)'
  if (rpeValue.value <= 8) return 'var(--color-accent-coral)'
  return '#e05555'
})

function selectRpe(value: number) {
  if (rpeValue.value === value) {
    rpeValue.value = undefined
  } else {
    rpeValue.value = value
  }
}
</script>

<template>
  <div class="rpe-slider">
    <div class="rpe-header">
      <span class="rpe-label">RPE</span>
      <span class="rpe-value" :style="{ color: rpeColor }">
        {{ rpeValue !== undefined ? rpeValue : '—' }}
      </span>
      <span v-if="rpeValue !== undefined" class="rpe-description">
        {{ rpeLabels[rpeValue] }}
      </span>
    </div>
    <div class="rpe-buttons">
      <button
        v-for="n in 11"
        :key="n - 1"
        class="rpe-btn"
        :class="{ active: rpeValue === n - 1 }"
        @click="selectRpe(n - 1)"
      >
        {{ n - 1 }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.rpe-slider {
  padding: 0.75rem 0;
}

.rpe-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.rpe-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
}

.rpe-value {
  font-size: 1.25rem;
  font-weight: 600;
  font-family: 'Poppins', sans-serif;
  min-width: 1.5rem;
}

.rpe-description {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-left: auto;
}

.rpe-buttons {
  display: flex;
  gap: 0.25rem;
}

.rpe-btn {
  flex: 1;
  min-width: 0;
  padding: 0.5rem 0;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.15);
  border-radius: 4px;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.rpe-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.3);
}

.rpe-btn.active {
  background: rgba(74, 144, 217, 0.2);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

/* Color gradient for active buttons based on RPE value */
.rpe-btn:nth-child(-n+4).active {
  background: rgba(129, 178, 154, 0.2);
  border-color: var(--color-accent-teal);
  color: var(--color-accent-teal);
}

.rpe-btn:nth-child(n+5):nth-child(-n+7).active {
  background: rgba(74, 144, 217, 0.2);
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.rpe-btn:nth-child(n+8):nth-child(-n+9).active {
  background: rgba(224, 122, 95, 0.2);
  border-color: var(--color-accent-coral);
  color: var(--color-accent-coral);
}

.rpe-btn:nth-child(n+10).active {
  background: rgba(224, 85, 85, 0.2);
  border-color: #e05555;
  color: #e05555;
}
</style>

