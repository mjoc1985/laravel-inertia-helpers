<?php

declare(strict_types=1);

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Mjoc1985\InertiaHelpers\Flash;
use Mjoc1985\InertiaHelpers\SharedData;

beforeEach(function () {
    $this->sharedData = new SharedData();
});

it('shares auth data for authenticated user', function () {
    $user = new class
    {
        public int $id = 1;

        public string $name = 'John Doe';

        public string $email = 'john@example.com';
    };

    $request = Request::create('/test');
    $request->setUserResolver(fn () => $user);

    $auth = $this->sharedData->auth($request);

    expect($auth)->toBe([
        'user' => [
            'id' => 1,
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ],
    ]);
});

it('shares null user for guests', function () {
    $request = Request::create('/test');
    $request->setUserResolver(fn () => null);

    $auth = $this->sharedData->auth($request);

    expect($auth)->toBe(['user' => null]);
});

it('shares rich flash messages from the Flash builder', function () {
    Flash::success('Item created')->send();
    Flash::error('Validation failed')->detail('Check your input')->send();

    $request = Request::create('/test');
    $request->setLaravelSession(app('session.store'));

    $flash = $this->sharedData->flash($request);

    expect($flash['messages'])->toHaveCount(2);
    expect($flash['messages'][0]['type'])->toBe('success');
    expect($flash['messages'][0]['text'])->toBe('Item created');
    expect($flash['messages'][1]['type'])->toBe('error');
    expect($flash['messages'][1]['detail'])->toBe('Check your input');
});

it('shares simple Laravel flash messages', function () {
    Session::flash('success', 'Simple success');

    $request = Request::create('/test');
    $request->setLaravelSession(app('session.store'));

    $flash = $this->sharedData->flash($request);

    expect($flash['messages'])->toHaveCount(1);
    expect($flash['messages'][0]['type'])->toBe('success');
    expect($flash['messages'][0]['text'])->toBe('Simple success');
    expect($flash['messages'][0]['autoDismiss'])->toBe(5000);
});

it('does not duplicate simple flash messages that match rich messages', function () {
    // Manually flash both a rich message and a matching simple message
    // to simulate the old backward-compat behavior
    Session::flash('_flash_messages', [
        [
            'type' => 'success',
            'text' => 'Done',
            'detail' => null,
            'action' => null,
            'autoDismiss' => 5000,
        ],
    ]);
    Session::flash('success', 'Done');

    $request = Request::create('/test');
    $request->setLaravelSession(app('session.store'));

    $flash = $this->sharedData->flash($request);

    // Should only appear once (the rich version)
    $successMessages = array_filter(
        $flash['messages'],
        fn ($msg) => $msg['type'] === 'success' && $msg['text'] === 'Done'
    );

    expect($successMessages)->toHaveCount(1);
});

it('returns empty messages when no flash data exists', function () {
    $request = Request::create('/test');
    $request->setLaravelSession(app('session.store'));

    $flash = $this->sharedData->flash($request);

    expect($flash['messages'])->toBe([]);
});

it('returns shared data as an array with closures', function () {
    $request = Request::create('/test');
    $request->setUserResolver(fn () => null);
    $request->setLaravelSession(app('session.store'));

    $data = $this->sharedData->toArray($request);

    // Values should be closures (lazy evaluation)
    expect($data['auth'])->toBeInstanceOf(Closure::class);
    expect($data['flash'])->toBeInstanceOf(Closure::class);
    expect($data['breadcrumbs'])->toBeInstanceOf(Closure::class);

    // Calling the closures should return the actual data
    expect(($data['auth'])())->toBe(['user' => null]);
    expect(($data['flash'])()['messages'])->toBe([]);
});
