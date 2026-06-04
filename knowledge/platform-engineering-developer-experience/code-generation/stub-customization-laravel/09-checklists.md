# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-generation-scaffolding
**Knowledge Unit:** stub-customization-laravel
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `stubs/` directory version-controlled
- [ ] `declare(strict_types=1)` added to all stubs
- [ ] Base class imports and trait `use` statements added
- [ ] Generated files match expected structure
- [ ] All team members aware of stub conventions
- [ ] Upgrades: stubs diffed and updated
- [ ] Stubs reviewed in PRs
- [ ] Performance: - Stub file I/O: ~1ms per generation â€” negligible for interactive use
- [ ] Performance: - Placeholder replacement: microseconds; dominated by file writing time
- [ ] Performance: - Custom stubs don't affect runtime performance â€” only generation time

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Publish stubs once, then manage via version control (never re-publish over customizations)
- [ ] Architecture guideline: - Organize custom stubs in `stubs/` with descriptive names: `stubs/model.stub`, `stubs/controller...
- [ ] Architecture guideline: - For team-specific patterns, create dedicated stubs referenced by custom generator commands
- [ ] Architecture guideline: - Keep stubs simple â€” use placeholders for variables, not control structures
- [ ] Architecture guideline: - Use `declare(strict_types=1)` via stubs to enforce strict typing across all generated code

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Customize Laravel Stubs for Code Generation

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Stub file I/O: ~1ms per generation â€” negligible for interactive use
- [ ] - Placeholder replacement: microseconds; dominated by file writing time
- [ ] - Custom stubs don't affect runtime performance â€” only generation time

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Stubs are PHP templates â€” sanitize user input before embedding in generated code
- [ ] - Never hard-code credentials, API keys, or secrets in stubs
- [ ] - Generated files should follow secure coding practices
- [ ] - Review stub changes for security implications (they affect all future generated code)

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
- [ ] `stubs/` directory version-controlled
- [ ] `declare(strict_types=1)` added to all stubs
- [ ] Base class imports and trait `use` statements added
- [ ] Generated files match expected structure
- [ ] All team members aware of stub conventions
- [ ] Upgrades: stubs diffed and updated
- [ ] Stubs reviewed in PRs

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Stub as Code Repository -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No Documentation -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Stale Stubs -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Over-Customization -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Stub Dependency -- apply preferred alternative
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
- Customize Laravel Stubs for Code Generation
### Anti-Patterns (from 08)
- Stub as Code Repository
- No Documentation
- Stale Stubs
- Over-Customization
- Stub Dependency
### Related Rules (from 06 skills)
- STUB-RULE-001: Version-control stubs
- STUB-RULE-002: Keep stubs generic
- STUB-RULE-003: Use traits for behavior
- STUB-RULE-004: Test stub output
- STUB-RULE-006: Diff after upgrades
### Related Skills (from 06 skills)
- Create Custom Artisan Make Commands
- Generate Laravel Code with Blueprint
- Write Blueprint YAML DSL Definitions

