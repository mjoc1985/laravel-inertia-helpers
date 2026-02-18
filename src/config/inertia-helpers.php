<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Breadcrumbs
    |--------------------------------------------------------------------------
    */

    'breadcrumbs' => [

        // Path to your breadcrumb definitions file
        'file' => base_path('routes/breadcrumbs.php'),

        // Automatically prepend a 'Home' crumb to every trail
        'auto_home' => false,

        // Route name used for the automatic Home breadcrumb
        'home_route' => 'home',

    ],

    /*
    |--------------------------------------------------------------------------
    | Flash Messages
    |--------------------------------------------------------------------------
    */

    'flash' => [

        // Default auto-dismiss duration in milliseconds
        // Set to false to disable auto-dismiss by default
        'auto_dismiss' => 5000,

        // Flash message types to check in the session
        // These map to session keys (e.g. session('success'))
        'types' => ['success', 'error', 'warning', 'info'],

    ],

];
