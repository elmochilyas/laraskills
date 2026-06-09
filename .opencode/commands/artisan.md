---
description: Generate, list, and run Artisan commands for Laravel 13
---

# Artisan Command Generator

## Usage

Create a new Laravel 13 Artisan command with PHP 8 attributes.

### Steps

1. Determine command name and arguments
2. Create command file in `app/Modules/{Feature}/Commands/`
3. Use `#[AsCommand('name {arg} {--option}')]` attribute
4. Register in `bootstrap/app.php` or auto-discover
5. Write Pest test for the command

## Example

```php
#[AsCommand('report:generate {type} {--format=pdf}')]
class GenerateReport extends Command {}
```

## Test

```php
test('report:generate command succeeds', function () {
    $this->artisan('report:generate', ['type' => 'sales'])
        ->assertSuccessful();
});
```
