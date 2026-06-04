# CodeBuddy — Laravel 13 Instructions

For full agent operating instructions and knowledge layer navigation, see:
- [`AGENTS.md`](../AGENTS.md)
- [`agent/retrieval-guide.md`](../agent/retrieval-guide.md)
- [`agent/domain-routing-index.md`](../agent/domain-routing-index.md)

## Development Rules

1. **Architecture**: Modular by domain (`app/Modules/`), Actions + DTOs pattern; Controller → Action → Service → Contract flow
2. **DI**: Constructor injection only, never `app()` or `resolve()` in business code
3. **Models**: Use PHP 8 attributes over properties (`#[Fillable]`, `#[Hidden]`)
4. **Validation**: Always use FormRequest with `authorize()` + `rules()`
5. **Authorization**: Gates for simple checks, Policies for model CRUD
6. **Testing**: Pest 4, fakes over mocks, 80%+ coverage
7. **Security**: Rate limit APIs, escape Blade output, CSRF all forms
8. **Queue**: `#[Connection]`, `#[Tries]`, `#[Timeout]` attributes

## Commands

```bash
php artisan test --parallel --coverage --min=80
./vendor/bin/pint
./vendor/bin/phpstan analyse --level=6
```
