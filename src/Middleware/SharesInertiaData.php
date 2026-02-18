<?php

declare(strict_types=1);

namespace Mjoc1985\InertiaHelpers\Middleware;

use Illuminate\Http\Request;
use Mjoc1985\InertiaHelpers\Breadcrumbs;

trait SharesInertiaData
{
    /**
     * Return all shared data for Inertia.
     * Call this from your HandleInertiaRequests::share() method.
     */
    protected function sharedData(Request $request): array
    {
        return array_filter([
            'auth' => fn () => $this->sharedAuth($request),
            'flash' => fn () => $this->sharedFlash($request),
            'breadcrumbs' => fn () => $this->sharedBreadcrumbs($request),
            ...$this->sharedCustom($request),
        ]);
    }

    /**
     * Share authentication data.
     * Override this to customise the user payload.
     */
    protected function sharedAuth(Request $request): array
    {
        $user = $request->user();

        return [
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ] : null,
        ];
    }

    /**
     * Share flash messages.
     * Supports both the Flash builder (rich messages) and plain
     * Laravel session flash (e.g. session('success')).
     */
    protected function sharedFlash(Request $request): array
    {
        $types = config('inertia-helpers.flash.types', ['success', 'error', 'warning', 'info']);

        // Collect rich flash messages (from Flash builder)
        $richMessages = $request->session()->get('_flash_messages', []);

        // Collect simple flash messages (from standard Laravel session flash).
        // These are deduplicated against rich messages so that messages sent
        // via Flash::send() are not counted twice.
        $richTexts = [];
        foreach ($richMessages as $rich) {
            $richTexts[$rich['type']][] = $rich['text'];
        }

        $simpleMessages = [];
        foreach ($types as $type) {
            $message = $request->session()->get($type);
            if ($message && ! isset($richTexts[$type]) || ! in_array($message, $richTexts[$type] ?? [], true)) {
                $simpleMessages[] = [
                    'type' => $type,
                    'text' => $message,
                    'detail' => null,
                    'action' => null,
                    'autoDismiss' => $type === 'error'
                        ? false
                        : config('inertia-helpers.flash.auto_dismiss', 5000),
                ];
            }
        }

        return [
            'messages' => array_merge($richMessages, $simpleMessages),
        ];
    }

    /**
     * Share breadcrumbs for the current route.
     */
    protected function sharedBreadcrumbs(Request $request): array
    {
        $breadcrumbs = app(Breadcrumbs::class);

        return $breadcrumbs->resolve();
    }

    /**
     * Override this to add custom shared data.
     */
    protected function sharedCustom(Request $request): array
    {
        return [];
    }
}
