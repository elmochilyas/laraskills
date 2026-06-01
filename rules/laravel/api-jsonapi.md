---
paths:
  - "**/*.php"
---

# Laravel 13 JSON:API Rules

> Enforced JSON:API specification standards. Violations require refactoring before merge.

## Resource Class

```php
// REQUIRED — use JsonApiResource for JSON:API endpoints
php artisan make:resource PostResource --json-api

// FORBIDDEN — manually constructing JSON:API responses
return response()->json(['data' => ['type' => 'posts', ...]]);
```

## Attributes

```php
// CORRECT
public $attributes = ['name', 'email'];

// Use closures for computed values
public $attributes = [
    'name',
    'full_name' => fn () => $this->first_name . ' ' . $this->last_name,
];
```

## Relationships

```php
// CORRECT
public $relationships = [
    'author' => AuthorResource::class,
];
```

## Sparse Fieldsets

```php
// MUST support: ?fields[type]=field1,field2
// JsonApiResource handles this automatically
```

## Includes

```php
// MUST whitelist allowed includes
// MUST eager-load in controller, never in resource
// MUST limit max depth (recommended: 2)
// Unknown includes MUST be silently ignored
```

## Meta Objects

```php
// FORBIDDEN — meta inside attributes
'attributes' => ['name' => 'John', 'meta' => ['count' => 5]]

// CORRECT — meta at top level
'meta' => ['count' => 5]
```

## Error Format

```php
// REQUIRED JSON:API error format
{
    "errors": [{
        "status": "422",
        "code": "VALIDATION_ERROR",
        "title": "Validation Failed",
        "detail": "The email field is required."
    }]
}
```

## Content Type

```php
// JsonApiResource automatically sets:
// Content-Type: application/vnd.api+json
```

## See Also

- Skill: `laravel-api-jsonapi`
- Official: [JSON:API Spec](https://jsonapi.org/format/)
- Rule: `rules/laravel/api-rest.md`
