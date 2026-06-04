# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Module Extractability
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Test directory mirrors source structure exactly
- [ ] Base test case exists with feature-specific `setUp()`
- [ ] All test classes extend the feature base test case
- [ ] `RefreshDatabase` or `DatabaseTransactions` applied to every test class
- [ ] Test files split by class or behavior (not one giant file)
- [ ] Tests focus on public API, not internal implementation
- [ ] Factory `$model` references feature model FQCN
- [ ] Tests pass when run in isolation: `phpunit tests/Features/{Feature}/`

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Test directory: `tests/Features/{Feature}/` mirroring source
- [ ] Architecture guideline: - Subdirectories mirror source layers: `Controllers/`, `Services/`, `Exceptions/`
- [ ] Architecture guideline: - Autoloading: `"Tests\\": "tests/"` in `composer.json` autoload-dev
- [ ] Architecture guideline: - Feature test base class extends `Tests\TestCase` with feature-specific `setUp()`
- [ ] Architecture guideline: - Per-feature phpunit config file for isolated test runs
- [ ] Architecture guideline: - Database isolation via `RefreshDatabase` with feature-specific migrations
- [ ] Decision: Per-Feature Test Directory vs Flat tests/ Directory - ensure correct choice is made
- [ ] Decision: Per-Feature PHPUnit Suite vs Single Test Suite - ensure correct choice is made
- [ ] Decision: CI Path Filtering Per Changed Feature vs Full Test Suite Run - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create Feature Test Structure
- [ ] Skill applied: Configure Per-Feature PHPUnit Suites For CI

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
- [ ] Test directory mirrors source structure exactly
- [ ] Base test case exists with feature-specific `setUp()`
- [ ] All test classes extend the feature base test case
- [ ] `RefreshDatabase` or `DatabaseTransactions` applied to every test class
- [ ] Test files split by class or behavior (not one giant file)
- [ ] Tests focus on public API, not internal implementation
- [ ] Factory `$model` references feature model FQCN

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

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
- Create Feature Test Structure
- Configure Per-Feature PHPUnit Suites For CI
### Decision Trees (from 07)
- Per-Feature Test Directory vs Flat tests/ Directory
- Per-Feature PHPUnit Suite vs Single Test Suite
- CI Path Filtering Per Changed Feature vs Full Test Suite Run
### Related Rules (from 06 skills)
- Mirror Source Structure Exactly In Tests (05-rules.md)
- Create A Base Test Case Per Feature (05-rules.md)
- Test Public API, Not Internal Implementation (05-rules.md)
- Isolate Feature Tests With Database Transactions (05-rules.md)
- Split Tests By Class Or Behavior (05-rules.md)
- Keep Integration Tests Separate From Feature Tests (05-rules.md)
### Related Skills (from 06 skills)
- Configure Per-Feature PHPUnit Suites For CI
- Create A New Feature Scaffold
- Add A Feature-Specific Model

