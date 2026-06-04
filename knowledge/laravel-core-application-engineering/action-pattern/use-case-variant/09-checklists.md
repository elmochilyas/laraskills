# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Use Case Variant
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Enforce Zero Framework Imports in Use Case Business Logic
- [ ] Enforce: Use Typed DTOs for All Use Case Input, Never Raw Arrays
- [ ] Enforce: Keep DTOs as Simple Data Carriers with Typed Readonly Properties
- [ ] Enforce: Depend on Interfaces, Not Concrete Classes, in Use Case Constructors
- [ ] Enforce: Bind Every Use Case Interface Dependency in a Service Provider
- [ ] Enforce: Do Not Create Use Cases for Single-Entry-Point Operations
- [ ] Enforce: Do Not Create Use Cases for CRUD-Only Operations with No Business Logic
- [ ] Enforce: Start with the Pragmatic Use Case, Evolve to Full Hexagonal as Needed
- [ ] Input DTO is `final readonly` with typed `public readonly` properties
- [ ] DTO contains no business logic â€” pure data carrier
- [ ] Use Case method accepts exactly one typed DTO parameter
- [ ] Use Case has zero `Illuminate\*` imports in the execute method body
- [ ] Use Case uses injected dependencies instead of facades/helpers
- [ ] Controller constructs the DTO from the HTTP request
- [ ] Transaction boundary is NOT in the Use Case (delegated to orchestrator if needed)
- [ ] Tests verify both valid and invalid input paths

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Directory structure:** Use Case classes live in `app/UseCases/` (or domain subdirectories). D...
- [ ] Architecture guideline: - **Service provider binding:** Every Use Case interface dependency requires a service provider b...
- [ ] Architecture guideline: - **Adapter layer:** The controller (adapter) extracts data from the Request, constructs the DTO,...
- [ ] Architecture guideline: - **Result DTO mapping:** The mapping between Eloquent models and result DTOs happens in the infr...
- [ ] Architecture guideline: - **Transaction boundary:** The Use Case does not own its transaction (same rule as actions). The...
- [ ] Architecture guideline: - **Interface growth:** Repository interfaces can grow to 40+ methods if every Use Case adds its ...
- [ ] Decision: Pragmatic vs Full Hexagonal Use Case - ensure correct choice is made
- [ ] Decision: Use Case vs Action for Multi-Entry-Point Operations - ensure correct choice is made
- [ ] Decision: Framework Agnosticism â€” Interface Dependencies vs Concrete Classes - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Enforce Zero Framework Imports in Use Case Business Logic
- [ ] Apply rule: Use Typed DTOs for All Use Case Input, Never Raw Arrays
- [ ] Apply rule: Keep DTOs as Simple Data Carriers with Typed Readonly Properties
- [ ] Apply rule: Depend on Interfaces, Not Concrete Classes, in Use Case Constructors
- [ ] Apply rule: Bind Every Use Case Interface Dependency in a Service Provider
- [ ] Apply rule: Do Not Create Use Cases for Single-Entry-Point Operations
- [ ] Apply rule: Do Not Create Use Cases for CRUD-Only Operations with No Business Logic
- [ ] Apply rule: Start with the Pragmatic Use Case, Evolve to Full Hexagonal as Needed
- [ ] Skill applied: Create a Pragmatic Use Case
- [ ] Skill applied: Create a Full Hexagonal Use Case

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
- [ ] Input DTO is `final readonly` with typed `public readonly` properties
- [ ] DTO contains no business logic â€” pure data carrier
- [ ] Use Case method accepts exactly one typed DTO parameter
- [ ] Use Case has zero `Illuminate\*` imports in the execute method body
- [ ] Use Case uses injected dependencies instead of facades/helpers
- [ ] Controller constructs the DTO from the HTTP request
- [ ] Transaction boundary is NOT in the Use Case (delegated to orchestrator if needed)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Use Case with Framework Imports -- apply preferred alternative
    - [ ] Grep for `use Illuminate` in `App\UseCases\` files
    - [ ] Grep for `\DB::`, `\Cache::`, `\Mail::` in use case execute methods
    - [ ] Check if use case can be instantiated without Laravel boot
- [ ] Prevent: Use Case When Action Would Suffice -- apply preferred alternative
    - [ ] Is the use case called from only one entry point (HTTP)?
    - [ ] Would an action provide equivalent structure with less ceremony?
    - [ ] Does the application need framework portability?

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
- Enforce Zero Framework Imports in Use Case Business Logic
- Use Typed DTOs for All Use Case Input, Never Raw Arrays
- Keep DTOs as Simple Data Carriers with Typed Readonly Properties
- Depend on Interfaces, Not Concrete Classes, in Use Case Constructors
- Bind Every Use Case Interface Dependency in a Service Provider
- Do Not Create Use Cases for Single-Entry-Point Operations
- Do Not Create Use Cases for CRUD-Only Operations with No Business Logic
- Start with the Pragmatic Use Case, Evolve to Full Hexagonal as Needed
### Skills (from 06)
- Create a Pragmatic Use Case
- Create a Full Hexagonal Use Case
### Decision Trees (from 07)
- Pragmatic vs Full Hexagonal Use Case
- Use Case vs Action for Multi-Entry-Point Operations
- Framework Agnosticism â€” Interface Dependencies vs Concrete Classes
### Anti-Patterns (from 08)
- Use Case with Framework Imports
- Use Case When Action Would Suffice
### Related Rules (from 06 skills)
- Rule: Enforce Zero Framework Imports in Use Case Business Logic (use-case-variant/05-rules.md)
- Rule: Use Typed DTOs for All Use Case Input, Never Raw Arrays (use-case-variant/05-rules.md)
- Rule: Keep DTOs as Simple Data Carriers with Typed Readonly Properties (use-case-variant/05-rules.md)
- Rule: Do Not Create Use Cases for Single-Entry-Point Operations (use-case-variant/05-rules.md)
- Rule: Start with the Pragmatic Use Case, Evolve to Full Hexagonal as Needed (use-case-variant/05-rules.md)
### Related Skills (from 06 skills)
- Upgrade an Action to a Use Case (action-vs-service-vs-usecase/06-skills.md)
- Create a Full Hexagonal Use Case (use-case-variant/06-skills.md)

