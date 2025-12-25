<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const showIOSPrompt = ref(false)

// Detect if running on iOS Safari and NOT already installed as PWA
const isIOSSafari = computed(() => {
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua)
  const isStandalone = ('standalone' in navigator) && (navigator as any).standalone
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua) // Not Chrome or Firefox on iOS
  return isIOS && isSafari && !isStandalone
})

onMounted(() => {
  // Show iOS install prompt if applicable and not dismissed before
  if (isIOSSafari.value && !localStorage.getItem('iosPromptDismissed')) {
    showIOSPrompt.value = true
  }
})

function dismissIOSPrompt() {
  showIOSPrompt.value = false
  localStorage.setItem('iosPromptDismissed', 'true')
}
</script>

<template>
  <div class="app-container">
    <!-- iOS Install Banner -->
    <div v-if="showIOSPrompt" class="ios-prompt">
      <button class="dismiss-btn" @click="dismissIOSPrompt">×</button>
      <p>
        Install this app: tap 
        <span class="share-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        </span> 
        then <strong>"Add to Home Screen"</strong>
      </p>
    </div>
    
    <router-view />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

/* iOS Install Prompt */
.ios-prompt {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(30, 30, 50, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 1.25rem 2.5rem 1.25rem 1.25rem;
  border-top: 1px solid rgba(100, 255, 218, 0.3);
  text-align: center;
  color: #e0e0e0;
  z-index: 1000;
  font-size: 1rem;
}

.ios-prompt p {
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.ios-prompt .share-icon {
  display: inline-flex;
  align-items: center;
  color: #64ffda;
  vertical-align: middle;
}

.ios-prompt strong {
  color: #64ffda;
}

.dismiss-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: #888;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  line-height: 1;
}

.dismiss-btn:hover {
  color: #e0e0e0;
}
</style>
