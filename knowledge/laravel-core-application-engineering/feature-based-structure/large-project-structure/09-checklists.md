# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Feature-Based Structure
**Knowledge Unit:** Vertical Slice Architecture / Shared Kernel
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Sub-feature directories follow the same internal structure as top-level features
- [ ] Namespaces updated in all moved files
- [ ] Sub-feature service providers created and registered by parent provider
- [ ] Routes moved to sub-feature route files with appropriate prefixes
- [ ] Tests mirrored for sub-features
- [ ] `composer dump-autoload` run
- [ ] Full test suite passes
- [ ] Sub-feature conventions are consistent across all sub-features

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Sub-features have their own service providers registered by the parent feature's provider
- [ ] Architecture guideline: - Domain groups can have their own service provider that registers child feature providers
- [ ] Architecture guideline: - Shared kernel must not depend on any feature â€” it's the foundation everything else builds on
- [ ] Architecture guideline: - Autoloading with explicit PSR-4 prefixes for domain groups if needed
- [ ] Architecture guideline: - Monorepo recommended over multi-repo for most projects; extract only when independent deploymen...
- [ ] Decision: Sub-Feature Splitting Threshold (When to Split a Feature) - ensure correct choice is made
- [ ] Decision: Domain Groups vs Flat Feature List for Large Projects - ensure correct choice is made
- [ ] Decision: Shared Kernel Content (What Goes in app/Kernel/) - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Split A Feature Into Sub-Features
- [ ] Skill applied: Set Up Domain Groups For Related Features
- [ ] Skill applied: Extract A Feature Into A Standalone Package

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
- [ ] Sub-feature directories follow the same internal structure as top-level features
- [ ] Namespaces updated in all moved files
- [ ] Sub-feature service providers created and registered by parent provider
- [ ] Routes moved to sub-feature route files with appropriate prefixes
- [ ] Tests mirrored for sub-features
- [ ] `composer dump-autoload` run
- [ ] Full test suite passes

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

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
- Split A Feature Into Sub-Features
- Set Up Domain Groups For Related Features
- Extract A Feature Into A Standalone Package
### Decision Trees (from 07)
- Sub-Feature Splitting Threshold (When to Split a Feature)
- Domain Groups vs Flat Feature List for Large Projects
- Shared Kernel Content (What Goes in app/Kernel/)
### Related Rules (from 06 skills)
- Split Features Into Sub-Features At ~20 Files (05-rules.md)
- Establish Sub-Feature Convention Consistency (05-rules.md)
- Use Domain Groups For Related Features (05-rules.md)
- Establish A Feature Lifecycle (05-rules.md)
### Related Skills (from 06 skills)
- Set Up Domain Groups For Related Features
- Create A New Feature Scaffold
- Maintain Consistent Feature Directory Structure (module-organization)

