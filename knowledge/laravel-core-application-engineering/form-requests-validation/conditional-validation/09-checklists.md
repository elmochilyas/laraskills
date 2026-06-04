# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Form Requests & Validation
**Knowledge Unit:** Conditional Validation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Declarative rules used instead of verbose `ConditionalRules::when()` or `sometimes()` for simple conditions
- [ ] Correct rule chosen (`required_if` vs `prohibited_if` vs `exclude_if`)
- [ ] Field names in conditions match actual input field names
- [ ] Multiple values use correct OR syntax
- [ ] Tests cover all conditional paths
- [ ] No deeply nested conditional rule chains (max 2 conditions per field)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - `ConditionalRules::when()` condition evaluated at parse time â€” operates on raw input, not val...
- [ ] Architecture guideline: - `sometimes()` callbacks fire during the `passes()` loop â€” access to current `Input` instance
- [ ] Architecture guideline: - `exclude_if` triggers `shouldBeExcluded()` in the validator loop â€” removes attribute from val...
- [ ] Architecture guideline: - `required_if` with nested fields uses dot notation: `required_if:parent.child,value`
- [ ] Architecture guideline: - Multiple conditions use array syntax: `required_if:field1,value1,field2,value2` (OR logic)
- [ ] Architecture guideline: - Custom `validator()` method override provides complete control for complex conditional scenarios
- [ ] Decision: Declarative Conditional Rules vs Programmatic Conditionals - ensure correct choice is made
- [ ] Decision: ConditionalRules::when() vs withValidator() for Complex Conditions - ensure correct choice is made
- [ ] Decision: sometimes() vs Exclude_* Rules for Conditional Field Presence - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Apply Declarative Conditional Validation Rules
- [ ] Skill applied: Apply Complex Conditional Validation Using ConditionalRules and sometimes

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
- [ ] Declarative rules used instead of verbose `ConditionalRules::when()` or `sometimes()` for simple conditions
- [ ] Correct rule chosen (`required_if` vs `prohibited_if` vs `exclude_if`)
- [ ] Field names in conditions match actual input field names
- [ ] Multiple values use correct OR syntax
- [ ] Tests cover all conditional paths
- [ ] No deeply nested conditional rule chains (max 2 conditions per field)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Deeply Nested Conditional Rule Chains -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Using sometimes() When required_if Would Work -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: ConditionalRules::when() for Database-Dependent Conditions -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Using exclude_if When prohibited_if Is Needed -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Merging Create and Update Rules Into One Conditional Request -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Conditional Rules Without Coverage for All Branches -- apply preferred alternative
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
- Apply Declarative Conditional Validation Rules
- Apply Complex Conditional Validation Using ConditionalRules and sometimes
### Decision Trees (from 07)
- Declarative Conditional Rules vs Programmatic Conditionals
- ConditionalRules::when() vs withValidator() for Complex Conditions
- sometimes() vs Exclude_* Rules for Conditional Field Presence
### Anti-Patterns (from 08)
- Deeply Nested Conditional Rule Chains
- Using sometimes() When required_if Would Work
- ConditionalRules::when() for Database-Dependent Conditions
- Using exclude_if When prohibited_if Is Needed
- Merging Create and Update Rules Into One Conditional Request
- Conditional Rules Without Coverage for All Branches
### Related Rules (from 06 skills)
- Rule 1: Use Declarative Rules for Simple Field-Dependent Conditions
- Rule 4: Avoid Deep Nesting of Conditional Rules
- Rule 6: Use exclude_if / exclude_unless for Conditional Field Removal
### Related Skills (from 06 skills)
- Apply Complex Conditional Validation Using ConditionalRules and sometimes
- Implement Cross-Field Validation Using withValidator and after

