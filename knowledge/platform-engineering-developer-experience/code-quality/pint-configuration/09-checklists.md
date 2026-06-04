# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-quality-static-analysis
**Knowledge Unit:** pint-configuration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `pint.json` at project root with explicit preset
- [ ] Custom rules (if any) tested and documented
- [ ] Generated files excluded via `notPath`/`notName`
- [ ] JSON format valid (no trailing commas)
- [ ] `pint.json` committed to version control
- [ ] Pint version pinned in `composer.json`
- [ ] `pint --test` passes on full codebase
- [ ] Performance: - Config parsing: <1ms for typical ~5KB file
- [ ] Performance: - Exclusion pattern evaluation: simple globs are fast; complex regex adds mar...
- [ ] Performance: - Nested config scanning: minimal overhead for subtree discovery

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Place `pint.json` in project root with explicit preset
- [ ] Architecture guideline: - Use nested `pint.json` for subdirectories needing different standards
- [ ] Architecture guideline: - Document custom rules in CONTRIBUTING.md with rationale
- [ ] Architecture guideline: - Validate `pint.json` with JSON linter â€” trailing commas cause silent failures
- [ ] Architecture guideline: - Lock Pint version in `composer.json` to prevent rule behavior changes

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Pint via pint.json

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Config parsing: <1ms for typical ~5KB file
- [ ] - Exclusion pattern evaluation: simple globs are fast; complex regex adds marginal overhead
- [ ] - Nested config scanning: minimal overhead for subtree discovery

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - JSON config only â€” no code execution risk
- [ ] - Config changes affect all files â€” review to ensure exclusions are correct

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
- [ ] `pint.json` at project root with explicit preset
- [ ] Custom rules (if any) tested and documented
- [ ] Generated files excluded via `notPath`/`notName`
- [ ] JSON format valid (no trailing commas)
- [ ] `pint.json` committed to version control
- [ ] Pint version pinned in `composer.json`
- [ ] `pint --test` passes on full codebase

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Over-Configuration -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No Exclusions -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Blind Rule Changes -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Floating Config -- apply preferred alternative
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
- Configure Pint via pint.json
### Anti-Patterns (from 08)
- Over-Configuration
- No Exclusions
- Blind Rule Changes
- Floating Config
### Related Rules (from 06 skills)
- PINT-CONF-RULE-001: Start minimal
- PINT-CONF-RULE-002: Exclude generated code
- PINT-CONF-RULE-003: Commit pint.json
- PINT-CONF-RULE-004: Review config in PRs
- PINT-CONF-RULE-005: Use glob patterns for exclusions
### Related Skills (from 06 skills)
- Configure Custom Pint Rules
- Select Appropriate Pint Preset
- Integrate Pint into CI

