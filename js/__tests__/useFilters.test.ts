import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reactive, nextTick } from 'vue'
import { withSetup } from './helpers'

const mockProps = reactive<Record<string, any>>({})
const { mockVisit } = vi.hoisted(() => ({ mockVisit: vi.fn() }))

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: mockProps }),
    router: { visit: mockVisit },
}))

import { useFilters } from '../composables/useFilters'

beforeEach(() => {
    vi.useFakeTimers()
    mockVisit.mockClear()
})

afterEach(() => {
    vi.useRealTimers()
})

describe('useFilters', () => {
    it('initializes values from defaults', () => {
        const { result } = withSetup(() =>
            useFilters(() => ({ search: '', status: 'active' })),
        )

        expect(result.values.search).toBe('')
        expect(result.values.status).toBe('active')
    })

    it('updates a single filter and triggers a visit', () => {
        const { result } = withSetup(() =>
            useFilters(() => ({ search: '', status: '' })),
        )

        result.update('search', 'test')

        expect(result.values.search).toBe('test')
        expect(mockVisit).toHaveBeenCalledOnce()
    })

    it('updates multiple filters at once', () => {
        const { result } = withSetup(() =>
            useFilters(() => ({ search: '', status: '', category: '' })),
        )

        result.updateMany({ search: 'foo', status: 'active' })

        expect(result.values.search).toBe('foo')
        expect(result.values.status).toBe('active')
        expect(mockVisit).toHaveBeenCalledOnce()
    })

    it('resets all filters to defaults', () => {
        const { result } = withSetup(() =>
            useFilters(() => ({ search: '', status: 'all' })),
        )

        result.update('search', 'test')
        mockVisit.mockClear()

        result.reset()

        expect(result.values.search).toBe('')
        expect(result.values.status).toBe('all')
        expect(mockVisit).toHaveBeenCalledOnce()
    })

    it('resets a single field', () => {
        const { result } = withSetup(() =>
            useFilters(() => ({ search: '', status: '' })),
        )

        result.update('search', 'test')
        result.update('status', 'active')
        mockVisit.mockClear()

        result.resetField('search')

        expect(result.values.search).toBe('')
        expect(result.values.status).toBe('active')
    })

    it('tracks dirty state', () => {
        const { result } = withSetup(() =>
            useFilters(() => ({ search: '', status: '' })),
        )

        expect(result.isDirty.value).toBe(false)

        result.update('search', 'test')

        expect(result.isDirty.value).toBe(true)
    })

    it('counts active filters', () => {
        const { result } = withSetup(() =>
            useFilters(() => ({ search: '', status: '', category: '' })),
        )

        expect(result.activeCount.value).toBe(0)

        result.update('search', 'test')
        result.update('status', 'active')

        expect(result.activeCount.value).toBe(2)
    })

    it('debounces updates per field', () => {
        const { result } = withSetup(() =>
            useFilters(() => ({ search: '', status: '' }), {
                debounce: { search: 300 },
            }),
        )

        result.update('search', 'a')
        result.update('search', 'ab')
        result.update('search', 'abc')

        // Only debounced - should not have fired yet
        expect(mockVisit).not.toHaveBeenCalled()

        vi.advanceTimersByTime(300)

        expect(mockVisit).toHaveBeenCalledOnce()
    })

    it('does not debounce fields without debounce config', () => {
        const { result } = withSetup(() =>
            useFilters(() => ({ search: '', status: '' }), {
                debounce: { search: 300 },
            }),
        )

        result.update('status', 'active')

        expect(mockVisit).toHaveBeenCalledOnce()
    })

    it('excludes default values from the URL', () => {
        const { result } = withSetup(() =>
            useFilters(() => ({ search: '', status: 'all' })),
        )

        result.update('search', 'test')

        const url = mockVisit.mock.calls[0][0] as string
        expect(url).toContain('search=test')
        expect(url).not.toContain('status=')
    })

    it('removes page param when filters change', () => {
        // Set initial URL with page param
        Object.defineProperty(window, 'location', {
            value: new URL('http://localhost/items?page=3&search=old'),
            writable: true,
        })

        const { result } = withSetup(() =>
            useFilters(() => ({ search: '' })),
        )

        result.update('search', 'new')

        const url = mockVisit.mock.calls[0][0] as string
        expect(url).not.toContain('page=')
    })

    it('passes preserveScroll and replace options', () => {
        const { result } = withSetup(() =>
            useFilters(() => ({ search: '' }), {
                preserveScroll: false,
                replace: false,
            }),
        )

        result.update('search', 'test')

        expect(mockVisit).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ preserveScroll: false, replace: false }),
        )
    })

    it('passes the only option', () => {
        const { result } = withSetup(() =>
            useFilters(() => ({ search: '' }), { only: ['users'] }),
        )

        result.update('search', 'test')

        expect(mockVisit).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ only: ['users'] }),
        )
    })

    it('re-syncs values when defaults change', async () => {
        const defaults = reactive({ search: 'initial', status: '' })

        const { result } = withSetup(() => useFilters(() => ({ ...defaults })))

        expect(result.values.search).toBe('initial')

        defaults.search = 'updated'
        await nextTick()

        expect(result.values.search).toBe('updated')
    })

    it('cleans up debounce timers on unmount', () => {
        const { result, wrapper } = withSetup(() =>
            useFilters(() => ({ search: '' }), { debounce: { search: 300 } }),
        )

        result.update('search', 'test')

        wrapper.unmount()

        // Advancing timers after unmount should not cause errors
        vi.advanceTimersByTime(500)
        expect(mockVisit).not.toHaveBeenCalled()
    })
})
