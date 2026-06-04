# Metadata
**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Package Development & Shared Libraries
**Knowledge Unit:** PackageAssetPublishing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Assets published with specific tag (`--tag=package-name-assets`)
- [ ] Pre-built (compiled, minified) assets available for zero-config setup
- [ ] Asset URLs include version strings for cache busting
- [ ] `--force` used in deployment scripts
- [ ] No unnecessary files (node_modules, tests) in published output
- [ ] Published assets minified and gzip-ready
- [ ] Fallback or error handling for missing published assets

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **dist/ Directory Pattern:** Store compiled, minified assets in `resources/dist/` of the packag...
- [ ] Architecture guideline: - **Source + Dist Pattern:** Ship both `resources/js/` (source Vue/React components) and `resourc...
- [ ] Architecture guideline: - **Vite Integration Pattern:** For Vite-based packages, configure the consumer's `vite.config.js...
- [ ] Architecture guideline: - **Symlink Alternative Pattern:** Instead of publishing, use symlinks for development; this avoi...
- [ ] Architecture guideline: - **Conditional Asset Publishing Pattern:** Use Spatie tools' `hasAssets()` method with condition...
- [ ] Architecture guideline: - **Publication Target:** `public/vendor/package-name/` for pre-built; `resources/` for source as...
- [ ] Architecture guideline: - **Asset Format:** Pre-built (minified) for zero-config; both pre-built and source for flexibility
- [ ] Decision: Pre-Built vs Source Assets? - ensure correct choice is made
- [ ] Decision: Publish to public/ vs resources/? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Publish Frontend Assets from Laravel Packages
- [ ] Skill applied: Set Up Migration Publishing and Discovery for Laravel Packages

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
- [ ] Assets published with specific tag (`--tag=package-name-assets`)
- [ ] Pre-built (compiled, minified) assets available for zero-config setup
- [ ] Asset URLs include version strings for cache busting
- [ ] `--force` used in deployment scripts
- [ ] No unnecessary files (node_modules, tests) in published output
- [ ] Published assets minified and gzip-ready
- [ ] Fallback or error handling for missing published assets

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Publishing everything from vendor -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: No pre-built option -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Inconsistent asset directory naming -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Versioning in file names only -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: One asset file for everything -- apply preferred alternative
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
- Publish Frontend Assets from Laravel Packages
- Set Up Migration Publishing and Discovery for Laravel Packages
### Decision Trees (from 07)
- Pre-Built vs Source Assets?
- Publish to public/ vs resources/?
### Anti-Patterns (from 08)
- Publishing everything from vendor
- No pre-built option
- Inconsistent asset directory naming
- Versioning in file names only
- One asset file for everything
### Related Skills (from 06 skills)
- Implement Config File Merging and Publishing
- Set Up Migration Publishing and Discovery
- Integrate Vite with Laravel Packages

