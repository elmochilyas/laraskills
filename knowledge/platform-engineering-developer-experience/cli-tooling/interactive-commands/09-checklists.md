# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** cli-tooling-artisan-extensions
**Knowledge Unit:** interactive-commands
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Default values provided for all prompts (non-interactive safe)
- [ ] Interactivity detected early with clear failure message
- [ ] 5-7 prompts maximum (config files for more complex input)
- [ ] `choice()` used for bounded options
- [ ] `secret()` used for passwords, tokens, and sensitive data
- [ ] Confirmation required before destructive operations
- [ ] Summary table displayed before execution (proceed prompt)
- [ ] All interactive input expressible via arguments/options
- [ ] Prompting logic extractable for testability
- [ ] `--no-interaction` flag respected throughout
- [ ] Performance: - Interactive commands pause waiting for input â€” intentional but confusing ...
- [ ] Performance: - `readline` extension adds ~0.1ms per prompt
- [ ] Performance: - `stty -echo` toggle adds ~5-10ms per `secret()` call

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - All interactive input must be expressible via arguments/options for non-interactive use
- [ ] Architecture guideline: - Use `secret()` for passwords, tokens, and sensitive data
- [ ] Architecture guideline: - Extract prompting logic into methods that accept `InputInterface` for testability
- [ ] Architecture guideline: - Handle Ctrl+C gracefully with shutdown/cleanup when needed

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Build Interactive Artisan Commands

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Interactive commands pause waiting for input â€” intentional but confusing in automated contexts
- [ ] - `readline` extension adds ~0.1ms per prompt
- [ ] - `stty -echo` toggle adds ~5-10ms per `secret()` call
- [ ] - Negligible for interactive use; only relevant in automated/non-interactive contexts

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - `$this->secret()` hides input from terminal but value remains in memory â€” clear after use
- [ ] - Never log prompted values (especially passwords, API keys)
- [ ] - Input encoding varies by terminal â€” normalize to UTF-8 for consistent processing
- [ ] - Add command-level timeouts to prevent hanging in case of mistaken non-interactive execution

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
- [ ] Default values provided for all prompts (non-interactive safe)
- [ ] Interactivity detected early with clear failure message
- [ ] 5-7 prompts maximum (config files for more complex input)
- [ ] `choice()` used for bounded options
- [ ] `secret()` used for passwords, tokens, and sensitive data
- [ ] Confirmation required before destructive operations
- [ ] Summary table displayed before execution (proceed prompt)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Required Interaction -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Prompt Without Validation -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Repeated Confirmation -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Sensitive Echo -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Nested Interactive Chains -- apply preferred alternative
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
- Build Interactive Artisan Commands
### Anti-Patterns (from 08)
- Required Interaction
- Prompt Without Validation
- Repeated Confirmation
- Sensitive Echo
- Nested Interactive Chains
### Related Rules (from 06 skills)
- INT-RULE-001 through INT-RULE-012
### Related Skills (from 06 skills)
- Create Custom Artisan Commands
- Format Console Output
- Define Command Signatures and Arguments
- Automate CLI Workflows

