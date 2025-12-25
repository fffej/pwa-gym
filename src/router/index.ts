import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/workout',
      name: 'workout',
      component: () => import('../views/WorkoutView.vue')
    },
    {
      path: '/workout/add-exercise',
      name: 'add-exercise',
      component: () => import('../views/ExercisePickerView.vue')
    },
    {
      path: '/timer',
      name: 'timer',
      component: () => import('../views/TimerView.vue')
    },
    {
      path: '/equipment',
      name: 'equipment',
      component: () => import('../views/EquipmentView.vue')
    },
    {
      path: '/progress',
      name: 'progress',
      component: () => import('../views/ProgressView.vue')
    }
  ]
})

export default router


