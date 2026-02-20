import type { ComputedRef } from 'vue'

// -------------------------------------------------------
// Shared Data Types
// -------------------------------------------------------

export interface AuthUser {
    id: number
    name: string
    email: string
    [key: string]: unknown
}

/**
 * Override this interface in your app to add custom shared data types.
 *
 * @example
 * declare module '@mjoc1985/inertia-helpers' {
 *     interface SharedDataOverrides {
 *         auth: { user: MyAppUser | null }
 *     }
 * }
 */
export interface SharedDataOverrides {}

export interface DefaultSharedData {
    auth: {
        user: AuthUser | null
    }
    flash: {
        messages: FlashMessagePayload[]
    }
    breadcrumbs: BreadcrumbItem[]
    [key: string]: unknown
}

export type SharedData = SharedDataOverrides extends { auth: infer A }
    ? Omit<DefaultSharedData, 'auth'> & { auth: A }
    : DefaultSharedData

// Utility to extract user type from shared data
export type InferUser<S extends SharedData = SharedData> = NonNullable<
    S['auth']['user']
>

// -------------------------------------------------------
// Flash Messages
// -------------------------------------------------------

export type FlashType = 'success' | 'error' | 'warning' | 'info'

export interface FlashMessagePayload {
    id?: string
    type: FlashType
    text: string
    detail?: string | null
    action?: { label: string; url: string } | null
    autoDismiss: number | false
}

export interface FlashMessage extends FlashMessagePayload {
    id: string
    remainingPercent: number
    createdAt: number
}

export interface UseFlashReturn {
    messages: ComputedRef<FlashMessage[]>
    dismiss: (id: string) => void
    dismissAll: () => void
    onFlash: (callback: (message: FlashMessage) => void) => () => void
}

// -------------------------------------------------------
// Auth
// -------------------------------------------------------

export interface UseAuthOptions<T = InferUser> {
    resolveRoles?: (user: T) => string[]
}

export interface UseAuthReturn<T = InferUser> {
    user: ComputedRef<T | null>
    isAuthenticated: ComputedRef<boolean>
    isGuest: ComputedRef<boolean>
    hasRole: (role: string) => boolean
    hasAnyRole: (...roles: string[]) => boolean
}

// -------------------------------------------------------
// Pagination
// -------------------------------------------------------

export interface PaginationLink {
    number: number | null
    label: string
    active: boolean
    url: string | null
}

export interface PaginationMeta {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
    from: number
    to: number
    links: PaginationLink[]
}

export interface InertiaPage<T> {
    data: T[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
    links: Array<{
        url: string | null
        label: string
        active: boolean
    }>
}

export interface UsePaginationOptions {
    preserveQuery?: string[]
    preserveScroll?: boolean
    replace?: boolean
    only?: string[]
}

export interface UsePaginationReturn<T> {
    items: ComputedRef<T[]>
    meta: ComputedRef<PaginationMeta>
    goToPage: (page: number) => void
    nextPage: () => void
    prevPage: () => void
    updatePerPage: (perPage: number) => void
    isFirstPage: ComputedRef<boolean>
    isLastPage: ComputedRef<boolean>
    isLoading: ComputedRef<boolean>
}

// -------------------------------------------------------
// Filters
// -------------------------------------------------------

export interface UseFiltersOptions<T> {
    debounce?: Partial<Record<keyof T, number>>
    preserveScroll?: boolean
    replace?: boolean
    only?: string[]
}

export interface UseFiltersReturn<T extends Record<string, any>> {
    values: T
    update: <K extends keyof T>(key: K, value: T[K]) => void
    updateMany: (updates: Partial<T>) => void
    reset: () => void
    resetField: <K extends keyof T>(key: K) => void
    isDirty: ComputedRef<boolean>
    activeCount: ComputedRef<number>
    isLoading: ComputedRef<boolean>
}

// -------------------------------------------------------
// Sorting
// -------------------------------------------------------

export interface SortState {
    field: string
    direction: 'asc' | 'desc'
}

export interface UseSortingOptions {
    preserveScroll?: boolean
    replace?: boolean
    only?: string[]
}

export interface UseSortingReturn {
    sortBy: (field: string) => void
    isSortedBy: (field: string) => boolean
    direction: ComputedRef<'asc' | 'desc'>
    field: ComputedRef<string>
}

// -------------------------------------------------------
// Breadcrumbs
// -------------------------------------------------------

export interface BreadcrumbItem {
    label: string
    url: string | null
}

export interface UseBreadcrumbsReturn {
    crumbs: ComputedRef<BreadcrumbItem[]>
    hasCrumbs: ComputedRef<boolean>
}
