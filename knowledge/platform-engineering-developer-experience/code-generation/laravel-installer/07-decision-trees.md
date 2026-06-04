# 07-Decision Trees: Laravel Installer

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | laravel-installer |
| **Domain** | platform-engineering-developer-experience |

## Decision Inventory

| Decision ID | Title | Description | Key Question |
|-------------|-------|-------------|--------------|
| D01 | Installation Mode | Interactive vs automated project creation | Is this for a developer or an automated CI/Docker process? |
| D02 | Starter Kit Selection | Breeze vs Jetstream vs none | What auth and frontend features does the project need? |
| D03 | Custom Template | Whether to use a custom organization skeleton | Does the organization have standardized project structure? |
| D04 | Setup Automation | Post-creation steps to automate | What setup commands run after the project is created? |

## Architecture-Level Decision Trees

### D01: Installation Mode

```
START: How should we run the Laravel installer?
│
├── Interactive mode (developer workstation)
│   ├── Command: laravel new my-app
│   ├── Guided prompts: starter kit, stack, test framework, DB, Git
│   ├── Best for: individual developers, prototyping
│   └── Slowest but most flexible
│
├── Automated mode (CI, Docker, scripts)
│   ├── Command: laravel new my-app --no-interaction --no-starterkit
│   ├── Must pass all flags explicitly — no prompts
│   ├── Flags to include:
│   │   ├── --no-interaction (required for automation)
│   │   ├── --no-starterkit or --breeze or --jet
│   │   ├── --stack (if starter kit selected)
│   │   ├── --pest or --phpunit
│   │   ├── --git (optional)
│   │   └── --using (optional, for custom templates)
│   └── Best for: CI pipelines, Docker build, dev environment scripts
│
└── Error prevention in automation
    ├── Always check: PHP version meets requirements
    ├── Always check: composer global is up to date
    ├── Never pipe input — use flags
    └── Capture exit code and logs
```

### D02: Starter Kit Selection

```
START: Which starter kit should the project use?
│
├── Breeze (most web applications)
│   ├── Need: basic auth (login, register, password reset, email verify)
│   ├── Don't need: teams, 2FA, API tokens
│   ├── Stack options: Blade, Livewire, React, Vue
│   └── Best for: simple to moderately complex web apps
│
├── Jetstream (enterprise applications)
│   ├── Need: teams/workspaces, 2FA, API tokens, session management
│   ├── Don't need: custom auth from scratch
│   ├── Stack options: Livewire, React, Vue
│   └── Best for: SaaS, multi-tenant, enterprise apps
│
├── No starter kit (API-only, microservices)
│   ├── Need: API backend, no auth UI needed
│   ├── Add: Sanctum for API auth (minimal)
│   └── Best for: API-only apps, microservices, custom auth
│
└── Selection rule
    ├── Simple auth → Breeze
    ├── Teams/2FA/API tokens → Jetstream
    └── API-only/custom auth → No kit
```

### D03: Custom Template

```
START: Should we use a custom organization template?
│
├── Standard Laravel skeleton (no custom template)
│   ├── Use: default laravel/laravel from Packagist
│   ├── After install: add org-specific packages manually
│   ├── Pro: always up to date with latest Laravel
│   └── Best for: small teams, early-stage projects
│
├── Custom GitHub template (recommended for orgs)
│   ├── Flag: --using=org/laravel-template
│   ├── Template includes:
│   │   ├── Pre-configured packages (debugbar, IDE helper, etc.)
│   │   ├── Standardized pint.json, phpstan.neon
│   │   ├── Base service providers and middleware
│   │   ├── Custom stubs for make: commands
│   │   └── Docker/docker-compose setup
│   ├── Pro: standardized project structure across the org
│   ├── Con: needs maintenance as Laravel evolves
│   └── Best for: organizations with 5+ Laravel projects
│
└── Template maintenance
    ├── Update after each major Laravel release
    ├── Version tag templates for reproducibility
    ├── Document template contents in org wiki
    └── PR process for template changes
```

### D04: Setup Automation

```
START: What steps should run after project creation?
│
├── Immediate post-install (always)
│   ├── cd my-app
│   ├── php artisan key:generate (auto if --no-interaction)
│   ├── Install/configure dev dependencies:
    │   │   ├── composer require --dev barryvdh/laravel-ide-helper
    │   │   ├── composer require --dev barryvdh/laravel-debugbar
    │   │   └── composer require --dev larastan/larastan
    └── git init && git add . && git commit -m "Initial commit"
│
├── If starter kit selected
│   ├── npm install
│   ├── npm run build
│   ├── Configure .env database connection
│   └── php artisan migrate
│
├── Development setup script (recommended)
    ├── Create setup.sh or Makefile with:
    │   ├── Install deps, compile assets, migrate, seed
    │   └── Create IDE helper docs, git hooks
    └── Document in README: ./setup.sh or make setup
│
└── CI automation
    ├── Full setup: laravel new → npm install → build → migrate
    ├── Cache composer deps for faster CI
    └── Use --no-interaction for all steps
```
