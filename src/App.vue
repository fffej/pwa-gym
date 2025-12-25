<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const count = ref(0)

onMounted(() => {
  const saved = localStorage.getItem('counter')
  if (saved) count.value = parseInt(saved, 10)
})

watch(count, (val) => localStorage.setItem('counter', val.toString()))

function increment() {
  count.value++
}
</script>

<template>
  <div class="container">
    <h1>Hello world</h1>
    <div class="counter-section">
      <p class="count">{{ count }}</p>
      <button @click="increment">Increment</button>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

h1 {
  font-size: 3rem;
  color: #e0e0e0;
  margin-bottom: 2rem;
}

.counter-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.count {
  font-size: 5rem;
  font-weight: bold;
  color: #64ffda;
  margin: 0;
}

button {
  padding: 1rem 2.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a2e;
  background: linear-gradient(135deg, #64ffda 0%, #48c9b0 100%);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(100, 255, 218, 0.3);
}

button:active {
  transform: translateY(0);
}
</style>
