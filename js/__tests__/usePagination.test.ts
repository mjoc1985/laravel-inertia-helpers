import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive, ref } from 'vue'
import { withSetup } from './helpers'

const mockProps = reactive<Record<string, any>>({})
const { mockVisit } = vi.hoisted(() => ({ mockVisit: vi.fn() }))

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: mockProps }),
    router: { visit: mockVisit },
}))

import { usePagination } from '../composables/usePagination'
import type { InertiaPage } from '../types'

function makePaginator<T>(data: T[], page = 1, perPage = 15, total?: number): InertiaPage<T> {
    const t = total ?? data.length
    const lastPage = Math.ceil(t / perPage)

    return {
        data,
        current_page: page,
        last_page: lastPage,
        per_page: perPage,
        total: t,
        from: (page - 1) * perPage + 1,
        to: Math.min(page * perPage, t),
        links: [
            { url: null, label: '&laquo; Previous', active: false },
            ...Array.from({ length: lastPage }, (_, i) => ({
                url: `http://localhost/items?page=${i + 1}`,
                label: String(i + 1),
                active: i + 1 === page,
            })),
            { url: null, label: 'Next &raquo;', active: false },
        ],
    }
}

beforeEach(() => {
    mockVisit.mockClear()
})

describe('usePagination', () => {
    it('extracts items from the paginator', () => {
        const paginator = makePaginator(['a', 'b', 'c'])

        const { result } = withSetup(() => usePagination(() => paginator))

        expect(result.items.value).toEqual(['a', 'b', 'c'])
    })

    it('computes pagination meta', () => {
        const paginator = makePaginator(['a'], 2, 10, 25)

        const { result } = withSetup(() => usePagination(() => paginator))

        expect(result.meta.value.currentPage).toBe(2)
        expect(result.meta.value.lastPage).toBe(3)
        expect(result.meta.value.perPage).toBe(10)
        expect(result.meta.value.total).toBe(25)
    })

    it('filters out previous/next labels from links', () => {
        const paginator = makePaginator(['a'], 1, 10, 30)

        const { result } = withSetup(() => usePagination(() => paginator))

        const labels = result.meta.value.links.map((l) => l.label)
        expect(labels).not.toContain('&laquo; Previous')
        expect(labels).not.toContain('Next &raquo;')
        expect(labels).toEqual(['1', '2', '3'])
    })

    it('parses page numbers from link URLs', () => {
        const paginator = makePaginator(['a'], 1, 10, 20)

        const { result } = withSetup(() => usePagination(() => paginator))

        expect(result.meta.value.links[0].number).toBe(1)
        expect(result.meta.value.links[1].number).toBe(2)
    })

    it('computes isFirstPage and isLastPage', () => {
        const first = makePaginator(['a'], 1, 10, 20)
        const { result: r1 } = withSetup(() => usePagination(() => first))
        expect(r1.isFirstPage.value).toBe(true)
        expect(r1.isLastPage.value).toBe(false)

        const last = makePaginator(['a'], 2, 10, 20)
        const { result: r2 } = withSetup(() => usePagination(() => last))
        expect(r2.isFirstPage.value).toBe(false)
        expect(r2.isLastPage.value).toBe(true)
    })

    it('navigates to a specific page via goToPage', () => {
        const paginator = makePaginator(['a'], 1, 10, 30)

        const { result } = withSetup(() => usePagination(() => paginator))

        result.goToPage(2)

        expect(mockVisit).toHaveBeenCalledOnce()
        const url = mockVisit.mock.calls[0][0] as string
        expect(url).toContain('page=2')
    })

    it('does not navigate when already on the target page', () => {
        const paginator = makePaginator(['a'], 1, 10, 30)

        const { result } = withSetup(() => usePagination(() => paginator))

        result.goToPage(1)

        expect(mockVisit).not.toHaveBeenCalled()
    })

    it('does not navigate to out-of-range pages', () => {
        const paginator = makePaginator(['a'], 1, 10, 30)

        const { result } = withSetup(() => usePagination(() => paginator))

        result.goToPage(0)
        result.goToPage(4)

        expect(mockVisit).not.toHaveBeenCalled()
    })

    it('navigates forward with nextPage', () => {
        const paginator = makePaginator(['a'], 1, 10, 20)

        const { result } = withSetup(() => usePagination(() => paginator))

        result.nextPage()

        expect(mockVisit).toHaveBeenCalledOnce()
        const url = mockVisit.mock.calls[0][0] as string
        expect(url).toContain('page=2')
    })

    it('does not navigate forward on last page', () => {
        const paginator = makePaginator(['a'], 2, 10, 20)

        const { result } = withSetup(() => usePagination(() => paginator))

        result.nextPage()

        expect(mockVisit).not.toHaveBeenCalled()
    })

    it('navigates backward with prevPage', () => {
        const paginator = makePaginator(['a'], 2, 10, 20)

        const { result } = withSetup(() => usePagination(() => paginator))

        result.prevPage()

        expect(mockVisit).toHaveBeenCalledOnce()
        const url = mockVisit.mock.calls[0][0] as string
        expect(url).toContain('page=1')
    })

    it('does not navigate backward on first page', () => {
        const paginator = makePaginator(['a'], 1, 10, 20)

        const { result } = withSetup(() => usePagination(() => paginator))

        result.prevPage()

        expect(mockVisit).not.toHaveBeenCalled()
    })

    it('updates per page and resets to page 1', () => {
        const paginator = makePaginator(['a'], 2, 10, 50)

        const { result } = withSetup(() => usePagination(() => paginator))

        result.updatePerPage(25)

        expect(mockVisit).toHaveBeenCalledOnce()
        const url = mockVisit.mock.calls[0][0] as string
        expect(url).toContain('page=1')
        expect(url).toContain('per_page=25')
    })

    it('passes preserveScroll and replace options', () => {
        const paginator = makePaginator(['a'], 1, 10, 20)

        const { result } = withSetup(() =>
            usePagination(() => paginator, { preserveScroll: false, replace: true }),
        )

        result.goToPage(2)

        expect(mockVisit).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ preserveScroll: false, replace: true }),
        )
    })

    it('passes the only option when provided', () => {
        const paginator = makePaginator(['a'], 1, 10, 20)

        const { result } = withSetup(() =>
            usePagination(() => paginator, { only: ['users'] }),
        )

        result.goToPage(2)

        expect(mockVisit).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ only: ['users'] }),
        )
    })

    it('accepts a ref as paginator input', () => {
        const paginator = ref(makePaginator(['x', 'y'], 1, 10, 20))

        const { result } = withSetup(() => usePagination(paginator))

        expect(result.items.value).toEqual(['x', 'y'])
    })
})
