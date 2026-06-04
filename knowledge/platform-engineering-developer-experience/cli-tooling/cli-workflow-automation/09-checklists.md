# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** cli-tooling-artisan-extensions
**Knowledge Unit:** cli-workflow-automation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Guard clauses check prerequisites before each step
- [ ] Fail-fast behavior with non-zero exit code on failure
- [ ] Each step is idempotent (safe to re-run)
- [ ] Logging captures timestamp, exit code, and output per step
- [ ] Environment detection adjusts verbosity and behavior
- [ ] Independent tasks run in parallel when possible
- [ ] Timeouts set for external process execution
- [ ] Cache-based locks prevent concurrent deployment/maintenance workflow execution
- [ ] Performance: - Each Symfony Process subprocess adds ~5-10ms overhead; avoid spawning in loops
- [ ] Performance: - `Artisan::call()` with config caching is ~1ms; without caching, 10-50ms per...
- [ ] Performance: - PowerShell/CMD on Windows have different startup times than bash â€” prefer...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Use `Artisan::call()` for Laravel commands (shared state, faster); use Symfony Process for exte...
- [ ] Architecture guideline: - Prefer Artisan commands for Laravel-specific logic; Makefile/shell for cross-language workflows
- [ ] Architecture guideline: - Implement rollback steps or checkpoint recovery for multi-step workflows
- [ ] Architecture guideline: - Set generous timeouts for Symfony Process to prevent silent hanging
- [ ] Architecture guideline: - Use cache-based locks to prevent concurrent execution of deployment or maintenance workflows

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Automate CLI Workflows

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Each Symfony Process subprocess adds ~5-10ms overhead; avoid spawning in loops
- [ ] - `Artisan::call()` with config caching is ~1ms; without caching, 10-50ms per call
- [ ] - PowerShell/CMD on Windows have different startup times than bash â€” prefer PHP tools for cross-platform
- [ ] - Parallel execution via background processes reduces wall time but consumes more resources

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Never hard-code secrets (API keys, passwords) in workflow scripts â€” use environment variables
- [ ] - Validate all external input before passing to shell commands
- [ ] - Log output should never expose sensitive data; use output filtering if needed
- [ ] - Lock concurrent execution of destructive workflows to prevent race conditions

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
- [ ] Guard clauses check prerequisites before each step
- [ ] Fail-fast behavior with non-zero exit code on failure
- [ ] Each step is idempotent (safe to re-run)
- [ ] Logging captures timestamp, exit code, and output per step
- [ ] Environment detection adjusts verbosity and behavior
- [ ] Independent tasks run in parallel when possible
- [ ] Timeouts set for external process execution

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Monolithic Script -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No Rollback -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Environment Assumptions -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Blind Parallelism -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Output Ignorance -- apply preferred alternative
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
- Automate CLI Workflows
### Anti-Patterns (from 08)
- Monolithic Script
- No Rollback
- Environment Assumptions
- Blind Parallelism
- Output Ignorance
### Related Rules (from 06 skills)
- CLIWA-RULE-001 through CLIWA-RULE-012
### Related Skills (from 06 skills)
- Schedule Commands
- Create Custom Artisan Commands
- Set Up GitHub Actions for Laravel
- Automate Deployment Pipelines
- Set Up Automated Testing in CI

