<?php

declare(strict_types=1);

namespace Mjoc1985\InertiaHelpers;

use Illuminate\Http\Request;

class SharedData
{
    /**
     * Return all shared data for Inertia as lazy closures.
     */
    public function toArray(Request $request): array
    {
        return array_filter([
            'auth' => fn () => $this->auth($request),
            'flash' => fn () => $this->flash($request),
            'breadcrumbs' => fn () => $this->breadcrumbs($request),
            ...$this->custom($request),
        ]);
    }

    /**
     * Authentication payload.
     * Override in a subclass to customise the user shape.
     */
    public function auth(Request $request): array
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
     * Flash messages.
     * Supports both the Flash builder (rich messages) and plain
     * Laravel session flash (e.g. session('success')).
     */
    public function flash(Request $request): array
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
            if ($message && (! isset($richTexts[$type]) || ! in_array($message, $richTexts[$type] ?? [], true))) {
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
     * Breadcrumb trail for the current route.
     */
    public function breadcrumbs(Request $request): array
    {
        $breadcrumbs = app(Breadcrumbs::class);

        return $breadcrumbs->resolve();
    }

    /**
     * Override in a subclass to add custom shared data.
     */
    public function custom(Request $request): array
    {
        return [];
    }
}
