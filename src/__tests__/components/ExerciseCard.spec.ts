import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ExerciseCard from '@/components/ExerciseCard.vue'
import type { Exercise } from '@/types/workout'

// Mock the machines store
vi.mock('@/stores/machines', () => ({
  useMachinesStore: vi.fn(() => ({
    getMachineById: vi.fn(() => ({
      id: 'bench-press',
      name: 'Bench Press',
      weightIncrement: 2.5,
      attachments: [
        { id: 'wide-bar', name: 'Wide Bar', grips: ['pronated'] }
      ]
    }))
  }))
}))

describe('ExerciseCard', () => {
  const mockExercise: Exercise = {
    id: 'exercise-1',
    machineId: 'bench-press',
    exerciseId: 'bench-press-flat',
    machineName: 'Bench Press',
    exerciseName: 'Flat Bench Press',
    sets: [
      {
        id: 'set-1',
        reps: 10,
        weight: 60,
        weightUnit: 'kg',
        restPeriod: 90,
        isCompleted: false
      },
      {
        id: 'set-2',
        reps: 10,
        weight: 60,
        weightUnit: 'kg',
        restPeriod: 90,
        isCompleted: true
      }
    ]
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('exercise name display', () => {
    it('displays exerciseName in the header, not machineName', () => {
      const wrapper = mount(ExerciseCard, {
        props: { exercise: mockExercise }
      })

      const exerciseName = wrapper.find('.exercise-name')
      expect(exerciseName.text()).toBe('Flat Bench Press')
      expect(exerciseName.text()).not.toBe('Bench Press')
    })

    it('displays machineName as a secondary tag in the meta section', () => {
      const wrapper = mount(ExerciseCard, {
        props: { exercise: mockExercise }
      })

      const machineTag = wrapper.find('.machine-tag')
      expect(machineTag.exists()).toBe(true)
      expect(machineTag.text()).toBe('Bench Press')
    })

    it('machine tag has distinct styling from other meta tags', () => {
      const wrapper = mount(ExerciseCard, {
        props: { exercise: mockExercise }
      })

      const machineTag = wrapper.find('.machine-tag')
      expect(machineTag.classes()).toContain('meta-tag')
      expect(machineTag.classes()).toContain('machine-tag')
    })
  })

  describe('sets display', () => {
    it('shows correct completed/total sets count', () => {
      const wrapper = mount(ExerciseCard, {
        props: { exercise: mockExercise }
      })

      const setsCount = wrapper.find('.sets-count')
      expect(setsCount.text()).toBe('1/2 sets')
    })
  })

  describe('attachment display', () => {
    it('shows attachment name when exercise has attachmentId', () => {
      const exerciseWithAttachment: Exercise = {
        ...mockExercise,
        attachmentId: 'wide-bar'
      }

      const wrapper = mount(ExerciseCard, {
        props: { exercise: exerciseWithAttachment }
      })

      const metaTags = wrapper.findAll('.meta-tag')
      const attachmentTag = metaTags.find(tag => tag.text() === 'Wide Bar')
      expect(attachmentTag).toBeDefined()
    })
  })

  describe('grip display', () => {
    it('shows formatted grip when exercise has grip', () => {
      const exerciseWithGrip: Exercise = {
        ...mockExercise,
        grip: 'pronated'
      }

      const wrapper = mount(ExerciseCard, {
        props: { exercise: exerciseWithGrip }
      })

      const metaTags = wrapper.findAll('.meta-tag')
      const gripTag = metaTags.find(tag => tag.text() === 'Pronated')
      expect(gripTag).toBeDefined()
    })
  })

  describe('collapse functionality', () => {
    it('starts expanded by default', () => {
      const wrapper = mount(ExerciseCard, {
        props: { exercise: mockExercise }
      })

      expect(wrapper.find('.exercise-body').isVisible()).toBe(true)
    })

    it('collapses when header is clicked', async () => {
      const wrapper = mount(ExerciseCard, {
        props: { exercise: mockExercise }
      })

      await wrapper.find('.exercise-header').trigger('click')
      expect(wrapper.find('.exercise-body').isVisible()).toBe(false)
    })
  })
})

