<?php

declare(strict_types=1);

namespace Mjoc1985\InertiaHelpers\Tests;

use Orchestra\Testbench\TestCase as BaseTestCase;
use Mjoc1985\InertiaHelpers\InertiaHelpersServiceProvider;

class TestCase extends BaseTestCase
{
    protected function getPackageProviders($app): array
    {
        return [InertiaHelpersServiceProvider::class];
    }
}
