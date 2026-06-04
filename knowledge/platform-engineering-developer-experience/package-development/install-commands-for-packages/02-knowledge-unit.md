# Knowledge Unit: Install Commands for Packages

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/install-commands-for-packages
- **Maturity:** Mature
- **Related Technologies:** Spatie Package Tools, Artisan Commands, Laravel

## Executive Summary

Install commands (`php artisan package-name:install`) provide a single-step setup for Laravel packages, automating the process of publishing configuration files, migrations, and assets, and running initial setup operations. The pattern, popularized by Spatie's Laravel Package Tools, wraps multiple `vendor:publish` calls into a single Artisan command with progress feedback. A well-designed install command reduces the package setup from 3-5 manual steps to one command, significantly improving developer experience. The install command typically: publishes configs (with confirmation prompts for overwrites), publishes migrations (with option to run them immediately), creates necessary storage directories, and prints a "next steps" summary.

## Core Concepts

- **InstallCommand:** `\Spatie\LaravelPackageTools\Commands\InstallCommand` is a pre-built Artisan command class that chains publishing steps with prompts and progress feedback
- **Tagged Publishing:** The install command calls `vendor:publish` internally with specific tags (`--tag=config`, `--tag=migrations`) to publish only package-specific files
- **Interactive Prompts:** `ask()`, `confirm()`, and `choice()` methods for optional setup decisions (run migrations immediately? overwrite existing config? which starter kit?)
- **Post-Install Summary:** After publishing and setup, the command displays available commands, config options, and next steps documentation

## Mental Models

- **Install Command as a Setup Wizard:** Like software installation wizards—guides the user through configuration choices, provides progress feedback, and summarizes what was done
- **Install as a Contract:** Running the install command should leave the application in a known, working state; it's a contract between the package and the consumer
- **Idempotent Install:** The install command should be safe to re-run; publishing with `--force` only when explicitly confirmed; skipping already-published files by default

## Internal Mechanics

1. **Command Registration:** The package's service provider calls `->hasInstallCommand(InstallCommand::class)` which registers the command as `package-name:install` (using the package name from `configurePackage()`).
2. **Chain Configuration:** The `InstallCommand` uses a fluent API to define the install steps: `->publishConfigFile()` → `->publishMigrations()` → `->askToRunMigrations()` → `->askToStarOnGitHub()`.
3. **Step Execution:** Each step method either executes immediately (`publishConfigFile`) or registers a callback that runs at command execution time (`askToRunMigrations` registers a prompt + migration command if confirmed).
4. **Progress Feedback:** The command uses Laravel's console output formatting (`newLine()`, `info()`, `warn()`, `confirm()`) to provide feedback during installation.

## Patterns

- **Interactive Default Pattern:** Use `confirm()` with sensible defaults so the install command works non-interactively in CI/CD (when `--no-interaction` flag is set, defaults are used automatically).
- **Tagged Publishing Pattern:** The install command calls `vendor:publish` with specific tags (`--tag=package-name-config`, `--tag=package-name-migrations`) rather than publishing everything.
- **Start-on-GitHub Pattern:** `->askToStarOnGitHub()` prompts the user to star the package repository on GitHub; this is a community-building convention in Spatie packages.
- **Post-Install Documentation Pattern:** After install, display available commands, configuration keys, and a link to documentation using `info()` blocks.
- **Non-Interactive Mode Pattern:** When the command detects `--no-interaction` flag (CI mode), skip prompts and use defaults; don't prompt for migration confirmation in automated deploys.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Install command scope | Single command for all setup vs multiple focused commands | Single comprehensive install command for most packages |
| Migration behavior | Ask before running vs always run vs separate step | Ask before running with option to run separately later |
| Config overwrite | Always overwrite vs ask vs skip | Ask with `--force` flag support; never silently overwrite |
| GitHub star prompt | Include vs exclude | Include for open-source; exclude for internal org packages |
| Post-install output | Minimal vs detailed documentation | Detailed: show available commands, config keys, and next steps |

## Tradeoffs

- **Interactive vs Silent Install:** Interactive prompts are friendly but fail in automated environments without `--no-interaction`. Test the install command with `--no-interaction` to ensure it completes successfully.
- **Comprehensive vs Minimal Install:** A comprehensive install command (publishes config + migrations + assets + runs setup) handles everything but may be overwhelming. A minimal install command (just publishes configs) is simpler but requires additional steps.
- **Prescriptive vs Flexible Install:** Prescriptive install commands enforce the package's recommended setup; flexible install commands let consumers choose what to install. Spatie tools support both: prescriptive by default, customizable via `InstallCommand` configuration.
- **Auto-Run Migrations vs Manual:** Auto-running migrations in the install command is convenient but may conflict with deployment workflows where migrations are run separately. Always provide the option to skip migration execution.

## Performance Considerations

- **Install Time:** The install command should complete in under 5 seconds for config-only packages and under 30 seconds for packages with migrations (migration execution time depends on database speed).
- **Publishing Overhead:** Each `vendor:publish` call copies files from vendor to application directories; for packages with many assets (10+ files), consider using archives or symlinks rather than individual file copies.
- **Migration Execution:** If the install command runs migrations, the duration depends on database performance and migration complexity. For packages with time-consuming migrations, document expected duration.

## Production Considerations

- **CI/CD Compatibility:** Ensure the install command works with `--no-interaction` flag; automated deploys should be able to run `php artisan package-name:install --no-interaction`.
- **Install in Existing Applications:** The install command must handle cases where the package is being added to an existing application with existing data. Don't make assumptions about empty databases.
- **Idempotency in Production:** Running the install command in production should be safe; it shouldn't overwrite customized published files or run migrations that have already been executed.
- **Rollback Support:** If the install command makes irreversible changes (runs migrations), document how to roll back (`php artisan migrate:rollback` targeting the package's migrations).

## Common Mistakes

- **Non-interactive mode broken:** Install command prompts for input without `--no-interaction` handling, causing CI failures; always test with `--no-interaction` flag
- **Silently overwriting published files:** Running install command overwrites consumer's customized config files without confirmation; always ask before overwrite
- **Not providing progress feedback:** Install command runs silently for 10+ seconds; users think it's frozen; use output formatting to show progress
- **Publishing without tags:** The install command publishes everything (all tags) rather than just package-specific files; use `--tag=package-name-config` for targeted publishing
- **Ignoring existing configuration:** Install command overwrites existing `.env` entries or config values that the consumer has already set; check before modifying

## Failure Modes

- **Migration Conflict:** Install command runs a migration that conflicts with an existing table structure. Mitigate: check for table existence before migration; provide clear error messages on conflict.
- **Configuration Missing Post-Install:** Install command publishes config but the command fails before completion (out of memory, timeout). Mitigate: make each step independent; verify post-condition after each step.
- **Dependency Not Installed:** Package requires a Redis queue driver but the consumer hasn't configured Redis. Mitigate: check prerequisites at the start of the install command and fail early with clear messages.
- **Version Mismatch:** Install command published files for a different package version than installed. Mitigate: verify package version before publishing; the issue manifests only on re-install, not first install.

## Ecosystem Usage

- **Spatie Packages:** Most Spatie packages use `InstallCommand` for single-command setup; the pattern is considered the gold standard
- **Laravel Telescope/Horizon:** Use custom install commands with prompts for configuration choices (user model, authentication setup)
- **Laravel Debugbar:** No install command (auto-discovery + auto-publish config); demonstrates alternative to install command pattern
- **Laravel Permission:** Uses install command for config and migration publishing; shows migration-specific prompt pattern
- **Laravel Passport:** Comprehensive install command with multiple prompts, asset publishing, and key generation

## Related Knowledge Units

- spatie-laravel-package-tools
- config-file-merging-publishing
- migration-publishing-discovery
- custom-artisan-command-patterns

## Research Notes

- The InstallCommand pattern was introduced by Spatie in 2021 and has been adopted by hundreds of packages since
- The pattern addresses the common complaint that "Laravel packages need too many setup steps" by condensing everything into one command
- The `askToStarOnGitHub` pattern is unique to the Laravel ecosystem and reflects the community culture of mutual support
- Future trends include `composer` script hooks that auto-run install commands post-install, further reducing manual setup steps
