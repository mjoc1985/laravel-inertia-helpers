import { computed, reactive, ref, watch, onUnmounted, type MaybeRefOrGetter, toValue } from 'vue'
import { router } from '@inertiajs/vue3'
import { getCurrentUrl } from '../utils/ssr'
import type { UseFiltersReturn, UseFiltersOptions } from '../types'

/**
 * Syncs a filter form with URL query parameters via Inertia visits.
 * Supports per-field debouncing, dirty tracking, and active filter counting.
 *
 * The returned `values` object supports direct v-model binding:
 *
 * @example
 * const { values, reset, isDirty, activeCount } = useFilters(
 *     () => props.filters,
 *     { debounce: { search: 300 }, only: ['users'] }
 * )
 *
 * // In template:
 * // <Input v-model="values.search" />
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

    const _isLoading = ref(false)
    const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

    // Internal reactive state — used for all internal reads/writes
    const _values = reactive({ ...toValue(defaults) }) as T

    // Re-sync values when defaults change (e.g., after an Inertia visit)
    watch(
        () => toValue(defaults),
        (newDefaults) => {
            Object.keys(newDefaults).forEach((key) => {
                ;(_values as Record<string, unknown>)[key] = newDefaults[key]
            })
        },
        { deep: true },
    )

    const visit = (): void => {
        const currentUrl = getCurrentUrl()
        const params = new URLSearchParams()
        const defaultValues = toValue(defaults)

        // Only include non-default values in the URL
        Object.entries(_values).forEach(([key, value]) => {
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

        _isLoading.value = true

        router.visit(url, {
            preserveScroll,
            replace,
            only: only.length > 0 ? only : undefined,
            onFinish: () => {
                _isLoading.value = false
            },
        })
    }

    const scheduleVisit = (key: string): void => {
        const existingTimer = debounceTimers.get(key)
        if (existingTimer) {
            clearTimeout(existingTimer)
        }

        const debounceMs = (debounce as Partial<Record<string, number>>)[key]

        if (debounceMs && typeof debounceMs === 'number') {
            const timer = setTimeout(() => {
                visit()
                debounceTimers.delete(key)
            }, debounceMs)
            debounceTimers.set(key, timer)
        } else {
            visit()
        }
    }

    // Writable proxy — setting a property triggers a debounced Inertia visit.
    // Supports v-model binding: <Input v-model="values.search" />
    const values = new Proxy(_values, {
        set(target, prop, value) {
            const result = Reflect.set(target, prop, value)
            if (typeof prop === 'string' && prop in toValue(defaults)) {
                scheduleVisit(prop)
            }
            return result
        },
    }) as T

    const update = <K extends keyof T>(key: K, value: T[K]): void => {
        ;(_values as Record<string, unknown>)[key as string] = value
        scheduleVisit(key as string)
    }

    const updateMany = (updates: Partial<T>): void => {
        Object.entries(updates).forEach(([key, value]) => {
            ;(_values as Record<string, unknown>)[key] = value
        })
        visit()
    }

    const reset = (): void => {
        const defaultValues = toValue(defaults)
        Object.keys(_values).forEach((key) => {
            ;(_values as Record<string, unknown>)[key] = defaultValues[key] ?? ''
        })
        visit()
    }

    const resetField = <K extends keyof T>(key: K): void => {
        const defaultValues = toValue(defaults)
        ;(_values as Record<string, unknown>)[key as string] = defaultValues[key] ?? ''
        visit()
    }

    const isDirty = computed(() => {
        const defaultValues = toValue(defaults)
        return Object.keys(_values).some((key) => {
            const current = (_values as Record<string, unknown>)[key]
            const def = defaultValues[key] ?? ''
            return current !== def
        })
    })

    const activeCount = computed(() => {
        const defaultValues = toValue(defaults)
        return Object.keys(_values).filter((key) => {
            const current = (_values as Record<string, unknown>)[key]
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
        isLoading: computed(() => _isLoading.value),
    }
}
