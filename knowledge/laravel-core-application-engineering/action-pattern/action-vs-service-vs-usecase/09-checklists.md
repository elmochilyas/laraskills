# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Action vs Service vs Use Case
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Apply the Three-Tier Decision Framework to Each Operation Individually
- [ ] Enforce: Use Service-Action Complement as the Default Production Pattern
- [ ] Enforce: Start with Services, Evolve to Actions, Introduce Use Cases as Needed
- [ ] Enforce: Use the DTO Boundary as the Distinguishing Signal Between Action and Use Case
- [ ] Enforce: Keep Pattern Choices Consistent Within a Domain
- [ ] Enforce: Do Not Enforce a Single Pattern Across the Entire Codebase
- [ ] Enforce: Use Interface Dependencies Exclusively in Use Cases
- [ ] The operation is clearly defined in one sentence
- [ ] Question 1 (Cohesion) was answered â€” does it share dependencies with entity operations?
- [ ] Question 2 (Granularity) was answered â€” is it a distinct, reusable, isolatable unit?
- [ ] Question 3 (Portability) was answered â€” is it called from 2+ entry points with framework-agnostic needs?
- [ ] The chosen pattern matches the most specific applicable answer
- [ ] The decision is documented with the reasoning
- [ ] Evolution criteria are documented (what would trigger the next pattern)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Service pattern:** One file per entity/domain. Shared constructor DI. Multiple public methods...
- [ ] Architecture guideline: - **Action pattern:** One file per operation. One DI per action. Single public method. Optional D...
- [ ] Architecture guideline: - **Use Case pattern:** One file + one DTO per input + one result DTO + interface dependencies. S...
- [ ] Architecture guideline: - **Service-Action complement:** Services for navigation and orchestration, actions for execution...
- [ ] Architecture guideline: - **Evolution path:** Start with services (file economy), extract to actions (isolation) when a s...
- [ ] Architecture guideline: - **Migration between patterns is additive only.** Service â†’ Action â†’ Use Case is forward. Us...
- [ ] Decision: Three-Tier Pattern Selection (Service vs Action vs Use Case) - ensure correct choice is made
- [ ] Decision: Evolution Path â€” When to Extract/Upgrade - ensure correct choice is made
- [ ] Decision: DTO Boundary â€” Signal of Pattern Choice - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Apply the Three-Tier Decision Framework to Each Operation Individually
- [ ] Apply rule: Use Service-Action Complement as the Default Production Pattern
- [ ] Apply rule: Start with Services, Evolve to Actions, Introduce Use Cases as Needed
- [ ] Apply rule: Use the DTO Boundary as the Distinguishing Signal Between Action and Use Case
- [ ] Apply rule: Keep Pattern Choices Consistent Within a Domain
- [ ] Apply rule: Do Not Enforce a Single Pattern Across the Entire Codebase
- [ ] Apply rule: Use Interface Dependencies Exclusively in Use Cases
- [ ] Skill applied: Choose the Right Pattern for a Business Operation
- [ ] Skill applied: Evolve a Service Method to an Action
- [ ] Skill applied: Upgrade an Action to a Use Case

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
- [ ] The operation is clearly defined in one sentence
- [ ] Question 1 (Cohesion) was answered â€” does it share dependencies with entity operations?
- [ ] Question 2 (Granularity) was answered â€” is it a distinct, reusable, isolatable unit?
- [ ] Question 3 (Portability) was answered â€” is it called from 2+ entry points with framework-agnostic needs?
- [ ] The chosen pattern matches the most specific applicable answer
- [ ] The decision is documented with the reasoning
- [ ] Evolution criteria are documented (what would trigger the next pattern)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: One-Size-Fits-All Pattern -- apply preferred alternative
    - [ ] Are all operations in the same pattern regardless of complexity?
    - [ ] Are there services with 20+ unrelated methods?
    - [ ] Are there actions with zero business logic?
- [ ] Prevent: God Service (Entity Service with 30+ Methods) -- apply preferred alternative
    - [ ] Does a single service file have >500 lines or >15 methods?
    - [ ] Do all methods share the same constructor dependencies?

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
- Apply the Three-Tier Decision Framework to Each Operation Individually
- Use Service-Action Complement as the Default Production Pattern
- Start with Services, Evolve to Actions, Introduce Use Cases as Needed
- Use the DTO Boundary as the Distinguishing Signal Between Action and Use Case
- Keep Pattern Choices Consistent Within a Domain
- Do Not Enforce a Single Pattern Across the Entire Codebase
- Use Interface Dependencies Exclusively in Use Cases
### Skills (from 06)
- Choose the Right Pattern for a Business Operation
- Evolve a Service Method to an Action
- Upgrade an Action to a Use Case
### Decision Trees (from 07)
- Three-Tier Pattern Selection (Service vs Action vs Use Case)
- Evolution Path â€” When to Extract/Upgrade
- DTO Boundary â€” Signal of Pattern Choice
### Anti-Patterns (from 08)
- One-Size-Fits-All Pattern
- God Service (Entity Service with 30+ Methods)
### Related Rules (from 06 skills)
- Rule: Apply the Three-Tier Decision Framework to Each Operation Individually (action-vs-service-vs-usecase/05-rules.md)
- Rule: Use Service-Action Complement as the Default Production Pattern (action-vs-service-vs-usecase/05-rules.md)
- Rule: Start with Services, Evolve to Actions, Introduce Use Cases as Needed (action-vs-service-vs-usecase/05-rules.md)
- Rule: Use the DTO Boundary as the Distinguishing Signal Between Action and Use Case (action-vs-service-vs-usecase/05-rules.md)
- Rule: Keep Pattern Choices Consistent Within a Domain (action-vs-service-vs-usecase/05-rules.md)
- Rule: Do Not Enforce a Single Pattern Across the Entire Codebase (action-vs-service-vs-usecase/05-rules.md)
### Related Skills (from 06 skills)
- Extract Controller Logic to an Action (action-class-design/06-skills.md)
- Refactor an Over-Composed Action to a Service (action-composition/06-skills.md)
- Create a Pragmatic Use Case (use-case-variant/06-skills.md)

