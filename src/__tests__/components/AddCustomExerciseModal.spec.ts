import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import AddCustomExerciseModal from '@/components/AddCustomExerciseModal.vue'
import { useMachinesStore } from '@/stores/machines'

// Mock the machines store
vi.mock('@/stores/machines', () => ({
  useMachinesStore: vi.fn(() => ({
    addCustomExercise: vi.fn().mockResolvedValue(undefined)
  }))
}))

describe('AddCustomExerciseModal', () => {
  const defaultProps = {
    machineId: 'bench-press',
    machineName: 'Bench Press',
    attachments: [
      { id: 'wide-bar', name: 'Wide Bar', grips: ['pronated', 'supinated'] },
      { id: 'v-bar', name: 'V-Bar', grips: ['neutral'] }
    ],
    isOpen: true
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders when isOpen is true', () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('.modal').exists()).toBe(true)
      expect(wrapper.find('#modal-title').text()).toBe('Add Exercise')
    })

    it('does not render when isOpen is false', () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: { ...defaultProps, isOpen: false },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('.modal').exists()).toBe(false)
    })

    it('displays the machine name in the context', () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('.machine-context').text()).toContain('Bench Press')
    })

    it('renders all muscle group options', () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      const muscleChips = wrapper.findAll('.muscle-chip')
      expect(muscleChips.length).toBe(12) // All 12 muscle groups
    })

    it('renders attachment dropdown when attachments are provided', () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      const select = wrapper.find('#attachment')
      expect(select.exists()).toBe(true)
      
      const options = select.findAll('option')
      expect(options.length).toBe(3) // "None" + 2 attachments
    })

    it('does not render attachment dropdown when no attachments', () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: { ...defaultProps, attachments: [] },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('#attachment').exists()).toBe(false)
    })
  })

  describe('form validation', () => {
    it('disables submit button when name is empty', () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      const submitBtn = wrapper.find('button[type="submit"]')
      expect(submitBtn.attributes('disabled')).toBeDefined()
    })

    it('disables submit button when no muscles are selected', async () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      // Enter a name
      await wrapper.find('#exercise-name').setValue('Test Exercise')

      // No muscles selected - button should still be disabled
      const submitBtn = wrapper.find('button[type="submit"]')
      expect(submitBtn.attributes('disabled')).toBeDefined()
    })

    it('enables submit button when name and at least one muscle are provided', async () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      // Enter a name
      await wrapper.find('#exercise-name').setValue('Test Exercise')

      // Click a muscle chip
      const muscleChips = wrapper.findAll('.muscle-chip')
      await muscleChips[0]?.trigger('click')

      // Submit button should be enabled
      const submitBtn = wrapper.find('button[type="submit"]')
      expect(submitBtn.attributes('disabled')).toBeUndefined()
    })

    it('shows hint when no muscles are selected', () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      expect(wrapper.find('.field-hint').text()).toContain('Select at least one muscle group')
    })

    it('hides hint when a muscle is selected', async () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      // Click a muscle chip
      const muscleChips = wrapper.findAll('.muscle-chip')
      await muscleChips[0]?.trigger('click')

      expect(wrapper.find('.field-hint').exists()).toBe(false)
    })
  })

  describe('muscle selection', () => {
    it('toggles muscle selection when clicked', async () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      // Initially not selected
      expect(wrapper.findAll('.muscle-chip')[0]!.classes()).not.toContain('active')

      // Click to select
      await wrapper.findAll('.muscle-chip')[0]!.trigger('click')
      // Re-query after Vue updates
      expect(wrapper.findAll('.muscle-chip')[0]!.classes()).toContain('active')

      // Click again to deselect
      await wrapper.findAll('.muscle-chip')[0]!.trigger('click')
      // Re-query after Vue updates
      expect(wrapper.findAll('.muscle-chip')[0]!.classes()).not.toContain('active')
    })

    it('allows selecting multiple muscles', async () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      const muscleChips = wrapper.findAll('.muscle-chip')

      // Select first two muscles
      await muscleChips[0]?.trigger('click')
      await muscleChips[1]?.trigger('click')

      const activeChips = wrapper.findAll('.muscle-chip.active')
      expect(activeChips.length).toBe(2)
    })
  })

  describe('form submission', () => {
    it('calls addCustomExercise with correct data on submit', async () => {
      const mockAddCustomExercise = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useMachinesStore).mockReturnValue({
        addCustomExercise: mockAddCustomExercise
      } as any)

      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      // Fill in the form
      await wrapper.find('#exercise-name').setValue('My Custom Exercise')

      // Select chest muscle (first chip)
      const muscleChips = wrapper.findAll('.muscle-chip')
      await muscleChips[0]?.trigger('click') // chest

      // Submit the form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Verify the store was called
      expect(mockAddCustomExercise).toHaveBeenCalledTimes(1)
      expect(mockAddCustomExercise).toHaveBeenCalledWith(
        'bench-press',
        expect.objectContaining({
          name: 'My Custom Exercise',
          muscles: ['chest'],
          isCustom: true
        })
      )
    })

    it('generates unique ID prefixed with custom-', async () => {
      const mockAddCustomExercise = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useMachinesStore).mockReturnValue({
        addCustomExercise: mockAddCustomExercise
      } as any)

      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      // Fill in the form
      await wrapper.find('#exercise-name').setValue('Test Exercise')
      const muscleChips = wrapper.findAll('.muscle-chip')
      await muscleChips[0]?.trigger('click')

      // Submit the form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Verify the ID format
      const call = mockAddCustomExercise.mock.calls[0]!
      const exercise = call[1]
      expect(exercise.id).toMatch(/^custom-/)
    })

    it('includes required attachment when selected', async () => {
      const mockAddCustomExercise = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useMachinesStore).mockReturnValue({
        addCustomExercise: mockAddCustomExercise
      } as any)

      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      // Fill in the form
      await wrapper.find('#exercise-name').setValue('Test Exercise')
      const muscleChips = wrapper.findAll('.muscle-chip')
      await muscleChips[0]?.trigger('click')

      // Select an attachment
      await wrapper.find('#attachment').setValue('wide-bar')

      // Submit the form
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Verify attachment is included
      expect(mockAddCustomExercise).toHaveBeenCalledWith(
        'bench-press',
        expect.objectContaining({
          requiredAttachment: 'wide-bar'
        })
      )
    })

    it('emits saved and close events on successful submission', async () => {
      const mockAddCustomExercise = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useMachinesStore).mockReturnValue({
        addCustomExercise: mockAddCustomExercise
      } as any)

      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      // Fill in the form
      await wrapper.find('#exercise-name').setValue('Test Exercise')
      const muscleChips = wrapper.findAll('.muscle-chip')
      await muscleChips[0]?.trigger('click')

      // Submit
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      expect(wrapper.emitted('saved')).toBeTruthy()
      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('cancel and close', () => {
    it('emits close event when cancel button is clicked', async () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.find('.btn-secondary').trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emits close event when close button is clicked', async () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.find('.close-btn').trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('emits close event when clicking overlay', async () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      await wrapper.find('.modal-overlay').trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('form reset', () => {
    it('resets form when modal opens', async () => {
      const wrapper = mount(AddCustomExerciseModal, {
        props: { ...defaultProps, isOpen: false },
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      // Open modal
      await wrapper.setProps({ isOpen: true })

      // Form should be empty
      const nameInput = wrapper.find('#exercise-name')
      expect((nameInput.element as HTMLInputElement).value).toBe('')

      const activeChips = wrapper.findAll('.muscle-chip.active')
      expect(activeChips.length).toBe(0)
    })
  })

  describe('generated exercise IDs', () => {
    it('generates unique IDs for multiple exercises', async () => {
      const mockAddCustomExercise = vi.fn().mockResolvedValue(undefined)
      vi.mocked(useMachinesStore).mockReturnValue({
        addCustomExercise: mockAddCustomExercise
      } as any)

      const wrapper = mount(AddCustomExerciseModal, {
        props: defaultProps,
        global: {
          stubs: {
            teleport: true
          }
        }
      })

      // Submit first exercise
      await wrapper.find('#exercise-name').setValue('Exercise 1')
      const muscleChips = wrapper.findAll('.muscle-chip')
      await muscleChips[0]?.trigger('click')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Reset and submit second exercise
      await wrapper.setProps({ isOpen: false })
      await wrapper.setProps({ isOpen: true })

      await wrapper.find('#exercise-name').setValue('Exercise 2')
      const muscleChips2 = wrapper.findAll('.muscle-chip')
      await muscleChips2[1]?.trigger('click')
      await wrapper.find('form').trigger('submit')
      await flushPromises()

      // Verify IDs are different
      const firstId = mockAddCustomExercise.mock.calls[0]![1].id
      const secondId = mockAddCustomExercise.mock.calls[1]![1].id
      expect(firstId).not.toBe(secondId)
    })
  })
})

