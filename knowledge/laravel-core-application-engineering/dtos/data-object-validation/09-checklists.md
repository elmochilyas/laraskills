# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** Data Object Validation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] DTO validation covers domain-level constraints only
- [ ] Validation rules do not duplicate FormRequest rules
- [ ] No database queries in DTO validation rules
- [ ] No side effects in validation rules
- [ ] Cross-field validation is placed in the correct layer (DTO for domain, FormRequest for HTTP)
- [ ] CLI/queue entry points have DTO validation as their sole validation layer
- [ ] `Data::fromRaw()` or `new Data(...)` is not used in production code paths
- [ ] Context is validated when using spatie/laravel-data's `rules(Context $context)`

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Use FormRequest for HTTP-specific rules (authorization, input format, database constraints)
- [ ] Architecture guideline: - Use DTO validation for domain-level constraints (business rules, cross-field validation for non...
- [ ] Architecture guideline: - For CLI/queue entry points, the DTO serves as the sole validation layer
- [ ] Architecture guideline: - Avoid database queries (`unique:users,email`) in DTO validation â€” cache unique checks or defe...
- [ ] Architecture guideline: - Test DTO validation independently of HTTP by constructing the DTO with invalid data and asserti...
- [ ] Decision: DTO Validation vs FormRequest Validation - ensure correct choice is made
- [ ] Decision: Constructor Validation vs Declarative `rules()` Method - ensure correct choice is made
- [ ] Decision: Database Queries in Validation vs Defer to Service Layer - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Add Domain-Level Validation to a DTO

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
- [ ] DTO validation covers domain-level constraints only
- [ ] Validation rules do not duplicate FormRequest rules
- [ ] No database queries in DTO validation rules
- [ ] No side effects in validation rules
- [ ] Cross-field validation is placed in the correct layer (DTO for domain, FormRequest for HTTP)
- [ ] CLI/queue entry points have DTO validation as their sole validation layer
- [ ] `Data::fromRaw()` or `new Data(...)` is not used in production code paths

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Double Validation -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Validating DTO (Heavy Validation) -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Silent Pass-Through -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Validation Bypass via fromRaw -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Complex Cross-Field Validation in DTOs -- apply preferred alternative
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
- Add Domain-Level Validation to a DTO
### Decision Trees (from 07)
- DTO Validation vs FormRequest Validation
- Constructor Validation vs Declarative `rules()` Method
- Database Queries in Validation vs Defer to Service Layer
### Anti-Patterns (from 08)
- The Double Validation
- The Validating DTO (Heavy Validation)
- The Silent Pass-Through
- Validation Bypass via fromRaw
- Complex Cross-Field Validation in DTOs
### Related Rules (from 06 skills)
- Rule 1: Use DTO Validation for Domain-Level Rules Only
- Rule 2: Never Use Database Queries in DTO Validation Rules
- Rule 3: Choose One Validation Layer â€” Never Validate the Same Rules in Both FormRequest and DTO
- Rule 4: Keep Validation Pure â€” No Side Effects in Validation Rules
- Rule 5: Validate Context Passed to `rules(Context $context)` from Untrusted Sources
- Rule 6: Audit All DTO Construction Points for Validation Bypass
- Rule 7: Do Not Define DTO Validation in the Constructor â€” Prefer Declarative `rules()` Methods
### Related Skills (from 06 skills)
- DTO Fundamentals: Implement Baseline DTO
- DTO Construction Patterns: Add Named Static Factories to a DTO
- DTO Testing: Write DTO Contract Tests

