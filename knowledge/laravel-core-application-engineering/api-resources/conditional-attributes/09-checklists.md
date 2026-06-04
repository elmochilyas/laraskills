# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** API Resources
**Knowledge Unit:** Conditional Attributes
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Use Lazy Evaluation for Expensive Computations
- [ ] Enforce: Prefer whenHas for Model Attributes and whenNotNull for Computed Values
- [ ] Enforce: Never Rely on Conditional Omission as Sole Security Mechanism
- [ ] Enforce: Split Resource When Most Fields Are Conditional
- [ ] Enforce: Test Every Conditional Path
- [ ] Enforce: Limit mergeWhen Nesting to One Level
- [ ] Enforce: Never Reference Sensitive Model Attributes in when()
- [ ] Enforce: Do Not Use Conditionals for API Version Branching
- [ ] Enforce: Pair Conditional Visibility with Authorization Policies
- [ ] Enforce: Always Use Explicit Arrays in mergeWhen
- [ ] Every conditional attribute has a test verifying both inclusion and omission
- [ ] No expensive computations inside `when()` without lazy evaluation via closures
- [ ] Conditional fields are documented as optional in API docs (clients need to know)
- [ ] Sensitive data omission is paired with proper endpoint-level authorization
- [ ] The resource has not been over-conditionalized â€” split if >70% of fields are conditional
- [ ] `mergeWhen()` is not nested beyond one level
- [ ] `mergeWhen()` receives an explicit inline array, not a variable
- [ ] Version branching is NOT done via conditionals â€” use separate versioned resources
- [ ] Sensitive model attribute names are never passed to `whenHas()`

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Conditional attributes are evaluated at response time â€” they do not affect query logic.
- [ ] Architecture guideline: - `mergeWhen()` merges the array when the condition is true. Individual items within the merge ca...
- [ ] Architecture guideline: - For permission-based fields, combine conditional visibility with proper authorization (policies...
- [ ] Architecture guideline: - When a field could be either present or absent, clients should use optional types (`?` in TypeS...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Use Lazy Evaluation for Expensive Computations
- [ ] Apply rule: Prefer whenHas for Model Attributes and whenNotNull for Computed Values
- [ ] Apply rule: Never Rely on Conditional Omission as Sole Security Mechanism
- [ ] Apply rule: Split Resource When Most Fields Are Conditional
- [ ] Apply rule: Test Every Conditional Path
- [ ] Apply rule: Limit mergeWhen Nesting to One Level
- [ ] Apply rule: Never Reference Sensitive Model Attributes in when()
- [ ] Apply rule: Do Not Use Conditionals for API Version Branching
- [ ] Apply rule: Pair Conditional Visibility with Authorization Policies
- [ ] Apply rule: Always Use Explicit Arrays in mergeWhen
- [ ] Skill applied: Add Conditional Fields to an API Resource

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
- [ ] Every conditional attribute has a test verifying both inclusion and omission
- [ ] No expensive computations inside `when()` without lazy evaluation via closures
- [ ] Conditional fields are documented as optional in API docs (clients need to know)
- [ ] Sensitive data omission is paired with proper endpoint-level authorization
- [ ] The resource has not been over-conditionalized â€” split if >70% of fields are conditional
- [ ] `mergeWhen()` is not nested beyond one level
- [ ] `mergeWhen()` receives an explicit inline array, not a variable

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Conditional Omission Used as Access Control -- apply preferred alternative
    - [ ] Grep for `when(` in resources and check if conditions check user permissions
    - [ ] Is there a policy/middleware check before the resource is returned?
- [ ] Prevent: Too Many Conditional Fields -- apply preferred alternative
    - [ ] Count conditional methods vs explicit fields in `toArray()`
    - [ ] Are >50% of fields conditional?
- [ ] Prevent: Expensive Computation Without Callable Wrapping -- apply preferred alternative
    - [ ] Grep for `when(` with method calls (e.g., `when($condition, $this->...)`)
    - [ ] Check if values could be wrapped in closures

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
- Use Lazy Evaluation for Expensive Computations
- Prefer whenHas for Model Attributes and whenNotNull for Computed Values
- Never Rely on Conditional Omission as Sole Security Mechanism
- Split Resource When Most Fields Are Conditional
- Test Every Conditional Path
- Limit mergeWhen Nesting to One Level
- Never Reference Sensitive Model Attributes in when()
- Do Not Use Conditionals for API Version Branching
- Pair Conditional Visibility with Authorization Policies
- Always Use Explicit Arrays in mergeWhen
### Skills (from 06)
- Add Conditional Fields to an API Resource
### Anti-Patterns (from 08)
- Conditional Omission Used as Access Control
- Too Many Conditional Fields
- Expensive Computation Without Callable Wrapping
### Related Rules (from 06 skills)
- Use Lazy Evaluation for Expensive Computations (Performance)
- Prefer whenHas for Model Attributes and whenNotNull for Computed Values (Design)
- Never Rely on Conditional Omission as Sole Security Mechanism (Security)
- Split Resource When Most Fields Are Conditional (Maintainability)
- Test Every Conditional Path (Testing)
- Limit mergeWhen Nesting to One Level (Maintainability)
- Never Reference Sensitive Model Attributes in when() (Security)
- Do Not Use Conditionals for API Version Branching (Architecture)
### Related Skills (from 06 skills)
- [Conditional Relationships](../conditional-relationships/06-skills.md)
- [Sparse Fieldsets](../sparse-fieldsets/06-skills.md)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)

