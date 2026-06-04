# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development & Shared Libraries
**Knowledge Unit:** TranslationFileLoadingPackages
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `loadTranslationsFrom()` called in service provider
- [ ] Translation namespace unique, matches package name
- [ ] All user-facing strings use `__()` or `@lang()`
- [ ] Default locale (English) has complete translations
- [ ] Translations publishable via tagged command
- [ ] Pluralization handled with `trans_choice()`
- [ ] No sensitive info in translation files
- [ ] Test verifies `__()` resolves correctly

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Single Directory Pattern:** Store all translation files in `resources/lang/` with locale subd...
- [ ] Architecture guideline: - **JSON for Short Strings Pattern:** Use `en.json` for short, self-contained strings that don't ...
- [ ] Architecture guideline: - **Fallback Key Pattern:** Use meaningful English strings as keys for JSON translations (e.g., `...
- [ ] Architecture guideline: - **Override Documentation Pattern:** In the package README, document which translation keys exis...
- [ ] Architecture guideline: - **Spatie Tools Pattern:** Use `->hasTranslations()` in `configurePackage()` to register the tra...
- [ ] Architecture guideline: - **Default Locale:** Provide English (`en`) as the complete default locale; accept community con...
- [ ] Architecture guideline: - **Key Naming:** Use dot notation for hierarchical keys (`messages.welcome`, `errors.not_found`,...
- [ ] Decision: PHP Array vs JSON Translation Files? - ensure correct choice is made
- [ ] Decision: Namespaced vs Global Translations? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up Translation File Loading in Laravel Packages

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
- [ ] `loadTranslationsFrom()` called in service provider
- [ ] Translation namespace unique, matches package name
- [ ] All user-facing strings use `__()` or `@lang()`
- [ ] Default locale (English) has complete translations
- [ ] Translations publishable via tagged command
- [ ] Pluralization handled with `trans_choice()`
- [ ] No sensitive info in translation files

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: No translation support -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Global namespace translations -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: One giant translation file -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Translation as configuration -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Skipping fallback locale -- apply preferred alternative
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
- Set Up Translation File Loading in Laravel Packages
### Decision Trees (from 07)
- PHP Array vs JSON Translation Files?
- Namespaced vs Global Translations?
### Anti-Patterns (from 08)
- No translation support
- Global namespace translations
- One giant translation file
- Translation as configuration
- Skipping fallback locale
### Related Skills (from 06 skills)
- Set Up a Package Service Provider with Spatie Tools
- Register View Components in Laravel Packages
- Register Blade Component Namespacing for Laravel Packages

