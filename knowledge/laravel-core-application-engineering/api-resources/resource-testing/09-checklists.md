# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** API Resources
**Knowledge Unit:** Resource Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Use make() Instead of create() for Unit Tests
- [ ] Enforce: Test Both Inclusion and Omission for Every Conditional
- [ ] Enforce: Mirror Production Wrapping in Test Configuration
- [ ] Enforce: Run Resource Tests Early in CI
- [ ] Enforce: Use Fixed Values in Snapshot Tests
- [ ] Enforce: Test Relationship Loaded and Unloaded States
- [ ] Enforce: Test Resource Contract, Not Internals
- [ ] Enforce: Use Data Providers for Exhaustive Conditional Coverage
- [ ] Enforce: Do Not Use Snapshots as Sole Contract Validation
- [ ] Enforce: Test Version Compatibility
- [ ] Every conditional field has both inclusion and omission test cases
- [ ] Unit tests use `make()` instead of `create()` where possible
- [ ] Test wrapping configuration matches production (`withoutWrapping()` in test base class)
- [ ] Version compatibility tests verify old versions lack new fields
- [ ] Paginated collection tests verify `links` and `meta` structure
- [ ] Resource tests are fast (<50ms suite) and run early in CI
- [ ] Snapshot tests use fixed, reproducible model values

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Structure test files to mirror resource organization: `tests/Feature/Http/Resources/V1/UserReso...
- [ ] Architecture guideline: - Use a base `ResourceTestCase` that configures wrapping, request defaults, and common assertions.
- [ ] Architecture guideline: - Version compatibility tests should assert that old version resources lack new version fields.
- [ ] Architecture guideline: - For collection resources, test empty collection, single item, multiple items, and paginated sta...
- [ ] Architecture guideline: - Resource unit tests should not hit the database unless relationship loading is being tested.

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Use make() Instead of create() for Unit Tests
- [ ] Apply rule: Test Both Inclusion and Omission for Every Conditional
- [ ] Apply rule: Mirror Production Wrapping in Test Configuration
- [ ] Apply rule: Run Resource Tests Early in CI
- [ ] Apply rule: Use Fixed Values in Snapshot Tests
- [ ] Apply rule: Test Relationship Loaded and Unloaded States
- [ ] Apply rule: Test Resource Contract, Not Internals
- [ ] Apply rule: Use Data Providers for Exhaustive Conditional Coverage
- [ ] Apply rule: Do Not Use Snapshots as Sole Contract Validation
- [ ] Apply rule: Test Version Compatibility
- [ ] Skill applied: Write Unit Tests for an API Resource

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
- [ ] Every conditional field has both inclusion and omission test cases
- [ ] Unit tests use `make()` instead of `create()` where possible
- [ ] Test wrapping configuration matches production (`withoutWrapping()` in test base class)
- [ ] Version compatibility tests verify old versions lack new fields
- [ ] Paginated collection tests verify `links` and `meta` structure
- [ ] Resource tests are fast (<50ms suite) and run early in CI
- [ ] Snapshot tests use fixed, reproducible model values

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Testing Only the Happy Path -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Integration Tests Only -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Snapshot Tests with Dynamic Values -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern

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
### Rules (from 05)
- Use make() Instead of create() for Unit Tests
- Test Both Inclusion and Omission for Every Conditional
- Mirror Production Wrapping in Test Configuration
- Run Resource Tests Early in CI
- Use Fixed Values in Snapshot Tests
- Test Relationship Loaded and Unloaded States
- Test Resource Contract, Not Internals
- Use Data Providers for Exhaustive Conditional Coverage
- Do Not Use Snapshots as Sole Contract Validation
- Test Version Compatibility
### Skills (from 06)
- Write Unit Tests for an API Resource
### Anti-Patterns (from 08)
- Testing Only the Happy Path
- Integration Tests Only
- Snapshot Tests with Dynamic Values
### Related Rules (from 06 skills)
- Use make() Instead of create() for Unit Tests (Performance)
- Test Both Inclusion and Omission for Every Conditional (Testing)
- Mirror Production Wrapping in Test Configuration (Testing)
- Run Resource Tests Early in CI (Testing)
- Use Fixed Values in Snapshot Tests (Testing)
- Test Relationship Loaded and Unloaded States (Testing)
- Test Resource Contract, Not Internals (Testing)
- Use Data Providers for Exhaustive Conditional Coverage (Testing)
- Do Not Use Snapshots as Sole Contract Validation (Testing)
- Test Version Compatibility (Testing)
### Related Skills (from 06 skills)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Conditional Attributes](../conditional-attributes/06-skills.md)
- [Conditional Relationships](../conditional-relationships/06-skills.md)
- [Pagination Metadata](../pagination-metadata/06-skills.md)
- [Top-Level Meta Data](../top-level-meta-data/06-skills.md)

