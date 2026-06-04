# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** cli-tooling-artisan-extensions
**Knowledge Unit:** custom-artisan-command-patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Command class extends `Illuminate\Console\Command`
- [ ] `$signature` includes name, arguments, options, and descriptions
- [ ] `$description` set for `php artisan list` output
- [ ] Business logic delegated to service classes (thin handle)
- [ ] Exit codes: `return 0` on success, `return 1` on failure
- [ ] Command is idempotent (check state before acting)
- [ ] No `die()`, `exit()`, or `dd()` used; always return exit codes
- [ ] Dependencies injected via `handle()` for testability
- [ ] Command registered in Kernel or via `load()`
- [ ] Performance: - Bootstrap overhead: each Artisan invocation bootstraps the full app (50-200...
- [ ] Performance: - Lazy loading: commands not in `$commands` array load lazily, reducing memor...
- [ ] Performance: - Long-running commands: chunk results, unset large variables, use generators...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Keep commands in `App\Console\Commands` namespace by default
- [ ] Architecture guideline: - Register via `$commands` array in small apps; use `load()` for modular/multi-package apps
- [ ] Architecture guideline: - Use constructor injection for shared dependencies (loggers, config); use handle injection for p...
- [ ] Architecture guideline: - Never use `die()`, `exit()`, or `dd()` in commands â€” always return exit codes
- [ ] Architecture guideline: - Avoid `$this->ask()`, `$this->confirm()` in commands intended for automated/scheduled execution

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Create Custom Artisan Commands

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Bootstrap overhead: each Artisan invocation bootstraps the full app (50-200ms) â€” use `laravel-zero` for micro-com...
- [ ] - Lazy loading: commands not in `$commands` array load lazily, reducing memory per `php artisan` invocation
- [ ] - Long-running commands: chunk results, unset large variables, use generators to prevent memory growth

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Never echo sensitive values (passwords, tokens, API keys) to the console
- [ ] - Commands handling sensitive data should warn about output redirects
- [ ] - Validate all input through signature regex and command body validation
- [ ] - Avoid storing secrets in command attributes; use config/env at runtime

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
- [ ] Command class extends `Illuminate\Console\Command`
- [ ] `$signature` includes name, arguments, options, and descriptions
- [ ] `$description` set for `php artisan list` output
- [ ] Business logic delegated to service classes (thin handle)
- [ ] Exit codes: `return 0` on success, `return 1` on failure
- [ ] Command is idempotent (check state before acting)
- [ ] No `die()`, `exit()`, or `dd()` used; always return exit codes

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: God Command -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Silent Failure -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Echo Overload -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Tight Coupling -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Unsafe Production Commands -- apply preferred alternative
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
- Create Custom Artisan Commands
### Anti-Patterns (from 08)
- God Command
- Silent Failure
- Echo Overload
- Tight Coupling
- Unsafe Production Commands
### Related Rules (from 06 skills)
- CAC-RULE-001 through CAC-RULE-013
### Related Skills (from 06 skills)
- Define Command Signatures and Arguments
- Format Console Output
- Build Interactive Commands
- Create Custom Generator Commands
- Automate CLI Workflows

