# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development & Shared Libraries
**Knowledge Unit:** SpatieLaravelPackageTools
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Service provider extends `Spatie\LaravelPackageTools\PackageServiceProvider`
- [ ] `configurePackage()` method implemented with all necessary builder calls
- [ ] `parent::register()` and `parent::boot()` called if overridden
- [ ] Config file at `config/package-name.php` with documented defaults
- [ ] Migrations in `database/migrations/` with unique package-prefixed filenames
- [ ] Install command registered for packages with publishable resources
- [ ] Auto-discovery configured in `composer.json` `extra.laravel`
- [ ] No manual registration calls duplicate builder method functionality
- [ ] Package name stable and unique within the organization

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Single Provider Pattern:** Most packages have one service provider that handles all registrat...
- [ ] Architecture guideline: - **Config File Handling:** `->hasConfigFile('my-package')` registers the config file for merging...
- [ ] Architecture guideline: - **Migration Registration:** `->hasMigration('create_my_table')` registers migration files from ...
- [ ] Architecture guideline: - **Command Registration:** `->hasCommand(MyCommand::class)` calls `$this->commands([MyCommand::c...
- [ ] Architecture guideline: - **View/Blade Component Loading:** `->hasViews()` registers the views directory; `->hasViewCompo...
- [ ] Architecture guideline: - **Install Command Pattern:** `->hasInstallCommand(MyInstallCommand::class)` automatically regis...
- [ ] Architecture guideline: - **Package Naming:** Use your organization prefix as the vendor namespace; package name is used ...
- [ ] Decision: Should We Use Spatie Package Tools? - ensure correct choice is made
- [ ] Decision: Spatie Tools vs Manual for Simple Packages? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up a Package Service Provider with Spatie Tools
- [ ] Skill applied: Implement Advanced Spatie Tools Features

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged

# Reliability Checklist (from 04/05/06)
- [ ] Error handling covers all failure modes
- [ ] Database transactions wrap multi-step operations
- [ ] Stateless design enforced (no mutable per-request state)
- [ ] Logging is configured for debugging without leaking sensitive data

# Testing Checklist (from 04/06)
- [ ] Unit tests cover happy path
- [ ] Unit tests cover error/exception paths
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Test coverage includes edge cases
- [ ] Architecture tests enforce patterns (Pest arch tests)
- [ ] Service provider extends `Spatie\LaravelPackageTools\PackageServiceProvider`
- [ ] `configurePackage()` method implemented with all necessary builder calls
- [ ] `parent::register()` and `parent::boot()` called if overridden
- [ ] Config file at `config/package-name.php` with documented defaults
- [ ] Migrations in `database/migrations/` with unique package-prefixed filenames
- [ ] Install command registered for packages with publishable resources
- [ ] Auto-discovery configured in `composer.json` `extra.laravel`

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Custom provider base class for every package -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Bypassing the DSL for simple registration -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring version compatibility -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Overriding the specification processing -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Error responses do not leak stack traces or internals
- [ ] Logging level is appropriate for production (INFO/WARN/ERROR)
- [ ] Feature flags or toggles are in place for risky changes
- [ ] Migration rollback strategy is defined
- [ ] Rate limiting is applied where appropriate
- [ ] Monitoring/alerting is configured for failure modes
- [ ] Dependencies are up to date with no known vulnerabilities

# Final Approval Checklist
- [ ] All previous checklist sections have been reviewed and satisfied
- [ ] Code review has been completed by at least one peer
- [ ] The implementation matches the approved design/architecture
- [ ] Tests pass in CI environment
- [ ] Documentation is updated (if applicable)
- [ ] No known regressions introduced
- [ ] Change log entry is added (if applicable)

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Skills (from 06)
- Set Up a Package Service Provider with Spatie Tools
- Implement Advanced Spatie Tools Features
### Decision Trees (from 07)
- Should We Use Spatie Package Tools?
- Spatie Tools vs Manual for Simple Packages?
### Anti-Patterns (from 08)
- Custom provider base class for every package
- Bypassing the DSL for simple registration
- Ignoring version compatibility
- Overriding the specification processing
### Related Skills (from 06 skills)
- Scaffold a Laravel Package from the Standard Skeleton
- Implement Service Provider Registration (register vs boot)
- Configure Package Auto-Discovery

