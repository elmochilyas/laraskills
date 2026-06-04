# Codex CLI — Laravel 13 Instructions

For full agent operating instructions and knowledge layer navigation, see:
- [`AGENTS.md`](../AGENTS.md)
- [`agent/retrieval-guide.md`](../agent/retrieval-guide.md)
- [`agent/domain-routing-index.md`](../agent/domain-routing-index.md)

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
- **Container**: Constructor injection, depend on contracts, contextual binding
- **Facades**: Use only for infrastructure (Cache, Log, DB); inject contracts in business code

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
