<?php

declare(strict_types=1);

use Mjoc1985\InertiaHelpers\Breadcrumbs;
use Mjoc1985\InertiaHelpers\BreadcrumbTrail;

it('pushes breadcrumbs onto the trail', function () {
    $breadcrumbs = new Breadcrumbs();
    $trail = new BreadcrumbTrail($breadcrumbs);

    $trail->push('Home', '/');
    $trail->push('Users', '/users');
    $trail->push('Edit');

    expect($trail->toArray())->toBe([
        ['label' => 'Home', 'url' => '/'],
        ['label' => 'Users', 'url' => '/users'],
        ['label' => 'Edit', 'url' => null],
    ]);
});

it('supports fluent chaining', function () {
    $breadcrumbs = new Breadcrumbs();
    $trail = new BreadcrumbTrail($breadcrumbs);

    $result = $trail
        ->push('Home', '/')
        ->push('Dashboard', '/dashboard');

    expect($result)->toBe($trail);
    expect($trail->toArray())->toHaveCount(2);
});

it('includes parent breadcrumbs', function () {
    $breadcrumbs = new Breadcrumbs();

    $breadcrumbs->register('home', function (BreadcrumbTrail $trail) {
        $trail->push('Home', '/');
    });

    $trail = new BreadcrumbTrail($breadcrumbs);
    $trail->parent('home');
    $trail->push('Users', '/users');

    expect($trail->toArray())->toBe([
        ['label' => 'Home', 'url' => '/'],
        ['label' => 'Users', 'url' => '/users'],
    ]);
});

it('passes parameters to parent callbacks', function () {
    $breadcrumbs = new Breadcrumbs();

    $breadcrumbs->register('users.show', function (BreadcrumbTrail $trail, string $name) {
        $trail->push($name, '/users/' . $name);
    });

    $trail = new BreadcrumbTrail($breadcrumbs);
    $trail->parent('users.show', 'John');
    $trail->push('Edit');

    expect($trail->toArray())->toBe([
        ['label' => 'John', 'url' => '/users/John'],
        ['label' => 'Edit', 'url' => null],
    ]);
});

it('handles missing parent gracefully', function () {
    $breadcrumbs = new Breadcrumbs();
    $trail = new BreadcrumbTrail($breadcrumbs);

    $trail->parent('nonexistent');
    $trail->push('Current');

    expect($trail->toArray())->toBe([
        ['label' => 'Current', 'url' => null],
    ]);
});

it('supports deeply nested parents', function () {
    $breadcrumbs = new Breadcrumbs();

    $breadcrumbs->register('home', function (BreadcrumbTrail $trail) {
        $trail->push('Home', '/');
    });

    $breadcrumbs->register('users', function (BreadcrumbTrail $trail) {
        $trail->parent('home');
        $trail->push('Users', '/users');
    });

    $breadcrumbs->register('users.edit', function (BreadcrumbTrail $trail) {
        $trail->parent('users');
        $trail->push('Edit');
    });

    $trail = new BreadcrumbTrail($breadcrumbs);
    $callback = $breadcrumbs->getCallback('users.edit');
    $callback($trail);

    expect($trail->toArray())->toBe([
        ['label' => 'Home', 'url' => '/'],
        ['label' => 'Users', 'url' => '/users'],
        ['label' => 'Edit', 'url' => null],
    ]);
});

it('returns empty array for a fresh trail', function () {
    $breadcrumbs = new Breadcrumbs();
    $trail = new BreadcrumbTrail($breadcrumbs);

    expect($trail->toArray())->toBe([]);
});
