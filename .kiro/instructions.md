# Kiro — Laravel 13 Instructions

## Key Laravel 13 Patterns

- Attribute-driven models: `#[Table('users')]` `#[Fillable(['name', 'email'])]`
- Domain modules: `app/Modules/{Feature}/Actions/`, `app/Modules/{Feature}/DTOs/`
- Single-purpose Action classes with `execute()`
- Pest 4 for testing (feature > unit, 80/20 split)
- FormRequest for validation + authorization
- Gates and Policies for access control
- Rate limiting on all API routes

## Commands

```bash
# Run tests
php artisan test --parallel

# Code style
./vendor/bin/pint --test

# Static analysis
./vendor/bin/phpstan analyse --level=6

# Security audit
composer audit
```
