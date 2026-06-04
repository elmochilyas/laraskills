# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-quality-static-analysis
**Knowledge Unit:** static-analysis-ci-integration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Pipeline runs Pint, PHPStan, and optionally Rector
- [ ] Stages are independent (one failure doesn't block others)
- [ ] Caching configured for both Pint and PHPStan caches
- [ ] PR annotations visible for style and analysis issues
- [ ] PHPStan baseline enforced (no new errors)
- [ ] Pipeline completes under 10 minutes total
- [ ] Memory limit configured (1G)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Separate stages**: style â†’ static analysis â†’ quality â€” each stage independent
- [ ] Architecture guideline: - **Parallel execution**: static analysis runs alongside test suite
- [ ] Architecture guideline: - **PHP matrix**: `strategy.matrix.php: [8.2, 8.3]` for multi-version compatibility
- [ ] Architecture guideline: - **Cache strategy**: restore `.php-cs-fixer.cache`, `tmpDir` from previous run
- [ ] Architecture guideline: - **PR annotations**: `--format=github` for PHPStan, `--format=github` for Pint
- [ ] Architecture guideline: - **Baseline enforcement**: fail CI if new errors exceed baseline

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Integrate Static Analysis in CI

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
- [ ] Pipeline runs Pint, PHPStan, and optionally Rector
- [ ] Stages are independent (one failure doesn't block others)
- [ ] Caching configured for both Pint and PHPStan caches
- [ ] PR annotations visible for style and analysis issues
- [ ] PHPStan baseline enforced (no new errors)
- [ ] Pipeline completes under 10 minutes total
- [ ] Memory limit configured (1G)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Pattern Without Enforcement -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Inconsistent Application -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Missing Documentation -- apply preferred alternative
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
- Integrate Static Analysis in CI
### Anti-Patterns (from 08)
- Pattern Without Enforcement
- Inconsistent Application
- Missing Documentation
### Related Rules (from 06 skills)
- SACIR-RULE-001: Separate stages
- SACIR-RULE-002: Parallel execution
- SACIR-RULE-004: Cache strategy
- SACIR-RULE-005: PR annotations
- SACIR-RULE-006: Baseline enforcement
### Related Skills (from 06 skills)
- Integrate Pint into CI
- Set Up Laravel PHPStan with Larastan
- Configure Rector for Automated Laravel Refactoring
- Generate and Manage PHPStan Baseline

