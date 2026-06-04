# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Workflow Automation & CI/CD
**Knowledge Unit:** PhpstanInCi
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Baseline generated and committed before enabling in CI
- [ ] `.phpstan.result.cache` cached between CI runs
- [ ] Level 6 configured for Laravel
- [ ] `--error-format=github` for inline annotations
- [ ] Memory limit set (2G)
- [ ] PHPStan job is required status check
- [ ] Baseline regenerated in dedicated PRs only

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **GitHub Actions PHPStan Pattern:** Run PHPStan with GitHub Annotations output; errors appear i...
- [ ] Architecture guideline: - **Baseline Generation Pattern:** Run `phpstan analyse --generate-baseline` to capture all curre...
- [ ] Architecture guideline: - **Baseline Update Pattern:** In a dedicated PR or cleanup sprint, regenerate the baseline after...
- [ ] Architecture guideline: - **Level Increment Pattern:** When increasing PHPStan level, generate a baseline at the new leve...
- [ ] Architecture guideline: - **GitHub Annotations Pattern:** Use `--error-format=github` for errors displayed inline on PR F...
- [ ] Architecture guideline: - **Memory Limit Pattern:** Set `php -d memory_limit=2G` for the PHPStan process to prevent OOM f...
- [ ] Architecture guideline: - **PHPStan Level:** Level 6 for most projects; level 5 as a starting point for teams new to stat...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Run PHPStan in CI

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
- [ ] Baseline generated and committed before enabling in CI
- [ ] `.phpstan.result.cache` cached between CI runs
- [ ] Level 6 configured for Laravel
- [ ] `--error-format=github` for inline annotations
- [ ] Memory limit set (2G)
- [ ] PHPStan job is required status check
- [ ] Baseline regenerated in dedicated PRs only

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Zero-baseline requirement from day one -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Hiding errors with @phpstan-ignore-line -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Running PHPStan at level 0 -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No PHPStan in CI at all -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Stale baseline never reduced -- apply preferred alternative
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
- Run PHPStan in CI
### Anti-Patterns (from 08)
- Zero-baseline requirement from day one
- Hiding errors with @phpstan-ignore-line
- Running PHPStan at level 0
- No PHPStan in CI at all
- Stale baseline never reduced
### Related Rules (from 06 skills)
- PSICI-RULE-001: Use baseline for legacy codebases
- PSICI-RULE-002: Cache .phpstan.result.cache
- PSICI-RULE-003: Use level 6 for Laravel projects
- PSICI-RULE-004: Use `--error-format=github`
- PSICI-RULE-005: Set explicit memory limit
### Related Skills (from 06 skills)
- Set Up Automated Testing in CI
- Run Pint in CI
- Generate and Manage PHPStan Baseline

