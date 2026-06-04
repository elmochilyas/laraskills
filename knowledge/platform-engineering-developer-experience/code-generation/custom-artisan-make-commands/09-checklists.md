# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** code-generation-scaffolding
**Knowledge Unit:** custom-artisan-make-commands
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Command extends GeneratorCommand
- [ ] `$rootNamespace()` used, not hard-coded `App\`
- [ ] Custom placeholders prefixed to avoid collisions
- [ ] `--force` flag respected
- [ ] `--namespace` option provided for flexibility
- [ ] Stubs version-controlled
- [ ] Command registered in Kernel
- [ ] Performance: - Stub file I/O: <1ms per file; negligible for manual generation
- [ ] Performance: - Namespace resolution cached from composer.json autoload config
- [ ] Performance: - Performance not a primary concern â€” generators are invoked manually (1-10...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Store custom stubs in project `/stubs` directory (version-controlled)
- [ ] Architecture guideline: - For package generators, ship stubs within the package and reference with `__DIR__`
- [ ] Architecture guideline: - Override `rootNamespace()` for test generators returning `Tests` namespace
- [ ] Architecture guideline: - Provide `--namespace` option override for non-standard namespace targets
- [ ] Architecture guideline: - Document available make commands in CONTRIBUTING.md or README

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create Custom Artisan Make Commands

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Stub file I/O: <1ms per file; negligible for manual generation
- [ ] - Namespace resolution cached from composer.json autoload config
- [ ] - Performance not a primary concern â€” generators are invoked manually (1-10 times/day)

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Stubs are PHP templates â€” sanitize user input before embedding in generated code
- [ ] - Generated files should not contain hard-coded credentials
- [ ] - `--force` overwrites existing files â€” confirm if files have local changes
- [ ] - Generated code should follow secure coding practices (type hints, validation)

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
- [ ] Command extends GeneratorCommand
- [ ] `$rootNamespace()` used, not hard-coded `App\`
- [ ] Custom placeholders prefixed to avoid collisions
- [ ] `--force` flag respected
- [ ] `--namespace` option provided for flexibility
- [ ] Stubs version-controlled
- [ ] Command registered in Kernel

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Too Many Generators -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Stub Sprawl -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Rigid Generators -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Unregistered Commands -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Static Stubs Never Updated -- apply preferred alternative
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
- Create Custom Artisan Make Commands
### Anti-Patterns (from 08)
- Too Many Generators
- Stub Sprawl
- Rigid Generators
- Unregistered Commands
- Static Stubs Never Updated
### Related Rules (from 06 skills)
- CUSTMAKE-RULE-001: Extend GeneratorCommand
- CUSTMAKE-RULE-002: Use $rootNamespace
- CUSTMAKE-RULE-003: Respect `--force`
- CUSTMAKE-RULE-004: Prefix custom placeholders
- CUSTMAKE-RULE-005: Keep stubs simple
### Related Skills (from 06 skills)
- Customize Laravel Stubs
- Generate Laravel Code with Blueprint
- Write Blueprint YAML DSL Definitions

