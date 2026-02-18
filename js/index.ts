// Composables
export { useAuth } from './composables/useAuth'
export { useFlash } from './composables/useFlash'
export { usePagination } from './composables/usePagination'
export { useFilters } from './composables/useFilters'
export { useSorting } from './composables/useSorting'
export { useBreadcrumbs } from './composables/useBreadcrumbs'

// Types
export type {
    // Shared data
    AuthUser,
    SharedData,
    SharedDataOverrides,
    InferUser,

    // Flash
    FlashType,
    FlashMessage,
    FlashMessagePayload,
    UseFlashReturn,

    // Auth
    UseAuthOptions,
    UseAuthReturn,

    // Pagination
    InertiaPage,
    PaginationMeta,
    PaginationLink,
    UsePaginationOptions,
    UsePaginationReturn,

    // Filters
    UseFiltersOptions,
    UseFiltersReturn,

    // Sorting
    SortState,
    UseSortingOptions,
    UseSortingReturn,

    // Breadcrumbs
    BreadcrumbItem,
    UseBreadcrumbsReturn,
} from './types'
