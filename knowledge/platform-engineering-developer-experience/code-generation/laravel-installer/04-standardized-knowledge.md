# 04-Standardized Knowledge: Laravel Installer

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | laravel-installer |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-breeze, laravel-jetstream, laravel-starter-kits |
| **Framework/Language** | Laravel, PHP, Composer, CLI |

## Overview

The Laravel Installer is a standalone CLI tool (`laravel new project-name`) that creates new Laravel applications with an interactive guided experience. It selects starter kits (Breeze, Jetstream, or none), frontend stacks (Blade, Livewire, React, Vue), testing frameworks (Pest, PHPUnit), database options, Git initialization, and runs initial setup commands. Distributed as a PHAR or Composer global package, it provides the quickest path from terminal to new Laravel project.

## Core Concepts

- **Interactive Project Creation**: guided wizard for project configuration with sensible defaults
- **Starter Kit Integration**: automatically installs and configures Breeze or Jetstream
- **Stack Selection**: frontend stack choice (Blade, Livewire, React with Inertia, Vue with Inertia)
- **Testing Framework**: Pest (modern) or PHPUnit (traditional)
- **Database Configuration**: MySQL, PostgreSQL, SQLite, SQL Server with `.env` setup
- **Git Initialization**: optional repo init with initial commit
- **Custom Templates**: `--using=org/repo` for organization-specific project skeletons

## When to Use

- Creating new Laravel projects (every new project starts here)
- CI/Docker environment automation (use `--no-interaction` with flags)
- Team onboarding — standardized project creation with starter kits
- Rapid prototyping — quick project setup without manual configuration

## When NOT to Use

- Adding features to an existing Laravel project
- Creating micro-services within a monorepo (use `composer create-project` directly)
- Offline/disconnected environments without network access
- When you need precise control over Composer version constraints

## Best Practices (WHY)

- **Keep the installer updated**: `composer global update laravel/installer` for latest features and Laravel versions
- **Use `--no-interaction` in CI**: automation must never hang on prompts; pass all flags explicitly
- **Check PHP version**: ensure system PHP meets Laravel version requirements (8.2+ for Laravel 11+)
- **Use custom templates for teams**: `--using=org/laravel-template` standardizes project structure across the organization
- **Prefer SQLite for development**: simplest setup; switch to MySQL/PostgreSQL for production

## Architecture Guidelines

- Install globally via Composer: `composer global require laravel/installer`
- For API-only projects, use `--no-starterkit` for minimal installation
- Custom templates on GitHub should follow Laravel skeleton structure
- The installer creates fresh projects only — never run over existing codebases
- For automated workflows, script the full `laravel new project --no-interaction` command

## Performance Considerations

- Installation: 30-120 seconds total (Composer download is bottleneck)
- Composer cache reduces `create-project` from 30-60s to 5-15s
- NPM install for starter kits adds 20-60 seconds
- Full Breeze/React installation: ~50-80MB; minimal: ~10MB

## Security Considerations

- The installer requires network access for Composer and NPM — ensure secure connections
- Custom templates (`--using`) should be audited for security before use
- Verify PHP extension requirements are met before installation
- The installer doesn't handle secrets — configure .env separately

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Not using --no-interaction in CI | Hanging on prompts | Forgetting automation context | Broken CI pipeline | Always use --no-interaction with flags |
| Missing global Composer install | Command not found | Not installing globally | "laravel: command not found" | Install via composer global require |
| Wrong PHP version | Laravel 11 requires PHP 8.2+ | Not checking | Installation fails | Check php -v before installing |
| Overwriting existing directory | Running in existing project | Not checking | Data loss | Always use fresh directory |
| Not verifying installer version | Using outdated installer | Not updating | Missing features | Keep updated with composer global update |

## Anti-Patterns

- **Installer on Existing Projects**: the installer creates new projects — never use it on existing code
- **No Flags in Scripts**: running `laravel new` in scripts without `--no-interaction` hangs indefinitely
- **Skipping Post-Creation Steps**: not running `php artisan migrate` or `npm install && npm run build`
- **Ignoring PHP Extensions**: not verifying required extensions before installation
- **Outdated Installer**: using an old installer that doesn't support the latest Laravel version

## Examples

```bash
# Install globally
composer global require laravel/installer

# Quick start (no starter kit, Pest, SQLite)
laravel new my-app

# Full stack with Jetstream + Livewire + Pest + Git
laravel new my-app --jet --stack=livewire --pest --git

# API-only (no starter kit, no frontend)
laravel new api-app --no-interaction --no-starterkit

# Custom organization template
laravel new my-app --using=my-org/laravel-skeleton

# CI/Docker automated install
laravel new my-app --no-interaction --no-starterkit --pest --git
cd my-app && php artisan migrate
```

## Related Topics

- laravel-breeze — minimal auth scaffolding
- laravel-jetstream — teams, API tokens, 2FA
- laravel-starter-kits — comparison and selection
- custom-artisan-make-commands — extending Laravel's make commands

## AI Agent Notes

- The installer internally uses `composer create-project laravel/laravel` under the hood
- `--using` supports both GitHub repos (`org/repo`) and local paths
- The installer checks PHP extensions (BCMath, Ctype, JSON, Mbstring, OpenSSL, PDO, Tokenizer, XML) before proceeding
- When generating commands for users, include `--no-interaction` flags for automated contexts

## Verification

- [ ] `laravel new` creates a working Laravel project
- [ ] Selected starter kit installed correctly
- [ ] `.env` configured with selected database driver
- [ ] App key generated
- [ ] Initial migrations run without errors
- [ ] NPM dependencies installed (if starter kit selected)
- [ ] Git initialized (if `--git` used)
- [ ] PHP version meets requirements
- [ ] All required PHP extensions installed
- [ ] Laravel version matches expected release
