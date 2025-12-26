import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { auth, googleProvider } from '@/services/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(true)
  const error = ref<string | null>(null)

  // Computed properties
  const isAuthenticated = computed(() => user.value !== null)
  const userName = computed(() => user.value?.displayName || 'Guest')
  const userEmail = computed(() => user.value?.email || '')
  const userPhoto = computed(() => user.value?.photoURL || '')
  const userId = computed(() => user.value?.uid || null)

  // Initialize auth state listener
  function initAuthListener() {
    isLoading.value = true
    
    onAuthStateChanged(auth, (firebaseUser) => {
      user.value = firebaseUser
      isLoading.value = false
      error.value = null
    }, (err) => {
      console.error('Auth state error:', err)
      error.value = err.message
      isLoading.value = false
    })
  }

  // Sign in with Google
  async function signInWithGoogle(): Promise<boolean> {
    try {
      isLoading.value = true
      error.value = null
      
      await signInWithPopup(auth, googleProvider)
      return true
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in'
      console.error('Sign in error:', err)
      error.value = errorMessage
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Sign out
  async function signOut(): Promise<boolean> {
    try {
      isLoading.value = true
      error.value = null
      
      await firebaseSignOut(auth)
      return true
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out'
      console.error('Sign out error:', err)
      error.value = errorMessage
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Clear error
  function clearError() {
    error.value = null
  }

  return {
    // State
    user,
    isLoading,
    error,
    
    // Computed
    isAuthenticated,
    userName,
    userEmail,
    userPhoto,
    userId,
    
    // Actions
    initAuthListener,
    signInWithGoogle,
    signOut,
    clearError
  }
})



