# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** API Resources
**Knowledge Unit:** Resource Organization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Start Flat, Restructure When Needed
- [ ] Enforce: Never Mix Versioned and Non-Versioned Resources
- [ ] Enforce: Keep Maximum Directory Depth at 3-4 Levels from app/
- [ ] Enforce: Use a Base Resource Class Per Version
- [ ] Enforce: Standardize Suffix Naming Convention
- [ ] Enforce: Create Version Subdirectories Only After First Breaking Change
- [ ] Enforce: Organize Tests to Mirror Resource Structure
- [ ] Enforce: Avoid Namespace-as-Version in File Names
- [ ] Resource organizational strategy is consistent across the entire API
- [ ] No mixing of versioned and non-versioned resources
- [ ] Maximum directory depth from `app/` is 3-4 levels
- [ ] Artisan is used to generate resources for consistent naming
- [ ] Base resource class exists per version for shared metadata
- [ ] Suffix conventions are standardized and documented
- [ ] Flat structure is used before the first breaking change (not prematurely versioned)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Maximum 3-4 directory levels from `app/` (`app/Http/Resources/V1/User/UserResource.php`). Deepe...
- [ ] Architecture guideline: - Version subdirectories should appear before resource-type subdirectories: `V1/User/UserResource...
- [ ] Architecture guideline: - For modular applications, resources within domain boundaries should still follow versioning con...
- [ ] Architecture guideline: - The decision to version-organize should coincide with the first breaking API change. Before tha...
- [ ] Architecture guideline: - When migrating from flat to versioned structure, use IDE refactoring tools or automated scripts...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Start Flat, Restructure When Needed
- [ ] Apply rule: Never Mix Versioned and Non-Versioned Resources
- [ ] Apply rule: Keep Maximum Directory Depth at 3-4 Levels from app/
- [ ] Apply rule: Use a Base Resource Class Per Version
- [ ] Apply rule: Standardize Suffix Naming Convention
- [ ] Apply rule: Create Version Subdirectories Only After First Breaking Change
- [ ] Apply rule: Organize Tests to Mirror Resource Structure
- [ ] Apply rule: Avoid Namespace-as-Version in File Names
- [ ] Skill applied: Organize API Resource Files

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
- [ ] Resource organizational strategy is consistent across the entire API
- [ ] No mixing of versioned and non-versioned resources
- [ ] Maximum directory depth from `app/` is 3-4 levels
- [ ] Artisan is used to generate resources for consistent naming
- [ ] Base resource class exists per version for shared metadata
- [ ] Suffix conventions are standardized and documented
- [ ] Flat structure is used before the first breaking change (not prematurely versioned)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Premature Version Subdirectory Creation -- apply preferred alternative
    - [ ] Does `app/Http/Resources/V1/` exist without a `V2/` in production?
    - [ ] Is there only one version of the API in use?
- [ ] Prevent: Mixing Versioned and Non-Versioned Resources -- apply preferred alternative
    - [ ] Are resources in both `Resources\` and `Resources\V1\` directories?

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
- Start Flat, Restructure When Needed
- Never Mix Versioned and Non-Versioned Resources
- Keep Maximum Directory Depth at 3-4 Levels from app/
- Use a Base Resource Class Per Version
- Standardize Suffix Naming Convention
- Create Version Subdirectories Only After First Breaking Change
- Organize Tests to Mirror Resource Structure
- Avoid Namespace-as-Version in File Names
### Skills (from 06)
- Organize API Resource Files
### Anti-Patterns (from 08)
- Premature Version Subdirectory Creation
- Mixing Versioned and Non-Versioned Resources
### Related Rules (from 06 skills)
- Start Flat, Restructure When Needed (Code Organization)
- Never Mix Versioned and Non-Versioned Resources (Code Organization)
- Keep Maximum Directory Depth at 3-4 Levels from app/ (Maintainability)
- Use a Base Resource Class Per Version (Code Organization)
- Standardize Suffix Naming Convention (Maintainability)
- Create Version Subdirectories Only After First Breaking Change (Architecture)
- Organize Tests to Mirror Resource Structure (Testing)
- Avoid Namespace-as-Version in File Names (Code Organization)
### Related Skills (from 06 skills)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Versioned Resources](../versioned-resources/06-skills.md)

