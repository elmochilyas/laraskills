# Codex CLI — Laravel 13 Instructions

## Laravel 13 Setup

PHP 8.3+ required. Structure your app by feature domain:

```
app/Modules/
  User/       # Models, Actions, DTOs, Controllers, Resources, Policies, Tests
  Order/      # Same structure per feature
  Payment/    # Same structure per feature
```

## Key Patterns

- **Actions**: Single-purpose classes with `execute()` method
- **DTOs**: Readonly classes for data transfer between layers
- **Attributes**: Use PHP 8 attributes (`#[Fillable]`, `#[Table]`, `#[Tries]`) instead of property declarations

## Testing

```bash
php artisan test --parallel --coverage --min=80
./vendor/bin/pint --test
```

## Security

- Always use `#[Fillable]` or `#[Guarded]` on models
- Validate via FormRequest, not inline
- Authorize via Gates/Polices
- Rate limit all API endpoints
