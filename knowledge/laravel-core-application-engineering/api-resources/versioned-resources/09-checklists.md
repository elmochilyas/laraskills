# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** API Resources
**Knowledge Unit:** Versioned Resources
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Never Modify Old Version Resources After Release
- [ ] Enforce: Cap Inheritance at 2 Levels Maximum
- [ ] Enforce: Always Version Collections Alongside Individual Resources
- [ ] Enforce: Use Deprecation Headers on Old Versions
- [ ] Enforce: Set a Sunset Policy with Maximum 3 Concurrent Versions
- [ ] Enforce: Prefer Copy-and-Modify for Major Versions, Inheritance for Minor
- [ ] Enforce: Version Controllers and Resources Together
- [ ] Enforce: Never Use Conditional Version Logic Inside a Single Resource
- [ ] Enforce: Backport Security Fixes to All Supported Versions
- [ ] Resources are organized by version directory (`V1/`, `V2/`, etc.)
- [ ] Collections are versioned alongside their individual resources
- [ ] Old version resources are frozen â€” no structural changes after release (enforced by CI if possible)
- [ ] Deprecation headers are set on old versions
- [ ] A sunset policy exists and is documented (max 3 concurrent versions)
- [ ] Tests verify each version's resource shape independently
- [ ] Inheritance is capped at 2 levels maximum

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - URL-based versioning is more discoverable and testable than header-based. Use URL versioning fo...
- [ ] Architecture guideline: - Version controllers and resources together â€” the controller version determines the resource v...
- [ ] Architecture guideline: - Use PHP namespaces to map to version directories: `App\Http\Resources\V1\UserResource`.
- [ ] Architecture guideline: - Bug fixes should change behavior (actual data), not structure (fields, types, keys). Structural...
- [ ] Architecture guideline: - For additive changes (new fields only), consider whether a new version is needed. Adding fields...
- [ ] Architecture guideline: - Generate versioned resources via Artisan: `php artisan make:resource V2/User/UserResource`.

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Never Modify Old Version Resources After Release
- [ ] Apply rule: Cap Inheritance at 2 Levels Maximum
- [ ] Apply rule: Always Version Collections Alongside Individual Resources
- [ ] Apply rule: Use Deprecation Headers on Old Versions
- [ ] Apply rule: Set a Sunset Policy with Maximum 3 Concurrent Versions
- [ ] Apply rule: Prefer Copy-and-Modify for Major Versions, Inheritance for Minor
- [ ] Apply rule: Version Controllers and Resources Together
- [ ] Apply rule: Never Use Conditional Version Logic Inside a Single Resource
- [ ] Apply rule: Backport Security Fixes to All Supported Versions
- [ ] Skill applied: Create a Versioned API Resource

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
- [ ] Resources are organized by version directory (`V1/`, `V2/`, etc.)
- [ ] Collections are versioned alongside their individual resources
- [ ] Old version resources are frozen â€” no structural changes after release (enforced by CI if possible)
- [ ] Deprecation headers are set on old versions
- [ ] A sunset policy exists and is documented (max 3 concurrent versions)
- [ ] Tests verify each version's resource shape independently
- [ ] Inheritance is capped at 2 levels maximum

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Modifying Old Version Resources After Release -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Deep Inheritance Chain -- apply preferred alternative
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
- Never Modify Old Version Resources After Release
- Cap Inheritance at 2 Levels Maximum
- Always Version Collections Alongside Individual Resources
- Use Deprecation Headers on Old Versions
- Set a Sunset Policy with Maximum 3 Concurrent Versions
- Prefer Copy-and-Modify for Major Versions, Inheritance for Minor
- Version Controllers and Resources Together
- Never Use Conditional Version Logic Inside a Single Resource
- Backport Security Fixes to All Supported Versions
### Skills (from 06)
- Create a Versioned API Resource
### Anti-Patterns (from 08)
- Modifying Old Version Resources After Release
- Deep Inheritance Chain
### Related Rules (from 06 skills)
- Never Modify Old Version Resources After Release (Reliability)
- Cap Inheritance at 2 Levels Maximum (Maintainability)
- Always Version Collections Alongside Individual Resources (Code Organization)
- Use Deprecation Headers on Old Versions (Reliability)
- Set a Sunset Policy with Maximum 3 Concurrent Versions (Scalability)
- Prefer Copy-and-Modify for Major Versions, Inheritance for Minor (Architecture)
- Version Controllers and Resources Together (Architecture)
- Never Use Conditional Version Logic Inside a Single Resource (Maintainability)
- Backport Security Fixes to All Supported Versions (Security)
### Related Skills (from 06 skills)
- [Resource Organization](../resource-organization/06-skills.md)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Resource Testing](../resource-testing/06-skills.md)

