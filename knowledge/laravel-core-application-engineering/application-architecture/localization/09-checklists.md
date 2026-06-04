# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Application Localization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Use PHP Array Format for Application Translations
- [ ] Verify: Set Fallback Locale Properly
- [ ] Verify: Validate Locale from User Input
- [ ] Verify: Always Pass count Parameter for Pluralization
- [ ] Verify: Use Locale in Cache Keys
- [ ] Supported locales list is defined and includes all available translation directories
- [ ] Fallback locale is configured to the most complete translation set
- [ ] All user-supplied locale values are validated against the supported list
- [ ] Middleware is registered in the correct group for locale-aware routes
- [ ] Cache keys for localized content include the locale
- [ ] `app()->getLocale()` returns the expected value after middleware runs
- [ ] Unsupported locale values gracefully fall back to the default locale
- [ ] Translation calls use `__('namespace.key')` syntax (PHP array format preferred)
- [ ] No `__()` calls exist in business logic classes
- [ ] Performance: ### Translation File Loading
- [ ] Performance: PHP files benefit from OpCache after first load. JSON files require `file_get...
- [ ] Performance: ### In-Memory Cache

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Locale Detection Flow
- [ ] Architecture guideline: SetLocale Middleware
- [ ] Architecture guideline: â†’ Determine locale (URL prefix / session / user preference / browser)
- [ ] Architecture guideline: â†’ Validate against allowed locales
- [ ] Architecture guideline: â†’ app()->setLocale($locale)
- [ ] Architecture guideline: â†’ return $next($request)
- [ ] Architecture guideline: ### Detection Strategies
- [ ] Architecture guideline: - **URL Prefix** â€” SEO-friendly, shareable, cacheable. Most recommended for public applications.
- [ ] Architecture guideline: - **Session** â€” Simple, no URL complexity. Not SEO-friendly.
- [ ] Architecture guideline: - **User Preference** â€” Persists across devices. Requires authentication.
- [ ] Architecture guideline: - **Browser Header** â€” Zero configuration. No override without UI.
- [ ] Architecture guideline: ### Translation File Organization

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Use PHP Array Format for Application Translations
- [ ] Best practice: Set Fallback Locale Properly
- [ ] Best practice: Validate Locale from User Input
- [ ] Best practice: Always Pass count Parameter for Pluralization
- [ ] Best practice: Use Locale in Cache Keys
- [ ] Skill applied: Implement Locale Detection Middleware

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] ### Translation File Loading
- [ ] PHP files benefit from OpCache after first load. JSON files require `file_get_contents()` + `json_decode()` on first ...
- [ ] ### In-Memory Cache
- [ ] Translator stores loaded translations in `$loaded` property. File I/O paid once per locale per request, not per trans...
- [ ] ### Pluralization Cost
- [ ] 0.01-0.05ms per pluralized call. Negligible for typical usage.
- [ ] ### Locale-Specific Cache Keys
- [ ] Doubles or triples cache storage proportionally to active locale count. Each locale needs separate cached content.

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Unvalidated Locale Injection
- [ ] User-supplied locale values from URL, session, or form input must be validated. An attacker could set the locale to a...
- [ ] ### XSS via Translation Strings
- [ ] If translation strings contain user-controlled content (e.g., `:name` parameters), ensure output is escaped. Blade's ...
- [ ] ### Translation File Integrity
- [ ] If `lang/` files are corrupted or maliciously modified, translated output is affected. Protect with filesystem permis...

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
- [ ] Supported locales list is defined and includes all available translation directories
- [ ] Fallback locale is configured to the most complete translation set
- [ ] All user-supplied locale values are validated against the supported list
- [ ] Middleware is registered in the correct group for locale-aware routes
- [ ] Cache keys for localized content include the locale
- [ ] `app()->getLocale()` returns the expected value after middleware runs
- [ ] Unsupported locale values gracefully fall back to the default locale

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Translation in Business Logic -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: JSON Format for Application Translations -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing Locale in Cache Keys -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Unvalidated User-Supplied Locale Values -- apply preferred alternative
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
### Skills (from 06)
- Implement Locale Detection Middleware
### Decision Trees (from 07)
- URL Prefix Locale Detection vs Session/Browser/User Preference Detection
- PHP Array Translation Files vs JSON Translation Files
- __() in Business Logic vs Translation in View Layer Only
- Application Translations vs Package Translation Publishing
### Anti-Patterns (from 08)
- Translation in Business Logic
- JSON Format for Application Translations
- Missing Locale in Cache Keys
- Unvalidated User-Supplied Locale Values
### Related Rules (from 06 skills)
- Use PHP Array Format for Application Translations (05-rules.md)
- Always Set and Configure the Fallback Locale (05-rules.md)
- Validate All User-Supplied Locale Values (05-rules.md)
- Always Pass the count Parameter for Pluralization (05-rules.md)
- Include Locale in Cache Keys for Localized Content (05-rules.md)
- Never Call __() in Business Logic Classes (05-rules.md)
- Do Not Translate Technical Messages (05-rules.md)
### Related Skills (from 06 skills)
- Skill: Configure Middleware Pipeline via Kernel
- Skill: Configure Application via Fluent API

