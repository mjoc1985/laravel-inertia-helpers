<?php

declare(strict_types=1);

namespace Mjoc1985\InertiaHelpers;

use Illuminate\Support\ServiceProvider;

class InertiaHelpersServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(
            __DIR__ . '/config/inertia-helpers.php',
            'inertia-helpers'
        );

        $this->app->singleton(Breadcrumbs::class, function () {
            return new Breadcrumbs();
        });
    }

    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->publishes([
                __DIR__ . '/config/inertia-helpers.php' => config_path('inertia-helpers.php'),
            ], 'inertia-helpers-config');
        }

        $this->loadBreadcrumbs();
    }

    protected function loadBreadcrumbs(): void
    {
        $file = config('inertia-helpers.breadcrumbs.file');

        if (! $file || ! file_exists($file)) {
            return;
        }

        // Resolve symlinks and verify the file is within the application base path
        $realPath = realpath($file);
        if ($realPath === false || ! str_starts_with($realPath, base_path())) {
            return;
        }

        require $realPath;
    }
}
