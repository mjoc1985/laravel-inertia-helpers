import { computed, ref, type MaybeRefOrGetter, toValue } from 'vue'
import { router } from '@inertiajs/vue3'
import { getCurrentUrl, getOrigin } from '../utils/ssr'
import type { UsePaginationReturn, UsePaginationOptions, PaginationMeta, InertiaPage } from '../types'

/**
 * Wraps a Laravel paginator response with reactive controls and Inertia navigation.
 *
 * @example
 * const { items, meta, nextPage, prevPage, goToPage } = usePagination(() => props.users)
 */
export function usePagination<T>(
    paginator: MaybeRefOrGetter<InertiaPage<T>>,
    options: UsePaginationOptions = {},
): UsePaginationReturn<T> {
    const {
        preserveQuery = [],
        preserveScroll = true,
        replace = false,
        only = [],
    } = options

    const isLoading = ref(false)

    const items = computed<T[]>(() => {
        return toValue(paginator).data
    })

    const meta = computed<PaginationMeta>(() => {
        const p = toValue(paginator)
        const origin = getOrigin()

        // Parse Laravel's pagination links into a cleaner format
        const links = p.links
            .filter((link) => link.label !== '&laquo; Previous' && link.label !== 'Next &raquo;')
            .map((link) => {
                const pageNumber = link.url
                    ? parseInt(new URL(link.url, origin).searchParams.get('page') || '1')
                    : null

                return {
                    number: pageNumber,
                    label: link.label,
                    active: link.active,
                    url: link.url,
                }
            })

        return {
            currentPage: p.current_page,
            lastPage: p.last_page,
            perPage: p.per_page,
            total: p.total,
            from: p.from,
            to: p.to,
            links,
        }
    })

    const navigate = (params: Record<string, string | number>): void => {
        const currentUrl = getCurrentUrl()

        // Preserve specified query params
        const preserved: Record<string, string> = {}
        preserveQuery.forEach((key) => {
            const value = currentUrl.searchParams.get(key)
            if (value) preserved[key] = value
        })

        // Build new URL
        const newParams = new URLSearchParams({
            ...preserved,
            ...Object.fromEntries(
                Object.entries(params).map(([k, v]) => [k, String(v)]),
            ),
        })

        // Remove empty params
        for (const [key, value] of newParams.entries()) {
            if (!value) newParams.delete(key)
        }

        const url = `${currentUrl.pathname}?${newParams.toString()}`

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

    const goToPage = (page: number): void => {
        const m = meta.value
        if (page < 1 || page > m.lastPage || page === m.currentPage) return

        navigate({ page, per_page: m.perPage })
    }

    const nextPage = (): void => {
        const m = meta.value
        if (m.currentPage < m.lastPage) {
            goToPage(m.currentPage + 1)
        }
    }

    const prevPage = (): void => {
        const m = meta.value
        if (m.currentPage > 1) {
            goToPage(m.currentPage - 1)
        }
    }

    const updatePerPage = (perPage: number): void => {
        navigate({ page: 1, per_page: perPage })
    }

    const isFirstPage = computed(() => meta.value.currentPage === 1)
    const isLastPage = computed(() => meta.value.currentPage === meta.value.lastPage)

    return {
        items,
        meta,
        goToPage,
        nextPage,
        prevPage,
        updatePerPage,
        isFirstPage,
        isLastPage,
        isLoading,
    }
}
