# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** cli-tooling-artisan-extensions
**Knowledge Unit:** command-scheduling
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Single system cron entry `* * * * * php artisan schedule:run` in place
- [ ] `->withoutOverlapping()` applied to tasks running more frequently than their duration
- [ ] Mutex TTL set with `->withoutOverlapping(seconds)`
- [ ] All tasks have output logged via `->appendOutputTo()`
- [ ] Long tasks use `->runInBackground()`
- [ ] Multi-server tasks use `->onOneServer()` with shared cache
- [ ] Environment-specific tasks gated with `->environments()`
- [ ] Heartbeat monitoring task runs every minute
- [ ] No interactive methods called in scheduled tasks
- [ ] Tasks grouped logically in `Kernel::schedule()`
- [ ] Performance: - Due event evaluation with 10-20 tasks takes <1ms; with hundreds, 10-100ms â...
- [ ] Performance: - `->runInBackground()` spawns a PHP subprocess per task â€” monitor concurre...
- [ ] Performance: - Mutex checking via Redis is ~1ms per task; file cache is 5-10ms

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Define schedules in `Kernel::schedule()` grouped by domain or frequency
- [ ] Architecture guideline: - Use `->environments('production')` to gate environment-specific tasks
- [ ] Architecture guideline: - For multi-server deployments, use `->onOneServer()` with shared cache (Redis) for coordination
- [ ] Architecture guideline: - Scheduled commands should never call `ask()`, `confirm()`, or other interactive methods
- [ ] Architecture guideline: - Test scheduled tasks by running the command directly and verifying behavior

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Schedule Artisan Commands

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Due event evaluation with 10-20 tasks takes <1ms; with hundreds, 10-100ms â€” still negligible
- [ ] - `->runInBackground()` spawns a PHP subprocess per task â€” monitor concurrent background limit
- [ ] - Mutex checking via Redis is ~1ms per task; file cache is 5-10ms
- [ ] - Background tasks can accumulate and exhaust memory on resource-constrained machines

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Scheduled commands run with the app's full privileges â€” limit destructive operations
- [ ] - Use `->evenInMaintenanceMode()` judiciously â€” only for safety-critical tasks
- [ ] - Store sensitive output separately; scheduled task logs may contain sensitive data
- [ ] - Validate that external exec commands (`schedule->exec()`) are not injectable

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
- [ ] Single system cron entry `* * * * * php artisan schedule:run` in place
- [ ] `->withoutOverlapping()` applied to tasks running more frequently than their duration
- [ ] Mutex TTL set with `->withoutOverlapping(seconds)`
- [ ] All tasks have output logged via `->appendOutputTo()`
- [ ] Long tasks use `->runInBackground()`
- [ ] Multi-server tasks use `->onOneServer()` with shared cache
- [ ] Environment-specific tasks gated with `->environments()`

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Interactive in Scheduled Tasks -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Overlapping without Mutex TTL -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Many `everyMinute()` Tasks -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Hard-Coded Paths -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No Failure Notification -- apply preferred alternative
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
- Schedule Artisan Commands
### Anti-Patterns (from 08)
- Interactive in Scheduled Tasks
- Overlapping without Mutex TTL
- Many `everyMinute()` Tasks
- Hard-Coded Paths
- No Failure Notification
### Related Rules (from 06 skills)
- SCHED-RULE-001 through SCHED-RULE-012
### Related Skills (from 06 skills)
- Create Custom Artisan Commands
- Automate CLI Workflows
- Build Interactive Commands
- Set Up Queue Workers
- Monitor Application Health

