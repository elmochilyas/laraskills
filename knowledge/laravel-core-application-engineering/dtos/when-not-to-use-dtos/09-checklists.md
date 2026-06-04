# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** When NOT to Use DTOs
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] The 2-3 layer threshold is met before introducing a DTO
- [ ] DTO transforms/renames fields â€” it does not just mirror FormRequest keys
- [ ] Team convention makes DTOs opt-in, not required for every controller
- [ ] API responses use API Resources, not DTOs
- [ ] Migration path exists: start without DTOs, add when a second entry point appears
- [ ] Rationale is documented when DTOs are intentionally skipped for complex operations

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Apply the 2-3 layer threshold before introducing a DTO
- [ ] Architecture guideline: - Simple CRUD: no DTO required â€” `$request->validated()` is sufficient
- [ ] Architecture guideline: - Complex workflows (3+ layers, multiple entry points): DTO required
- [ ] Architecture guideline: - API responses: use API Resources, not DTOs (Resources are designed for response shaping)
- [ ] Architecture guideline: - Migration path: Start without DTOs â†’ Add when second entry point appears or field-related bug...
- [ ] Decision: DTO vs No DTO (2-3 Layer Threshold) - ensure correct choice is made
- [ ] Decision: Start With vs Without DTO - ensure correct choice is made
- [ ] Decision: DTO vs API Resource for Output - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Decide Whether to Introduce a DTO for a Data Flow

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
- [ ] The 2-3 layer threshold is met before introducing a DTO
- [ ] DTO transforms/renames fields â€” it does not just mirror FormRequest keys
- [ ] Team convention makes DTOs opt-in, not required for every controller
- [ ] API responses use API Resources, not DTOs
- [ ] Migration path exists: start without DTOs, add when a second entry point appears
- [ ] Rationale is documented when DTOs are intentionally skipped for complex operations

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Dogmatic DTO -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Premature Abstraction -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Echo Chamber DTO -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: DTOs for API Responses -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: DTO Churn -- apply preferred alternative
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
- Decide Whether to Introduce a DTO for a Data Flow
### Decision Trees (from 07)
- DTO vs No DTO (2-3 Layer Threshold)
- Start With vs Without DTO
- DTO vs API Resource for Output
### Anti-Patterns (from 08)
- The Dogmatic DTO
- The Premature Abstraction
- The Echo Chamber DTO
- DTOs for API Responses
- DTO Churn
### Related Rules (from 06 skills)
- Rule 1: Apply the 2-3 Layer Threshold Before Introducing a DTO
- Rule 2: Skip DTOs That Mirror FormRequest Keys Exactly with No Transformation
- Rule 3: Make DTOs Opt-In, Not Default â€” Avoid Team Dogma
- Rule 4: Start Without DTOs and Introduce Them When a Second Entry Point Appears
- Rule 5: Use API Resources, Not DTOs, for HTTP Response Shaping
- Rule 6: Document the Rationale When Intentionally Skipping a DTO for a Complex Operation
- Rule 7: Avoid DTO Churn During Rapid Prototyping and MVP Phases
### Related Skills (from 06 skills)
- DTO Fundamentals: Implement Baseline DTO
- DTO vs Form Request: Bridge FormRequest to DTO
- DTO vs Value Object: Introduce a Value Object with Constructor Invariants

