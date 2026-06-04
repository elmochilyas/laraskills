# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** cli-tooling-artisan-extensions
**Knowledge Unit:** laravel-tinker-repl
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Result sets limited (no `::all()`, `limit(10)` used)
- [ ] Relationships eager loaded to prevent N+1 queries
- [ ] Queries verified with `->get()` before destructive operations
- [ ] Tinker is in `require-dev` only, not production
- [ ] `config/tinker.php` configured with command whitelist/blacklist if needed
- [ ] Tinker never run on production servers
- [ ] PsySH commands (`doc`, `show`, `ls`) used for exploration
- [ ] Tinker restarted after file changes
- [ ] Performance: - Bootstrap time: 50-200ms for full Laravel application boot (once per session)
- [ ] Performance: - Code evaluation: <1ms after bootstrap â€” effectively instant
- [ ] Performance: - Large result sets: `User::all()->toArray()` with thousands of records consu...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Tinker configuration (`config/tinker.php`) supports command whitelist/blacklist and aliases
- [ ] Architecture guideline: - Use `shell.include` config to pre-load helper files on startup for custom global functions
- [ ] Architecture guideline: - Tinker should never be installed as a non-dev dependency (`require-dev` only)
- [ ] Architecture guideline: - Consider `PsySH\Configuration::setStartupMessage()` for team-specific prompts or registered com...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Use Laravel Tinker REPL for Development

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Bootstrap time: 50-200ms for full Laravel application boot (once per session)
- [ ] - Code evaluation: <1ms after bootstrap â€” effectively instant
- [ ] - Large result sets: `User::all()->toArray()` with thousands of records consumes memory and terminal output
- [ ] - N+1 queries: all queries log to terminal during exploration â€” use eager loading

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - **Never in production**: Tinker provides unrestricted data and service access
- [ ] - If unavoidable in non-local, use `config/tinker.php` whitelist/blacklist to disable destructive operations
- [ ] - Active Tinker session on a server = equivalent to root shell access
- [ ] - Tinker bypasses some Laravel model events and observers for direct DB operations
- [ ] - Database modifications in Tinker are not automatically rolled back

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
- [ ] Result sets limited (no `::all()`, `limit(10)` used)
- [ ] Relationships eager loaded to prevent N+1 queries
- [ ] Queries verified with `->get()` before destructive operations
- [ ] Tinker is in `require-dev` only, not production
- [ ] `config/tinker.php` configured with command whitelist/blacklist if needed
- [ ] Tinker never run on production servers
- [ ] PsySH commands (`doc`, `show`, `ls`) used for exploration

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Production Tinker Sessions -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Bulk Data Operations -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Session Dependency -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Unlimited Result Sets -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Skipping Eager Loading -- apply preferred alternative
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
- Use Laravel Tinker REPL for Development
### Anti-Patterns (from 08)
- Production Tinker Sessions
- Bulk Data Operations
- Session Dependency
- Unlimited Result Sets
- Skipping Eager Loading
### Related Rules (from 06 skills)
- TINKER-RULE-001 through TINKER-RULE-011
### Related Skills (from 06 skills)
- Build Interactive Commands
- Create Custom Artisan Commands
- Optimize Database Queries
- Debug with Laravel Debugbar

