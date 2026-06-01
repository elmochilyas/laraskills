# CodeBuddy — Laravel 13 Instructions

## Development Rules

1. **Architecture**: Modular by domain (`app/Modules/`), Actions + DTOs pattern
2. **Models**: Use PHP 8 attributes over properties (`#[Fillable]`, `#[Hidden]`)
3. **Validation**: Always use FormRequest with `authorize()` + `rules()`
4. **Authorization**: Gates for simple checks, Policies for model CRUD
5. **Testing**: Pest 4, fakes over mocks, 80%+ coverage
6. **Security**: Rate limit APIs, escape Blade output, CSRF all forms
7. **Queue**: `#[Connection]`, `#[Tries]`, `#[Timeout]` attributes

## Commands

```bash
php artisan test --parallel --coverage --min=80
./vendor/bin/pint
./vendor/bin/phpstan analyse --level=6
```
