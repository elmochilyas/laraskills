# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** DTO Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Every factory method has at least one valid-input test
- [ ] Output shape tests assert exact keys and values with `assertSame()`
- [ ] Null/optional field handling has explicit test cases
- [ ] Invalid input rejection has one test per distinct validation path
- [ ] Data providers are used for construction variants where applicable
- [ ] Tests verify the contract, not the implementation
- [ ] Tests do not assert PHP-enforced type hints
- [ ] DTO tests complete in <50ms total
- [ ] DTO tests run as the first stage in CI pipeline

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Test DTOs as unit tests (pure assertions) â€” no integration scaffolding needed
- [ ] Architecture guideline: - For `fromModel` tests, use a factory-built model (light integration) or mock the model
- [ ] Architecture guideline: - For `fromRequest` tests, mock `validated()` to return known data
- [ ] Architecture guideline: - Name test methods to document the DTO contract: `test_from_array_sets_name_and_email()`, `test_...
- [ ] Architecture guideline: - Use data providers for multiple construction variants to reduce duplication
- [ ] Decision: Contract Tests vs Implementation Tests - ensure correct choice is made
- [ ] Decision: Data Provider vs Separate Test Methods - ensure correct choice is made
- [ ] Decision: CI Pipeline Order - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Write DTO Contract Tests

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
- [ ] Every factory method has at least one valid-input test
- [ ] Output shape tests assert exact keys and values with `assertSame()`
- [ ] Null/optional field handling has explicit test cases
- [ ] Invalid input rejection has one test per distinct validation path
- [ ] Data providers are used for construction variants where applicable
- [ ] Tests verify the contract, not the implementation
- [ ] Tests do not assert PHP-enforced type hints

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Implementation Spy -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Over-Tested Constructor -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Untested Factory -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Testing PHP-Enforced Type Hints -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Testing Through HTTP Integration Tests -- apply preferred alternative
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
- Write DTO Contract Tests
### Decision Trees (from 07)
- Contract Tests vs Implementation Tests
- Data Provider vs Separate Test Methods
- CI Pipeline Order
### Anti-Patterns (from 08)
- The Implementation Spy
- The Over-Tested Constructor
- The Untested Factory
- Testing PHP-Enforced Type Hints
- Testing Through HTTP Integration Tests
### Related Rules (from 06 skills)
- Rule 1: Test the DTO's Contract, Not Its Implementation
- Rule 2: Use Data Providers for Construction Variants
- Rule 3: Run DTO Tests First in the CI Pipeline
- Rule 4: Test Every Factory Method with at Least One Valid-Input Test
- Rule 5: Test Invalid Input Rejection with Explicit Validation Test Cases
- Rule 6: Test Output Methods for Expected Shape, Keys, Types, and Null Handling
### Related Skills (from 06 skills)
- Data Object Transformation: Implement and Test DTO Output Methods
- Data Object Validation: Add Domain-Level Validation to a DTO

