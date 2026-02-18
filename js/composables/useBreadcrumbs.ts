import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'
import type { UseBreadcrumbsReturn, SharedData } from '../types'

/**
 * Access the breadcrumb trail shared from the Laravel backend.
 *
 * @example
 * const { crumbs, hasCrumbs } = useBreadcrumbs()
 */
export function useBreadcrumbs(): UseBreadcrumbsReturn {
    const page = usePage<SharedData>()

    const crumbs = computed(() => {
        const breadcrumbs = page.props.breadcrumbs

        if (!breadcrumbs || !Array.isArray(breadcrumbs)) {
            return []
        }

        return breadcrumbs
    })

    const hasCrumbs = computed(() => crumbs.value.length > 0)

    return {
        crumbs,
        hasCrumbs,
    }
}
