<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="progress-view">
    <header class="header">
      <button class="back-btn" @click="router.push('/')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1>Progress</h1>
    </header>

    <div class="content">
      <div class="placeholder-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 3v18h18"/>
          <path d="M18 17V9"/>
          <path d="M13 17V5"/>
          <path d="M8 17v-3"/>
        </svg>
      </div>
      <h2>Coming Soon</h2>
      <p>Track your workout progress and view analytics here.</p>
    </div>
  </div>
</template>

<style scoped>
.progress-view {
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
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 4px;
  color: var(--color-gold);
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--color-bg-tertiary);
  border-color: rgba(74, 144, 217, 0.4);
}

.header h1 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 1.5rem;
}

.placeholder-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 140px;
  height: 140px;
  background: var(--color-bg-secondary);
  border: 1px solid rgba(74, 144, 217, 0.2);
  border-radius: 50%;
  color: var(--color-accent-teal);
}

.content h2 {
  font-family: 'Poppins', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin: 0;
}

.content p {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  max-width: 280px;
  line-height: 1.7;
  font-family: 'Poppins', sans-serif;
}
</style>

