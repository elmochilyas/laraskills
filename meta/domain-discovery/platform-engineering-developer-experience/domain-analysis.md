# Domain Analysis: Platform Engineering & Developer Experience for Laravel

## Domain Overview

Platform Engineering & Developer Experience (DevEx) for Laravel encompasses the tools, workflows, practices, and internal platforms that enable Laravel development teams to ship software efficiently, consistently, and with high quality. This domain sits at the intersection of DevOps, software architecture, and developer productivity tooling. It includes everything from local development environments (Laravel Sail, Devboxes) to code quality tooling (Pint, PHPStan, Rector), package development frameworks (Spatie package tools, service providers), monorepo strategies, CI/CD automation, and onboarding workflows.

The goal of platform engineering in the Laravel context is to reduce cognitive load on developers by providing standardized, self-service workflows and toolchains that abstract away infrastructure complexity, enforce coding standards, automate repetitive tasks, and shorten feedback loops.

## Domain Scope

**In Scope:**
- Internal Developer Platforms (IDP) built on/for Laravel
- Laravel package development patterns and standards (Spatie guidelines, package skeletons, service providers)
- Shared libraries and internal package management
- Monorepo strategies for Laravel applications
- Developer debugging and introspection tooling (Telescope, Debugbar, Pulse)
- IDE productivity tooling (IDE Helpers, autocompletion)
- Code quality automation (Pint, PHPStan, Laravel Rector, PHP-CS-Fixer)
- Code generation and scaffolding (Blueprint, Laravel Shift, custom generators)
- Development containers and environment standardization (Laravel Sail, Devboxes)
- Git workflows, PR templates, code review standards for Laravel teams
- Onboarding automation for Laravel developers
- CLI tooling and custom Artisan commands
- Workflow automation (GitHub Actions, CI/CD pipelines for Laravel)

**Out of Scope (adjacent but separate):**
- Production infrastructure deployment (covered in Infrastructure & DevOps domain)
- Application monitoring in production (Nightwatch, server monitoring)
- Frontend build tooling (Vite, Laravel Mix)
- Database architecture and migration strategies
- Specific application business logic patterns

## Major Subdomains

### 1. Internal Developer Platforms (IDP)
Self-service platforms that abstract infrastructure and provide standardized environments, deployment pipelines, and development workflows for Laravel teams. Includes Backstage-like developer portals, Forge-based internal platforms, and custom IDP solutions.

### 2. Package Development & Shared Libraries
Standards, patterns, and tooling for creating, versioning, and distributing Laravel packages. Includes Spatie's package tools, package skeletons, service provider patterns, and internal package registries (Satis, Private Packagist).

### 3. Monorepo Management
Strategies for managing multiple Laravel applications or packages within a single repository. Includes tooling for split testing, dependency management, and CI optimization in monorepo contexts.

### 4. Developer Tooling & Debugging
Local development debugging and introspection tools including Laravel Telescope (request inspection), Laravel Debugbar (profiling), Laravel Pulse (performance monitoring), and IDE integration tools.

### 5. Code Quality & Static Analysis
Automated code quality enforcement including Laravel Pint (code style), PHPStan (static analysis with laravel-phpstan rules), Rector (automated refactoring), and PHP-CS-Fixer configuration.

### 6. Code Generation & Scaffolding
Tools that generate Laravel code from declarative specifications, including Laravel Shift (automated upgrades), Blueprint (code generation from YAML), custom Artisan generators, and stub customization.

### 7. Development Environments
Standardized local development environments including Laravel Sail (Docker-based), Devcontainer configurations, Homestead (Vagrant), and custom Docker setups. Includes environment configuration management.

### 8. Workflow Automation & CI/CD
Automated testing, linting, static analysis, deployment pipelines, and quality gates. Includes GitHub Actions workflows, Git hooks, PR templates, and code review automation.

### 9. Onboarding & Team Standards
Automated developer onboarding, contribution guidelines, coding standards documentation, PR templates, and code review checklists specific to Laravel.

### 10. CLI Tooling & Artisan Extensions
Custom Artisan commands, console application patterns, workflow automation scripts, and developer productivity CLI tools.

## Complete Knowledge Inventory

### Subdomain 1: Internal Developer Platforms (IDP)

| Knowledge Item | Maturity | Sources |
|---|---|---|
| IDP architecture patterns for Laravel teams | Emerging | Platform Engineering community, Backstage docs |
| Forge-based internal platform patterns | Mature | Laravel Forge documentation, community case studies |
| Self-service environment provisioning | Maturing | Laravel Sail, Docker Compose patterns |
| Developer portal integration (Backstage) | Emerging | Backstage.io, TechDocs |
| Service catalog patterns for Laravel services | Emerging | Backstage, internal tooling examples |
| Golden path / paved road patterns | Maturing | Platform Engineering community |
| Internal template registries (Laravel project templates) | Maturing | Laravel installer, custom skeletons |

### Subdomain 2: Package Development & Shared Libraries

| Knowledge Item | Maturity | Sources |
|---|---|---|
| Spatie Laravel Package Tools | Mature | spatie/laravel-package-tools (946★, v1.93.1) |
| Package service provider patterns | Mature | Laravel docs, spatie/laravel-package-tools |
| Package auto-discovery | Mature | Laravel docs (composer.json extra.laravel) |
| Package skeleton structure | Mature | spatie/package-skeleton-laravel |
| Private Packagist / Satis setup | Mature | Private Packagist docs, Satis docs |
| Package versioning & semantic versioning | Mature | Composer, SemVer standard |
| Service provider registration (register vs boot) | Mature | Laravel docs |
| Config file merging & publishing | Mature | Laravel docs, spatie package tools |
| Migration publishing & discovery | Mature | Laravel docs, spatie package tools |
| View component registration in packages | Mature | Laravel docs |
| Inertia component integration in packages | Maturing | spatie/laravel-package-tools |
| Install commands for packages | Mature | spatie/laravel-package-tools |
| Package testing with Orchestra Testbench | Mature | orchestra/testbench |
| Package asset publishing | Mature | Laravel docs |
| Translation file loading in packages | Mature | Laravel docs |
| Blade component namespacing | Mature | Laravel docs |

### Subdomain 3: Monorepo Management

| Knowledge Item | Maturity | Sources |
|---|---|---|
| Laravel monorepo tools (monorepo-split) | Maturing | symplify/monorepo-split, community tools |
| Monorepo CI optimization | Maturing | GitHub Actions monorepo strategies |
| Shared library extraction patterns | Maturing | Community articles, team practices |
| Composer path repository usage | Mature | Composer docs |
| Split testing for monorepo packages | Maturing | symplify/monorepo-split |
| Dependency management across monorepo | Maturing | Composer, custom tooling |

### Subdomain 4: Developer Tooling & Debugging

| Knowledge Item | Maturity | Sources |
|---|---|---|
| Laravel Telescope | Mature | laravel/telescope (official, extensive watchers) |
| Laravel Debugbar | Mature | fruitcake/laravel-debugbar (19.2k★, v4.2.8) |
| Laravel Pulse | Mature | laravel/pulse (1.7k★, v1.7.3, real-time APM) |
| IDE Helper | Mature | barryvdh/laravel-ide-helper (14.9k★, v3.7.0) |
| Telescope watchers (18 watchers) | Mature | Laravel docs |
| Debugbar collectors & profiling | Mature | fruitcake/laravel-debugbar docs |
| Pulse cards & custom card development | Maturing | Laravel Pulse docs |
| PhpStorm meta file generation | Mature | laravel-ide-helper meta command |
| Model PHPDoc generation | Mature | laravel-ide-helper models command |
| Facade autocompletion generation | Mature | laravel-ide-helper generate command |
| Xdebug integration with Sail | Mature | Laravel Sail docs |
| Laravel Nightwatch (production APM) | Mature | Laravel Nightwatch (official) |
| Log viewer & debugging patterns | Mature | Laravel logging, community packages |
| Mailpit for email previews | Mature | Laravel Sail, Mailpit |

### Subdomain 5: Code Quality & Static Analysis

| Knowledge Item | Maturity | Sources |
|---|---|---|
| Laravel Pint | Mature | laravel/pint (3.1k★, v1.29.1, official) |
| Laravel PHPStan | Mature | larastan/larastan (community standard) |
| Laravel Rector | Maturing | rectorphp/rector, laravel rules |
| Pint presets (laravel, psr12, per, symfony) | Mature | Pint documentation |
| Pint CI integration | Mature | Pint docs (GitHub Actions) |
| PHPStan config for Laravel | Mature | Larastan documentation |
| PHPStan baseline patterns | Mature | PHPStan docs |
| Custom Pint rules | Mature | PHP-CS-Fixer configurator |
| Rector rules for Laravel upgrades | Maturing | Rector documentation |
| Static analysis integration in CI | Mature | GitHub Actions, GitLab CI |
| Pre-commit hooks for code quality | Mature | CaptainHook, husky, custom scripts |
| phpstan.neon configuration patterns | Mature | Larastan, community examples |
| Pint configuration (pint.json) | Mature | Pint documentation |

### Subdomain 6: Code Generation & Scaffolding

| Knowledge Item | Maturity | Sources |
|---|---|---|
| Laravel Shift (automated upgrades) | Mature | laravelshift.com (commercial) |
| Blueprint (code generation) | Mature | laravel-shift/blueprint (open source) |
| Laravel Breeze (starter kit) | Mature | Laravel official (Blade, Livewire, React, Vue) |
| Laravel Jetstream (starter kit) | Mature | Laravel official |
| Laravel Installer | Mature | Laravel official |
| Stub customization in Laravel | Mature | Laravel docs (stub:publish) |
| Custom Artisan make commands | Mature | Laravel docs |
| Blueprint YAML DSL | Mature | Blueprint documentation |
| Laravel Starter Kits | Mature | Laravel docs (Breeze, Jetstream) |

### Subdomain 7: Development Environments

| Knowledge Item | Maturity | Sources |
|---|---|---|
| Laravel Sail | Mature | laravel/sail (1.9k★, v1.61.0, official) |
| Docker Compose for Laravel | Mature | Sail, community Docker setups |
| Devcontainer configuration | Maturing | VS Code Devcontainers, Sail --devcontainer |
| PHP version management (8.0-8.4) | Mature | Sail runtimes |
| Database services (MySQL, PostgreSQL, MongoDB) | Mature | Sail services |
| Cache/queue services (Redis, Valkey) | Mature | Sail services |
| Search services (Meilisearch, Typesense) | Mature | Sail services |
| Mail services (Mailpit) | Mature | Sail services |
| S3-compatible storage (MinIO) | Mature | Sail services |
| Xdebug configuration in Docker | Mature | Sail documentation |
| Sail customization (dockerfiles) | Mature | Sail publish command |
| Environment file management | Mature | Laravel .env patterns |
| WSL2 configuration for Laravel | Mature | Laravel docs, community |

### Subdomain 8: Workflow Automation & CI/CD

| Knowledge Item | Maturity | Sources |
|---|---|---|
| GitHub Actions for Laravel | Mature | Community workflows, Laravel docs |
| Pint in CI (automated code style fixing) | Mature | Pint documentation |
| PHPStan in CI | Mature | Larastan, GitHub Actions |
| Automated testing in CI | Mature | PHPUnit, Pest, GitHub Actions |
| Dusk browser tests in CI | Mature | Laravel Sail, Selenium |
| Automated deployment pipelines | Mature | Forge, Vapor, Envoyer |
| Git hooks for Laravel (CaptainHook) | Mature | CaptainHook documentation |
| PR template patterns | Mature | GitHub docs, community examples |
| Code review standards | Maturing | Community practices |
| Automated changelog generation | Mature | Keep a Changelog, automated tools |
| Dependency update automation | Mature | Dependabot, Renovate |
| Security scanning | Mature | Dependabot, Laravel security advisories |

### Subdomain 9: Onboarding & Team Standards

| Knowledge Item | Maturity | Sources |
|---|---|---|
| Developer onboarding checklists | Maturing | Community practices |
| CONTRIBUTING.md patterns | Mature | GitHub, Laravel docs |
| Coding standards documentation | Mature | Laravel coding style, PSR standards |
| Architecture decision records (ADRs) | Maturing | Community practices |
| Local environment setup documentation | Mature | README patterns |
| Development workflow documentation | Mature | Team wikis, Notion, etc. |
| Automated environment setup scripts | Maturing | Sail, custom scripts |
| Team collaboration patterns | Mature | Git workflow docs |

### Subdomain 10: CLI Tooling & Artisan Extensions

| Knowledge Item | Maturity | Sources |
|---|---|---|
| Custom Artisan command patterns | Mature | Laravel docs |
| Artisan command signatures & arguments | Mature | Laravel docs |
| Console output formatting | Mature | Laravel docs (table, progress bar, etc.) |
| Command scheduling | Mature | Laravel docs (Schedule) |
| Interactive commands (ask, confirm, etc.) | Mature | Laravel docs |
| Custom generator commands | Mature | Laravel docs, community |
| CLI workflow automation | Mature | Artisan commands, shell scripts |
| Laravel Tinker (REPL) | Mature | Laravel official |
| Ploi CLI, Forge CLI | Mature | Third-party CLI tools |

## Knowledge Classification

### By Maturity Level

**Mature (well-established, documented, widely adopted):**
- Laravel Sail (development environments)
- Laravel Pint (code style)
- Laravel Telescope (debugging)
- Laravel Debugbar (profiling)
- IDE Helper (autocompletion)
- Package service provider patterns
- Spatie Laravel Package Tools
- GitHub Actions CI/CD for Laravel
- Laravel Breeze/Jetstream (starter kits)
- Laravel Pulse (performance monitoring)
- Custom Artisan command patterns

**Maturing (established but evolving):**
- Laravel PHPStan rulesets and baseline management
- Laravel Rector rules
- Blueprint code generation
- Devcontainer standards for Laravel
- Monorepo tooling for Laravel
- Internal developer platform architectures
- Automated onboarding workflows

**Emerging (new or rapidly evolving):**
- Backstage integration for Laravel teams
- AI-assisted code generation for Laravel
- Platform engineering golden paths for Laravel
- Internal developer portal patterns
- Automated refactoring pipelines

## Dependency Map

```
Internal Developer Platforms
  +-- Development Environments (Sail, Devboxes)
  |     +-- Docker Compose
  |     +-- PHP Runtimes
  |     +-- Service Containers (MySQL, Redis, etc.)
  +-- CI/CD Pipelines (GitHub Actions)
  |     +-- Testing (PHPUnit, Pest, Dusk)
  |     +-- Static Analysis (PHPStan)
  |     +-- Code Style (Pint)
  |     +-- Deployment (Forge, Vapor)
  +-- Package Registry (Private Packagist/Satis)
  +-- Project Templates & Scaffolding
  +-- Code Review Automation
  +-- Onboarding Scripts

Package Development
  +-- Service Provider Patterns
  +-- Package Skeleton (Spatie)
  +-- Orchestra Testbench
  +-- Package Auto-discovery
  +-- Config/Migration/View Publishing
  +-- Package Distribution (Packagist/Private)

Developer Tooling
  +-- Debugging (Telescope, Debugbar)
  +-- Profiling (Pulse, Debugbar)
  +-- IDE Integration (IDE Helper, PhpStorm Meta)
  +-- Logging & Monitoring

Code Quality Toolchain
  +-- Pint (code style) -> PHP-CS-Fixer
  +-- PHPStan (static analysis) -> Larastan
  +-- Rector (automated refactoring)
  +-- Pre-commit Hooks

Code Generation
  +-- Blueprint (YAML -> code)
  +-- Laravel Shift (upgrades)
  +-- Stub Customization
  +-- Custom Artisan Generators

Monorepo
  +-- Split Testing
  +-- Composer Path Repositories
  +-- Shared Library Management
```

## Missing Knowledge Risk Analysis

| Gap | Risk Level | Impact | Mitigation |
|---|---|---|---|
| No standardized Laravel IDP reference architecture | High | Teams build IDPs from scratch inconsistently | Define golden path patterns, reference Backstage Plug-in for Laravel |
| No official Laravel monorepo tooling | Medium | Teams adopt ad-hoc approaches, inconsistent DX | Evaluate symplify/monorepo-split, document patterns |
| Laravel Rector rules not comprehensive | Medium | Manual upgrade effort still significant | Contribute to Rector Laravel rulesets, document workarounds |
| AI-assisted code generation quality for Laravel | Emerging | Reliability concerns, context window limits | Document prompt patterns, combine with Shift for upgrades |
| Devcontainer standards not universal | Low | Inconsistent local environments | Promote Sail's --devcontainer flag, document best practices |
| No formal onboarding automation framework | Medium | Inconsistent team member ramp-up | Build onboarding scripts combining Sail + project setup automation |
| Backstage-Laravel integration immature | Medium | Teams building custom portals instead of leveraging ecosystem | Build and document Backstage plugin for Laravel service catalog |
| Inconsistent PR template adoption | Low | Variable PR quality | Provide standardized PR templates with checklists |
| Limited package development governance | Medium | Inconsistent internal package quality | Define package creation standards based on Spatie patterns |

## Research Findings

### Key Insight 1: Laravel's Tooling Ecosystem is Exceptionally Mature

The Laravel ecosystem provides first-party or well-established third-party solutions for nearly every aspect of developer experience. Laravel offers official packages for debugging (Telescope), monitoring (Pulse), code style (Pint), local development (Sail), and application scaffolding (Breeze, Jetstream). This is unusual in the PHP ecosystem and positions Laravel teams to build effective internal platforms with minimal custom development.

### Key Insight 2: Package Development is Well-Standardized

Spatie's Laravel Package Tools (946★, 469 commits) has become the de facto standard for creating Laravel packages. Its `PackageServiceProvider` abstraction handles configuration merging, migration registration, view loading, blade component registration, asset publishing, and install commands. The accompanying skeleton repository provides a canonical directory structure. This standardization means internal package creation can follow predictable patterns, reducing cognitive overhead.

### Key Insight 3: The IDP Space for Laravel is Underserved

While individual tooling is mature, there is no established reference architecture for a comprehensive Internal Developer Platform specifically for Laravel teams. Most organizations piece together Sail + Forge + GitHub Actions + custom packages. The emerging Backstage ecosystem offers potential but has minimal Laravel-specific content. This represents both a gap and an opportunity.

### Key Insight 4: Automated Upgrades (Shift) Are a Critical Pain Point

Laravel Shift has emerged as an essential tool, with over 1 million shifts run. The gap between "works with AI" and "fully upgraded Laravel application" is significant. Shift provides a commercial solution but the underlying patterns (codemods, automated refactoring) could be replicated with Rector rules for teams wanting in-house automation.

### Key Insight 5: Code Generation is Evolving Beyond Scaffolding

Blueprint has pioneered a declarative YAML-based approach to generating complete Laravel components (models, controllers, factories, migrations, form requests, events, jobs, mailables, tests). Combined with AI-assisted development, this pattern is likely to become more central to Laravel development workflows.

### Key Insight 6: Docker-Based Development Environments Are Now Standard

Laravel Sail (1.9k★, v1.61.0) has made Docker-based local development standard. With support for PHP 8.0-8.4, MySQL, PostgreSQL, MongoDB, Redis, Valkey, Meilisearch, Typesense, Mailpit, MinIO, and Selenium, it provides a comprehensive development environment. The `--devcontainer` flag for VS Code Devcontainers further standardizes the development experience.

### Key Insight 7: Code Quality Toolchain is Integrated but Configurable

Laravel provides an integrated code quality toolchain: Pint (style) + PHPStan (static analysis) + Rector (refactoring). These tools are designed to work together and can be configured through a single `pint.json`, `phpstan.neon`, and `rector.php` respectively. CI integration is well-documented, particularly for GitHub Actions.

## Future Expansion Opportunities

1. **AI-Assisted Development Platform**: Build an internal AI platform for Laravel that includes context-aware code generation, automated refactoring suggestions, and upgrade assistance combining Rector rules with LLM capabilities.

2. **Backstage Plugin for Laravel**: Develop a comprehensive Backstage plugin that provides a service catalog for Laravel applications, documentation integration, tech health scoring, and self-service actions (create new project, deploy, etc.).

3. **Internal Developer Portal Blueprint**: Create a reference architecture for a Laravel IDP that integrates Sail, Forge/Vapor, GitHub Actions, Private Packagist, and custom tooling into a cohesive platform.

4. **Monorepo Standardization**: Establish best practices and tooling for Laravel monorepos including package splitting, shared library management, and CI optimization specific to Laravel.

5. **Automated Onboarding Workflow**: Build a reusable onboarding automation system that provisions development environments, installs dependencies, runs setup scripts, and verifies configuration automatically.

6. **Laravel Rector Rules Expansion**: Create comprehensive Rector rules for Laravel upgrades between major versions, reducing reliance on commercial Shift services for teams that prefer in-house automation.

7. **Package Governance Framework**: Define a complete governance framework for internal packages including creation standards (based on Spatie patterns), versioning policies, deprecation workflows, and quality gates.

## Sources Consulted

### Tier 1: Official Documentation & Primary Sources
- Laravel Documentation: Package Development (laravel.com/docs/11.x/packages)
- Laravel Documentation: Sail (laravel.com/docs/11.x/sail)
- Laravel Documentation: Pint (laravel.com/docs/11.x/pint)
- Laravel Documentation: Telescope (laravel.com/docs/11.x/telescope)
- Laravel Documentation: Starter Kits (laravel.com/docs/11.x/starter-kits)
- Laravel Pulse Documentation (pulse.laravel.com)
- Spatie Laravel Package Tools README (github.com/spatie/laravel-package-tools)
- Laravel Sail Repository (github.com/laravel/sail)
- Laravel Pint Repository (github.com/laravel/pint)
- Laravel Telescope Repository (github.com/laravel/telescope)
- Laravel Pulse Repository (github.com/laravel/pulse)
- IDE Helper for Laravel (github.com/barryvdh/laravel-ide-helper)
- Laravel Debugbar (github.com/fruitcake/laravel-debugbar)

### Tier 2: Community Standards & Established Tools
- Laravel Shift (laravelshift.com)
- Blueprint Code Generator (blueprint.laravelshift.com)
- Laravel News (laravel-news.com)
- Laracasts (laracasts.com)
- Spatie Package Skeleton Laravel (github.com/spatie/package-skeleton-laravel)
- Orchestra Testbench (github.com/orchestral/testbench)
- Laravel Breeze (github.com/laravel/breeze)
- Laravel Jetstream (jetstream.laravel.com)

### Tier 3: Community Resources, Articles & Guides
- Laravel Blog (blog.laravel.com)
- Laravel Community (laravel.com/community)
- Laravel Bootcamp (bootcamp.laravel.com)
- Platform Engineering Community resources
- Various Laravel package development tutorials and guides
- Laravel News articles on developer tooling and workflows

### Tier 4: Conceptual & Adjacent Sources
- Internal Developer Platform (IDP) architecture patterns
- Backstage.io documentation
- Platform Engineering concepts and literature
- DevOps and CI/CD best practices for PHP/Laravel
- Monorepo strategy documentation (symplify/monorepo-split)
- Docker and Devcontainer standards
- PHP-CS-Fixer documentation (github.com/FriendsOfPHP/PHP-CS-Fixer)
- PHPStan documentation (phpstan.org)
- Rector documentation (getrector.org)
