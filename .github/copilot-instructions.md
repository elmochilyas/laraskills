# GitHub Copilot Instructions for Laravel 13

## Architecture

- Use modular domain structure: `app/Modules/{Feature}/`
- Use Actions (`execute()` method) for single-purpose operations
- Use readonly DTOs for data transfer
- Use FormRequest for validation and authorization

## Models (Laravel 13)

- Use PHP 8 attributes instead of properties:
  - `#[Table('users', key: 'user_id')]` instead of `protected $table`
  - `#[Fillable(['name', 'email'])]` instead of `protected $fillable`
  - `#[Hidden(['password'])]` instead of `protected $hidden`
  - `#[Casts(['is_admin' => 'boolean'])]` instead of `protected $casts`

## Testing (Pest 4)

- Write tests before implementation (TDD)
- 80% feature tests, 20% unit tests
- Use Laravel fakes (Http, Mail, Queue, Storage, Event, Bus)
- Use `RefreshDatabase` trait for database tests
- Write architecture tests with Pest

```php
test('example', function () {
    $response = $this->get('/');
    $response->assertOk();
});
```

## Security

- Every model needs `#[Fillable]` or `#[Guarded]`
- All user input validated via FormRequest
- Blade `{{ }}` for output (auto-escaped)
- Rate limiting on all API endpoints
- CSRF on all web forms
- Authorization checks on all state-changing actions

## Code Quality

```bash
./vendor/bin/pint               # Format code
./vendor/bin/phpstan analyse --level=6  # Static analysis
php artisan test --parallel      # Run tests
```

## Queue Jobs

```php
#[Connection('redis')]
#[Tries(3)]
#[Timeout(60)]
class ProcessJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
}
```

## Console Commands

```php
use Symfony\Component\Console\Attribute\AsCommand;

#[AsCommand('mail:send {user}')]
class MailSend extends Command {}
```
