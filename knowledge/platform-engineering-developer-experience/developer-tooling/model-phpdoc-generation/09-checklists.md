# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** developer-tooling-debugging
**Knowledge Unit:** model-phpdoc-generation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Model files have `@property` annotations for all DB columns
- [ ] Relationship methods have `@property-read` annotations with correct return types
- [ ] Query builder methods have `@method` annotations (`find()`, `whereEmail()`)
- [ ] Annotations match actual database schema
- [ ] `doctrine/dbal` configured and database accessible
- [ ] Inline annotations (if chosen) tracked in version control
- [ ] Performance: - Schema reading: 0.5-2s per model (first run); cached for subsequent runs
- [ ] Performance: - 50 models: 5-30s (cold cache), 2-5s (warm cache)
- [ ] Performance: - File writing: 1-3s for 50 models

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Run after every migration that changes model-related tables
- [ ] Architecture guideline: - Use `config/ide-helper.php` for customizations: excluded models, timestamps behavior
- [ ] Architecture guideline: - Version control: track inline annotations; ignore separate `_ide_helper_models.php`
- [ ] Architecture guideline: - Gitignore entries: `_ide_helper_models.php` if using separate file
- [ ] Decision: Inline vs Separate Model Annotations? - ensure correct choice is made
- [ ] Decision: Doctrine DBAL Required? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Generate Model PHPDoc Annotations

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Schema reading: 0.5-2s per model (first run); cached for subsequent runs
- [ ] - 50 models: 5-30s (cold cache), 2-5s (warm cache)
- [ ] - File writing: 1-3s for 50 models
- [ ] - Advanced: Doctrine DBAL caching speeds up generation significantly

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Dev dependency only (`require-dev`)
- [ ] - Models command reads DB schema â€” ensure DB accessible during generation
- [ ] - No runtime effect â€” generated annotations are IDE-only

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
- [ ] Model files have `@property` annotations for all DB columns
- [ ] Relationship methods have `@property-read` annotations with correct return types
- [ ] Query builder methods have `@method` annotations (`find()`, `whereEmail()`)
- [ ] Annotations match actual database schema
- [ ] `doctrine/dbal` configured and database accessible
- [ ] Inline annotations (if chosen) tracked in version control

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Generating once and never updating -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Without Doctrine DBAL -- apply preferred alternative
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
- Generate Model PHPDoc Annotations
### Decision Trees (from 07)
- Inline vs Separate Model Annotations?
- Doctrine DBAL Required?
### Anti-Patterns (from 08)
- Generating once and never updating
- Without Doctrine DBAL
### Related Rules (from 06 skills)
- MODELDOC-RULE-001: Run ide-helper:models
- MODELDOC-RULE-002: Dev dependency only
- MODELDOC-RULE-003: Inline vs separate
- MODELDOC-RULE-004: Pre-requisite for PHPStan
### Related Skills (from 06 skills)
- Generate Facade Autocompletion Stubs
- Generate PhpStorm Meta File
- Configure IDE Helper

