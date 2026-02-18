import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { withSetup } from './helpers'

const mockProps = reactive<Record<string, any>>({})
const { mockVisit } = vi.hoisted(() => ({ mockVisit: vi.fn() }))

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: mockProps }),
    router: { visit: mockVisit },
}))

import { useSorting } from '../composables/useSorting'

beforeEach(() => {
    mockVisit.mockClear()
})

describe('useSorting', () => {
    it('exposes the current sort field and direction', () => {
        const { result } = withSetup(() =>
            useSorting(() => ({ field: 'name', direction: 'asc' as const })),
        )

        expect(result.field.value).toBe('name')
        expect(result.direction.value).toBe('asc')
    })

    it('checks if a field is currently sorted', () => {
        const { result } = withSetup(() =>
            useSorting(() => ({ field: 'name', direction: 'asc' as const })),
        )

        expect(result.isSortedBy('name')).toBe(true)
        expect(result.isSortedBy('email')).toBe(false)
    })

    it('sorts ascending when clicking a new field', () => {
        const { result } = withSetup(() =>
            useSorting(() => ({ field: 'name', direction: 'asc' as const })),
        )

        result.sortBy('email')

        expect(mockVisit).toHaveBeenCalledOnce()
        const url = mockVisit.mock.calls[0][0] as string
        expect(url).toContain('sort=email')
        expect(url).toContain('direction=asc')
    })

    it('toggles direction when clicking the same field', () => {
        const { result } = withSetup(() =>
            useSorting(() => ({ field: 'name', direction: 'asc' as const })),
        )

        result.sortBy('name')

        const url = mockVisit.mock.calls[0][0] as string
        expect(url).toContain('sort=name')
        expect(url).toContain('direction=desc')
    })

    it('toggles from desc to asc', () => {
        const { result } = withSetup(() =>
            useSorting(() => ({ field: 'name', direction: 'desc' as const })),
        )

        result.sortBy('name')

        const url = mockVisit.mock.calls[0][0] as string
        expect(url).toContain('direction=asc')
    })

    it('resets to page 1 when sorting', () => {
        Object.defineProperty(window, 'location', {
            value: new URL('http://localhost/items?page=3&sort=name&direction=asc'),
            writable: true,
        })

        const { result } = withSetup(() =>
            useSorting(() => ({ field: 'name', direction: 'asc' as const })),
        )

        result.sortBy('email')

        const url = mockVisit.mock.calls[0][0] as string
        expect(url).not.toContain('page=')
    })

    it('passes preserveScroll option', () => {
        const { result } = withSetup(() =>
            useSorting(() => ({ field: 'name', direction: 'asc' as const }), {
                preserveScroll: false,
            }),
        )

        result.sortBy('email')

        expect(mockVisit).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ preserveScroll: false }),
        )
    })

    it('passes replace option', () => {
        const { result } = withSetup(() =>
            useSorting(() => ({ field: 'name', direction: 'asc' as const }), {
                replace: true,
            }),
        )

        result.sortBy('email')

        expect(mockVisit).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ replace: true }),
        )
    })

    it('passes only option', () => {
        const { result } = withSetup(() =>
            useSorting(() => ({ field: 'name', direction: 'asc' as const }), {
                only: ['users'],
            }),
        )

        result.sortBy('email')

        expect(mockVisit).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ only: ['users'] }),
        )
    })
})
