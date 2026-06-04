# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** API Resources
**Knowledge Unit:** Conditional Relationships
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Always Use whenLoaded for Every Relationship Access
- [ ] Enforce: Document Required Eager Loads in the Resource Class
- [ ] Enforce: Controllers Must Eager-Load Every Relationship the Resource Uses
- [ ] Enforce: Sub-Resources Must Independently Use whenLoaded
- [ ] Enforce: Pair whenCounted with withCount and whenAggregated with withAggregate
- [ ] Enforce: Test Both Loaded and Unloaded States
- [ ] Enforce: Use Explicit Aggregate Aliasing to Avoid Accessor Collisions
- [ ] Enforce: Never Use whenLoaded as Error Handling for Forgotten Eager Loads
- [ ] Every relationship access in every resource uses `whenLoaded()`
- [ ] Controllers eager-load all relationships used in their resources
- [ ] `whenCounted()` is paired with `withCount()` in the controller
- [ ] `whenAggregated()` is paired with `withAggregate()` in the controller
- [ ] Sub-resources independently use `whenLoaded()` for their own relationships
- [ ] Tests verify both loaded and unloaded states for each conditional relationship
- [ ] Required eager loads are documented in the resource class docblock
- [ ] Explicit aliases are used for aggregates (`posts as total_posts`) to avoid accessor collisions

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - The controller controls response depth via eager loading. Shallow response: no `with()`. Medium...
- [ ] Architecture guideline: - Sub-resources must independently use `whenLoaded()` for their own relationships. A `PostResourc...
- [ ] Architecture guideline: - For nested conditions, pass relationships in dot notation: `User::with('posts.comments')` enabl...
- [ ] Architecture guideline: - Use `withCount('posts as total_posts')` with explicit aliasing when aggregate naming might conf...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Always Use whenLoaded for Every Relationship Access
- [ ] Apply rule: Document Required Eager Loads in the Resource Class
- [ ] Apply rule: Controllers Must Eager-Load Every Relationship the Resource Uses
- [ ] Apply rule: Sub-Resources Must Independently Use whenLoaded
- [ ] Apply rule: Pair whenCounted with withCount and whenAggregated with withAggregate
- [ ] Apply rule: Test Both Loaded and Unloaded States
- [ ] Apply rule: Use Explicit Aggregate Aliasing to Avoid Accessor Collisions
- [ ] Apply rule: Never Use whenLoaded as Error Handling for Forgotten Eager Loads
- [ ] Skill applied: Add Conditional Relationships to an API Resource

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
- [ ] Every relationship access in every resource uses `whenLoaded()`
- [ ] Controllers eager-load all relationships used in their resources
- [ ] `whenCounted()` is paired with `withCount()` in the controller
- [ ] `whenAggregated()` is paired with `withAggregate()` in the controller
- [ ] Sub-resources independently use `whenLoaded()` for their own relationships
- [ ] Tests verify both loaded and unloaded states for each conditional relationship
- [ ] Required eager loads are documented in the resource class docblock

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Lazy Loading in Resources -- apply preferred alternative
    - [ ] Grep for `$this->` relationship access without `whenLoaded` in resource files
    - [ ] Check if relationship loading is guaranteed in the controller
- [ ] Prevent: Accessing Relationships Without Eager Loading in Controller -- apply preferred alternative
    - [ ] Do `whenLoaded()` conditions ever evaluate to true?
    - [ ] Check the controller for matching `->with()` calls

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
- Always Use whenLoaded for Every Relationship Access
- Document Required Eager Loads in the Resource Class
- Controllers Must Eager-Load Every Relationship the Resource Uses
- Sub-Resources Must Independently Use whenLoaded
- Pair whenCounted with withCount and whenAggregated with withAggregate
- Test Both Loaded and Unloaded States
- Use Explicit Aggregate Aliasing to Avoid Accessor Collisions
- Never Use whenLoaded as Error Handling for Forgotten Eager Loads
### Skills (from 06)
- Add Conditional Relationships to an API Resource
### Anti-Patterns (from 08)
- Lazy Loading in Resources
- Accessing Relationships Without Eager Loading in Controller
### Related Rules (from 06 skills)
- Always Use whenLoaded for Every Relationship Access (Performance)
- Document Required Eager Loads in the Resource Class (Maintainability)
- Controllers Must Eager-Load Every Relationship the Resource Uses (Architecture)
- Sub-Resources Must Independently Use whenLoaded (Architecture)
- Pair whenCounted with withCount and whenAggregated with withAggregate (Framework Usage)
- Test Both Loaded and Unloaded States (Testing)
- Use Explicit Aggregate Aliasing to Avoid Accessor Collisions (Design)
- Never Use whenLoaded as Error Handling for Forgotten Eager Loads (Reliability)
### Related Skills (from 06 skills)
- [Conditional Attributes](../conditional-attributes/06-skills.md)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Sparse Fieldsets](../sparse-fieldsets/06-skills.md)

