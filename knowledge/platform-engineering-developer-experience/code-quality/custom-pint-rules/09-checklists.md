# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-quality-static-analysis
**Knowledge Unit:** custom-pint-rules
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `pint.json` has preset and minimal custom rules (3-5)
- [ ] All custom rules have documented rationale in CONTRIBUTING.md
- [ ] `pint --test` passes with zero style issues
- [ ] No conflicting rules in the ruleset
- [ ] Pint version locked in `composer.json`
- [ ] Generated files excluded via `notPath`/`notName`
- [ ] Performance: - Simple custom rules: <1ms per file
- [ ] Performance: - Complex AST-based rules: 5-10ms per file â€” negligible for CI
- [ ] Performance: - Exclusion patterns add marginal overhead per file

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Define custom rules in `pint.json` `rules` section
- [ ] Architecture guideline: - Custom fixers should be PSR-4 autoloadable and registered via Pint extensions
- [ ] Architecture guideline: - Use `notPath`/`notName` to exclude generated files from custom rule application
- [ ] Architecture guideline: - For per-directory rules, use nested `pint.json` files

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Custom Pint Rules

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Simple custom rules: <1ms per file
- [ ] - Complex AST-based rules: 5-10ms per file â€” negligible for CI
- [ ] - Exclusion patterns add marginal overhead per file

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
- [ ] `pint.json` has preset and minimal custom rules (3-5)
- [ ] All custom rules have documented rationale in CONTRIBUTING.md
- [ ] `pint --test` passes with zero style issues
- [ ] No conflicting rules in the ruleset
- [ ] Pint version locked in `composer.json`
- [ ] Generated files excluded via `notPath`/`notName`

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
- Configure Custom Pint Rules
### Anti-Patterns (from 08)
- Pattern Without Enforcement
- Inconsistent Application
- Missing Documentation
### Related Rules (from 06 skills)
- CUSTPIN-RULE-001: Start with preset, add minimal overrides
- CUSTPIN-RULE-002: Document each rule's rationale
- CUSTPIN-RULE-003: Avoid conflicting rules
- CUSTPIN-RULE-004: Test rules on codebase
- CUSTPIN-RULE-005: Lock Pint version
### Related Skills (from 06 skills)
- Configure Laravel Pint
- Select Appropriate Pint Preset
- Integrate Pint into CI

