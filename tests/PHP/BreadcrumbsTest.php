<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Mjoc1985\InertiaHelpers\Breadcrumbs;
use Mjoc1985\InertiaHelpers\BreadcrumbTrail;

beforeEach(function () {
    $this->breadcrumbs = app(Breadcrumbs::class);
});

it('registers and resolves breadcrumbs for a route', function () {
    Route::get('/dashboard', fn () => 'dashboard')->name('dashboard');

    $this->breadcrumbs->register('dashboard', function (BreadcrumbTrail $trail) {
        $trail->push('Dashboard', '/dashboard');
    });

    // Simulate navigating to the route
    $request = Request::create('/dashboard');
    $route = app('router')->getRoutes()->match($request);
    Route::shouldReceive('current')->andReturn($route);

    $crumbs = $this->breadcrumbs->resolve();

    expect($crumbs)->toHaveCount(1);
    expect($crumbs[0])->toBe(['label' => 'Dashboard', 'url' => '/dashboard']);
});

it('returns empty array when no route is current', function () {
    Route::shouldReceive('current')->andReturn(null);

    expect($this->breadcrumbs->resolve())->toBe([]);
});

it('returns empty array when route has no name', function () {
    Route::get('/unnamed', fn () => 'unnamed');

    $request = Request::create('/unnamed');
    $route = app('router')->getRoutes()->match($request);
    Route::shouldReceive('current')->andReturn($route);

    expect($this->breadcrumbs->resolve())->toBe([]);
});

it('returns empty array when no breadcrumbs are registered for the route', function () {
    Route::get('/unknown', fn () => 'unknown')->name('unknown');

    $request = Request::create('/unknown');
    $route = app('router')->getRoutes()->match($request);
    Route::shouldReceive('current')->andReturn($route);

    expect($this->breadcrumbs->resolve())->toBe([]);
});

it('checks if a route has breadcrumbs registered', function () {
    $this->breadcrumbs->register('dashboard', function (BreadcrumbTrail $trail) {
        $trail->push('Dashboard');
    });

    expect($this->breadcrumbs->has('dashboard'))->toBeTrue();
    expect($this->breadcrumbs->has('settings'))->toBeFalse();
});

it('retrieves a registered callback', function () {
    $callback = function (BreadcrumbTrail $trail) {
        $trail->push('Test');
    };

    $this->breadcrumbs->register('test', $callback);

    expect($this->breadcrumbs->getCallback('test'))->toBe($callback);
    expect($this->breadcrumbs->getCallback('nonexistent'))->toBeNull();
});

it('registers breadcrumbs via the static for method', function () {
    Breadcrumbs::for('home', function (BreadcrumbTrail $trail) {
        $trail->push('Home', '/');
    });

    expect($this->breadcrumbs->has('home'))->toBeTrue();
});

it('catches exceptions in production mode', function () {
    Route::get('/broken', fn () => 'broken')->name('broken');

    $this->breadcrumbs->register('broken', function () {
        throw new RuntimeException('Breadcrumb error');
    });

    $request = Request::create('/broken');
    $route = app('router')->getRoutes()->match($request);
    Route::shouldReceive('current')->andReturn($route);

    // In non-debug mode, exceptions are caught
    config(['app.debug' => false]);

    expect($this->breadcrumbs->resolve())->toBe([]);
});

it('rethrows exceptions in debug mode', function () {
    Route::get('/broken', fn () => 'broken')->name('broken');

    $this->breadcrumbs->register('broken', function () {
        throw new RuntimeException('Breadcrumb error');
    });

    $request = Request::create('/broken');
    $route = app('router')->getRoutes()->match($request);
    Route::shouldReceive('current')->andReturn($route);

    config(['app.debug' => true]);

    $this->breadcrumbs->resolve();
})->throws(RuntimeException::class, 'Breadcrumb error');
