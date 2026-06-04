# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** DTO vs Value Object
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] VO validates invariants in the constructor and throws on invalid input
- [ ] VO implements `equals()` for value-based comparison
- [ ] VO has no setter methods (readonly enforced)
- [ ] VO has focused behavior related to the value it represents
- [ ] DTO does not have domain behavior methods
- [ ] DTO serializes VOs explicitly in `toArray()` â€” never returns raw VO objects
- [ ] DTO factory methods construct VOs from source data
- [ ] Tests cover valid construction, invalid rejection, equality, and behavior

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - VOs at system boundaries: validate at controllers, command handlers, queue jobs. Once inside th...
- [ ] Architecture guideline: - Scalar in DTO â†’ VO in Service: Option A (simpler DTOs) vs Option B (more expressive DTOs). Ch...
- [ ] Architecture guideline: - Serialization symmetry: When DTOs contain VOs, handle VO-to-primitive conversion in `toArray()`...
- [ ] Architecture guideline: - Primitive obsession policy: Decide at team level which identifiers (user_id, order_id) require ...
- [ ] Decision: DTO vs Value Object Selection - ensure correct choice is made
- [ ] Decision: VO Inside DTO vs Scalar in DTO + VO in Service - ensure correct choice is made
- [ ] Decision: Value Comparison on DTO vs Reference Comparison - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Introduce a Value Object with Constructor Invariants

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
- [ ] VO validates invariants in the constructor and throws on invalid input
- [ ] VO implements `equals()` for value-based comparison
- [ ] VO has no setter methods (readonly enforced)
- [ ] VO has focused behavior related to the value it represents
- [ ] DTO does not have domain behavior methods
- [ ] DTO serializes VOs explicitly in `toArray()` â€” never returns raw VO objects
- [ ] DTO factory methods construct VOs from source data

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Ceremony Wrapper -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The DTO-VO Hybrid -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The God VO -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Primitive Obsession in DTOs -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Comparing DTOs by Value -- apply preferred alternative
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
- Introduce a Value Object with Constructor Invariants
### Decision Trees (from 07)
- DTO vs Value Object Selection
- VO Inside DTO vs Scalar in DTO + VO in Service
- Value Comparison on DTO vs Reference Comparison
### Anti-Patterns (from 08)
- The Ceremony Wrapper
- The DTO-VO Hybrid
- The God VO
- Primitive Obsession in DTOs
- Comparing DTOs by Value
### Related Rules (from 06 skills)
- Rule 1: Use Value Objects for Domain Concepts with Invariants; Use DTOs for Layer Crossing
- Rule 2: Value Objects Must Enforce Invariants in the Constructor
- Rule 3: DTOs Must Not Have Domain Behavior Methods
- Rule 4: Use VOs Inside DTOs for Domain-Rich Properties
- Rule 5: Never Compare DTOs by Value
- Rule 6: Serialize VOs Explicitly in DTO Output Methods
### Related Skills (from 06 skills)
- DTO Fundamentals: Implement Baseline DTO
- Data Object Transformation: Implement and Test DTO Output Methods

