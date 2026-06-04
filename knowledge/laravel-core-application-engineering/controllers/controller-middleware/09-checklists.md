# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Controller Middleware
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Use only() and except() for Granular Control
- [ ] Verify: Prefer Route-Level Middleware for Consistency
- [ ] Verify: Avoid Constructor Logic
- [ ] Enforce: Register Middleware Only in Constructors
- [ ] Enforce: Use only() or except() for Every Middleware Registration
- [ ] Enforce: Keep Constructors Limited to Middleware Registration
- [ ] Enforce: Prefer Route-Level Middleware for Shared Protection
- [ ] Enforce: Do Not Use Controller Middleware as Authorization Gate
- [ ] Enforce: Verify Middleware Composition with route:list
- [ ] Enforce: Always Declare except() for Public Resource Actions
- [ ] Enforce: Use ->only() as the Default, ->except() as the Exception
- [ ] All `$this->middleware()` calls are in the constructor only
- [ ] Every `$this->middleware()` call chains `->only()` or `->except()` (no unscoped middleware)
- [ ] Constructor contains no logic besides middleware registration
- [ ] `php artisan route:list` shows the correct middleware composition for each route
- [ ] No middleware is duplicated between route group and controller level
- [ ] Public resource actions (`index`, `show`) are excluded from `auth` middleware via `->except()`
- [ ] Authorization middleware (`can:...`) is NOT used â€” use FormRequest `authorize()` instead
- [ ] `->only()` is preferred over `->except()` unless the middleware applies to most actions

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Resource Controller Middleware
- [ ] Architecture guideline: class UserController extends Controller
- [ ] Architecture guideline: public function __construct()
- [ ] Architecture guideline: $this->middleware('auth')->except(['index', 'show']);
- [ ] Architecture guideline: $this->middleware('admin')->only(['destroy']);
- [ ] Architecture guideline: $this->middleware('throttle:api')->only(['store', 'update', 'destroy']);
- [ ] Architecture guideline: ### Method-Specific Middleware
- [ ] Architecture guideline: $this->middleware('verified')->only('store');
- [ ] Architecture guideline: $this->middleware('password.confirm')->only(['edit', 'update']);
- [ ] Decision: Route-Level vs Controller-Level Middleware - ensure correct choice is made
- [ ] Decision: only() vs except() Scoping Strategy - ensure correct choice is made
- [ ] Decision: Controller Middleware vs FormRequest authorize() - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Use only() and except() for Granular Control
- [ ] Best practice: Prefer Route-Level Middleware for Consistency
- [ ] Best practice: Avoid Constructor Logic
- [ ] Apply rule: Register Middleware Only in Constructors
- [ ] Apply rule: Use only() or except() for Every Middleware Registration
- [ ] Apply rule: Keep Constructors Limited to Middleware Registration
- [ ] Apply rule: Prefer Route-Level Middleware for Shared Protection
- [ ] Apply rule: Do Not Use Controller Middleware as Authorization Gate
- [ ] Apply rule: Verify Middleware Composition with route:list
- [ ] Apply rule: Always Declare except() for Public Resource Actions
- [ ] Apply rule: Use ->only() as the Default, ->except() as the Exception
- [ ] Skill applied: Apply Middleware to Controller Actions

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
- [ ] All `$this->middleware()` calls are in the constructor only
- [ ] Every `$this->middleware()` call chains `->only()` or `->except()` (no unscoped middleware)
- [ ] Constructor contains no logic besides middleware registration
- [ ] `php artisan route:list` shows the correct middleware composition for each route
- [ ] No middleware is duplicated between route group and controller level
- [ ] Public resource actions (`index`, `show`) are excluded from `auth` middleware via `->except()`
- [ ] Authorization middleware (`can:...`) is NOT used â€” use FormRequest `authorize()` instead

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Business Logic in Controller Constructors -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Middleware Registered Outside Constructor -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Unscoped Middleware (No only()/except()) -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Middleware Duplication (Route and Controller Levels) -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Authorization Middleware Instead of FormRequest authorize() -- apply preferred alternative
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
- Register Middleware Only in Constructors
- Use only() or except() for Every Middleware Registration
- Keep Constructors Limited to Middleware Registration
- Prefer Route-Level Middleware for Shared Protection
- Do Not Use Controller Middleware as Authorization Gate
- Verify Middleware Composition with route:list
- Always Declare except() for Public Resource Actions
- Use ->only() as the Default, ->except() as the Exception
### Skills (from 06)
- Apply Middleware to Controller Actions
- Audit Controller Middleware Composition for Security and Duplication
### Decision Trees (from 07)
- Route-Level vs Controller-Level Middleware
- only() vs except() Scoping Strategy
- Controller Middleware vs FormRequest authorize()
### Anti-Patterns (from 08)
- Business Logic in Controller Constructors
- Middleware Registered Outside Constructor
- Unscoped Middleware (No only()/except())
- Middleware Duplication (Route and Controller Levels)
- Authorization Middleware Instead of FormRequest authorize()
### Related Rules (from 06 skills)
- `05-rules.md` Rule: "Register Middleware Only in Constructors"
- `05-rules.md` Rule: "Use only() or except() for Every Middleware Registration"
- `05-rules.md` Rule: "Keep Constructors Limited to Middleware Registration"
- `05-rules.md` Rule: "Prefer Route-Level Middleware for Shared Protection"
- `05-rules.md` Rule: "Do Not Use Controller Middleware as Authorization Gate"
- `05-rules.md` Rule: "Verify Middleware Composition with route:list"
- `05-rules.md` Rule: "Always Declare except() for Public Resource Actions"
- `05-rules.md` Rule: "Use ->only() as the Default, ->except() as the Exception"
### Related Skills (from 06 skills)
- "Design and Implement Controller Architecture" â€” foundation for controller constructors
- "Create a Resource Controller for CRUD Operations" â€” common middleware use case

