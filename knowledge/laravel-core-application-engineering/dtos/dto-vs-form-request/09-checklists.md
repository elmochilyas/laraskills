# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Data Transfer Objects
**Knowledge Unit:** DTO vs Form Request
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Service receives DTO (or validated array), never a FormRequest
- [ ] Bridge method exists â€” either `payload()` on FormRequest or `fromRequest()` on DTO
- [ ] Bridge uses `validated()` data, never `$request->all()`
- [ ] DTO transforms/renames fields â€” it does not mirror HTTP structure exactly
- [ ] No validation rules are duplicated between FormRequest and DTO
- [ ] DTO has no HTTP dependencies (no `Request` imports)
- [ ] Controller uses the bridge method

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - The controller depends on both FormRequest and DTO; the DTO depends on nothing; the FormRequest...
- [ ] Architecture guideline: - Add a DTO when: same data shape used by multiple entry points, data crosses 3+ layers, or servi...
- [ ] Architecture guideline: - Skip the FormRequest when: no HTTP-specific concerns (no authorization beyond auth, no input pr...
- [ ] Architecture guideline: - During code review: verify service receives DTO (not array), FormRequest validates HTTP concern...
- [ ] Decision: FormRequest Only vs DTO Only vs Both - ensure correct choice is made
- [ ] Decision: `payload()` vs `fromRequest()` Bridge Pattern - ensure correct choice is made
- [ ] Decision: FormRequest Authoritative vs DTO Authoritative Validation - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Bridge FormRequest to DTO via payload() or fromRequest()

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
- [ ] Service receives DTO (or validated array), never a FormRequest
- [ ] Bridge method exists â€” either `payload()` on FormRequest or `fromRequest()` on DTO
- [ ] Bridge uses `validated()` data, never `$request->all()`
- [ ] DTO transforms/renames fields â€” it does not mirror HTTP structure exactly
- [ ] No validation rules are duplicated between FormRequest and DTO
- [ ] DTO has no HTTP dependencies (no `Request` imports)
- [ ] Controller uses the bridge method

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: The Conflated Object -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Echo Chamber -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: The Duplicated Rule Set -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: DTO Without FormRequest for HTTP Endpoints -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: FormRequest DTO Method That Spreads $this->all() -- apply preferred alternative
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
- Bridge FormRequest to DTO via payload() or fromRequest()
### Decision Trees (from 07)
- FormRequest Only vs DTO Only vs Both
- `payload()` vs `fromRequest()` Bridge Pattern
- FormRequest Authoritative vs DTO Authoritative Validation
### Anti-Patterns (from 08)
- The Conflated Object
- The Echo Chamber
- The Duplicated Rule Set
- DTO Without FormRequest for HTTP Endpoints
- FormRequest DTO Method That Spreads $this->all()
### Related Rules (from 06 skills)
- Rule 1: Never Pass FormRequest Instances to Services
- Rule 2: Use the Sequential Flow â€” FormRequest â†’ DTO â†’ Service
- Rule 3: DTOs Must Transform Data, Not Mirror HTTP Structure
- Rule 4: Define Validation Rules in Exactly One Layer
- Rule 5: Use the Bridging Pattern â€” `payload()` on FormRequest or `fromRequest()` on DTO
- Rule 6: Use DTO Validation as the Sole Validation Layer for CLI and Queue Entry Points
### Related Skills (from 06 skills)
- DTO Fundamentals: Implement Baseline DTO
- DTO Construction Patterns: Add Named Static Factories to a DTO
- Data Object Validation: Add Domain-Level Validation to a DTO

