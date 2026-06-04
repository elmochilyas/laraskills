# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development & Shared Libraries
**Knowledge Unit:** PackageSkeletonStructure
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Configure script run and all placeholders replaced
- [ ] PSR-4 autoloading in composer.json matches `src/` directory structure
- [ ] `extra.laravel.providers` and `extra.laravel.aliases` configured
- [ ] `.gitattributes` includes `export-ignore` for non-essential files
- [ ] `tests/TestCase.php` extends `Orchestra\Testbench\TestCase` with `getPackageProviders()`
- [ ] Service provider exists in `src/` with package registration logic
- [ ] Config file exists at `config/package-name.php` with documented defaults
- [ ] CI workflow passes on initial push
- [ ] PHPStan and Pint configuration present and passing

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Flat Source Structure:** Place all package classes directly in `src/` or use subdirectories f...
- [ ] Architecture guideline: - **Service Provider in src/:** Place the service provider directly in `src/` (e.g., `src/Package...
- [ ] Architecture guideline: - **Minimal Facades:** Only create facades for classes that are commonly injected or resolved; fa...
- [ ] Architecture guideline: - **Config-First Design:** Place default config in `config/package-name.php` with documented opti...
- [ ] Architecture guideline: - **Testbench Setup:** `tests/TestCase.php` extends `Orchestra\Testbench\TestCase`; `getPackagePr...
- [ ] Architecture guideline: - **Composer Configuration:** Include `require` (laravel/framework, php), `require-dev` (orchestr...
- [ ] Decision: Public Skeleton vs Organizational Fork? - ensure correct choice is made
- [ ] Decision: Single Package vs Monorepo Structure? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Scaffold a Laravel Package from the Standard Skeleton
- [ ] Skill applied: Maintain a Living Package Skeleton Standard

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
- [ ] Configure script run and all placeholders replaced
- [ ] PSR-4 autoloading in composer.json matches `src/` directory structure
- [ ] `extra.laravel.providers` and `extra.laravel.aliases` configured
- [ ] `.gitattributes` includes `export-ignore` for non-essential files
- [ ] `tests/TestCase.php` extends `Orchestra\Testbench\TestCase` with `getPackageProviders()`
- [ ] Service provider exists in `src/` with package registration logic
- [ ] Config file exists at `config/package-name.php` with documented defaults

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Ignoring the skeleton entirely -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Deep nesting in src/ -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Monorepo forced into single skeleton -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Over-customizing the skeleton -- apply preferred alternative
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
- Scaffold a Laravel Package from the Standard Skeleton
- Maintain a Living Package Skeleton Standard
### Decision Trees (from 07)
- Public Skeleton vs Organizational Fork?
- Single Package vs Monorepo Structure?
### Anti-Patterns (from 08)
- Ignoring the skeleton entirely
- Deep nesting in src/
- Monorepo forced into single skeleton
- Over-customizing the skeleton
### Related Skills (from 06 skills)
- Set Up a Package Service Provider with Spatie Tools
- Test Laravel Packages with Orchestra Testbench
- Publish a Laravel Package to Packagist

