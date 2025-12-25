import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RestTimer from '@/components/RestTimer.vue'

describe('RestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('displayTime formatting', () => {
    it('formats 60 seconds as "1:00"', () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 60 }
      })
      
      expect(wrapper.find('.time').text()).toBe('1:00')
    })

    it('formats 90 seconds as "1:30"', () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 90 }
      })
      
      expect(wrapper.find('.time').text()).toBe('1:30')
    })

    it('formats 30 seconds as "0:30"', () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 30 }
      })
      
      expect(wrapper.find('.time').text()).toBe('0:30')
    })

    it('formats 5 seconds as "0:05" (with leading zero)', () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 5 }
      })
      
      expect(wrapper.find('.time').text()).toBe('0:05')
    })

    it('formats 120 seconds as "2:00"', () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 120 }
      })
      
      expect(wrapper.find('.time').text()).toBe('2:00')
    })

    it('formats 0 seconds as "0:00"', () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 0 }
      })
      
      expect(wrapper.find('.time').text()).toBe('0:00')
    })
  })

  describe('progress calculation', () => {
    it('starts at 0% progress', () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 60 }
      })
      
      const progressCircle = wrapper.find('.ring-progress')
      // strokeDashoffset should be at full value (282.74) at 0% progress
      expect(progressCircle.attributes('stroke-dashoffset')).toBe('282.74')
    })

    it('shows 50% progress when half the time has elapsed', async () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 60, autoStart: true }
      })
      
      // Advance 30 seconds (half of 60)
      vi.advanceTimersByTime(30000)
      await wrapper.vm.$nextTick()
      
      const progressCircle = wrapper.find('.ring-progress')
      // At 50% progress, offset should be approximately 141.37 (282.74 / 2)
      const offset = parseFloat(progressCircle.attributes('stroke-dashoffset') || '0')
      expect(offset).toBeCloseTo(141.37, 0)
    })
  })

  describe('timer controls', () => {
    it('adds 15 seconds when +15s button is clicked', async () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 60 }
      })
      
      const addButton = wrapper.findAll('.control-btn').find(btn => btn.text() === '+15s')
      await addButton?.trigger('click')
      
      expect(wrapper.find('.time').text()).toBe('1:15')
    })

    it('subtracts 15 seconds when -15s button is clicked', async () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 60 }
      })
      
      const subtractButton = wrapper.findAll('.control-btn').find(btn => btn.text() === '-15s')
      await subtractButton?.trigger('click')
      
      expect(wrapper.find('.time').text()).toBe('0:45')
    })

    it('does not go below 0 when subtracting time', async () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 10 }
      })
      
      const subtractButton = wrapper.findAll('.control-btn').find(btn => btn.text() === '-15s')
      await subtractButton?.trigger('click')
      
      expect(wrapper.find('.time').text()).toBe('0:00')
    })
  })

  describe('events', () => {
    it('emits complete event when timer reaches 0', async () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 2, autoStart: true }
      })
      
      // Advance past the duration
      vi.advanceTimersByTime(3000)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('complete')).toBeTruthy()
    })

    it('emits dismiss event when dismiss button is clicked', async () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 60 }
      })
      
      await wrapper.find('.dismiss-btn').trigger('click')
      
      expect(wrapper.emitted('dismiss')).toBeTruthy()
    })

    it('emits dismiss event when skip button is clicked', async () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 60 }
      })
      
      await wrapper.find('.skip-btn').trigger('click')
      
      expect(wrapper.emitted('dismiss')).toBeTruthy()
    })
  })

  describe('autoStart prop', () => {
    it('starts timer automatically when autoStart is true', async () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 60, autoStart: true }
      })
      
      // Advance 1 second
      vi.advanceTimersByTime(1000)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.time').text()).toBe('0:59')
    })

    it('does not start automatically when autoStart is false', async () => {
      const wrapper = mount(RestTimer, {
        props: { duration: 60, autoStart: false }
      })
      
      vi.advanceTimersByTime(5000)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.find('.time').text()).toBe('1:00')
    })
  })
})

