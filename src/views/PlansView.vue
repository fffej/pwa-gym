<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePlansStore } from '@/stores/plans'
import type { Plan } from '@/types/workout'

const router = useRouter()
const plansStore = usePlansStore()

const planToDelete = ref<Plan | null>(null)
const showDeleteConfirm = ref(false)

onMounted(async () => {
  await plansStore.initialize()
})

function goBack() {
  router.push('/')
}

function editPlan(planId: string) {
  router.push(`/plans/${planId}`)
}

function createNewPlan() {
  router.push('/plans/new')
}

function confirmDelete(plan: Plan) {
  planToDelete.value = plan
  showDeleteConfirm.value = true
}

async function deletePlan() {
  if (planToDelete.value) {
    await plansStore.deletePlan(planToDelete.value.id)
    planToDelete.value = null
    showDeleteConfirm.value = false
  }
}

function cancelDelete() {
  planToDelete.value = null
  showDeleteConfirm.value = false
}

function getExerciseSummary(plan: Plan): string {
  if (plan.exercises.length === 0) return 'No exercises'
  if (plan.exercises.length === 1) return '1 exercise'
  return `${plan.exercises.length} exercises`
}
</script>

<template>
  <div class="plans-view">
    <header class="header">
      <button class="back-btn" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Workout Plans</h1>
    </header>

    <div class="content">
      <div v-if="plansStore.isLoading" class="loading">
        <p>Loading plans...</p>
      </div>

      <div v-else-if="plansStore.plans.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/>
            <line x1="9" y1="12" x2="15" y2="12"/>
            <line x1="9" y1="16" x2="15" y2="16"/>
          </svg>
        </div>
        <h2>No Plans Yet</h2>
        <p>Create your first workout plan to get started</p>
      </div>

      <div v-else class="plans-list">
        <button
          v-for="plan in plansStore.plans"
          :key="plan.id"
          class="plan-card"
          @click="editPlan(plan.id)"
        >
          <div class="plan-info">
            <span class="plan-name">{{ plan.name }}</span>
            <span class="plan-description" v-if="plan.description">{{ plan.description }}</span>
            <span class="plan-exercises">{{ getExerciseSummary(plan) }}</span>
          </div>
          <div class="plan-actions">
            <button 
              class="delete-btn" 
              @click.stop="confirmDelete(plan)"
              title="Delete plan"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
            <div class="plan-arrow">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
        </button>
      </div>

      <button class="create-btn" @click="createNewPlan">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Create New Plan
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
      <div class="modal" @click.stop>
        <h3>Delete Plan?</h3>
        <p>Are you sure you want to delete "{{ planToDelete?.name }}"? This action cannot be undone.</p>
        <div class="modal-actions">
          <button class="modal-btn cancel" @click="cancelDelete">Cancel</button>
          <button class="modal-btn delete" @click="deletePlan">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.plans-view {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--color-bg-primary);
  position: sticky;
  top: 0;
  z-index: 10;
  border-bottom: 1px solid rgba(74, 144, 217, 0.1);
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
  flex-shrink: 0;
}

.back-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.4);
}

.header h1 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0;
}

.content {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
}

.empty-icon {
  color: var(--color-text-muted);
  margin-bottom: 1.5rem;
}

.empty-state h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
  margin-bottom: 1.5rem;
}

.plan-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
}

.plan-card:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.3);
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  flex: 1;
}

.plan-name {
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.plan-description {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.plan-exercises {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.plan-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: rgba(224, 122, 95, 0.1);
  border-color: var(--color-accent-coral);
  color: var(--color-accent-coral);
}

.plan-arrow {
  color: var(--color-text-muted);
}

.create-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-gold);
  border: none;
  border-radius: 8px;
  color: var(--color-bg-primary);
  font-family: 'Poppins', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: auto;
}

.create-btn:hover {
  background: var(--color-gold-light);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal {
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 12px;
  padding: 1.5rem;
  max-width: 320px;
  width: 100%;
}

.modal h3 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 0.75rem;
}

.modal p {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
}

.modal-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  font-family: 'Poppins', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-btn.cancel {
  background: var(--color-bg-tertiary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  color: var(--color-text-secondary);
}

.modal-btn.cancel:hover {
  background: var(--color-bg-primary);
  border-color: rgba(74, 144, 217, 0.4);
}

.modal-btn.delete {
  background: var(--color-accent-coral);
  border: none;
  color: white;
}

.modal-btn.delete:hover {
  background: #c96a52;
}
</style>

