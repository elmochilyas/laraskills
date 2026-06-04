# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** cli-tooling-artisan-extensions
**Knowledge Unit:** artisan-command-signatures-arguments
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Each argument and option has a description for `--help` documentation
- [ ] Required arguments precede optional arguments
- [ ] Array arguments are placed last
- [ ] Options are used for modifiers; arguments for targets
- [ ] `--force` and `--dry-run` conventions follow Laravel ecosystem patterns
- [ ] Sensitive values use `$this->secret()` not signature arguments
- [ ] Signature is concise (under 5 arguments/options)
- [ ] Regex validation used for format, PHP for business logic
- [ ] Performance: - Signature parsed once per command registration; negligible overhead
- [ ] Performance: - Regex patterns evaluated on every invocation â€” keep patterns simple (avoi...
- [ ] Performance: - InputDefinition built on command instantiation; lazy loading means no upfro...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Keep signatures concise â€” more than 5 arguments/options suggests splitting the command
- [ ] Architecture guideline: - Use `configure()` method when signature string cannot express the needed logic
- [ ] Architecture guideline: - Document breaking signature changes in changelog and update consuming CI scripts
- [ ] Architecture guideline: - Sensitive values (passwords) should use interactive `$this->secret()`, not arguments

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Define Artisan Command Signatures and Arguments

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Signature parsed once per command registration; negligible overhead
- [ ] - Regex patterns evaluated on every invocation â€” keep patterns simple (avoid backtracking)
- [ ] - InputDefinition built on command instantiation; lazy loading means no upfront cost for unused commands

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Arguments and options are visible in process listings (`ps aux`); never put secrets in them
- [ ] - Regex validation is a first gate, not a security boundary â€” always validate in command body too
- [ ] - Array arguments can overflow â€” set reasonable limits and validate count
- [ ] - Option aliases must be unique to avoid collision errors

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
- [ ] Each argument and option has a description for `--help` documentation
- [ ] Required arguments precede optional arguments
- [ ] Array arguments are placed last
- [ ] Options are used for modifiers; arguments for targets
- [ ] `--force` and `--dry-run` conventions follow Laravel ecosystem patterns
- [ ] Sensitive values use `$this->secret()` not signature arguments
- [ ] Signature is concise (under 5 arguments/options)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Signature Overload -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Brittle Regex -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Dynamic Argument Meaning -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Empty Descriptions -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Positional Breaking Changes -- apply preferred alternative
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
- Define Artisan Command Signatures and Arguments
### Anti-Patterns (from 08)
- Signature Overload
- Brittle Regex
- Dynamic Argument Meaning
- Empty Descriptions
- Positional Breaking Changes
### Related Rules (from 06 skills)
- SIG-RULE-001 through SIG-RULE-011
### Related Skills (from 06 skills)
- Create Custom Artisan Commands
- Format Console Output
- Build Interactive Commands
- Automate CLI Workflows

