# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** API Resources
**Knowledge Unit:** Resource vs DTO Decision
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Never Pass Resources as Arguments to Services
- [ ] Enforce: Never Return Bare DTOs from Controllers When Resources Are Available
- [ ] Enforce: Keep DTOs HTTP-Agnostic
- [ ] Enforce: Use Both DTOs and Resources for Public APIs with Complex Logic
- [ ] Enforce: Maintain Clear Dependency Direction â€” DTOs Never Depend on Resources
- [ ] Enforce: Use the Decision Matrix for Each Endpoint's Pattern Choice
- [ ] Enforce: Test the Full DTO-to-Resource Chain
- [ ] Enforce: Avoid Circular Dependencies Between DTOs and Resources
- [ ] Services receive typed DTOs, not Resources or raw Request objects
- [ ] Controllers return Resources (or ResourceCollections), not bare DTOs
- [ ] DTOs do not depend on HTTP context or Resources
- [ ] The pattern choice (Resource-only, DTO-only, or both) is justified by endpoint complexity
- [ ] For simple CRUD without a service layer, DTOs are not forced
- [ ] For public APIs with complex logic, both DTOs and Resources are used
- [ ] The full chain (DTO â†’ Resource â†’ response) is tested in integration tests

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - The controller is the boundary: it receives FormRequest, creates DTO, passes to service, receiv...
- [ ] Architecture guideline: - When services return Eloquent models, Resources wrap them directly. When services return DTOs, ...
- [ ] Architecture guideline: - For simple CRUD (no service layer), skip the DTO. The model goes directly to the Resource.
- [ ] Architecture guideline: - For internal APIs where conditional response features are not needed, DTO-only responses are ac...
- [ ] Architecture guideline: - The "both" pattern scales best for production APIs with >20 endpoints and >50k LOC. For smaller...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Never Pass Resources as Arguments to Services
- [ ] Apply rule: Never Return Bare DTOs from Controllers When Resources Are Available
- [ ] Apply rule: Keep DTOs HTTP-Agnostic
- [ ] Apply rule: Use Both DTOs and Resources for Public APIs with Complex Logic
- [ ] Apply rule: Maintain Clear Dependency Direction â€” DTOs Never Depend on Resources
- [ ] Apply rule: Use the Decision Matrix for Each Endpoint's Pattern Choice
- [ ] Apply rule: Test the Full DTO-to-Resource Chain
- [ ] Apply rule: Avoid Circular Dependencies Between DTOs and Resources
- [ ] Skill applied: Decide Whether to Use a Resource, DTO, or Both for an Endpoint

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
- [ ] Services receive typed DTOs, not Resources or raw Request objects
- [ ] Controllers return Resources (or ResourceCollections), not bare DTOs
- [ ] DTOs do not depend on HTTP context or Resources
- [ ] The pattern choice (Resource-only, DTO-only, or both) is justified by endpoint complexity
- [ ] For simple CRUD without a service layer, DTOs are not forced
- [ ] For public APIs with complex logic, both DTOs and Resources are used
- [ ] The full chain (DTO â†’ Resource â†’ response) is tested in integration tests

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Passing Resources as Arguments to Services -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Forcing Both Patterns on Every Endpoint -- apply preferred alternative
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
### Rules (from 05)
- Never Pass Resources as Arguments to Services
- Never Return Bare DTOs from Controllers When Resources Are Available
- Keep DTOs HTTP-Agnostic
- Use Both DTOs and Resources for Public APIs with Complex Logic
- Maintain Clear Dependency Direction â€” DTOs Never Depend on Resources
- Use the Decision Matrix for Each Endpoint's Pattern Choice
- Test the Full DTO-to-Resource Chain
- Avoid Circular Dependencies Between DTOs and Resources
### Skills (from 06)
- Decide Whether to Use a Resource, DTO, or Both for an Endpoint
### Anti-Patterns (from 08)
- Passing Resources as Arguments to Services
- Forcing Both Patterns on Every Endpoint
### Related Rules (from 06 skills)
- Never Pass Resources as Arguments to Services (Architecture)
- Never Return Bare DTOs from Controllers When Resources Are Available (Architecture)
- Keep DTOs HTTP-Agnostic (Architecture)
- Use Both DTOs and Resources for Public APIs with Complex Logic (Architecture)
- Maintain Clear Dependency Direction â€” DTOs Never Depend on Resources (Architecture)
- Use the Decision Matrix for Each Endpoint's Pattern Choice (Architecture)
- Test the Full DTO-to-Resource Chain (Testing)
- Avoid Circular Dependencies Between DTOs and Resources (Architecture)
### Related Skills (from 06 skills)
- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Resource Collections](../resource-collections/06-skills.md)

