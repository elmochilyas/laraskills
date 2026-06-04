# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** cli-tooling-artisan-extensions
**Knowledge Unit:** console-output-formatting
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `$this->info()`, `$this->error()`, `$this->warn()` used instead of `echo`
- [ ] Tables used for structured data display
- [ ] Progress bars properly finished with `$bar->finish()`
- [ ] `--json` flag supported for programmatic consumers
- [ ] Verbosity levels correctly implemented (details at VERBOSE, not NORMAL)
- [ ] Output detects CI environment and adjusts formatting
- [ ] `--quiet` flag switches to QUIET verbosity for cron/scheduled tasks
- [ ] No sensitive data output even in DEBUG verbosity
- [ ] Color support checked before raw ANSI codes
- [ ] Performance: - Progress bar updates trigger terminal writes â€” batch advances for loops w...
- [ ] Performance: - `$this->table()` renders entire table in memory â€” use streaming for 10k+ ...
- [ ] Performance: - Terminal width detection fails gracefully in cron/non-TTY environments, def...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Use helper methods (`$this->info()`) instead of `echo` to ensure formatting and verbosity control
- [ ] Architecture guideline: - Detect CI environment (`CI` env var) to adjust formatting for headless contexts
- [ ] Architecture guideline: - Implement `--quiet` flag that switches to QUIET verbosity for cron/scheduled tasks
- [ ] Architecture guideline: - Never output sensitive data even in DEBUG verbosity

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Format Console Output in Artisan Commands

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Progress bar updates trigger terminal writes â€” batch advances for loops with 100k+ iterations
- [ ] - `$this->table()` renders entire table in memory â€” use streaming for 10k+ rows
- [ ] - Terminal width detection fails gracefully in cron/non-TTY environments, defaulting to 80 chars
- [ ] - Output is buffered by default â€” flush explicitly for real-time progress in long-running commands

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Strip ANSI tags or disable decoration for production log output
- [ ] - Never output passwords, tokens, or API keys in any verbosity level
- [ ] - Implement `--max-output` limits to prevent log flooding
- [ ] - Sanitize user-provided data before displaying in output

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
- [ ] `$this->info()`, `$this->error()`, `$this->warn()` used instead of `echo`
- [ ] Tables used for structured data display
- [ ] Progress bars properly finished with `$bar->finish()`
- [ ] `--json` flag supported for programmatic consumers
- [ ] Verbosity levels correctly implemented (details at VERBOSE, not NORMAL)
- [ ] Output detects CI environment and adjusts formatting
- [ ] `--quiet` flag switches to QUIET verbosity for cron/scheduled tasks

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Progress Bar in Log Output -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Console Dump of Large Objects -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Over-Formatted Output -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Sensitive Info in Debug -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Platform-Specific Formatting -- apply preferred alternative
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
- Format Console Output in Artisan Commands
### Anti-Patterns (from 08)
- Progress Bar in Log Output
- Console Dump of Large Objects
- Over-Formatted Output
- Sensitive Info in Debug
- Platform-Specific Formatting
### Related Rules (from 06 skills)
- OUTPUT-RULE-001 through OUTPUT-RULE-011
### Related Skills (from 06 skills)
- Create Custom Artisan Commands
- Build Interactive Commands
- Define Command Signatures and Arguments
- Automate CLI Workflows

