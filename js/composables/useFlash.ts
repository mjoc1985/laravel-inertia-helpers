import { computed, ref, watch, onUnmounted } from 'vue'
import { usePage } from '@inertiajs/vue3'
import type { UseFlashReturn, FlashMessage, FlashMessagePayload, SharedData } from '../types'

const generateId = (): string =>
    `flash-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

/**
 * Manages flash messages with auto-dismiss, stacking, and lifecycle tracking.
 *
 * @example
 * const { messages, dismiss, dismissAll, onFlash } = useFlash()
 *
 * onFlash((msg) => {
 *     if (msg.type === 'error') console.error(msg.text)
 * })
 */
export function useFlash(): UseFlashReturn {
    const page = usePage<SharedData>()
    const activeMessages = ref<FlashMessage[]>([])
    const timers = new Map<string, ReturnType<typeof setInterval>>()
    const dismissTimers = new Map<string, ReturnType<typeof setTimeout>>()
    const listeners = new Set<(message: FlashMessage) => void>()
    let lastProcessedPayload: string | null = null

    const addMessage = (payload: FlashMessagePayload): void => {
        const message: FlashMessage = {
            ...payload,
            id: generateId(),
            remainingPercent: 100,
            createdAt: Date.now(),
        }

        activeMessages.value = [...activeMessages.value, message]

        // Notify listeners
        listeners.forEach((cb) => cb(message))

        // Set up auto-dismiss if configured
        if (message.autoDismiss && typeof message.autoDismiss === 'number') {
            const duration = message.autoDismiss
            const intervalMs = 50 // update progress every 50ms
            const startTime = Date.now()

            // Progress countdown
            const progressTimer = setInterval(() => {
                const elapsed = Date.now() - startTime
                const remaining = Math.max(0, 100 - (elapsed / duration) * 100)

                activeMessages.value = activeMessages.value.map((msg) =>
                    msg.id === message.id
                        ? { ...msg, remainingPercent: remaining }
                        : msg,
                )
            }, intervalMs)
            timers.set(message.id, progressTimer)

            // Dismiss after duration
            const dismissTimer = setTimeout(() => {
                dismiss(message.id)
            }, duration)
            dismissTimers.set(message.id, dismissTimer)
        }
    }

    const dismiss = (id: string): void => {
        // Clear timers
        const progressTimer = timers.get(id)
        if (progressTimer) {
            clearInterval(progressTimer)
            timers.delete(id)
        }

        const dismissTimer = dismissTimers.get(id)
        if (dismissTimer) {
            clearTimeout(dismissTimer)
            dismissTimers.delete(id)
        }

        // Remove message
        activeMessages.value = activeMessages.value.filter((msg) => msg.id !== id)
    }

    const dismissAll = (): void => {
        // Clear all timers
        timers.forEach((timer) => clearInterval(timer))
        timers.clear()
        dismissTimers.forEach((timer) => clearTimeout(timer))
        dismissTimers.clear()

        activeMessages.value = []
    }

    const onFlash = (callback: (message: FlashMessage) => void): void => {
        listeners.add(callback)
    }

    // Watch for new flash messages from Inertia page props.
    // Deduplicates by comparing serialized payloads to prevent
    // adding the same messages on partial reloads.
    watch(
        () => page.props.flash?.messages,
        (newMessages) => {
            if (!newMessages || !Array.isArray(newMessages) || newMessages.length === 0) {
                return
            }

            const serialized = JSON.stringify(newMessages)
            if (serialized === lastProcessedPayload) return
            lastProcessedPayload = serialized

            newMessages.forEach((payload: FlashMessagePayload) => {
                if (payload.text) {
                    addMessage(payload)
                }
            })
        },
        { immediate: true, deep: true },
    )

    // Clean up all timers and listeners on unmount
    onUnmounted(() => {
        timers.forEach((timer) => clearInterval(timer))
        timers.clear()
        dismissTimers.forEach((timer) => clearTimeout(timer))
        dismissTimers.clear()
        listeners.clear()
    })

    const messages = computed(() => activeMessages.value)

    return {
        messages,
        dismiss,
        dismissAll,
        onFlash,
    }
}
