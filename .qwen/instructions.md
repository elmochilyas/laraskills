# Qwen CLI — Laravel 13 Instructions

For full agent operating instructions and knowledge layer navigation, see:
- [`AGENTS.md`](../AGENTS.md)
- [`agent/retrieval-guide.md`](../agent/retrieval-guide.md)
- [`agent/domain-routing-index.md`](../agent/domain-routing-index.md)

## Quick Reference

- **Framework**: Laravel 13, PHP 8.3+, Pest 4
- **Models**: `#[Table]`, `#[Fillable]`, `#[Hidden]`, `#[Casts]` attributes
- **Structure**: `app/Modules/{Feature}/` (domain, not type)
- **Actions**: Single-purpose classes, `execute()` method
- **DTOs**: Readonly classes for data transfer
- **DI**: Constructor injection, depend on contracts, avoid facades in business logic
- **Auth**: Gates, Policies, FormRequest `authorize()`
- **Testing**: `php artisan test --parallel`
- **Quality**: `./vendor/bin/pint && ./vendor/bin/phpstan analyse --level=6`
- **Security**: `#[Fillable]` on all models, Blade `{{ }}` escaping, CSRF on all forms
