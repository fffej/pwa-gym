<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import { useSyncStatus } from '@/services/sync'
import type { TimerBehavior } from '@/types/workout'

const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const { status: syncStatus, isOnline } = useSyncStatus()
const showDropdown = ref(false)

onMounted(async () => {
  await settingsStore.loadSettings()
})

const syncStatusText = computed(() => {
  if (!isOnline.value) return 'Offline'
  switch (syncStatus.value) {
    case 'syncing': return 'Syncing...'
    case 'error': return 'Sync error'
    default: return 'Synced'
  }
})

const syncStatusClass = computed(() => {
  if (!isOnline.value) return 'status-offline'
  switch (syncStatus.value) {
    case 'syncing': return 'status-syncing'
    case 'error': return 'status-error'
    default: return 'status-synced'
  }
})

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function closeDropdown() {
  showDropdown.value = false
}

async function handleSignOut() {
  await authStore.signOut()
  closeDropdown()
}

async function setTimerBehavior(behavior: TimerBehavior) {
  await settingsStore.setTimerBehavior(behavior)
}
</script>

<template>
  <div class="user-profile-compact">
    <!-- Loading state -->
    <div v-if="authStore.isLoading" class="profile-icon loading">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- Signed in state -->
    <div v-else-if="authStore.isAuthenticated" class="profile-wrapper">
      <button class="profile-icon-btn" @click="toggleDropdown">
        <img 
          v-if="authStore.userPhoto" 
          :src="authStore.userPhoto" 
          :alt="authStore.userName"
          class="user-avatar"
          referrerpolicy="no-referrer"
        />
        <div v-else class="user-avatar-placeholder">
          {{ authStore.userName.charAt(0).toUpperCase() }}
        </div>
        <span class="sync-dot" :class="syncStatusClass"></span>
      </button>
      
      <!-- Dropdown menu -->
      <Transition name="dropdown">
        <div v-if="showDropdown" class="dropdown-menu">
          <div class="dropdown-header">
            <span class="user-name">{{ authStore.userName }}</span>
            <span class="user-email">{{ authStore.userEmail }}</span>
          </div>
          <div class="dropdown-divider"></div>
          <div class="sync-status" :class="syncStatusClass">
            <span class="sync-indicator-dot"></span>
            <span>{{ syncStatusText }}</span>
          </div>
          <div class="dropdown-divider"></div>
          <div class="settings-section">
            <span class="settings-label">Rest Timer</span>
            <div class="timer-options">
              <button 
                class="timer-option" 
                :class="{ active: settingsStore.settings.timerBehavior === 'auto' }"
                @click="setTimerBehavior('auto')"
              >Auto</button>
              <button 
                class="timer-option" 
                :class="{ active: settingsStore.settings.timerBehavior === 'manual' }"
                @click="setTimerBehavior('manual')"
              >Manual</button>
              <button 
                class="timer-option" 
                :class="{ active: settingsStore.settings.timerBehavior === 'disabled' }"
                @click="setTimerBehavior('disabled')"
              >Off</button>
            </div>
          </div>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item sign-out" @click="handleSignOut">
            Sign out
          </button>
        </div>
      </Transition>
      
      <!-- Backdrop to close dropdown -->
      <div v-if="showDropdown" class="dropdown-backdrop" @click="closeDropdown"></div>
    </div>
    
    <!-- Signed out state -->
    <div v-else class="profile-wrapper">
      <button class="sign-in-icon-btn" @click="toggleDropdown" title="Settings">
        <svg class="sign-in-icon" viewBox="0 0 24 24" width="24" height="24">
          <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
        </svg>
      </button>
      
      <!-- Dropdown menu for non-authenticated users -->
      <Transition name="dropdown">
        <div v-if="showDropdown" class="dropdown-menu">
          <div class="settings-section">
            <span class="settings-label">Rest Timer</span>
            <div class="timer-options">
              <button 
                class="timer-option" 
                :class="{ active: settingsStore.settings.timerBehavior === 'auto' }"
                @click="setTimerBehavior('auto')"
              >Auto</button>
              <button 
                class="timer-option" 
                :class="{ active: settingsStore.settings.timerBehavior === 'manual' }"
                @click="setTimerBehavior('manual')"
              >Manual</button>
              <button 
                class="timer-option" 
                :class="{ active: settingsStore.settings.timerBehavior === 'disabled' }"
                @click="setTimerBehavior('disabled')"
              >Off</button>
            </div>
          </div>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item" @click="authStore.signInWithGoogle">
            Sign in with Google
          </button>
        </div>
      </Transition>
      
      <!-- Backdrop to close dropdown -->
      <div v-if="showDropdown" class="dropdown-backdrop" @click="closeDropdown"></div>
    </div>
    
    <!-- Error display -->
    <div v-if="authStore.error" class="auth-error-toast">
      {{ authStore.error }}
      <button class="dismiss-error" @click="authStore.clearError">×</button>
    </div>
  </div>
</template>

<style scoped>
.user-profile-compact {
  position: relative;
}

.profile-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-icon.loading {
  opacity: 0.7;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--color-gold);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.profile-wrapper {
  position: relative;
}

.profile-icon-btn {
  position: relative;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.profile-icon-btn:hover {
  transform: scale(1.05);
}

.profile-icon-btn:active {
  transform: scale(0.95);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.user-avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-gold);
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.sync-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--color-bg, #0a0c10);
}

.status-synced .sync-dot,
.sync-dot.status-synced {
  background: #4ade80;
}

.status-syncing .sync-dot,
.sync-dot.status-syncing {
  background: var(--color-gold);
  animation: pulse 1s ease-in-out infinite;
}

.status-error .sync-dot,
.sync-dot.status-error {
  background: #ef4444;
}

.status-offline .sync-dot,
.sync-dot.status-offline {
  background: #6b7280;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Dropdown */
.dropdown-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  background: rgba(20, 25, 35, 0.98);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  z-index: 100;
  overflow: hidden;
}

.dropdown-header {
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.user-email {
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.sync-indicator-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.sync-status.status-synced .sync-indicator-dot {
  background: #4ade80;
}

.sync-status.status-syncing .sync-indicator-dot {
  background: var(--color-gold);
  animation: pulse 1s ease-in-out infinite;
}

.sync-status.status-error .sync-indicator-dot {
  background: #ef4444;
}

.sync-status.status-offline .sync-indicator-dot {
  background: #6b7280;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.6rem 1rem;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s ease;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-primary);
}

.dropdown-item.sign-out:hover {
  color: #fca5a5;
}

/* Settings section */
.settings-section {
  padding: 0.6rem 1rem;
}

.settings-label {
  display: block;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.timer-options {
  display: flex;
  gap: 0.25rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 0.15rem;
}

.timer-option {
  flex: 1;
  padding: 0.4rem 0.5rem;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.7rem;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.timer-option:hover {
  color: var(--color-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.timer-option.active {
  background: var(--color-gold);
  color: #000;
}

/* Sign in button */
.sign-in-icon-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.sign-in-icon-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--color-text-primary);
  transform: scale(1.05);
}

.sign-in-icon-btn:active {
  transform: scale(0.95);
}

.sign-in-icon {
  width: 24px;
  height: 24px;
}

/* Dropdown animation */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

/* Error toast */
.auth-error-toast {
  position: fixed;
  bottom: 1rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.6rem 1rem;
  background: rgba(239, 68, 68, 0.95);
  border-radius: 8px;
  color: white;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.dismiss-error {
  background: none;
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  opacity: 0.8;
}

.dismiss-error:hover {
  opacity: 1;
}
</style>
