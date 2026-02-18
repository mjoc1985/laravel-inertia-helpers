import { computed } from 'vue'
import { usePage } from '@inertiajs/vue3'
import type { UseAuthReturn, UseAuthOptions, SharedData, InferUser } from '../types'

/**
 * Type-safe access to the authenticated user from Inertia shared data.
 *
 * @example
 * const { user, isAuthenticated, hasRole } = useAuth()
 *
 * // With custom role resolution:
 * const { hasRole } = useAuth({
 *     resolveRoles: (user) => user.permissions.map(p => p.name)
 * })
 */
export function useAuth<T = InferUser>(options: UseAuthOptions<T> = {}): UseAuthReturn<T> {
    const { resolveRoles } = options
    const page = usePage<SharedData>()

    const user = computed<T | null>(() => {
        return (page.props.auth?.user as T) ?? null
    })

    const isAuthenticated = computed(() => user.value !== null)

    const isGuest = computed(() => user.value === null)

    const getRoles = (currentUser: T): string[] => {
        if (resolveRoles) return resolveRoles(currentUser)

        const u = currentUser as Record<string, unknown>
        return Array.isArray(u.roles) ? u.roles.filter((r): r is string => typeof r === 'string') : []
    }

    const hasRole = (role: string): boolean => {
        if (!user.value) return false
        return getRoles(user.value).includes(role)
    }

    const hasAnyRole = (...roles: string[]): boolean => {
        return roles.some((role) => hasRole(role))
    }

    return {
        user,
        isAuthenticated,
        isGuest,
        hasRole,
        hasAnyRole,
    }
}
