# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** API Resources
**Knowledge Unit:** Resource Fundamentals
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Always Explicitly List Every Field in toArray
- [ ] Enforce: Keep toArray as Pure Transformation â€” No Business Logic
- [ ] Enforce: Never Pass Resources into Services
- [ ] Enforce: Match Resource Names to API Resource Names, Not Model Names
- [ ] Enforce: Use Per-Endpoint Resources When Shape Varies Significantly
- [ ] Enforce: Use Resources for All Public API Endpoints
- [ ] Enforce: Never Access Relationships Without Eager Loading in Resources
- [ ] Every public API endpoint uses a resource class
- [ ] `toArray()` returns an explicit array, not `$this->resource->toArray()`
- [ ] No business logic or database queries exist inside `toArray()`
- [ ] Relationship accesses use `whenLoaded()` or are guaranteed to be eager-loaded
- [ ] Resource names match the API resource name, not necessarily the model name
- [ ] Resources are returned from controllers, not passed into services

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Place resources in `app/Http/Resources/` following PSR-4.
- [ ] Architecture guideline: - One resource class per model or per endpoint shape â€” the choice depends on how much the API s...
- [ ] Architecture guideline: - Resources should be returned from controllers, never passed into services (services receive DTO...
- [ ] Architecture guideline: - For collections, use `Resource::collection()` or extend `ResourceCollection`.
- [ ] Architecture guideline: - Version resources via namespace directories (`V1/`, `V2/`) when the API evolves.

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Always Explicitly List Every Field in toArray
- [ ] Apply rule: Keep toArray as Pure Transformation â€” No Business Logic
- [ ] Apply rule: Never Pass Resources into Services
- [ ] Apply rule: Match Resource Names to API Resource Names, Not Model Names
- [ ] Apply rule: Use Per-Endpoint Resources When Shape Varies Significantly
- [ ] Apply rule: Use Resources for All Public API Endpoints
- [ ] Apply rule: Never Access Relationships Without Eager Loading in Resources
- [ ] Skill applied: Create an API Resource

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
- [ ] Every public API endpoint uses a resource class
- [ ] `toArray()` returns an explicit array, not `$this->resource->toArray()`
- [ ] No business logic or database queries exist inside `toArray()`
- [ ] Relationship accesses use `whenLoaded()` or are guaranteed to be eager-loaded
- [ ] Resource names match the API resource name, not necessarily the model name
- [ ] Resources are returned from controllers, not passed into services

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Resource Exposing Full Model -- apply preferred alternative
    - [ ] Grep for `->resource->toArray()` or `->getAttributes()` in resource files
    - [ ] Check if resource fields match database columns exactly
- [ ] Prevent: Business Logic Inside `toArray()` -- apply preferred alternative
    - [ ] Grep for `if`, `foreach`, `for`, `while` inside `toArray()` methods
    - [ ] Grep for `Service`, `::make()`, `app()` calls inside resources

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
- Always Explicitly List Every Field in toArray
- Keep toArray as Pure Transformation â€” No Business Logic
- Never Pass Resources into Services
- Match Resource Names to API Resource Names, Not Model Names
- Use Per-Endpoint Resources When Shape Varies Significantly
- Use Resources for All Public API Endpoints
- Never Access Relationships Without Eager Loading in Resources
### Skills (from 06)
- Create an API Resource
### Anti-Patterns (from 08)
- Resource Exposing Full Model
- Business Logic Inside `toArray()`
### Related Rules (from 06 skills)
- Always Explicitly List Every Field in toArray (Security)
- Keep toArray as Pure Transformation â€” No Business Logic (Architecture)
- Never Pass Resources into Services (Architecture)
- Match Resource Names to API Resource Names, Not Model Names (Design)
- Use Per-Endpoint Resources When Shape Varies Significantly (Design)
- Use Resources for All Public API Endpoints (Architecture)
- Never Access Relationships Without Eager Loading in Resources (Performance)
### Related Skills (from 06 skills)
- [Conditional Attributes](../conditional-attributes/06-skills.md)
- [Conditional Relationships](../conditional-relationships/06-skills.md)
- [Resource Collections](../resource-collections/06-skills.md)
- [Resource vs DTO Decision](../resource-vs-dto-decision/06-skills.md)

