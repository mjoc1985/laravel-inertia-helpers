<?php

declare(strict_types=1);

namespace Mjoc1985\InertiaHelpers;

use Illuminate\Support\Facades\Session;

class Flash
{
    protected string $type;

    protected string $message;

    protected ?string $detail = null;

    protected ?array $action = null;

    protected int|false $autoDismiss;

    protected function __construct(string $type, string $message)
    {
        $this->type = $type;
        $this->message = $message;
        $this->autoDismiss = config('inertia-helpers.flash.auto_dismiss', 5000);

        // Errors should persist by default
        if ($type === 'error') {
            $this->autoDismiss = false;
        }
    }

    public static function success(string $message): static
    {
        return new static('success', $message);
    }

    public static function error(string $message): static
    {
        return new static('error', $message);
    }

    public static function warning(string $message): static
    {
        return new static('warning', $message);
    }

    public static function info(string $message): static
    {
        return new static('info', $message);
    }

    public function detail(string $detail): static
    {
        $this->detail = $detail;

        return $this;
    }

    public function action(string $label, string $url): static
    {
        $this->action = [
            'label' => $label,
            'url' => $url,
        ];

        return $this;
    }

    public function autoDismiss(int|false $milliseconds): static
    {
        $this->autoDismiss = $milliseconds;

        return $this;
    }

    public function send(): void
    {
        $messages = Session::get('_flash_messages', []);

        $messages[] = $this->toArray();

        Session::flash('_flash_messages', $messages);
    }

    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'text' => $this->message,
            'detail' => $this->detail,
            'action' => $this->action,
            'autoDismiss' => $this->autoDismiss,
        ];
    }
}
