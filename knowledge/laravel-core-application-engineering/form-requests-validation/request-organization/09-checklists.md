# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Request Organization
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Subdirectories created for each entity/domain with 2+ requests
- [ ] Namespace matches directory structure (e.g., `App\Http\Requests\User\StoreUserRequest`)
- [ ] All imports in controllers and tests updated
- [ ] Naming convention `{Action}{Entity}Request` applied consistently
- [ ] No mixed organization (flat + domain-based in same project)
- [ ] Single-entity directories contain only the entity's requests
- [ ] Convention documented for future contributions

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Default location: `app/Http/Requests/` with optional domain subdirectories
- [ ] Architecture guideline: - Naming: `{Verb}{Entity}Request` where Verb = Store/Update/Show/Delete/Index
- [ ] Architecture guideline: - Inheritance: Abstract base class extends `FormRequest`, specific requests extend base
- [ ] Architecture guideline: - Base class pattern: `abstract class UserRequest extends FormRequest` with `commonRules()` method
- [ ] Architecture guideline: - Container resolution: Controller type-hint triggers auto-resolution and validation
- [ ] Architecture guideline: - No registration step needed â€” PSR-4 autoloading handles discovery
- [ ] Decision: Flat app/Http/Requests/ vs Domain-Subdirectory Organization - ensure correct choice is made
- [ ] Decision: Naming Convention: ActionEntityRequest vs EntityActionRequest - ensure correct choice is made
- [ ] Decision: Inheritance: Base Request Class vs Per-Action Duplication - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Organize FormRequests Using Domain-Based Directories
- [ ] Skill applied: Structure Shared Validation Rules Using Inheritance and Traits

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
- [ ] Subdirectories created for each entity/domain with 2+ requests
- [ ] Namespace matches directory structure (e.g., `App\Http\Requests\User\StoreUserRequest`)
- [ ] All imports in controllers and tests updated
- [ ] Naming convention `{Action}{Entity}Request` applied consistently
- [ ] No mixed organization (flat + domain-based in same project)
- [ ] Single-entity directories contain only the entity's requests
- [ ] Convention documented for future contributions

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: One FormRequest Per Controller Action in the Same Class -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Inconsistent File Naming for Form Requests -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Deep Directory Nesting for Form Requests -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: FormRequest Class Name Collisions â€” No Entity Prefix -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Not Using Abstract Base Requests -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Including Request-Specific Logic in Shared Abstract Requests -- apply preferred alternative
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
- Organize FormRequests Using Domain-Based Directories
- Structure Shared Validation Rules Using Inheritance and Traits
### Decision Trees (from 07)
- Flat app/Http/Requests/ vs Domain-Subdirectory Organization
- Naming Convention: ActionEntityRequest vs EntityActionRequest
- Inheritance: Base Request Class vs Per-Action Duplication
### Anti-Patterns (from 08)
- One FormRequest Per Controller Action in the Same Class
- Inconsistent File Naming for Form Requests
- Deep Directory Nesting for Form Requests
- FormRequest Class Name Collisions â€” No Entity Prefix
- Not Using Abstract Base Requests
- Including Request-Specific Logic in Shared Abstract Requests
### Related Rules (from 06 skills)
- Rule 1: Name FormRequests {Action}{Entity}Request Consistently
- Rule 2: One Request Per Action â€” Always
- Rule 4: Use Domain-Based Directories at 15+ FormRequests
- Rule 6: Consistent Directory Structure Across the Project
### Related Skills (from 06 skills)
- Structure Shared Validation Rules Using Inheritance and Traits
- Create and Wire a FormRequest to a Controller Action

