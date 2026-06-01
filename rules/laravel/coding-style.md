---
paths:
  - "**/*.php"
  - "**/composer.json"
  - "**/.php-cs-fixer.php"
  - "**/pint.json"
---
# Laravel 13 Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md), [php/coding-style.md](../php/coding-style.md) with Laravel 13 specific content.

## Standards

- Follow PSR-12 with Laravel Pint (default config).
- Use `declare(strict_types=1)` at the top of every new PHP file.
- Use PHP 8.3+ typed properties, readonly properties, and union types everywhere.

## Laravel Conventions

- Models: singular PascalCase (`User`, `OrderItem`).
- Tables: plural snake_case (`users`, `order_items`).
- Controllers: singular PascalCase with `Controller` suffix.
- Migrations: snake_case with date prefix (`2024_01_15_000001_create_users_table.php`).
- FormRequest: singular PascalCase with `Request` suffix.
- Policies: singular PascalCase with `Policy` suffix.
- Resources: singular PascalCase with `Resource` suffix.
- Actions: PascalCase with `Action` suffix (`CreateUserAction`).
- DTOs: PascalCase with `DTO` suffix (`CreateUserDTO`).
- Enums: singular PascalCase with `Enum` suffix if ambiguity exists.

## PHP 8 Attributes (Laravel 13)

Use PHP 8 attributes over traditional property declarations:
- `#[Table('users', key: 'user_id')]` instead of `protected $table = 'users'`
- `#[Fillable(['name', 'email'])]` instead of `protected $fillable = [...]`
- `#[Hidden(['password'])]` instead of `protected $hidden = [...]`
- `#[Casts(['is_admin' => 'boolean'])]` instead of `protected $casts = [...]`
- `#[Connection('redis')]` instead of `public $connection = 'redis'`
- `#[Tries(3)]` instead of `public $tries = 3`
- `#[AsCommand('mail:send')]` instead of `protected $signature = 'mail:send'`

## Import Order

```php
<?php

declare(strict_types=1);

namespace App\Modules\User\Controllers;

use App\Modules\User\Actions\CreateUserAction;
use App\Modules\User\DTOs\CreateUserDTO;
use App\Modules\User\Requests\StoreUserRequest;
use App\Modules\User\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
```

## Formatting

- Use **Laravel Pint** for formatting (`./vendor/bin/pint`).
- Use **PHPStan** at level 6+ for static analysis.
- Keep Pint config in `pint.json` at project root.
