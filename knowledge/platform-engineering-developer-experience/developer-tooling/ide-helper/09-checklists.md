# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** developer-tooling-debugging
**Knowledge Unit:** ide-helper
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `_ide_helper.php` generated and in `.gitignore`
- [ ] Model files have `@property` annotations for DB columns
- [ ] Relationship methods have `@property-read` annotations
- [ ] `.phpstorm.meta.php` generated (if using PhpStorm)
- [ ] Composer script configured for `post-update-cmd`
- [ ] Version pinned for consistent team experience
- [ ] Performance: - `generate`: 1-3 seconds
- [ ] Performance: - `models`: 3-30 seconds (depends on model count, database schema reading)
- [ ] Performance: - `meta`: 1-2 seconds

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Run all three commands after `composer install`/`composer update`
- [ ] Architecture guideline: - Publish `config/ide-helper.php` for customizations: excluded models, included facades, timestamps
- [ ] Architecture guideline: - Choose annotation strategy per team: inline vs separate file for models
- [ ] Architecture guideline: - PhpStorm meta only benefits PhpStorm users; VS Code users rely on `_ide_helper.php`
- [ ] Decision: Should We Install IDE Helper? - ensure correct choice is made
- [ ] Decision: Inline vs Separate Model Annotations? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure IDE Helper for Full Laravel IDE Support

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - `generate`: 1-3 seconds
- [ ] - `models`: 3-30 seconds (depends on model count, database schema reading)
- [ ] - `meta`: 1-2 seconds
- [ ] - IDE indexing of generated files: 1-5 seconds on modern hardware
- [ ] - Schema caching speeds subsequent `models` runs significantly

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Dev dependency only; never install in production
- [ ] - `models` command reads database column types; ensure DB accessible during generation
- [ ] - No sensitive data exposed in generated files (column names only, not values)

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
- [ ] `_ide_helper.php` generated and in `.gitignore`
- [ ] Model files have `@property` annotations for DB columns
- [ ] Relationship methods have `@property-read` annotations
- [ ] `.phpstorm.meta.php` generated (if using PhpStorm)
- [ ] Composer script configured for `post-update-cmd`
- [ ] Version pinned for consistent team experience

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Manual PHPDoc editing -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Skipping meta generation -- apply preferred alternative
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
- Configure IDE Helper for Full Laravel IDE Support
### Decision Trees (from 07)
- Should We Install IDE Helper?
- Inline vs Separate Model Annotations?
### Anti-Patterns (from 08)
- Manual PHPDoc editing
- Skipping meta generation
### Related Rules (from 06 skills)
- IDE-RULE-001: Run all three commands
- IDE-RULE-002: Composer script automation
- IDE-RULE-003: Dev dependency only
- IDE-RULE-004: Gitignore generated files
- IDE-RULE-005: Pin version
### Related Skills (from 06 skills)
- Generate Facade Autocompletion Stubs
- Generate Model PHPDoc Annotations
- Generate PhpStorm Meta File

