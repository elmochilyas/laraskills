# Knowledge Unit: Laravel Installer

## Metadata
- **Subdomain:** Code Generation & Scaffolding
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-generation-scaffolding/laravel-installer
- **Maturity:** Mature
- **Related Technologies:** Laravel, PHP, Composer, CLI

## Executive Summary

The Laravel Installer is a standalone CLI tool that creates new Laravel applications via `laravel new project-name`. It provides a guided, interactive experience for project creation: selecting starter kits (Breeze, Jetstream, or none), choosing frontend stacks (Blade, Livewire, React, Vue), picking testing frameworks (Pest, PHPUnit), configuring database options, initializing Git repos, and running initial commands. The installer creates the project using Composer's `create-project` command against the latest Laravel release, then applies selected configurations. It supports `--dev` for development snapshots, `--branch` for specific branches, and `--using` for custom templates. The installer is distributed as a PHAR file installed globally via Composer or downloaded from the Laravel website, providing the quickest path from terminal to new Laravel project.

## Core Concepts

- **Interactive Project Creation:** Guided wizard that asks about project name, starter kit, stack, testing framework, and database; provides sensible defaults for all options
- **Starter Kit Integration:** After creating the base project, the installer can automatically install and configure Breeze or Jetstream based on user selection
- **Stack Selection:** Within starter kits, the installer prompts for the specific frontend stack (Blade, Livewire, React with Inertia, Vue with Inertia)
- **Testing Framework:** Choice between Pest (modern, expressive) and PHPUnit (traditional, xUnit-style) for the project's testing suite
- **Database Configuration:** Sets up `.env` with the selected database driver (MySQL, PostgreSQL, SQLite, SQL Server) and runs initial migrations
- **Git Initialization:** Optionally initializes a Git repository with an initial commit of the scaffolded project
- **Custom Template Support:** `laravel new project --using=org/repo` creates projects from custom GitHub templates or local paths

## Mental Models

- **Installer as Project Factory:** The installer is like a factory method for Laravel projects—parameterize the type of project you want and get a fully configured instance
- **Installer as Freestanding Experience:** Unlike `composer create-project`, the installer provides an opinionated, guided experience with visual prompts and progress indicators
- **Installer as Bootstrap Tool:** The installer handles everything from Composer resolution to database setup, reducing the 30-step new project setup to a single command

## Internal Mechanics

1. **Entry Point:** `laravel new` binary invokes the installer's main command, checking for PHP and Composer availability
2. **Interactive Prompts:** The installer presents a series of questions (`$this->choice()`, `$this->confirm()`, `$this->ask()`) for project configuration
3. **Composer Create-Project:** The installer calls `composer create-project laravel/laravel project-name` to download the latest Laravel skeleton
4. **Starter Kit Application:** After the skeleton is created, the installer runs `composer require laravel/breeze` and `php artisan breeze:install` (or Jetstream equivalent) if selected
5. **Environment Configuration:** The `.env.example` is copied to `.env`, application key is generated, and database settings are configured based on user input
6. **Post-Creation Steps:** Migrations are run, NPM dependencies may be installed, and Git is optionally initialized
7. **Output:** Success message with guidance on next steps (`cd project-name && php artisan serve`)

## Patterns

- **Quick Start Pattern:** Use `laravel new project` with no flags for the default setup (no starter kit, Pest, SQLite)—the fastest path to a working Laravel app
- **Full Stack Pattern:** Use `laravel new project --jet --stack=livewire --pest --git` to create a Jetstream project with Livewire, Pest tests, and Git initialized
- **API-Only Pattern:** Use `laravel new project --no-interaction` with flags for a minimal, API-only Laravel installation (no starter kit, no frontend scaffolding)
- **Custom Template Pattern:** Organizations define `org/laravel-project-template` on GitHub and use `laravel new project --using=org/laravel-project-template` for standardized project starts
- **CI/Docker Pattern:** In CI or Docker environments, use `--no-interaction` with all flags to completely automate project creation without prompts

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Installation method | Composer global vs PHAR download | Composer (`composer global require laravel/installer`) for updates; PHAR for CI/docker |
| Starter kit | None vs Breeze vs Jetstream | None for APIs; Breeze for simple auth; Jetstream for teams/advanced auth |
| Version selection | Latest vs `--dev` vs `--branch` | Latest by default; `--dev` for pre-release testing; `--branch` for specific versions |
| Database driver | MySQL vs PostgreSQL vs SQLite vs SQL Server | SQLite for development; MySQL/PostgreSQL for production |
| Testing framework | Pest vs PHPUnit | Pest for modern, expressive tests; PHPUnit for traditional xUnit style |

## Tradeoffs

- **Installer vs Composer Create-Project:** The installer provides a guided experience with additional setup (starter kits, database, Git). `composer create-project laravel/laravel` is faster and more scriptable but requires manual post-creation setup.
- **Global Tool vs Per-Project Script:** The installer is a global tool (installed once, used for all projects). For organizations with specific project templates, the `--using` flag or custom shell scripts may be more appropriate.
- **Interactive vs Scripted:** Interactive mode is great for new developers and everyday use. For automation (CI, Docker), always use `--no-interaction` with explicit flags.

## Performance Considerations

- **Installation Time:** `laravel new` takes 30-120 seconds depending on: Composer package download speed, starter kit installation, NPM dependency install, and database setup. The Composer create-project step is the bottleneck.
- **Composer Cache:** If the Laravel skeleton is already in Composer's cache, `create-project` runs in 5-15 seconds (vs 30-60 seconds from scratch).
- **NPM Install:** Installing Breeze or Jetstream with NPM dependencies adds 20-60 seconds. For minimal installs, skip frontend scaffolding.
- **Download Size:** A full Breeze/React installation is ~50-80MB (Composer + NPM packages). A minimal installation (no starter kit, no NPM) is ~10MB.

## Production Considerations

- **Installer Version:** Keep the installer updated: `composer global update laravel/installer` ensures access to the latest features and Laravel versions.
- **PHP Version Check:** The installer checks the system PHP version against the Laravel version requirements. Ensure the system meets PHP 8.2+ for Laravel 11+.
- **Extension Requirements:** The installer checks for required PHP extensions (BCMath, Ctype, JSON, Mbstring, OpenSSL, PDO, Tokenizer, XML). Missing extensions cause the creation to fail.
- **Offline/Disconnected Environments:** The installer requires network access for Composer and NPM. For disconnected environments, consider using offline mirrors or pre-built project archives.

## Common Mistakes

- **Not using --no-interaction in CI:** Running `laravel new project` in CI without `--no-interaction` hangs waiting for input; always use `--no-interaction` with explicit flags for automation
- **Installing globally without Composer:** Trying to use `laravel new` without installing via `composer global require`; results in "command not found"
- **Running with incompatible PHP version:** Trying to install Laravel 11 with PHP 8.1 (requires 8.2+); the installer shows an error but it's easy to miss
- **Forgetting --no-interaction with custom templates:** Custom templates (`--using`) may have their own interactive prompts; use `--no-interaction` to skip them
- **Overwriting an existing directory:** `laravel new existing-project` where `existing-project` is already a directory; the installer prompts for confirmation but this can be missed in automation

## Failure Modes

- **Composer Memory Limit:** `composer create-project` fails with memory exhaustion on low-memory servers (especially 512MB or less). Mitigate: set `COMPOSER_MEMORY_LIMIT=-1` or increase PHP memory limit.
- **Network Timeout:** Composer or NPM timeouts during package download from slow or unreliable networks. Mitigate: use `--prefer-dist` (default) and retry with better connectivity.
- **Starter Kit Conflicts:** Installing Jetstream over Breeze (or vice versa) creates conflicting files. Mitigate: use the installer only on fresh Laravel skeletons (it always creates a new project).
- **Database Connection Error:** The installer runs migrations against the selected database, which may not be running. Mitigate: ensure the database service is available before running `laravel new`.

## Ecosystem Usage

- **Laravel Bootcamp:** The Bootcamp instructions assume the use of `laravel new` to create the project before building the Chirper application
- **Laravel Documentation:** All Laravel documentation starts with "Create a new Laravel project using `laravel new`" or `composer create-project`
- **Laracasts:** Laracasts courses consistently use `laravel new` for project creation, often with specific starter kit flags
- **Laravel Forge:** Forge's Quick Deploy feature uses the Laravel installer internally when creating new projects
- **Laravel Vapor:** Vapor documentation guides users through `laravel new` with specific flags for Vapor-compatible project structure

## Related Knowledge Units

- laravel-breeze
- laravel-jetstream
- laravel-starter-kits
- custom-artisan-make-commands

## Research Notes

- The Laravel Installer was rewritten in Laravel 10.x/11.x to use a more modular architecture with separate components for each installation step
- The `--using` flag for custom templates was added in Laravel Installer 5.0, supporting both GitHub repositories and local paths
- The installer originally used `php -r` to download a PHP script that bootstrapped the installation; modern versions use Composer's create-project directly
- The migration from `--dev` (composer dev) to `--branch` for specific Laravel versions reflects Laravel's release cycle changes
