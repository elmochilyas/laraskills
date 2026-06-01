# Gemini CLI — Laravel 13 Instructions

When working with Laravel 13 projects, follow these guidelines:

## Architecture

- Use modular/domain structure: `app/Modules/{Feature}/`
- Use PHP 8 attributes for model config: `#[Table]`, `#[Fillable]`, `#[Hidden]`
- Use Actions for single-purpose operations, DTOs for data transfer
- Use Laravel 13 attribute-driven queue and command config
- Use constructor injection, depend on contracts, avoid facades in business logic
- Use contextual binding when consumers need different implementations

## Testing

- Pest 4 is the first-class test framework
- 80% feature tests, 20% unit tests
- Use Laravel fakes (Http, Mail, Queue, Notification, Storage, Event, Bus)
- Write architecture tests with Pest

## Security

- Mass assignment protection via `#[Fillable]` or `#[Guarded]`
- Blade `{{ }}` auto-escaping (never `{!! !!}` without sanitization)
- FormRequest for all validation
- Rate limiting on all API endpoints
- CSRF protection on all web forms

## Code Quality

- Run `./vendor/bin/pint` before committing
- Run `./vendor/bin/phpstan analyse --level=6`
- Run `php artisan test --parallel --coverage --min=80`
