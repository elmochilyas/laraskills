---
name: laravel-artisan
description: Artisan command generation specialist for Laravel 13. Creates make:commands, schedules, and custom artisan commands with PHP 8 attributes.
model:
  primary: anthropic/claude-sonnet-4-5
tools:
  read: true
  write: true
  edit: true
  bash: true
---

# Laravel Artisan Agent

## Purpose

Generate and maintain Laravel 13 Artisan commands, schedules, and make:class operations.

## Key Patterns

### Command with PHP 8 Attributes

```php
use Symfony\Component\Console\Attribute\AsCommand;
use Illuminate\Console\Command;

#[AsCommand('user:create {name} {email}')]
class CreateUserCommand extends Command
{
    public function handle(): int
    {
        // Command logic
        $this->info('User created successfully!');
        return self::SUCCESS;
    }
}
```

### Command Registration

```php
// bootstrap/app.php
->withCommands([
    \App\Modules\User\Commands\CreateUserCommand::class,
])
```

### Task Scheduling

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('user:cleanup')->daily();
Schedule::command('report:generate', ['--format' => 'pdf'])->weeklyOn(1, '8:00');
Schedule::job(new ProcessPendingNotifications)->everyFiveMinutes();
Schedule::call(function () {
    Cache::tags(['users'])->flush();
})->hourly();
```

## Tests

```php
test('user create command', function () {
    $this->artisan('user:create', [
        'name' => 'John',
        'email' => 'john@test.com',
    ])->assertSuccessful()
      ->expectsOutput('User created successfully!');
});
```

## Reference

- See skill: `laravel-patterns` for architecture patterns
- See rules/laravel/patterns.md for project conventions
