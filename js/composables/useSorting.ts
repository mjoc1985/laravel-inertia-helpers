import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { router } from '@inertiajs/vue3'
import { getCurrentUrl } from '../utils/ssr'
import type { UseSortingReturn, UseSortingOptions, SortState } from '../types'

/**
 * Manages sortable table columns with Inertia visits.
 * Clicking the same field toggles direction; clicking a new field sorts ascending.
 *
 * @example
 * const { sortBy, isSortedBy, direction } = useSorting(() => props.sort, {
 *     only: ['users']
 * })
 */
export function useSorting(
    currentSort: MaybeRefOrGetter<SortState>,
    options: UseSortingOptions = {},
): UseSortingReturn {
    const {
        preserveScroll = true,
        replace = false,
        only = [],
    } = options

    const field = computed(() => toValue(currentSort).field)
    const direction = computed(() => toValue(currentSort).direction)

    const sortBy = (newField: string): void => {
        const current = toValue(currentSort)
        let newDirection: 'asc' | 'desc' = 'asc'

        // Toggle direction if clicking the same field
        if (current.field === newField) {
            newDirection = current.direction === 'asc' ? 'desc' : 'asc'
        }

        const currentUrl = getCurrentUrl()
        const params = new URLSearchParams(currentUrl.search)

        params.set('sort', newField)
        params.set('direction', newDirection)

        // Reset to page 1 when sort changes
        params.delete('page')

        const url = `${currentUrl.pathname}?${params.toString()}`

        router.visit(url, {
            preserveScroll,
            replace,
            only: only.length > 0 ? only : undefined,
        })
    }

    const isSortedBy = (checkField: string): boolean => {
        return field.value === checkField
    }

    return {
        sortBy,
        isSortedBy,
        direction,
        field,
    }
}
