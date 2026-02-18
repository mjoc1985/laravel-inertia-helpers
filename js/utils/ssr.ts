/**
 * SSR-safe URL helpers.
 * During server-side rendering, `window` is undefined.
 */

const FALLBACK_URL = 'http://localhost'

export function getCurrentUrl(): URL {
    if (typeof window !== 'undefined') {
        return new URL(window.location.href)
    }
    return new URL(FALLBACK_URL)
}

export function getOrigin(): string {
    if (typeof window !== 'undefined') {
        return window.location.origin
    }
    return FALLBACK_URL
}
