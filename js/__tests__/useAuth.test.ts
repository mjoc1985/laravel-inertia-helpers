import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive } from 'vue'
import { withSetup } from './helpers'

const mockProps = reactive<Record<string, any>>({})

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ props: mockProps }),
    router: { visit: vi.fn() },
}))

import { useAuth } from '../composables/useAuth'

beforeEach(() => {
    Object.keys(mockProps).forEach((key) => delete mockProps[key])
})

describe('useAuth', () => {
    it('returns the authenticated user', () => {
        Object.assign(mockProps, {
            auth: { user: { id: 1, name: 'John', email: 'john@test.com' } },
        })

        const { result } = withSetup(() => useAuth())

        expect(result.user.value).toEqual({ id: 1, name: 'John', email: 'john@test.com' })
    })

    it('returns null for guests', () => {
        Object.assign(mockProps, { auth: { user: null } })

        const { result } = withSetup(() => useAuth())

        expect(result.user.value).toBeNull()
    })

    it('computes isAuthenticated correctly', () => {
        Object.assign(mockProps, {
            auth: { user: { id: 1, name: 'John', email: 'john@test.com' } },
        })

        const { result } = withSetup(() => useAuth())

        expect(result.isAuthenticated.value).toBe(true)
        expect(result.isGuest.value).toBe(false)
    })

    it('computes isGuest correctly', () => {
        Object.assign(mockProps, { auth: { user: null } })

        const { result } = withSetup(() => useAuth())

        expect(result.isAuthenticated.value).toBe(false)
        expect(result.isGuest.value).toBe(true)
    })

    it('checks roles using default roles array', () => {
        Object.assign(mockProps, {
            auth: { user: { id: 1, name: 'Admin', email: 'a@test.com', roles: ['admin', 'editor'] } },
        })

        const { result } = withSetup(() => useAuth())

        expect(result.hasRole('admin')).toBe(true)
        expect(result.hasRole('editor')).toBe(true)
        expect(result.hasRole('viewer')).toBe(false)
    })

    it('hasAnyRole returns true if user has at least one role', () => {
        Object.assign(mockProps, {
            auth: { user: { id: 1, name: 'Admin', email: 'a@test.com', roles: ['editor'] } },
        })

        const { result } = withSetup(() => useAuth())

        expect(result.hasAnyRole('admin', 'editor')).toBe(true)
        expect(result.hasAnyRole('admin', 'viewer')).toBe(false)
    })

    it('hasRole returns false for guests', () => {
        Object.assign(mockProps, { auth: { user: null } })

        const { result } = withSetup(() => useAuth())

        expect(result.hasRole('admin')).toBe(false)
    })

    it('hasRole returns false when user has no roles property', () => {
        Object.assign(mockProps, {
            auth: { user: { id: 1, name: 'John', email: 'john@test.com' } },
        })

        const { result } = withSetup(() => useAuth())

        expect(result.hasRole('admin')).toBe(false)
    })

    it('accepts a custom resolveRoles function', () => {
        interface CustomUser {
            id: number
            name: string
            email: string
            permissions: Array<{ name: string }>
        }

        Object.assign(mockProps, {
            auth: {
                user: {
                    id: 1,
                    name: 'John',
                    email: 'john@test.com',
                    permissions: [{ name: 'manage-users' }, { name: 'view-reports' }],
                },
            },
        })

        const { result } = withSetup(() =>
            useAuth<CustomUser>({
                resolveRoles: (user) => user.permissions.map((p) => p.name),
            }),
        )

        expect(result.hasRole('manage-users')).toBe(true)
        expect(result.hasRole('delete-users')).toBe(false)
    })

    it('filters non-string values from roles array', () => {
        Object.assign(mockProps, {
            auth: {
                user: {
                    id: 1,
                    name: 'John',
                    email: 'john@test.com',
                    roles: ['admin', 42, null, 'editor', undefined, true],
                },
            },
        })

        const { result } = withSetup(() => useAuth())

        expect(result.hasRole('admin')).toBe(true)
        expect(result.hasRole('editor')).toBe(true)
        expect(result.hasAnyRole('admin', 'editor')).toBe(true)
        // Non-string values should be filtered out
        expect(result.hasRole('42')).toBe(false)
    })

    it('handles missing auth prop gracefully', () => {
        // No auth prop at all
        Object.assign(mockProps, {})

        const { result } = withSetup(() => useAuth())

        expect(result.user.value).toBeNull()
        expect(result.isGuest.value).toBe(true)
    })
})
