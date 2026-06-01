---
paths:
  - "**/*.php"
  - "**/composer.json"
  - "**/phpstan.neon"
  - "**/phpstan.neon.dist"
  - "**/pint.json"
  - "**/.php-cs-fixer.php"
---
# Laravel 13 Hooks

> This file extends [common/hooks.md](../common/hooks.md), [php/hooks.md](../php/hooks.md) with Laravel 13 specific content.

## PostToolUse Hooks

Configure in `~/.claude/settings.json` or your AI tool's hook system:

- **Pint**: Auto-format edited `.php` files using `./vendor/bin/pint <file>`.
- **PHPStan**: Run static analysis after PHP edits: `./vendor/bin/phpstan analyse <file>`.
- **Pest**: Run targeted tests: `php artisan test --filter=<name>`.

## Recommended Hook Configuration

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "matcher-patterns": ["**/*.php"],
        "command": "./vendor/bin/pint \"$FILE_PATH\"",
        "description": "Auto-format edited PHP files with Laravel Pint"
      },
      {
        "matcher": "Write|Edit",
        "matcher-patterns": ["**/*.php"],
        "command": "php artisan test --filter=\"$CHANGED\"",
        "description": "Run Pest tests for changed files"
      }
    ]
  }
}
```

## Warnings

- Warn on `dd()`, `dump()`, `var_dump()`, `die()`, `ray()`, `ddd()` left in files.
- Warn when mass assignment is unprotected (missing `#[Fillable]`/`#[Guarded]`).
- Warn when raw SQL or `DB::raw()` is used without explicit justification.
- Warn when CSRF exceptions are added to `VerifyCsrfToken`.
