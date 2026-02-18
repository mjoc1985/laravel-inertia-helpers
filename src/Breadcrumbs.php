<?php

declare(strict_types=1);

namespace Mjoc1985\InertiaHelpers;

use Closure;
use Illuminate\Support\Facades\Route;

class Breadcrumbs
{
    protected array $callbacks = [];

    public static function for(string $routeName, Closure $callback): void
    {
        app(static::class)->register($routeName, $callback);
    }

    public function register(string $routeName, Closure $callback): void
    {
        $this->callbacks[$routeName] = $callback;
    }

    public function resolve(): array
    {
        $route = Route::current();

        if (! $route || ! $route->getName()) {
            return [];
        }

        $routeName = $route->getName();

        if (! isset($this->callbacks[$routeName])) {
            return [];
        }

        $trail = new BreadcrumbTrail($this);

        // Auto-prepend Home breadcrumb if configured
        if (config('inertia-helpers.breadcrumbs.auto_home', false)) {
            $homeRoute = config('inertia-helpers.breadcrumbs.home_route', 'home');
            if ($routeName !== $homeRoute && Route::has($homeRoute)) {
                $trail->push('Home', route($homeRoute));
            }
        }

        $parameters = array_values($route->parameters());

        try {
            ($this->callbacks[$routeName])($trail, ...$parameters);
        } catch (\Throwable $e) {
            if (app()->hasDebugModeEnabled()) {
                throw $e;
            }

            report($e);

            return [];
        }

        return $trail->toArray();
    }

    public function has(string $routeName): bool
    {
        return isset($this->callbacks[$routeName]);
    }

    public function getCallback(string $routeName): ?Closure
    {
        return $this->callbacks[$routeName] ?? null;
    }
}
