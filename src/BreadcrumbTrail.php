<?php

declare(strict_types=1);

namespace Mjoc1985\InertiaHelpers;

class BreadcrumbTrail
{
    protected array $crumbs = [];

    protected Breadcrumbs $breadcrumbs;

    public function __construct(Breadcrumbs $breadcrumbs)
    {
        $this->breadcrumbs = $breadcrumbs;
    }

    /**
     * Push a breadcrumb onto the trail.
     *
     * @param  string  $label  The display text for the breadcrumb
     * @param  string|null  $url  The URL (null for the current/last page)
     */
    public function push(string $label, ?string $url = null): static
    {
        $this->crumbs[] = [
            'label' => $label,
            'url' => $url,
        ];

        return $this;
    }

    /**
     * Include the breadcrumb trail from a parent route.
     *
     * @param  string  $routeName  The parent route name
     * @param  mixed  ...$parameters  Parameters to pass to the parent callback
     */
    public function parent(string $routeName, mixed ...$parameters): static
    {
        $callback = $this->breadcrumbs->getCallback($routeName);

        if ($callback) {
            $callback($this, ...$parameters);
        }

        return $this;
    }

    public function toArray(): array
    {
        return $this->crumbs;
    }
}
