import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import SetRow from '@/components/SetRow.vue'
import type { WorkoutSet } from '@/types/workout'

describe('SetRow', () => {
  const mockSet: WorkoutSet = {
    id: 'set-1',
    reps: 10,
    weight: 60,
    weightUnit: 'kg',
    isCompleted: false
  }

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('layout structure', () => {
    it('has set-main section for weight and reps inputs', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      const setMain = wrapper.find('.set-main')
      expect(setMain.exists()).toBe(true)
      
      // set-main should contain weight and reps inputs
      expect(setMain.find('.weight-column').exists()).toBe(true)
      expect(setMain.find('.reps-column').exists()).toBe(true)
    })

    it('has set-actions section for RPE, complete, and delete buttons', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      const setActions = wrapper.find('.set-actions')
      expect(setActions.exists()).toBe(true)
      
      // set-actions should contain action buttons
      expect(setActions.find('.rpe-toggle').exists()).toBe(true)
      expect(setActions.find('.complete-btn').exists()).toBe(true)
      expect(setActions.find('.delete-btn').exists()).toBe(true)
    })

    it('set-main and set-actions are separate DOM elements (not siblings in same flex row)', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      const setMain = wrapper.find('.set-main')
      const setActions = wrapper.find('.set-actions')
      
      // Both should exist
      expect(setMain.exists()).toBe(true)
      expect(setActions.exists()).toBe(true)
      
      // set-actions should not be a child of set-main
      expect(setMain.find('.set-actions').exists()).toBe(false)
      
      // Both should be direct children of set-row
      const setRow = wrapper.find('.set-row')
      const directChildren = setRow.element.children
      const childClasses = Array.from(directChildren).map(el => el.className)
      
      expect(childClasses.some(c => c.includes('set-main'))).toBe(true)
      expect(childClasses.some(c => c.includes('set-actions'))).toBe(true)
    })

    it('RPE toggle is in set-actions, not in set-main', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      // RPE toggle should NOT be in set-main
      expect(wrapper.find('.set-main .rpe-toggle').exists()).toBe(false)
      
      // RPE toggle SHOULD be in set-actions
      expect(wrapper.find('.set-actions .rpe-toggle').exists()).toBe(true)
    })

    it('complete button is in set-actions, not in set-main', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      // Complete button should NOT be in set-main
      expect(wrapper.find('.set-main .complete-btn').exists()).toBe(false)
      
      // Complete button SHOULD be in set-actions
      expect(wrapper.find('.set-actions .complete-btn').exists()).toBe(true)
    })

    it('delete button is in set-actions, not in set-main', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      // Delete button should NOT be in set-main
      expect(wrapper.find('.set-main .delete-btn').exists()).toBe(false)
      
      // Delete button SHOULD be in set-actions
      expect(wrapper.find('.set-actions .delete-btn').exists()).toBe(true)
    })
  })

  describe('weight input', () => {
    it('displays the weight value', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      const weightInput = wrapper.find('.weight-column .value-input')
      expect((weightInput.element as HTMLInputElement).value).toBe('60')
    })

    it('displays the weight unit', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      const unitBtn = wrapper.find('.unit-btn')
      expect(unitBtn.text()).toBe('kg')
    })
  })

  describe('reps input', () => {
    it('displays the reps value', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      const repsInput = wrapper.find('.reps-column .value-input')
      expect((repsInput.element as HTMLInputElement).value).toBe('10')
    })
  })

  describe('completed state', () => {
    it('shows completed-check instead of complete-btn when set is completed', () => {
      const completedSet: WorkoutSet = { ...mockSet, isCompleted: true }
      const wrapper = mount(SetRow, {
        props: { set: completedSet, setNumber: 1 }
      })

      expect(wrapper.find('.complete-btn').exists()).toBe(false)
      expect(wrapper.find('.completed-check').exists()).toBe(true)
    })

    it('hides delete button when set is completed', () => {
      const completedSet: WorkoutSet = { ...mockSet, isCompleted: true }
      const wrapper = mount(SetRow, {
        props: { set: completedSet, setNumber: 1 }
      })

      expect(wrapper.find('.delete-btn').exists()).toBe(false)
    })
  })

  describe('events', () => {
    it('emits complete event when complete button is clicked', async () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      await wrapper.find('.complete-btn').trigger('click')
      expect(wrapper.emitted('complete')).toBeTruthy()
    })

    it('emits delete event when delete button is clicked', async () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      await wrapper.find('.delete-btn').trigger('click')
      expect(wrapper.emitted('delete')).toBeTruthy()
    })
  })
})

