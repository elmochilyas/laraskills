# Laravel 13 Rules for Trae IDE

## File Structure

- Modular organization: `app/Modules/{Feature}/{Type}.php`
- Many small files (200-400 lines), max 800 lines

## Laravel Practices

1. Use PHP 8 attributes: `#[Table]`, `#[Fillable]`, `#[Hidden]`, `#[Casts]`
2. Use Actions (`execute()`) for single-purpose logic
3. Use readonly DTOs for data transfer
4. Use FormRequest for validation
5. Use Policies/Gates for authorization

## Testing

- Pest 4 with `php artisan test`
- Feature tests (80%) + Unit tests (20%)
- `RefreshDatabase` for DB tests
- Laravel fakes (not mocks)

## Quality

- `./vendor/bin/pint` before commit
- `./vendor/bin/phpstan analyse --level=6` before commit
- `php artisan test --parallel --coverage --min=80` in CI
