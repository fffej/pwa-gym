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
    it('has set-main section for weight, reps, and complete button', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      const setMain = wrapper.find('.set-main')
      expect(setMain.exists()).toBe(true)
      
      // set-main should contain weight and reps cells
      expect(setMain.find('.weight-cell').exists()).toBe(true)
      expect(setMain.find('.reps-cell').exists()).toBe(true)
      expect(setMain.find('.complete-btn').exists()).toBe(true)
    })

    it('has rpe-row section for the always-visible RPE slider', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      const rpeRow = wrapper.find('.rpe-row')
      expect(rpeRow.exists()).toBe(true)
      
      // RPE slider should be present
      expect(rpeRow.find('.rpe-slider').exists()).toBe(true)
    })

    it('set-main and rpe-row are separate sections within set-row', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      const setMain = wrapper.find('.set-main')
      const rpeRow = wrapper.find('.rpe-row')
      
      // Both should exist
      expect(setMain.exists()).toBe(true)
      expect(rpeRow.exists()).toBe(true)
      
      // Both should be direct children of set-row
      const setRow = wrapper.find('.set-row')
      const directChildren = setRow.element.children
      const childClasses = Array.from(directChildren).map(el => el.className)
      
      expect(childClasses.some(c => c.includes('set-main'))).toBe(true)
      expect(childClasses.some(c => c.includes('rpe-row'))).toBe(true)
    })

    it('complete button is in set-main', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      expect(wrapper.find('.set-main .complete-btn').exists()).toBe(true)
    })
  })

  describe('weight display', () => {
    it('displays the weight value', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      const weightCell = wrapper.find('.weight-cell')
      expect(weightCell.text()).toContain('60')
    })

    it('displays the weight unit', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      const unitBadge = wrapper.find('.unit-badge')
      expect(unitBadge.text()).toBe('kg')
    })

    it('shows input when weight cell is clicked', async () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      // Initially, value-text is shown, not input
      expect(wrapper.find('.weight-cell .value-text').exists()).toBe(true)
      expect(wrapper.find('.weight-cell .inline-input').exists()).toBe(false)

      // Click to edit
      await wrapper.find('.weight-cell').trigger('click')

      // Now inline-input should be visible
      expect(wrapper.find('.weight-cell .inline-input').exists()).toBe(true)
    })
  })

  describe('reps display', () => {
    it('displays the reps value', () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      const repsCell = wrapper.find('.reps-cell')
      expect(repsCell.text()).toContain('10')
    })

    it('shows input when reps cell is clicked', async () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      // Initially, value-text is shown, not input
      expect(wrapper.find('.reps-cell .value-text').exists()).toBe(true)
      expect(wrapper.find('.reps-cell .inline-input').exists()).toBe(false)

      // Click to edit
      await wrapper.find('.reps-cell').trigger('click')

      // Now inline-input should be visible
      expect(wrapper.find('.reps-cell .inline-input').exists()).toBe(true)
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

    it('shows edit button when set is completed', () => {
      const completedSet: WorkoutSet = { ...mockSet, isCompleted: true }
      const wrapper = mount(SetRow, {
        props: { set: completedSet, setNumber: 1 }
      })

      expect(wrapper.find('.edit-btn').exists()).toBe(true)
    })

    it('does not allow editing weight when completed (before clicking edit)', async () => {
      const completedSet: WorkoutSet = { ...mockSet, isCompleted: true }
      const wrapper = mount(SetRow, {
        props: { set: completedSet, setNumber: 1 }
      })

      // Click should not trigger edit mode
      await wrapper.find('.weight-cell').trigger('click')
      expect(wrapper.find('.weight-cell .inline-input').exists()).toBe(false)
    })

    it('does not allow editing reps when completed (before clicking edit)', async () => {
      const completedSet: WorkoutSet = { ...mockSet, isCompleted: true }
      const wrapper = mount(SetRow, {
        props: { set: completedSet, setNumber: 1 }
      })

      // Click should not trigger edit mode
      await wrapper.find('.reps-cell').trigger('click')
      expect(wrapper.find('.reps-cell .inline-input').exists()).toBe(false)
    })

    it('allows editing after clicking the edit button on completed set', async () => {
      const completedSet: WorkoutSet = { ...mockSet, isCompleted: true }
      const wrapper = mount(SetRow, {
        props: { set: completedSet, setNumber: 1 }
      })

      // Click edit button to enable editing
      await wrapper.find('.edit-btn').trigger('click')

      // Edit button should now be hidden
      expect(wrapper.find('.edit-btn').exists()).toBe(false)

      // Now clicking weight should work
      await wrapper.find('.weight-cell').trigger('click')
      expect(wrapper.find('.weight-cell .inline-input').exists()).toBe(true)
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

    it('emits update event when weight is changed', async () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      // Enter edit mode
      await wrapper.find('.weight-cell').trigger('click')
      
      // Change the value
      const input = wrapper.find('.weight-cell .inline-input')
      await input.setValue(70)
      await input.trigger('blur')

      const updateEvents = wrapper.emitted('update')
      expect(updateEvents).toBeTruthy()
      expect(updateEvents![updateEvents!.length - 1]).toEqual([{ weight: 70 }])
    })

    it('emits update event when reps is changed', async () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      // Enter edit mode
      await wrapper.find('.reps-cell').trigger('click')
      
      // Change the value
      const input = wrapper.find('.reps-cell .inline-input')
      await input.setValue(12)
      await input.trigger('blur')

      const updateEvents = wrapper.emitted('update')
      expect(updateEvents).toBeTruthy()
      expect(updateEvents![updateEvents!.length - 1]).toEqual([{ reps: 12 }])
    })

    it('emits update event when unit is toggled', async () => {
      const wrapper = mount(SetRow, {
        props: { set: mockSet, setNumber: 1 }
      })

      await wrapper.find('.unit-badge').trigger('click')
      
      const updateEvents = wrapper.emitted('update')
      expect(updateEvents).toBeTruthy()
      expect(updateEvents![0]).toEqual([{ weightUnit: 'lbs' }])
    })
  })
})
