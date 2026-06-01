---
description: List and verify Laravel 13 application routes
---

# Route List Command

## Usage

```bash
php artisan route:list
php artisan route:list --path=api/users
php artisan route:list --method=POST
php artisan route:list --except-vendor
```

## Route Organization

```php
// routes/api.php — API routes (auth:sanctum)
// routes/web.php — Web routes (web middleware)
// routes/console.php — Artisan command schedules
```

## Route Caching

```bash
php artisan route:cache    # Production
php artisan route:clear    # Development
```
