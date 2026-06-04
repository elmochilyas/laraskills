# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Localization in Views
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Always Use `__()` for User-Facing Strings
- [ ] Enforce: Always Pass All Required Placeholder Replacements
- [ ] Enforce: Validate User-Supplied Locale Values
- [ ] Enforce: Use Dot-Notation Keys with Maximum 2 Levels
- [ ] Enforce: Use Laravel's `Number` and `Date` Helpers for Locale-Aware Formatting
- [ ] Enforce: Cache Translations in Production
- [ ] All user-facing strings use `__()` or `@lang` (no hardcoded text)
- [ ] Translation files exist for all supported locales
- [ ] Placeholder replacements are passed correctly for all parameterized strings
- [ ] Pluralization rules are defined for all count-sensitive strings
- [ ] `Number` and `Date` helpers used for locale-aware formatting (not PHP native functions)
- [ ] RTL languages handled via dynamic `dir` attribute on `<html>`
- [ ] Locale validation whitelist exists for user-supplied locales
- [ ] Translation cache enabled in production (`php artisan lang:publish`)
- [ ] CI checks detect missing translation keys

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### PHP Array vs JSON Translation Files
- [ ] Architecture guideline: PHP arrays preferred for structured translations. JSON for simple apps or vendor translation extr...
- [ ] Architecture guideline: ### Locale Detection Strategies
- [ ] Architecture guideline: ### Directory Structure
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ messages.php      # General messages
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ auth.php          # Authentication strings
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ validation.php    # Validation error messages
- [ ] Architecture guideline: â”‚   â””â”€â”€ navigation.php    # Navigation labels
- [ ] Architecture guideline: â”œâ”€â”€ messages.php
- [ ] Architecture guideline: â”œâ”€â”€ auth.php
- [ ] Architecture guideline: â””â”€â”€ validation.php
- [ ] Decision: Translation File Format (PHP Arrays vs JSON) - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Always Use `__()` for User-Facing Strings
- [ ] Apply rule: Always Pass All Required Placeholder Replacements
- [ ] Apply rule: Validate User-Supplied Locale Values
- [ ] Apply rule: Use Dot-Notation Keys with Maximum 2 Levels
- [ ] Apply rule: Use Laravel's `Number` and `Date` Helpers for Locale-Aware Formatting
- [ ] Apply rule: Cache Translations in Production
- [ ] Skill applied: Implement Multi-Language Translation in Views

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged

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
- [ ] All user-facing strings use `__()` or `@lang` (no hardcoded text)
- [ ] Translation files exist for all supported locales
- [ ] Placeholder replacements are passed correctly for all parameterized strings
- [ ] Pluralization rules are defined for all count-sensitive strings
- [ ] `Number` and `Date` helpers used for locale-aware formatting (not PHP native functions)
- [ ] RTL languages handled via dynamic `dir` attribute on `<html>`
- [ ] Locale validation whitelist exists for user-supplied locales

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Hardcoded User-Facing Strings -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing Placeholder Replacements -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Unvalidated User-Supplied Locale -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Deeply Nested Translation Keys -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: PHP Native Formatting Instead of Laravel Helpers -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern

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
### Rules (from 05)
- Always Use `__()` for User-Facing Strings
- Always Pass All Required Placeholder Replacements
- Validate User-Supplied Locale Values
- Use Dot-Notation Keys with Maximum 2 Levels
- Use Laravel's `Number` and `Date` Helpers for Locale-Aware Formatting
- Cache Translations in Production
### Skills (from 06)
- Implement Multi-Language Translation in Views
### Decision Trees (from 07)
- Translation File Format (PHP Arrays vs JSON)
- Locale Detection Strategy
- Translation Key Structure (Dot-Notation Depth)
### Anti-Patterns (from 08)
- Hardcoded User-Facing Strings
- Missing Placeholder Replacements
- Unvalidated User-Supplied Locale
- Deeply Nested Translation Keys
- PHP Native Formatting Instead of Laravel Helpers
### Related Rules (from 06 skills)
- localization-in-views/05-rules.md: Always Use `__()` for User-Facing Strings
- localization-in-views/05-rules.md: Always Pass All Required Placeholder Replacements
- localization-in-views/05-rules.md: Validate User-Supplied Locale Values
- localization-in-views/05-rules.md: Use Dot-Notation Keys with Maximum 2 Levels
- localization-in-views/05-rules.md: Use Laravel's `Number` and `Date` Helpers for Locale-Aware Formatting
- localization-in-views/05-rules.md: Cache Translations in Production
### Related Skills (from 06 skills)
- Blade Testing: Write Assertions for Blade View Rendering
- View Composers and Creators: Implement View Composers for Shared Data
- Template Inheritance: Implement Template Inheritance Hierarchy
- Rendering Performance: Profile and Optimize Slow View Rendering

