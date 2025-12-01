import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TimerCircle from './TimerCircle.vue'

describe('TimerCircle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('renders correctly', () => {
    const wrapper = mount(TimerCircle, {
      props: {
        durationSec: 20,
        autoStart: false
      }
    })

    expect(wrapper.find('.timer-circle-container').exists()).toBe(true)
    expect(wrapper.find('.timer-text').text()).toBe('20')
  })

  it('starts timer when autoStart is true', async () => {
    const wrapper = mount(TimerCircle, {
      props: {
        durationSec: 5,
        autoStart: true
      }
    })

    expect(wrapper.find('.timer-text').text()).toBe('5')

    // Advance time
    await vi.advanceTimersByTime(1000)
    await wrapper.vm.$nextTick()

    // Timer should have decreased
    const timeLeft = parseInt(wrapper.find('.timer-text').text())
    expect(timeLeft).toBeLessThanOrEqual(4)
  })

  it('emits finished event when timer reaches zero', async () => {
    const wrapper = mount(TimerCircle, {
      props: {
        durationSec: 1,
        autoStart: true
      }
    })

    // Advance time to finish timer
    await vi.advanceTimersByTime(1100)
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('finished')).toBeTruthy()
  })

  it('exposes start, stop, and reset methods', () => {
    const wrapper = mount(TimerCircle, {
      props: {
        durationSec: 20,
        autoStart: false
      }
    })

    const vm = wrapper.vm as any
    expect(typeof vm.start).toBe('function')
    expect(typeof vm.stop).toBe('function')
    expect(typeof vm.reset).toBe('function')
  })

  it('can be manually started and stopped', async () => {
    const wrapper = mount(TimerCircle, {
      props: {
        durationSec: 10,
        autoStart: false
      }
    })

    const vm = wrapper.vm as any

    // Start timer
    vm.start()
    await wrapper.vm.$nextTick()

    const initialTime = parseInt(wrapper.find('.timer-text').text())

    // Advance time by more than one update interval (100ms)
    await vi.advanceTimersByTime(1100)
    await wrapper.vm.$nextTick()

    // Stop timer
    vm.stop()
    await wrapper.vm.$nextTick()

    const stoppedTime = parseInt(wrapper.find('.timer-text').text())
    expect(stoppedTime).toBeLessThanOrEqual(initialTime)
    expect(stoppedTime).toBeGreaterThanOrEqual(8) // Should have decreased
  })

  it('resets timer correctly', async () => {
    const wrapper = mount(TimerCircle, {
      props: {
        durationSec: 10,
        autoStart: true
      }
    })

    const vm = wrapper.vm as any

    // Advance time
    await vi.advanceTimersByTime(2000)
    await wrapper.vm.$nextTick()

    // Reset
    vm.reset()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.timer-text').text()).toBe('10')
  })
})

