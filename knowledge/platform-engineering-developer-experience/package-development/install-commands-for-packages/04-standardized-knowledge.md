# Experience Curation: Install Commands for Packages

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/install-commands-for-packages
- **Maturity:** Mature
- **Related Technologies:** Spatie Package Tools, Artisan Commands, Laravel
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Install commands (`php artisan package-name:install`) provide a single-step setup for Laravel packages, automating the process of publishing configuration files, migrations, and assets, and running initial setup operations. The pattern, popularized by Spatie's Laravel Package Tools, wraps multiple `vendor:publish` calls into a single Artisan command with progress feedback. A well-designed install command reduces the package setup from 3-5 manual steps to one command, significantly improving developer experience. The install command typically: publishes configs (with confirmation prompts for overwrites), publishes migrations (with option to run them immediately), creates necessary storage directories, and prints a "next steps" summary.

## Core Concepts
- **InstallCommand:** `\Spatie\LaravelPackageTools\Commands\InstallCommand` is a pre-built Artisan command class that chains publishing steps with prompts and progress feedback
- **Tagged Publishing:** The install command calls `vendor:publish` internally with specific tags (`--tag=config`, `--tag=migrations`) to publish only package-specific files
- **Interactive Prompts:** `ask()`, `confirm()`, and `choice()` methods for optional setup decisions (run migrations immediately? overwrite existing config? which starter kit?)
- **Post-Install Summary:** After publishing and setup, the command displays available commands, config options, and next steps documentation
- **Install Command as a Setup Wizard:** Like software installation wizards—guides the user through configuration choices, provides progress feedback, and summarizes what was done
- **Idempotent Install:** The install command should be safe to re-run; publishing with `--force` only when explicitly confirmed

## When To Use
- Any package with configuration files, migrations, or assets that need to be published before use
- Packages that require initial setup beyond simple publishing (directory creation, key generation, storage setup)
- Packages where developer experience is a priority; reducing setup steps improves adoption
- Packages with multiple publishable resources (config + migrations + assets) that benefit from a single command
- Open-source packages where reducing friction increases community adoption

## When NOT To Use
- Packages that auto-discover and work immediately without any setup (no config, no migrations, no assets)
- Packages used internally where the few consumers already know the manual setup steps
- Packages where setup is purely configuration-driven (just `.env` changes) with no publishing needed
- Packages where the install command would duplicate other well-known setup patterns

## Best Practices
- **WHY:** Ensure the install command works with `--no-interaction` flag; CI/CD deployments need to run `php artisan package-name:install --no-interaction` without prompts
- **WHY:** Ask before overwriting existing published files; never silently overwrite consumer customizations
- **WHY:** Provide progress feedback using `newLine()`, `info()`, and `warn()`; silent installation makes users think the command is frozen
- **WHY:** Use tagged publishing (``--tag=package-name-config`) in the install command rather than publishing everything; this isolates package files from other packages' files
- **WHY:** Make the install command idempotent; running it multiple times should be safe and not cause errors or data loss
- **WHY:** Display a post-install summary showing available commands, configuration keys, and next steps; this helps users understand what was installed and how to use the package

## Architecture Guidelines
- **Interactive Default Pattern:** Use `confirm()` with sensible defaults so the install command works non-interactively; when `--no-interaction` is set, defaults are used automatically
- **Tagged Publishing Pattern:** Call `vendor:publish` with specific tags rather than publishing everything; `--tag=package-name-config`, `--tag=package-name-migrations`
- **Start-on-GitHub Pattern:** `->askToStarOnGitHub()` prompts the user to star the package repository; community-building convention in Spatie packages
- **Post-Install Documentation Pattern:** After install, display available commands, configuration keys, and documentation links using `info()` blocks
- **Non-Interactive Mode Pattern:** When `--no-interaction` flag is detected (CI mode), skip prompts and use defaults
- **Command Registration:** Use Spatie tools' `->hasInstallCommand(InstallCommand::class)` which registers the command as `package-name:install`
- **Chain Configuration:** Use the fluent API to define install steps: `->publishConfigFile()` → `->publishMigrations()` → `->askToRunMigrations()`

## Performance
- The install command should complete in under 5 seconds for config-only packages and under 30 seconds for packages with migrations
- Each `vendor:publish` call copies files from vendor to application directories; for packages with many assets (10+ files), consider archives or symlinks
- If the install command runs migrations, the duration depends on database performance and migration complexity
- The install command runs once (on setup) and has no runtime performance impact

## Security
- Ensure the install command doesn't expose sensitive information (API keys, credentials) in output or prompts
- Never store credentials or tokens in published config files as defaults; use `env()` with documented required variables
- Install commands that create storage directories should use secure permissions
- For install commands that modify `.env` files or generate keys, ensure proper file permissions and warn users of security implications
- Document security implications of any setup choices presented in the install command

## Common Mistakes

### Non-interactive mode broken
- **Description:** Install command prompts for input without handling `--no-interaction` flag
- **Consequence:** CI/CD pipelines fail because prompts can't be answered; automated deploys are blocked
- **Better Approach:** Test the install command with `--no-interaction` flag; ensure all prompts have sensible defaults that are used when no input is available

### Silently overwriting published files
- **Description:** Running install command overwrites consumer's customized config files without confirmation
- **Consequence:** Consumer loses custom configuration changes; unexpected behavior after re-running install command
- **Better Approach:** Always ask before overwrite; support `--force` flag for automated environments

### Not providing progress feedback
- **Description:** Install command runs silently for 10+ seconds without any output
- **Consequence:** Users think the command is frozen or failed; poor user experience
- **Better Approach:** Use `newLine()`, `info()`, and `warn()` to show progress; indicate when long operations (migrations) are running

### Publishing without tags
- **Description:** The install command publishes everything (all tags) rather than package-specific files
- **Consequence:** Files from other packages may be inadvertently overwritten; publishing is slow and includes unrelated resources
- **Better Approach:** Use `--tag=package-name-config`, `--tag=package-name-migrations` for targeted publishing

### Ignoring existing configuration
- **Description:** Install command overwrites existing `.env` entries or config values that the consumer has already set
- **Consequence:** Consumer's custom configuration is lost; application behavior changes unexpectedly
- **Better Approach:** Check before modifying existing configuration; document manual steps for configuration changes

## Anti-Patterns
- **No install command for complex packages:** Requiring consumers to manually run 3+ `vendor:publish` commands and manually configure files; poor developer experience
- **Destructive install commands:** Commands that run migrations or modify database without confirmation or backup
- **Non-idempotent install:** Running the install command twice produces errors or duplicate resources
- **Install command as configuration dump:** Outputting all configuration options without organization or explanation; overwhelming post-install summary
- **Ignoring CI environments:** Building an install command that only works in interactive terminal sessions

## Examples
- **Spatie/laravel-permission:** Uses `InstallCommand` for config and migration publishing with migration-specific prompt pattern
- **Laravel Passport:** Comprehensive install command with multiple prompts, asset publishing, and key generation
- **Laravel Telescope/Horizon:** Custom install commands with prompts for configuration choices (user model, authentication setup)
- **Spatie/laravel-medialibrary:** Install command for config publishing, migration, and storage directory creation

## Related Topics
- spatie-laravel-package-tools (provides the `InstallCommand` class)
- config-file-merging-publishing (install command publishes config files)
- migration-publishing-discovery (install command publishes and optionally runs migrations)
- custom-artisan-command-patterns (broader context for Artisan command design)
- package-service-provider-patterns (install command is registered in the service provider)

## AI Agent Notes
- The InstallCommand pattern was introduced by Spatie in 2021 and is now considered the gold standard for Laravel package setup
- Always recommend an install command for any package with config files or migrations; it significantly improves developer experience
- The `--no-interaction` handling is the most commonly missed feature; always verify it works
- For internal organizational packages, skip the `askToStarOnGitHub` pattern; it's for open-source community building
- Future trends include Composer script hooks that auto-run install commands post-install

## Verification
- [ ] Install command is registered via `->hasInstallCommand()` in the service provider
- [ ] Command works with `--no-interaction` flag (CI/CD compatible)
- [ ] Publishing uses specific tags, not "publish everything"
- [ ] Existing published files are not overwritten without confirmation or `--force` flag
- [ ] Progress feedback is provided during execution
- [ ] Post-install summary shows available commands, config keys, and next steps
- [ ] Command is idempotent (safe to run multiple times)
- [ ] Migration execution is optional or confirmable
- [ ] No sensitive information is exposed in output
- [ ] Install command is documented in the package README
