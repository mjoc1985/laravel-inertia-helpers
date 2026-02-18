# Laravel Inertia Helpers

A collection of backend and frontend utilities for common [Inertia.js](https://inertiajs.com/) + [Laravel](https://laravel.com/) patterns. Type-safe, unopinionated about styling, and designed to eliminate the boilerplate every Inertia project ends up writing.

[![Latest Version on Packagist](https://img.shields.io/packagist/v/mjoc1985/laravel-inertia-helpers.svg)](https://packagist.org/packages/mjoc1985/laravel-inertia-helpers)
[![npm version](https://img.shields.io/npm/v/@mjoc1985/inertia-helpers.svg)](https://www.npmjs.com/package/@mjoc1985/inertia-helpers)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE.md)

---

## Why?

Every Inertia.js + Laravel project ends up solving the same problems:

- Accessing shared data (auth user, flash messages) without type safety
- Wiring up flash messages with auto-dismiss and stacking
- Building pagination controls that work with Inertia's router
- Syncing filter/search forms with URL query parameters
- Managing breadcrumbs without duplicating logic across components

This package solves all of them with a clean, typed API on both sides of the stack.

---

## Requirements

- PHP 8.2+
- Laravel 11+
- Vue 3.3+
- Inertia.js 2.x
- TypeScript 5+ (recommended but not required)

---

## Installation

### Backend (Laravel)

```bash
composer require mjoc1985/laravel-inertia-helpers
```

The service provider is auto-discovered. Optionally publish the config:

```bash
php artisan vendor:publish --tag=inertia-helpers-config
```

### Frontend (Vue 3)

```bash
npm install @mjoc1985/inertia-helpers
```

---

## Quick Start

### 1. Set up the middleware

Replace your `HandleInertiaRequests` middleware or extend the one provided:

```php
// app/Http/Middleware/HandleInertiaRequests.php

use Mjoc1985\InertiaHelpers\Middleware\SharesInertiaData;

class HandleInertiaRequests extends Middleware
{
    use SharesInertiaData;

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            ...$this->sharedData($request),
        ];
    }
}
```

This automatically shares a structured payload including auth, flash messages, and breadcrumbs.

### 2. Define your shared data types

```typescript
// resources/js/types/inertia.d.ts

import type { SharedData } from '@mjoc1985/inertia-helpers'

// Extend with your app's user model
interface AppUser {
    id: number
    name: string
    email: string
    avatar_url: string | null
    roles: string[]
}

// Register your types globally
declare module '@mjoc1985/inertia-helpers' {
    interface SharedDataOverrides {
        auth: {
            user: AppUser | null
        }
    }
}
```

### 3. Use the composables

```vue
<script setup lang="ts">
import { useAuth, useFlash } from '@mjoc1985/inertia-helpers'

const { user, isAuthenticated, hasRole } = useAuth()
const { messages, dismiss } = useFlash()
</script>

<template>
    <div v-if="isAuthenticated">
        Welcome back, {{ user.name }}!
    </div>

    <div v-for="msg in messages" :key="msg.id">
        {{ msg.text }}
        <button @click="dismiss(msg.id)">×</button>
    </div>
</template>
```

---

## Backend API

### SharesInertiaData Trait

The trait structures all shared data into a predictable shape:

```php
use Mjoc1985\InertiaHelpers\Middleware\SharesInertiaData;

class HandleInertiaRequests extends Middleware
{
    use SharesInertiaData;

    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            ...$this->sharedData($request),
        ];
    }

    // Optional: customise what's included in the auth payload
    protected function sharedAuth(Request $request): array
    {
        $user = $request->user();

        return [
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'roles' => $user->roles->pluck('name'),
            ] : null,
        ];
    }

    // Optional: add custom shared data alongside the defaults
    protected function sharedCustom(Request $request): array
    {
        return [
            'app' => [
                'name' => config('app.name'),
                'environment' => app()->environment(),
            ],
        ];
    }
}
```

**What gets shared automatically:**

```php
[
    'auth' => [
        'user' => [...] | null,
    ],
    'flash' => [
        'success' => '...' | null,
        'error' => '...' | null,
        'warning' => '...' | null,
        'info' => '...' | null,
    ],
    'breadcrumbs' => [
        ['label' => 'Home', 'url' => '/'],
        ['label' => 'Users', 'url' => '/users'],
        ['label' => 'John Doe', 'url' => null], // current page, no link
    ],
]
```

### Flash Messages — Enhanced

Beyond Laravel's basic `session()->flash()`, the package provides a fluent API for richer flash messages:

```php
use Mjoc1985\InertiaHelpers\Flash;

// Simple usage (works with standard Laravel flash)
return redirect()->route('users.index')->with('success', 'User created.');

// Rich flash messages with metadata
Flash::success('User created successfully.')
    ->action('View User', route('users.show', $user))
    ->autoDismiss(5000) // milliseconds, or false to persist
    ->send();

Flash::error('Payment failed.')
    ->detail('Your card was declined. Please try a different payment method.')
    ->autoDismiss(false) // errors should persist
    ->send();

Flash::warning('Your trial expires in 3 days.')
    ->action('Upgrade Now', route('billing.plans'))
    ->send();

// Stack multiple flash messages
Flash::success('Project saved.')->send();
Flash::info('Collaborators have been notified.')->send();
```

### Breadcrumbs

Register breadcrumbs in a dedicated file, referenced by route name:

```php
// routes/breadcrumbs.php (auto-loaded by the service provider)

use Mjoc1985\InertiaHelpers\Breadcrumbs;

Breadcrumbs::for('home', function ($trail) {
    $trail->push('Home', route('home'));
});

Breadcrumbs::for('users.index', function ($trail) {
    $trail->parent('home');
    $trail->push('Users', route('users.index'));
});

Breadcrumbs::for('users.show', function ($trail, $user) {
    $trail->parent('users.index');
    $trail->push($user->name); // no URL = current page
});

Breadcrumbs::for('users.edit', function ($trail, $user) {
    $trail->parent('users.show', $user);
    $trail->push('Edit');
});
```

Breadcrumbs are resolved automatically based on the current route and shared via the middleware. Route model binding works as expected — the parameters from the current route are passed to the breadcrumb callback.

**Config (config/inertia-helpers.php):**

```php
return [
    'breadcrumbs' => [
        // Path to your breadcrumb definitions
        'file' => base_path('routes/breadcrumbs.php'),

        // Include 'Home' automatically on every trail
        'auto_home' => true,

        // Route name for the home breadcrumb
        'home_route' => 'home',
    ],

    'flash' => [
        // Default auto-dismiss duration in milliseconds
        'auto_dismiss' => 5000,

        // Flash types to share (maps to session keys)
        'types' => ['success', 'error', 'warning', 'info'],
    ],
];
```

### Pagination — Backend Helper

A macro on Laravel's LengthAwarePaginator that formats pagination data cleanly for the frontend composable:

```php
// In a controller
public function index(Request $request)
{
    $users = User::query()
        ->filter($request->only(['search', 'role', 'status']))
        ->sort($request->get('sort', 'name'), $request->get('direction', 'asc'))
        ->paginate(15)
        ->withQueryString();

    return inertia('Users/Index', [
        'users' => $users,
        'filters' => $request->only(['search', 'role', 'status']),
        'sort' => [
            'field' => $request->get('sort', 'name'),
            'direction' => $request->get('direction', 'asc'),
        ],
    ]);
}
```

---

## Frontend API

### useAuth()

Type-safe access to the authenticated user.

```vue
<script setup lang="ts">
import { useAuth } from '@mjoc1985/inertia-helpers'

const { user, isAuthenticated, isGuest, hasRole, hasAnyRole } = useAuth()
</script>

<template>
    <nav>
        <template v-if="isAuthenticated">
            <span>{{ user.name }}</span>
            <AdminMenu v-if="hasRole('admin')" />
        </template>
        <template v-else>
            <LoginLink />
        </template>
    </nav>
</template>
```

**API:**

```typescript
interface UseAuthReturn<T = AuthUser> {
    /** The authenticated user, or null. Reactive. */
    user: ComputedRef<T | null>

    /** Whether a user is authenticated. Reactive. */
    isAuthenticated: ComputedRef<boolean>

    /** Whether no user is authenticated. Reactive. */
    isGuest: ComputedRef<boolean>

    /** Check if the user has a specific role */
    hasRole: (role: string) => boolean

    /** Check if the user has any of the given roles */
    hasAnyRole: (...roles: string[]) => boolean
}
```

### useFlash()

Manages flash messages with auto-dismiss, stacking, and lifecycle.

```vue
<script setup lang="ts">
import { useFlash } from '@mjoc1985/inertia-helpers'

const { messages, dismiss, dismissAll, onFlash } = useFlash()

// Optional: react to new flash messages (e.g. for sound effects, logging)
onFlash((message) => {
    if (message.type === 'error') {
        console.error('Flash error:', message.text)
    }
})
</script>

<template>
    <TransitionGroup name="flash" tag="div" class="fixed top-4 right-4 space-y-2 z-50">
        <div
            v-for="msg in messages"
            :key="msg.id"
            :class="{
                'bg-green-50 border-green-500': msg.type === 'success',
                'bg-red-50 border-red-500': msg.type === 'error',
                'bg-yellow-50 border-yellow-500': msg.type === 'warning',
                'bg-blue-50 border-blue-500': msg.type === 'info',
            }"
            class="border-l-4 p-4 rounded shadow-lg max-w-sm"
        >
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-medium">{{ msg.text }}</p>
                    <p v-if="msg.detail" class="text-sm mt-1 opacity-75">{{ msg.detail }}</p>
                </div>
                <button @click="dismiss(msg.id)" class="ml-4 opacity-50 hover:opacity-100">×</button>
            </div>

            <a
                v-if="msg.action"
                :href="msg.action.url"
                class="text-sm font-medium underline mt-2 inline-block"
            >
                {{ msg.action.label }}
            </a>

            <!-- Auto-dismiss progress bar -->
            <div
                v-if="msg.autoDismiss"
                class="h-0.5 bg-current opacity-20 mt-2 rounded"
                :style="{ width: msg.remainingPercent + '%', transition: 'width 100ms linear' }"
            />
        </div>
    </TransitionGroup>
</template>
```

**API:**

```typescript
interface FlashMessage {
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    text: string
    detail?: string
    action?: { label: string; url: string }
    autoDismiss: number | false     // milliseconds or false
    remainingPercent: number         // 100 → 0, reactive, for progress bars
    createdAt: number
}

interface UseFlashReturn {
    /** All currently visible flash messages. Reactive. */
    messages: ComputedRef<FlashMessage[]>

    /** Dismiss a specific message by ID */
    dismiss: (id: string) => void

    /** Dismiss all messages */
    dismissAll: () => void

    /** Register a callback for new flash messages */
    onFlash: (callback: (message: FlashMessage) => void) => void
}
```

### usePagination()

Wraps an Inertia paginator response with reactive controls.

```vue
<script setup lang="ts">
import { usePagination } from '@mjoc1985/inertia-helpers'

const props = defineProps<{
    users: InertiaPage<User>  // Laravel's paginated response
}>()

const {
    items,
    meta,
    goToPage,
    nextPage,
    prevPage,
    updatePerPage,
    isFirstPage,
    isLastPage,
} = usePagination(() => props.users)
</script>

<template>
    <table>
        <tbody>
            <tr v-for="user in items" :key="user.id">
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
            </tr>
        </tbody>
    </table>

    <div class="flex items-center justify-between mt-4">
        <span>
            Showing {{ meta.from }}–{{ meta.to }} of {{ meta.total }}
        </span>

        <div class="flex gap-2">
            <button @click="prevPage" :disabled="isFirstPage">Previous</button>

            <button
                v-for="page in meta.links"
                :key="page.label"
                @click="goToPage(page.number)"
                :class="{ 'font-bold': page.active }"
            >
                {{ page.label }}
            </button>

            <button @click="nextPage" :disabled="isLastPage">Next</button>
        </div>

        <select :value="meta.perPage" @change="updatePerPage(+$event.target.value)">
            <option :value="10">10 per page</option>
            <option :value="25">25 per page</option>
            <option :value="50">50 per page</option>
        </select>
    </div>
</template>
```

**API:**

```typescript
interface PaginationMeta {
    currentPage: number
    lastPage: number
    perPage: number
    total: number
    from: number
    to: number
    links: Array<{
        number: number | null
        label: string
        active: boolean
        url: string | null
    }>
}

interface UsePaginationReturn<T> {
    /** The items on the current page. Reactive. */
    items: ComputedRef<T[]>

    /** Pagination metadata. Reactive. */
    meta: ComputedRef<PaginationMeta>

    /** Navigate to a specific page */
    goToPage: (page: number) => void

    /** Go to the next page */
    nextPage: () => void

    /** Go to the previous page */
    prevPage: () => void

    /** Change items per page (reloads from page 1) */
    updatePerPage: (perPage: number) => void

    /** Whether currently on the first page. Reactive. */
    isFirstPage: ComputedRef<boolean>

    /** Whether currently on the last page. Reactive. */
    isLastPage: ComputedRef<boolean>

    /** Whether a page transition is in progress. Reactive. */
    isLoading: ComputedRef<boolean>
}
```

**Options:**

```typescript
const pagination = usePagination(() => props.users, {
    // Preserve these query params during navigation (e.g. active filters)
    preserveQuery: ['search', 'role', 'status'],

    // Use 'replace' instead of 'push' for browser history
    replace: true,

    // Preserve scroll position during navigation
    preserveScroll: true,

    // Only reload this prop (performance optimisation)
    only: ['users'],
})
```

### useFilters()

Syncs a filter form with URL query parameters via Inertia visits. Handles debouncing, resetting, and dirty tracking.

```vue
<script setup lang="ts">
import { useFilters } from '@mjoc1985/inertia-helpers'

const props = defineProps<{
    filters: {
        search: string
        role: string
        status: string
    }
}>()

const { values, update, reset, isDirty, activeCount } = useFilters(
    () => props.filters,
    {
        debounce: { search: 300 },  // debounce specific fields
        only: ['users'],             // only reload the users prop
    }
)
</script>

<template>
    <div class="flex gap-4 items-center">
        <input
            type="text"
            :value="values.search"
            @input="update('search', $event.target.value)"
            placeholder="Search users..."
        />

        <select :value="values.role" @change="update('role', $event.target.value)">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
        </select>

        <select :value="values.status" @change="update('status', $event.target.value)">
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
        </select>

        <button v-if="isDirty" @click="reset">
            Clear Filters ({{ activeCount }})
        </button>
    </div>
</template>
```

**API:**

```typescript
interface UseFiltersReturn<T extends Record<string, any>> {
    /** Current filter values. Reactive. */
    values: Reactive<T>

    /** Update a single filter value (triggers debounced Inertia visit) */
    update: <K extends keyof T>(key: K, value: T[K]) => void

    /** Update multiple filter values at once */
    updateMany: (updates: Partial<T>) => void

    /** Reset all filters to their defaults */
    reset: () => void

    /** Reset a single filter to its default */
    resetField: <K extends keyof T>(key: K) => void

    /** Whether any filter differs from its default. Reactive. */
    isDirty: ComputedRef<boolean>

    /** Number of active (non-default) filters. Reactive. */
    activeCount: ComputedRef<number>

    /** Whether an Inertia visit is in progress. Reactive. */
    isLoading: ComputedRef<boolean>
}
```

### useSorting()

Manages sortable table columns with Inertia visits.

```vue
<script setup lang="ts">
import { useSorting } from '@mjoc1985/inertia-helpers'

const props = defineProps<{
    sort: { field: string; direction: 'asc' | 'desc' }
}>()

const { sortBy, isSortedBy, direction } = useSorting(() => props.sort, {
    only: ['users'],
})
</script>

<template>
    <table>
        <thead>
            <tr>
                <th @click="sortBy('name')" class="cursor-pointer">
                    Name
                    <span v-if="isSortedBy('name')">
                        {{ direction === 'asc' ? '↑' : '↓' }}
                    </span>
                </th>
                <th @click="sortBy('email')" class="cursor-pointer">
                    Email
                    <span v-if="isSortedBy('email')">
                        {{ direction === 'asc' ? '↑' : '↓' }}
                    </span>
                </th>
                <th @click="sortBy('created_at')" class="cursor-pointer">
                    Joined
                    <span v-if="isSortedBy('created_at')">
                        {{ direction === 'asc' ? '↑' : '↓' }}
                    </span>
                </th>
            </tr>
        </thead>
    </table>
</template>
```

**API:**

```typescript
interface UseSortingReturn {
    /** Sort by a field. Toggles direction if already sorted by this field. */
    sortBy: (field: string) => void

    /** Whether currently sorted by the given field. */
    isSortedBy: (field: string) => boolean

    /** Current sort direction. Reactive. */
    direction: ComputedRef<'asc' | 'desc'>

    /** Current sort field. Reactive. */
    field: ComputedRef<string>
}
```

### useBreadcrumbs()

Access the breadcrumb trail shared from the backend.

```vue
<script setup lang="ts">
import { useBreadcrumbs } from '@mjoc1985/inertia-helpers'

const { crumbs, hasCrumbs } = useBreadcrumbs()
</script>

<template>
    <nav v-if="hasCrumbs" aria-label="Breadcrumb">
        <ol class="flex items-center gap-2 text-sm text-gray-500">
            <li v-for="(crumb, index) in crumbs" :key="index" class="flex items-center gap-2">
                <span v-if="index > 0">/</span>

                <Link
                    v-if="crumb.url"
                    :href="crumb.url"
                    class="hover:text-gray-700 underline"
                >
                    {{ crumb.label }}
                </Link>
                <span v-else class="text-gray-900 font-medium">
                    {{ crumb.label }}
                </span>
            </li>
        </ol>
    </nav>
</template>
```

---

## Package Structure

```
laravel-inertia-helpers/
├── composer.json
├── package.json
├── README.md
├── LICENSE.md
│
├── src/                              # Laravel package (PHP)
│   ├── InertiaHelpersServiceProvider.php
│   ├── Flash.php                     # Fluent flash message builder
│   ├── Breadcrumbs.php               # Breadcrumb registration & resolution
│   ├── BreadcrumbTrail.php           # Trail builder passed to callbacks
│   ├── Middleware/
│   │   └── SharesInertiaData.php     # Trait for HandleInertiaRequests
│   └── config/
│       └── inertia-helpers.php       # Published config
│
├── js/                               # Vue 3 package (TypeScript)
│   ├── index.ts                      # Main entry — exports all composables
│   ├── composables/
│   │   ├── useAuth.ts
│   │   ├── useFlash.ts
│   │   ├── usePagination.ts
│   │   ├── useFilters.ts
│   │   ├── useSorting.ts
│   │   └── useBreadcrumbs.ts
│   └── types/
│       ├── index.ts                  # Shared types & interfaces
│       └── augmentations.ts          # Module augmentation for user overrides
│
└── tests/
    ├── PHP/
    │   ├── FlashTest.php
    │   ├── BreadcrumbsTest.php
    │   └── SharesInertiaDataTest.php
    └── JS/
        ├── useAuth.test.ts
        ├── useFlash.test.ts
        ├── usePagination.test.ts
        ├── useFilters.test.ts
        └── useSorting.test.ts
```

---

## Versioning & Releases

### v1.0 — Initial Release
- `useAuth` composable with typed user access
- `useFlash` composable with auto-dismiss and stacking
- `usePagination` composable with full navigation controls
- `SharesInertiaData` middleware trait
- `Flash` builder class
- TypeScript types with module augmentation

### v1.1
- `useFilters` composable with debounce and dirty tracking
- `useSorting` composable for table columns

### v1.2
- `useBreadcrumbs` composable
- `Breadcrumbs` registration API
- Auto-sharing breadcrumbs via middleware

### v2.0 (Future)
- Renderless Vue components as alternatives to composables
- SSR support improvements
- Laravel 12+ specific optimisations

---

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

The MIT License (MIT). See [LICENSE.md](LICENSE.md) for details.

---

Built by [mjoc1985](https://github.com/mjoc1985)
