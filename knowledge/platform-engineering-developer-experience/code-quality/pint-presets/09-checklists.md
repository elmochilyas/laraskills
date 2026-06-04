# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-quality-static-analysis
**Knowledge Unit:** pint-presets
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Preset explicitly set in `pint.json`
- [ ] Preset matches project type (Laravel â†’ `laravel`, library â†’ `psr12`)
- [ ] Full codebase formatted after preset change (isolated commit)
- [ ] All projects in organization use same preset
- [ ] Custom rules minimal (3-5 max beyond preset)
- [ ] `pint --test` passes with selected preset
- [ ] Performance: - Laravel preset: ~80 rules; PSR-12: ~60; PER: ~70; Symfony: ~90
- [ ] Performance: - Rule count has negligible impact on formatting speed
- [ ] Performance: - Preset loading is compiled; switching preset has zero performance cost

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Preset selected in `pint.json` â€” committed for team-wide consistency
- [ ] Architecture guideline: - For monorepos, use nested `pint.json` per package with appropriate presets
- [ ] Architecture guideline: - Review preset content when upgrading Pint (rules may be added/removed)
- [ ] Architecture guideline: - Use `pint -v` to see effective rules being applied

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Select Appropriate Pint Preset

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Laravel preset: ~80 rules; PSR-12: ~60; PER: ~70; Symfony: ~90
- [ ] - Rule count has negligible impact on formatting speed
- [ ] - Preset loading is compiled; switching preset has zero performance cost

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Presets are formatting rules only â€” no security implications
- [ ] - Custom rules could theoretically introduce formatting that hides code issues

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
- [ ] Preset explicitly set in `pint.json`
- [ ] Preset matches project type (Laravel â†’ `laravel`, library â†’ `psr12`)
- [ ] Full codebase formatted after preset change (isolated commit)
- [ ] All projects in organization use same preset
- [ ] Custom rules minimal (3-5 max beyond preset)
- [ ] `pint --test` passes with selected preset

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Full Custom Ruleset -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Frequent Preset Switching -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring Preset Changes -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Forcing Non-Laravel Preset on Laravel -- apply preferred alternative
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
- Select Appropriate Pint Preset
### Anti-Patterns (from 08)
- Full Custom Ruleset
- Frequent Preset Switching
- Ignoring Preset Changes
- Forcing Non-Laravel Preset on Laravel
### Related Rules (from 06 skills)
- PPRES-RULE-001: Use laravel preset for Laravel projects
- PPRES-RULE-002: Use PSR-12 for framework-agnostic libraries
- PPRES-RULE-005: Start with preset, add minimal overrides
- PPRES-RULE-006: Full format on preset change
### Related Skills (from 06 skills)
- Configure Pint via pint.json
- Configure Custom Pint Rules
- Configure Laravel Pint for Code Style

