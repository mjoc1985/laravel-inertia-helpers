<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Session;
use Mjoc1985\InertiaHelpers\Flash;

it('creates a success flash message', function () {
    $flash = Flash::success('Operation completed');

    expect($flash->toArray())
        ->id->toBeString()
        ->type->toBe('success')
        ->text->toBe('Operation completed')
        ->detail->toBeNull()
        ->action->toBeNull()
        ->autoDismiss->toBe(5000);
});

it('creates an error flash message with auto-dismiss disabled', function () {
    $flash = Flash::error('Something went wrong');

    expect($flash->toArray())
        ->type->toBe('error')
        ->text->toBe('Something went wrong')
        ->autoDismiss->toBeFalse();
});

it('creates warning and info flash messages', function () {
    $warning = Flash::warning('Be careful');
    $info = Flash::info('FYI');

    expect($warning->toArray())->type->toBe('warning');
    expect($info->toArray())->type->toBe('info');
});

it('sets detail text', function () {
    $flash = Flash::success('Done')->detail('All 5 items were processed');

    expect($flash->toArray())
        ->detail->toBe('All 5 items were processed');
});

it('sets an action', function () {
    $flash = Flash::success('Created')->action('View', '/items/1');

    expect($flash->toArray())
        ->action->toBe(['label' => 'View', 'url' => '/items/1']);
});

it('overrides auto-dismiss duration', function () {
    $flash = Flash::success('Quick')->autoDismiss(2000);

    expect($flash->toArray())->autoDismiss->toBe(2000);
});

it('disables auto-dismiss', function () {
    $flash = Flash::success('Persistent')->autoDismiss(false);

    expect($flash->toArray())->autoDismiss->toBeFalse();
});

it('chains all builder methods fluently', function () {
    $flash = Flash::warning('Warning')
        ->detail('Something needs attention')
        ->action('Fix', '/fix')
        ->autoDismiss(10000);

    $array = $flash->toArray();

    expect($array)
        ->id->toBeString()
        ->type->toBe('warning')
        ->text->toBe('Warning')
        ->detail->toBe('Something needs attention')
        ->action->toBe(['label' => 'Fix', 'url' => '/fix'])
        ->autoDismiss->toBe(10000);
});

it('flashes rich messages to the session', function () {
    Flash::success('First')->send();
    Flash::error('Second')->send();

    $messages = Session::get('_flash_messages');

    expect($messages)->toHaveCount(2);
    expect($messages[0]['type'])->toBe('success');
    expect($messages[0]['text'])->toBe('First');
    expect($messages[1]['type'])->toBe('error');
    expect($messages[1]['text'])->toBe('Second');
});

it('does not set simple session flash keys', function () {
    Flash::success('Done')->send();

    expect(Session::get('success'))->toBeNull();
});

it('generates unique IDs for each flash message', function () {
    $first = Flash::success('First');
    $second = Flash::error('Second');
    $third = Flash::success('Third');

    $ids = [
        $first->toArray()['id'],
        $second->toArray()['id'],
        $third->toArray()['id'],
    ];

    expect($ids)->toHaveCount(3)
        ->and(array_unique($ids))->toHaveCount(3);
});
