# Metadata
**Domain:** PlatformEngineeringDeveloperExperience
**Subdomain:** 03MonorepoManagement
**Knowledge Unit:** LaravelMonorepoTools
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `/packages/{package-name}` structure with independent composer.json per package
- [ ] Root composer.json has path repos and `replace` declarations
- [ ] `monorepo-builder.php` configured with directory-to-repo mappings
- [ ] Change-detection CI filters packages correctly
- [ ] Tag-based split automation works end to end
- [ ] No circular package dependencies
- [ ] Split repos are updated correctly on tag push

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Package Directory Layout:** `/packages/{package-name}` convention. Each package has its own `...
- [ ] Architecture guideline: - **Split Configuration:** `monorepo-builder.php` defines `package_directories`, `data_to_append`...
- [ ] Architecture guideline: - **Root composer.json:** Requires all packages' dependencies at compatible versions. Uses `repla...
- [ ] Architecture guideline: - **CI Pipeline:** Step 1: detect changed packages. Step 2: run changed packages' tests. Step 3: ...
- [ ] Architecture guideline: - **Release Process:** Tag in monorepo â†’ CI validates â†’ CI runs split â†’ Split repos updated...
- [ ] Decision: Monorepo vs Separate Repos? - ensure correct choice is made
- [ ] Decision: Split on Tag vs Split on Commit? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up a Laravel Monorepo with symplify/monorepo-split
- [ ] Skill applied: Configure Composer Path Repositories for Monorepos
- [ ] Skill applied: Extract Shared Libraries from Laravel Applications

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
- [ ] `/packages/{package-name}` structure with independent composer.json per package
- [ ] Root composer.json has path repos and `replace` declarations
- [ ] `monorepo-builder.php` configured with directory-to-repo mappings
- [ ] Change-detection CI filters packages correctly
- [ ] Tag-based split automation works end to end
- [ ] No circular package dependencies
- [ ] Split repos are updated correctly on tag push

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Monolith Monorepo -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Git Graveyard -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Split-Free Monorepo -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: The Manual Split -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Avoid mistake: Not Using Path Repositories in Development
- [ ] Avoid mistake: Circular Package Dependencies
- [ ] Avoid mistake: Oversized Monorepo
- [ ] Avoid mistake: Forgetting to Split Before Release

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
- Set Up a Laravel Monorepo with symplify/monorepo-split
- Configure Composer Path Repositories for Monorepos
- Extract Shared Libraries from Laravel Applications
### Decision Trees (from 07)
- Monorepo vs Separate Repos?
- Split on Tag vs Split on Commit?
### Anti-Patterns (from 08)
- The Monolith Monorepo
- The Git Graveyard
- The Split-Free Monorepo
- The Manual Split
### Common Mistakes (from 04)
- Not Using Path Repositories in Development
- Circular Package Dependencies
- Oversized Monorepo
- Forgetting to Split Before Release
### Related Skills (from 06 skills)
- Configure Composer Path Repositories for Monorepos
- Extract Shared Libraries from Laravel Applications
- Manage Dependencies Across a Laravel Monorepo

