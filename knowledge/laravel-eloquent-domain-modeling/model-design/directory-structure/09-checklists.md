# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Design
**Knowledge Unit:** Directory Structure
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Start Flat, Split by Domain When Navigation Suffers
- [ ] Enforce: Match Namespace Exactly to Directory Structure
- [ ] Enforce: Apply One Organizational Pattern Consistently
- [ ] Enforce: Use Module-Based Structure Only for Bounded Contexts
- [ ] Enforce: Place Enum and DTO Classes Outside the Models Directory
- [ ] Enforce: Keep Base Model and Traits Outside Domain Subdirectories
- [ ] Namespace exactly matches directory path relative to `app/`
- [ ] One consistent pattern is used (no mixing of flat and subdirectory approaches)
- [ ] Base model and shared traits remain outside domain directories
- [ ] Enums, DTOs, and value objects are not inside `app/Models/`
- [ ] Module-based structure is used only when bounded contexts exist

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Default: `app/Models/{Model}.php` with `App\Models` namespace
- [ ] Architecture guideline: - Growing: `app/Models/{Domain}/{Model}.php` with `App\Models\{Domain}` namespace
- [ ] Architecture guideline: - DDD: `app/Modules/{Module}/Models/{Model}.php` with `App\Modules\{Module}\Models` namespace

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Start Flat, Split by Domain When Navigation Suffers
- [ ] Apply rule: Match Namespace Exactly to Directory Structure
- [ ] Apply rule: Apply One Organizational Pattern Consistently
- [ ] Apply rule: Use Module-Based Structure Only for Bounded Contexts
- [ ] Apply rule: Place Enum and DTO Classes Outside the Models Directory
- [ ] Apply rule: Keep Base Model and Traits Outside Domain Subdirectories
- [ ] Skill applied: Organize Models by Domain with Matching Namespaces

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
- [ ] Namespace exactly matches directory path relative to `app/`
- [ ] One consistent pattern is used (no mixing of flat and subdirectory approaches)
- [ ] Base model and shared traits remain outside domain directories
- [ ] Enums, DTOs, and value objects are not inside `app/Models/`
- [ ] Module-based structure is used only when bounded contexts exist

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
### Rules (from 05)
- Start Flat, Split by Domain When Navigation Suffers
- Match Namespace Exactly to Directory Structure
- Apply One Organizational Pattern Consistently
- Use Module-Based Structure Only for Bounded Contexts
- Place Enum and DTO Classes Outside the Models Directory
- Keep Base Model and Traits Outside Domain Subdirectories
### Skills (from 06)
- Organize Models by Domain with Matching Namespaces
### Related Rules (from 06 skills)
- Start Flat, Split by Domain When Navigation Suffers
- Match Namespace Exactly to Directory Structure
- Apply One Organizational Pattern Consistently
- Place Enum and DTO Classes Outside the Models Directory
- Keep Base Model and Traits Outside Domain Subdirectories
### Related Skills (from 06 skills)
- Model Conventions for Naming Standards
- Base Model Class Configuration
- Trait Decomposition for Cross-Cutting Concerns

