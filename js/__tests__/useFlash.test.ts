import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reactive, nextTick } from 'vue'
import { withSetup } from './helpers'

const mockProps = reactive<Record<string, any>>({})

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: mockProps }),
    router: { visit: vi.fn() },
}))

import { useFlash } from '../composables/useFlash'

beforeEach(() => {
    vi.useFakeTimers()
    Object.keys(mockProps).forEach((key) => delete mockProps[key])
    Object.assign(mockProps, { flash: { messages: [] } })
})

afterEach(() => {
    vi.useRealTimers()
})

describe('useFlash', () => {
    it('starts with no messages', () => {
        const { result } = withSetup(() => useFlash())

        expect(result.messages.value).toEqual([])
    })

    it('picks up flash messages from page props', async () => {
        const { result } = withSetup(() => useFlash())

        mockProps.flash = {
            messages: [
                { id: 'server-uuid-1', type: 'success', text: 'Created!', detail: null, action: null, autoDismiss: 5000 },
            ],
        }
        await nextTick()

        expect(result.messages.value).toHaveLength(1)
        expect(result.messages.value[0].text).toBe('Created!')
        expect(result.messages.value[0].type).toBe('success')
        expect(result.messages.value[0].id).toBe('server-uuid-1')
    })

    it('does not duplicate messages on re-trigger with same payload', async () => {
        const { result } = withSetup(() => useFlash())

        const payload = [
            { id: 'uuid-1', type: 'success', text: 'Done', detail: null, action: null, autoDismiss: 5000 },
        ]

        mockProps.flash = { messages: [...payload] }
        await nextTick()

        // Re-assign the same payload (same server ID)
        mockProps.flash = { messages: [...payload] }
        await nextTick()

        expect(result.messages.value).toHaveLength(1)
    })

    it('adds new messages when payload changes', async () => {
        const { result } = withSetup(() => useFlash())

        mockProps.flash = {
            messages: [
                { id: 'uuid-a', type: 'success', text: 'First', detail: null, action: null, autoDismiss: 5000 },
            ],
        }
        await nextTick()

        mockProps.flash = {
            messages: [
                { id: 'uuid-b', type: 'error', text: 'Second', detail: null, action: null, autoDismiss: false },
            ],
        }
        await nextTick()

        expect(result.messages.value).toHaveLength(2)
    })

    it('falls back to client-generated ID when server ID is missing', async () => {
        const { result } = withSetup(() => useFlash())

        mockProps.flash = {
            messages: [
                { type: 'success', text: 'No ID', detail: null, action: null, autoDismiss: false },
            ],
        }
        await nextTick()

        expect(result.messages.value).toHaveLength(1)
        expect(result.messages.value[0].id).toMatch(/^flash-/)
    })

    it('dismisses a message by id', async () => {
        const { result } = withSetup(() => useFlash())

        mockProps.flash = {
            messages: [
                { type: 'success', text: 'Test', detail: null, action: null, autoDismiss: false },
            ],
        }
        await nextTick()

        const id = result.messages.value[0].id
        result.dismiss(id)

        expect(result.messages.value).toHaveLength(0)
    })

    it('dismisses all messages', async () => {
        const { result } = withSetup(() => useFlash())

        mockProps.flash = {
            messages: [
                { type: 'success', text: 'One', detail: null, action: null, autoDismiss: false },
                { type: 'error', text: 'Two', detail: null, action: null, autoDismiss: false },
            ],
        }
        await nextTick()

        expect(result.messages.value).toHaveLength(2)

        result.dismissAll()

        expect(result.messages.value).toHaveLength(0)
    })

    it('auto-dismisses messages after the configured duration', async () => {
        const { result } = withSetup(() => useFlash())

        mockProps.flash = {
            messages: [
                { type: 'success', text: 'Auto', detail: null, action: null, autoDismiss: 3000 },
            ],
        }
        await nextTick()

        expect(result.messages.value).toHaveLength(1)

        vi.advanceTimersByTime(3000)

        expect(result.messages.value).toHaveLength(0)
    })

    it('does not auto-dismiss when autoDismiss is false', async () => {
        const { result } = withSetup(() => useFlash())

        mockProps.flash = {
            messages: [
                { type: 'error', text: 'Persistent', detail: null, action: null, autoDismiss: false },
            ],
        }
        await nextTick()

        vi.advanceTimersByTime(10000)

        expect(result.messages.value).toHaveLength(1)
    })

    it('updates remainingPercent during auto-dismiss countdown', async () => {
        const { result } = withSetup(() => useFlash())

        mockProps.flash = {
            messages: [
                { type: 'success', text: 'Progress', detail: null, action: null, autoDismiss: 1000 },
            ],
        }
        await nextTick()

        expect(result.messages.value[0].remainingPercent).toBe(100)

        vi.advanceTimersByTime(500)

        expect(result.messages.value[0].remainingPercent).toBeLessThan(100)
        expect(result.messages.value[0].remainingPercent).toBeGreaterThan(0)
    })

    it('fires onFlash callbacks when a message is added', async () => {
        const callback = vi.fn()
        const { result } = withSetup(() => {
            const flash = useFlash()
            flash.onFlash(callback)
            return flash
        })

        mockProps.flash = {
            messages: [
                { type: 'info', text: 'Hello', detail: null, action: null, autoDismiss: false },
            ],
        }
        await nextTick()

        expect(callback).toHaveBeenCalledOnce()
        expect(callback).toHaveBeenCalledWith(
            expect.objectContaining({ type: 'info', text: 'Hello' }),
        )
    })

    it('unsubscribed onFlash callbacks are not called', async () => {
        const callback = vi.fn()
        withSetup(() => {
            const flash = useFlash()
            const unsubscribe = flash.onFlash(callback)
            unsubscribe()
            return flash
        })

        mockProps.flash = {
            messages: [
                { type: 'info', text: 'After unsub', detail: null, action: null, autoDismiss: false },
            ],
        }
        await nextTick()

        expect(callback).not.toHaveBeenCalled()
    })

    it('cleans up timers on unmount', async () => {
        const { result, wrapper } = withSetup(() => useFlash())

        mockProps.flash = {
            messages: [
                { type: 'success', text: 'Temp', detail: null, action: null, autoDismiss: 5000 },
            ],
        }
        await nextTick()

        expect(result.messages.value).toHaveLength(1)

        wrapper.unmount()

        // Timers should be cleaned up - no errors from advancing time
        vi.advanceTimersByTime(10000)
    })

    it('ignores messages with empty text', async () => {
        const { result } = withSetup(() => useFlash())

        mockProps.flash = {
            messages: [
                { type: 'success', text: '', detail: null, action: null, autoDismiss: 5000 },
            ],
        }
        await nextTick()

        expect(result.messages.value).toHaveLength(0)
    })
})
