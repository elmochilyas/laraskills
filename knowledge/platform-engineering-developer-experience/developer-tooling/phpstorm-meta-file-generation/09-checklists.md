# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** developer-tooling-debugging
**Knowledge Unit:** phpstorm-meta-file-generation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `.phpstorm.meta.php` exists in project root
- [ ] `app()->make('mailer')` resolves to `\Illuminate\Mail\Mailer`
- [ ] Collection operations (`first()`, `filter()`, `map()`) return typed items
- [ ] Query builder methods (`find()`, `first()`, `get()`) return correct model types
- [ ] Factory methods (`User::factory()->create()`) return `User`
- [ ] File is in `.gitignore` and not tracked
- [ ] Performance: - Generation time: 1-3s (small), 5-10s (large projects with many providers)
- [ ] Performance: - File size: 500-3000 lines; PhpStorm parses on project load (100-500ms)
- [ ] Performance: - IDE indexing: larger files increase indexing but <1s typically

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - File location: project root (auto-detected by PhpStorm)
- [ ] Architecture guideline: - Gitignore and regenerate on `composer install`/`composer update`
- [ ] Architecture guideline: - Only benefits PhpStorm users; VS Code relies on `_ide_helper.php` for type info
- [ ] Architecture guideline: - Part of standard `ide-helper` workflow: `generate` + `models` + `meta`
- [ ] Decision: Should We Generate .phpstorm.meta.php? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Generate PhpStorm Meta File

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Generation time: 1-3s (small), 5-10s (large projects with many providers)
- [ ] - File size: 500-3000 lines; PhpStorm parses on project load (100-500ms)
- [ ] - IDE indexing: larger files increase indexing but <1s typically

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Dev-only file with no runtime impact (never loaded by PHP)
- [ ] - Gitignore to avoid merge conflicts from different provider sets

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
- [ ] `.phpstorm.meta.php` exists in project root
- [ ] `app()->make('mailer')` resolves to `\Illuminate\Mail\Mailer`
- [ ] Collection operations (`first()`, `filter()`, `map()`) return typed items
- [ ] Query builder methods (`find()`, `first()`, `get()`) return correct model types
- [ ] Factory methods (`User::factory()->create()`) return `User`
- [ ] File is in `.gitignore` and not tracked

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Skipping meta generation -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Manual meta editing -- apply preferred alternative
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
- Generate PhpStorm Meta File
### Decision Trees (from 07)
- Should We Generate .phpstorm.meta.php?
### Anti-Patterns (from 08)
- Skipping meta generation
- Manual meta editing
### Related Rules (from 06 skills)
- META-RULE-001: Run ide-helper:meta
- META-RULE-002: Dev dependency only
- META-RULE-003: Gitignore output
- META-RULE-004: Composer script
### Related Skills (from 06 skills)
- Generate Facade Autocompletion Stubs
- Generate Model PHPDoc Annotations
- Configure IDE Helper

