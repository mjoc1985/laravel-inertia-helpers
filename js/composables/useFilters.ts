import { computed, reactive, ref, watch, onUnmounted, type MaybeRefOrGetter, toValue } from 'vue'
import { router } from '@inertiajs/vue3'
import { getCurrentUrl } from '../utils/ssr'
import type { UseFiltersReturn, UseFiltersOptions } from '../types'

/**
 * Syncs a filter form with URL query parameters via Inertia visits.
 * Supports per-field debouncing, dirty tracking, and active filter counting.
 *
 * @example
 * const { values, update, reset, isDirty, activeCount } = useFilters(
 *     () => props.filters,
 *     { debounce: { search: 300 }, only: ['users'] }
 * )
 */
export function useFilters<T extends Record<string, any>>(
    defaults: MaybeRefOrGetter<T>,
    options: UseFiltersOptions<T> = {},
): UseFiltersReturn<T> {
    const {
        debounce = {},
        preserveScroll = true,
        replace = true,
        only = [],
    } = options

    const isLoading = ref(false)
    const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

    // Create a reactive copy of the current filter values
    const values = reactive({ ...toValue(defaults) }) as T

    // Re-sync values when defaults change (e.g., after an Inertia visit)
    watch(
        () => toValue(defaults),
        (newDefaults) => {
            Object.keys(newDefaults).forEach((key) => {
                ;(values as any)[key] = newDefaults[key]
            })
        },
        { deep: true },
    )

    const visit = (): void => {
        const currentUrl = getCurrentUrl()
        const params = new URLSearchParams()
        const defaultValues = toValue(defaults)

        // Only include non-default values in the URL
        Object.entries(values).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined && value !== defaultValues[key]) {
                params.set(key, String(value))
            }
        })

        // Reset to page 1 when filters change
        params.delete('page')

        const queryString = params.toString()
        const url = queryString
            ? `${currentUrl.pathname}?${queryString}`
            : currentUrl.pathname

        isLoading.value = true

        router.visit(url, {
            preserveScroll,
            replace,
            only: only.length > 0 ? only : undefined,
            onFinish: () => {
                isLoading.value = false
            },
        })
    }

    const update = <K extends keyof T>(key: K, value: T[K]): void => {
        ;(values as any)[key] = value

        // Clear existing debounce timer for this field
        const existingTimer = debounceTimers.get(key as string)
        if (existingTimer) {
            clearTimeout(existingTimer)
        }

        const debounceMs = (debounce as any)[key]

        if (debounceMs && typeof debounceMs === 'number') {
            const timer = setTimeout(() => {
                visit()
                debounceTimers.delete(key as string)
            }, debounceMs)
            debounceTimers.set(key as string, timer)
        } else {
            visit()
        }
    }

    const updateMany = (updates: Partial<T>): void => {
        Object.entries(updates).forEach(([key, value]) => {
            ;(values as any)[key] = value
        })
        visit()
    }

    const reset = (): void => {
        const defaultValues = toValue(defaults)
        Object.keys(values).forEach((key) => {
            ;(values as any)[key] = defaultValues[key] ?? ''
        })
        visit()
    }

    const resetField = <K extends keyof T>(key: K): void => {
        const defaultValues = toValue(defaults)
        ;(values as any)[key] = defaultValues[key] ?? ''
        visit()
    }

    const isDirty = computed(() => {
        const defaultValues = toValue(defaults)
        return Object.keys(values).some((key) => {
            const current = (values as any)[key]
            const def = defaultValues[key] ?? ''
            return current !== def
        })
    })

    const activeCount = computed(() => {
        const defaultValues = toValue(defaults)
        return Object.keys(values).filter((key) => {
            const current = (values as any)[key]
            const def = defaultValues[key] ?? ''
            return current !== '' && current !== null && current !== undefined && current !== def
        }).length
    })

    // Clean up debounce timers on unmount
    onUnmounted(() => {
        debounceTimers.forEach((timer) => clearTimeout(timer))
        debounceTimers.clear()
    })

    return {
        values,
        update,
        updateMany,
        reset,
        resetField,
        isDirty,
        activeCount,
        isLoading,
    }
}
