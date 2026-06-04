# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Controller Architecture
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Keep Controllers Thin
- [ ] Verify: Use Constructor Injection for Shared Dependencies
- [ ] Verify: Use Method Injection for Request-Specific Dependencies
- [ ] Verify: Return Responses Explicitly
- [ ] Enforce: Enforce Maximum Controller Method Length
- [ ] Enforce: Delegate All Business Logic to Services or Actions
- [ ] Enforce: Use FormRequest Classes for All Validation
- [ ] Enforce: Return Explicit Response Types
- [ ] Enforce: Separate Web and API Controllers
- [ ] Enforce: Avoid God Controllers
- [ ] Enforce: Follow the Three-Step Controller Flow
- [ ] Enforce: Use Constructor Promotion for Injected Dependencies
- [ ] Controller method bodies are each 10-15 lines maximum
- [ ] No business logic (queries, calculations, multi-step workflows) in any method
- [ ] Every store/update action type-hints a FormRequest, not `Request`
- [ ] Each method returns an explicit response type
- [ ] Constructor uses `private readonly` promoted properties for dependencies
- [ ] No `Illuminate\Http\Request` injected via constructor
- [ ] Controller does not import Model, DB, or Query Builder classes

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Controller Flow
- [ ] Architecture guideline: Request â†’ Route â†’ Middleware â†’ Controller
- [ ] Architecture guideline: Validate (FormRequest)
- [ ] Architecture guideline: Delegate (Service/Action)
- [ ] Architecture guideline: Respond (View/Resource/Redirect/JsonResponse)
- [ ] Architecture guideline: ### Namespace Convention
- [ ] Architecture guideline: `App\Http\Controllers\{Domain}\{ControllerName}`. Group by domain for large applications.
- [ ] Architecture guideline: ### Dependency Direction
- [ ] Architecture guideline: Controllers depend on services/actions. Services/actions must NOT depend on controllers. Controll...
- [ ] Decision: Controller Pattern Selection - ensure correct choice is made
- [ ] Decision: Constructor vs Method Injection in Controllers - ensure correct choice is made
- [ ] Decision: Web vs API Controller Separation - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Keep Controllers Thin
- [ ] Best practice: Use Constructor Injection for Shared Dependencies
- [ ] Best practice: Use Method Injection for Request-Specific Dependencies
- [ ] Best practice: Return Responses Explicitly
- [ ] Apply rule: Enforce Maximum Controller Method Length
- [ ] Apply rule: Delegate All Business Logic to Services or Actions
- [ ] Apply rule: Use FormRequest Classes for All Validation
- [ ] Apply rule: Return Explicit Response Types
- [ ] Apply rule: Separate Web and API Controllers
- [ ] Apply rule: Avoid God Controllers
- [ ] Apply rule: Follow the Three-Step Controller Flow
- [ ] Apply rule: Use Constructor Promotion for Injected Dependencies

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] Controller resolution adds minimal overhead (~1-3ms for typical dependency graphs). Method injection adds reflection ...
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] Controller methods receive validated data (via Form Requests). Never trust `$request->all()` directly â€” always use ...

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
- [ ] Controller method bodies are each 10-15 lines maximum
- [ ] No business logic (queries, calculations, multi-step workflows) in any method
- [ ] Every store/update action type-hints a FormRequest, not `Request`
- [ ] Each method returns an explicit response type
- [ ] Constructor uses `private readonly` promoted properties for dependencies
- [ ] No `Illuminate\Http\Request` injected via constructor
- [ ] Controller does not import Model, DB, or Query Builder classes

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Business Logic in Controllers -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Fat Controller Methods -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: God Controller -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Mixing Web and API Response Types -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Inline Validation Instead of FormRequest -- apply preferred alternative
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
- Enforce Maximum Controller Method Length
- Delegate All Business Logic to Services or Actions
- Use FormRequest Classes for All Validation
- Return Explicit Response Types
- Separate Web and API Controllers
- Avoid God Controllers
- Follow the Three-Step Controller Flow
- Use Constructor Promotion for Injected Dependencies
### Skills (from 06)
- Design and Implement Controller Architecture
- Refactor a Fat Controller into a Thin Controller
### Decision Trees (from 07)
- Controller Pattern Selection
- Constructor vs Method Injection in Controllers
- Web vs API Controller Separation
### Anti-Patterns (from 08)
- Business Logic in Controllers
- Fat Controller Methods
- God Controller
- Mixing Web and API Response Types
- Inline Validation Instead of FormRequest
### Related Rules (from 06 skills)
- `05-rules.md` Rule: "Enforce Maximum Controller Method Length" (10-15 lines)
- `05-rules.md` Rule: "Delegate All Business Logic to Services or Actions"
- `05-rules.md` Rule: "Use FormRequest Classes for All Validation"
- `05-rules.md` Rule: "Return Explicit Response Types"
- `05-rules.md` Rule: "Separate Web and API Controllers"
- `05-rules.md` Rule: "Avoid God Controllers" (max 7-10 public methods)
- `05-rules.md` Rule: "Follow the Three-Step Controller Flow"
- `05-rules.md` Rule: "Use Constructor Promotion for Injected Dependencies"
### Related Skills (from 06 skills)
- "Apply Dependency Injection to Controllers" â€” detailed DI decision workflow
- "Organize Controllers into Directory Structure" â€” directory placement decisions
- "Create a Resource Controller for CRUD Operations" â€” resource controller specifics
- "Create a Single-Action Controller for a Non-CRUD Operation" â€” invokable controller specifics
- "Refactor a Fat Controller into a Thin Controller" â€” migration workflow

