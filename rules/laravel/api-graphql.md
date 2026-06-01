---
paths:
  - "**/*.graphql"
  - "**/GraphQL/**/*.php"
  - "config/lighthouse.php"
---

# Laravel 13 GraphQL Rules

> Enforced GraphQL standards. Violations require refactoring before merge.

## Schema-First

```graphql
// REQUIRED — define schema before resolvers
// FORBIDDEN — code-first schema generation
```

## Resolver Thinness

```php
// FORBIDDEN — business logic in resolvers
class SearchUsers {
    public function __invoke($root, array $args) {
        return DB::query(...); // Nope — delegate to Action
    }
}

// REQUIRED
class SearchUsers {
    public function __construct(private SearchUsersAction $action) {}
    public function __invoke($root, array $args) {
        return $this->action->execute(new SearchUsersDTO(...$args));
    }
}
```

## N+1 Prevention

```php
// REQUIRED — use @hasMany, @belongsTo etc. (Lighthouse batches automatically)
// FORBIDDEN — lazy-loading relationships in resolvers
```

## Query Protection

```php
// REQUIRED in config/lighthouse.php
'max_depth' => env('LIGHTHOUSE_MAX_DEPTH', 10),
'max_complexity' => env('LIGHTHOUSE_MAX_COMPLEXITY', 1000),
```

## Authorization

```graphql
// REQUIRED — use @can, @canModel with Laravel Policies
// FORBIDDEN — inline authorization checks in resolvers
```

## Validation

```graphql
// REQUIRED — use @rules directive
input CreateUserInput {
    email: String! @rules(apply: ["required", "email"])
}
```

## Seed Also

- Skill: `laravel-api-graphql`
- Official: [Lighthouse Docs](https://lighthouse-php.com/)
