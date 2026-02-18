import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { withSetup } from './helpers'

const mockProps = reactive<Record<string, any>>({})

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: mockProps }),
    router: { visit: vi.fn() },
}))

import { useBreadcrumbs } from '../composables/useBreadcrumbs'

beforeEach(() => {
    Object.keys(mockProps).forEach((key) => delete mockProps[key])
})

describe('useBreadcrumbs', () => {
    it('returns breadcrumbs from page props', () => {
        Object.assign(mockProps, {
            breadcrumbs: [
                { label: 'Home', url: '/' },
                { label: 'Users', url: '/users' },
                { label: 'Edit', url: null },
            ],
        })

        const { result } = withSetup(() => useBreadcrumbs())

        expect(result.crumbs.value).toHaveLength(3)
        expect(result.crumbs.value[0]).toEqual({ label: 'Home', url: '/' })
        expect(result.crumbs.value[2]).toEqual({ label: 'Edit', url: null })
    })

    it('computes hasCrumbs correctly', () => {
        Object.assign(mockProps, {
            breadcrumbs: [{ label: 'Home', url: '/' }],
        })

        const { result } = withSetup(() => useBreadcrumbs())

        expect(result.hasCrumbs.value).toBe(true)
    })

    it('returns empty array when no breadcrumbs exist', () => {
        Object.assign(mockProps, { breadcrumbs: [] })

        const { result } = withSetup(() => useBreadcrumbs())

        expect(result.crumbs.value).toEqual([])
        expect(result.hasCrumbs.value).toBe(false)
    })

    it('handles missing breadcrumbs prop', () => {
        Object.assign(mockProps, {})

        const { result } = withSetup(() => useBreadcrumbs())

        expect(result.crumbs.value).toEqual([])
        expect(result.hasCrumbs.value).toBe(false)
    })

    it('handles non-array breadcrumbs prop', () => {
        Object.assign(mockProps, { breadcrumbs: 'invalid' })

        const { result } = withSetup(() => useBreadcrumbs())

        expect(result.crumbs.value).toEqual([])
    })
})
