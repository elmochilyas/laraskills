# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** cli-tooling-artisan-extensions
**Knowledge Unit:** custom-generator-commands
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Command extends `Illuminate\Console\GeneratorCommand`
- [ ] `getStub()` returns correct path to stub file
- [ ] `getDefaultNamespace()` sets correct target namespace
- [ ] Custom placeholders implemented via `buildClass()` or `buildView()`
- [ ] `--force` flag respected for overwriting existing files
- [ ] Class names validated with `Str::studly()`
- [ ] Stubs versioned in VCS
- [ ] Multi-file generation uses composed GeneratorCommand calls
- [ ] Migration paths documented for stub changes
- [ ] Performance: - Stub file reading is <1ms per generation; bulk generation (100+ files) cumu...
- [ ] Performance: - Namespace resolution reads `composer.json` once and caches
- [ ] Performance: - Bulk generation of 100 files takes ~100-500ms; bottleneck is file writing (...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Store shared stubs in `/stubs` at project root; use `base_path('stubs/my-stub.stub')` in `getSt...
- [ ] Architecture guideline: - Override `rootNamespace()` for test generators returning `Tests` namespace
- [ ] Architecture guideline: - For multi-file generation, compose multiple `GeneratorCommand` calls or use a custom Command
- [ ] Architecture guideline: - Use `$this->ask()` and `$this->choice()` for interactive collection of generation parameters

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create Custom Generator Commands

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Stub file reading is <1ms per generation; bulk generation (100+ files) cumulative I/O is negligible
- [ ] - Namespace resolution reads `composer.json` once and caches
- [ ] - Bulk generation of 100 files takes ~100-500ms; bottleneck is file writing (disk I/O)

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Stubs are PHP code templates â€” ensure user input is sanitized before being embedded
- [ ] - Never use `{{ }}` placeholders for values that could contain code injection
- [ ] - Generated files should not contain hard-coded credentials or secrets
- [ ] - Be cautious with `--force` overwriting existing files â€” confirm if files have local changes

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
- [ ] Command extends `Illuminate\Console\GeneratorCommand`
- [ ] `getStub()` returns correct path to stub file
- [ ] `getDefaultNamespace()` sets correct target namespace
- [ ] Custom placeholders implemented via `buildClass()` or `buildView()`
- [ ] `--force` flag respected for overwriting existing files
- [ ] Class names validated with `Str::studly()`
- [ ] Stubs versioned in VCS

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: God Generator -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Stub Sprawl -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Outdated Stubs -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Silent Overwrite -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Complex Logic in Stubs -- apply preferred alternative
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
- Create Custom Generator Commands
### Anti-Patterns (from 08)
- God Generator
- Stub Sprawl
- Outdated Stubs
- Silent Overwrite
- Complex Logic in Stubs
### Related Rules (from 06 skills)
- GEN-RULE-001 through GEN-RULE-012
### Related Skills (from 06 skills)
- Create Custom Artisan Commands
- Customize Laravel Stubs
- Generate Code with Blueprint
- Define Artisan Command Signatures

