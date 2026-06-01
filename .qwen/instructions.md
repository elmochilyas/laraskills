# Qwen CLI — Laravel 13 Instructions

## Quick Reference

- **Framework**: Laravel 13, PHP 8.3+, Pest 4
- **Models**: `#[Table]`, `#[Fillable]`, `#[Hidden]`, `#[Casts]` attributes
- **Structure**: `app/Modules/{Feature}/` (domain, not type)
- **Actions**: Single-purpose classes, `execute()` method
- **DTOs**: Readonly classes for data transfer
- **Auth**: Gates, Policies, FormRequest `authorize()`
- **Testing**: `php artisan test --parallel`
- **Quality**: `./vendor/bin/pint && ./vendor/bin/phpstan analyse --level=6`
- **Security**: `#[Fillable]` on all models, Blade `{{ }}` escaping, CSRF on all forms
