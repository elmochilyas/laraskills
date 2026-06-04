# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** Data Object Transformation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `toArray()` is the single canonical output method
- [ ] `JsonSerializable` delegates to `toArray()`
- [ ] Output keys are explicitly mapped, not derived from property names
- [ ] Internal/sensitive fields are not exposed
- [ ] No business logic or expensive computations in `toArray()`
- [ ] Nested DTOs serialize recursively via child `toArray()` calls
- [ ] No circular references in DTO tree
- [ ] Round-trip consistency verified for bidirectional DTOs
- [ ] Test asserts exact output shape including all keys and types

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Establish output format conventions: ISO 8601 for dates, integers for cents, consistent null ha...
- [ ] Architecture guideline: - Use `toArray()` as the single output method; `JsonSerializable` delegates to it
- [ ] Architecture guideline: - For bidirectional DTOs, ensure casters are invertible (input cast â†” output serialize)
- [ ] Architecture guideline: - Test each output method: expected keys, value types, null handling, date formatting
- [ ] Architecture guideline: - For large collections (10,000+), use streaming serialization instead of bulk `toArray()`
- [ ] Decision: Single `toArray()` vs Multiple Output Shapes (Transformer) - ensure correct choice is made
- [ ] Decision: Bidirectional vs Input-Only vs Output-Only DTO - ensure correct choice is made
- [ ] Decision: Explicit Key Mapping vs Dynamic Serialization - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement and Test DTO Output Methods
- [ ] Skill applied: Build a Dedicated DTO Transformer for Multiple Output Shapes

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
- [ ] `toArray()` is the single canonical output method
- [ ] `JsonSerializable` delegates to `toArray()`
- [ ] Output keys are explicitly mapped, not derived from property names
- [ ] Internal/sensitive fields are not exposed
- [ ] No business logic or expensive computations in `toArray()`
- [ ] Nested DTOs serialize recursively via child `toArray()` calls
- [ ] No circular references in DTO tree

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Conditional toArray -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Business Logic Transformer -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Leaky DTO -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Round-Trip Breaking -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Recursive Serialization Overflow -- apply preferred alternative
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
- Implement and Test DTO Output Methods
- Build a Dedicated DTO Transformer for Multiple Output Shapes
### Decision Trees (from 07)
- Single `toArray()` vs Multiple Output Shapes (Transformer)
- Bidirectional vs Input-Only vs Output-Only DTO
- Explicit Key Mapping vs Dynamic Serialization
### Anti-Patterns (from 08)
- The Conditional toArray
- The Business Logic Transformer
- The Leaky DTO
- Round-Trip Breaking
- Recursive Serialization Overflow
### Related Rules (from 06 skills)
- Rule 1: Use `toArray()` as the Canonical Output Method
- Rule 2: Never Include Business Logic in `toArray()`
- Rule 3: Separate Output Shapes with Dedicated Transformers or Output DTOs
- Rule 4: Ensure Round-Trip Consistency for Bidirectional DTOs
- Rule 5: Use Key Mapping to Decouple Internal Property Names from External Representations
- Rule 6: Control the Serialization Surface â€” Never Leak Internal Fields
- Rule 7: Use Dedicated Output DTOs When Input and Output Shapes Diverge Significantly
- Rule 8: Prevent Circular References in Recursive Serialization
### Related Skills (from 06 skills)
- DTO Fundamentals: Implement Baseline DTO
- Nested DTOs: Construct and Serialize Nested DTO Trees
- DTO Testing: Write DTO Contract Tests

