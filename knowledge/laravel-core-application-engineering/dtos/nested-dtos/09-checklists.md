# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** Nested DTOs
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] DTO tree is acyclic â€” no circular references
- [ ] Construction proceeds bottom-up â€” leaf DTOs constructed before parent
- [ ] Parent factory delegates to child DTO factories (factory chaining)
- [ ] Collections of DTOs have typed docblock annotations
- [ ] Optional child relationships use nullable DTO types
- [ ] Nesting depth does not exceed 3-4 levels
- [ ] All Eloquent relations are eager-loaded before `fromModel()` call
- [ ] `toArray()` recurses correctly through all nesting levels
- [ ] Serialization test covers the complete tree

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Establish a team convention for maximum DTO nesting depth (typically 3-4 levels)
- [ ] Architecture guideline: - Use nullable DTOs (`?ProfileDto`) for optional child relationships
- [ ] Architecture guideline: - Design nested DTOs with API consumer needs in mind: list endpoints flat, detail endpoints 2-3 l...
- [ ] Architecture guideline: - Replace parent object references with scalar IDs to prevent circular references
- [ ] Architecture guideline: - Use partial nesting â€” different DTO views for different use cases (list vs detail)
- [ ] Decision: Eager Construction vs Lazy/Proxy for Nested DTOs - ensure correct choice is made
- [ ] Decision: Full Nesting vs Flattening Strategy - ensure correct choice is made
- [ ] Decision: Factory Chaining vs Caller-Side Construction - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Construct and Serialize Nested DTO Trees

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
- [ ] DTO tree is acyclic â€” no circular references
- [ ] Construction proceeds bottom-up â€” leaf DTOs constructed before parent
- [ ] Parent factory delegates to child DTO factories (factory chaining)
- [ ] Collections of DTOs have typed docblock annotations
- [ ] Optional child relationships use nullable DTO types
- [ ] Nesting depth does not exceed 3-4 levels
- [ ] All Eloquent relations are eager-loaded before `fromModel()` call

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Infinity Tree (Circular References) -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The One-Size-Fits-All DTO Tree -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Hydra Factory -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Deep Nesting Beyond 4 Levels -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Inconsistent Nesting (Same Entity, Different Shapes) -- apply preferred alternative
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
- Construct and Serialize Nested DTO Trees
### Decision Trees (from 07)
- Eager Construction vs Lazy/Proxy for Nested DTOs
- Full Nesting vs Flattening Strategy
- Factory Chaining vs Caller-Side Construction
### Anti-Patterns (from 08)
- The Infinity Tree (Circular References)
- The One-Size-Fits-All DTO Tree
- The Hydra Factory
- Deep Nesting Beyond 4 Levels
- Inconsistent Nesting (Same Entity, Different Shapes)
### Related Rules (from 06 skills)
- Rule 1: Construct Nested DTOs Bottom-Up
- Rule 2: Limit DTO Nesting Depth to a Maximum of 3-4 Levels
- Rule 3: Prevent Circular References â€” Use Scalar IDs Instead of Parent Objects
- Rule 4: Use Factory Chaining â€” Each DTO Level Owns Its Own Construction
- Rule 5: Use Nullable Child DTOs for Optional Relationships
- Rule 6: Eager-Load All Eloquent Relations Before Passing Models to Nested Factories
### Related Skills (from 06 skills)
- DTO Construction Patterns: Add Named Static Factories to a DTO
- Data Object Transformation: Implement and Test DTO Output Methods
- DTO Testing: Write DTO Contract Tests

