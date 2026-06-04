# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Single-Action Controllers
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Use for Non-CRUD Operations
- [ ] Verify: Name Controllers by Operation
- [ ] Verify: Replace Closure Routes with Invokable Controllers
- [ ] Enforce: Use Single-Action Controllers for Non-CRUD Operations
- [ ] Enforce: Name Single-Action Controllers by Operation
- [ ] Enforce: Expose Only __invoke() as a Public Method
- [ ] Enforce: Keep __invoke() Under 15 Lines
- [ ] Enforce: Prefer Single-Action Controllers Over Closure Routes
- [ ] Enforce: Do Not Use Single-Action Controllers for CRUD Operations
- [ ] Enforce: Register Single-Action Controllers by Class Only
- [ ] Enforce: Use Constructor Injection in Single-Action Controllers
- [ ] Enforce: Keep Single-Action Controllers Free of Custom Traits
- [ ] Controller has exactly one public method: `__invoke()`
- [ ] No other public methods exist (all helpers are `private` or `protected`)
- [ ] Controller is named by operation: `{Verb}{Resource}Controller`
- [ ] Route is registered by class name only: `ControllerName::class`
- [ ] `__invoke()` is under 15 lines following validate-delegate-return
- [ ] Constructor injection is used for shared dependencies (with `private readonly`)
- [ ] FormRequest is used if the operation receives user input

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Invokable Controller Definition
- [ ] Architecture guideline: class DashboardController
- [ ] Architecture guideline: public function __construct(
- [ ] Architecture guideline: private DashboardService $service,
- [ ] Architecture guideline: public function __invoke(): View
- [ ] Architecture guideline: return view('dashboard', ['data' => $this->service->getData()]);
- [ ] Architecture guideline: ### Route Registration
- [ ] Architecture guideline: Route::get('/dashboard', DashboardController::class);
- [ ] Architecture guideline: Route::post('/contact', ContactFormController::class);
- [ ] Architecture guideline: Route::post('/posts/{post}/publish', PublishPostController::class);
- [ ] Decision: Single-Action Controller vs Closure Route - ensure correct choice is made
- [ ] Decision: Single-Action Controller vs Resource Controller Method - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Use for Non-CRUD Operations
- [ ] Best practice: Name Controllers by Operation
- [ ] Best practice: Replace Closure Routes with Invokable Controllers
- [ ] Apply rule: Use Single-Action Controllers for Non-CRUD Operations
- [ ] Apply rule: Name Single-Action Controllers by Operation
- [ ] Apply rule: Expose Only __invoke() as a Public Method
- [ ] Apply rule: Keep __invoke() Under 15 Lines
- [ ] Apply rule: Prefer Single-Action Controllers Over Closure Routes
- [ ] Apply rule: Do Not Use Single-Action Controllers for CRUD Operations
- [ ] Apply rule: Register Single-Action Controllers by Class Only
- [ ] Apply rule: Use Constructor Injection in Single-Action Controllers
- [ ] Apply rule: Keep Single-Action Controllers Free of Custom Traits

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
- [ ] Controller has exactly one public method: `__invoke()`
- [ ] No other public methods exist (all helpers are `private` or `protected`)
- [ ] Controller is named by operation: `{Verb}{Resource}Controller`
- [ ] Route is registered by class name only: `ControllerName::class`
- [ ] `__invoke()` is under 15 lines following validate-delegate-return
- [ ] Constructor injection is used for shared dependencies (with `private readonly`)
- [ ] FormRequest is used if the operation receives user input

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Invokable Controllers for CRUD Operations -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Multiple Public Methods Alongside __invoke() -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Fat __invoke() Exceeding 15 Lines -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Vague Controller Names -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Specifying `__invoke` in Route Registration -- apply preferred alternative
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
- Use Single-Action Controllers for Non-CRUD Operations
- Name Single-Action Controllers by Operation
- Expose Only __invoke() as a Public Method
- Keep __invoke() Under 15 Lines
- Prefer Single-Action Controllers Over Closure Routes
- Do Not Use Single-Action Controllers for CRUD Operations
- Register Single-Action Controllers by Class Only
- Use Constructor Injection in Single-Action Controllers
- Keep Single-Action Controllers Free of Custom Traits
### Skills (from 06)
- Create a Single-Action Controller for a Non-CRUD Operation
- Convert a Closure Route to a Single-Action Controller
### Decision Trees (from 07)
- Single-Action Controller vs Closure Route
- Single-Action Controller vs Resource Controller Method
- Single-Action Controller vs Full Controller Class
### Anti-Patterns (from 08)
- Invokable Controllers for CRUD Operations
- Multiple Public Methods Alongside __invoke()
- Fat __invoke() Exceeding 15 Lines
- Vague Controller Names
- Specifying `__invoke` in Route Registration
### Related Rules (from 06 skills)
- `05-rules.md` Rule: "Use Single-Action Controllers for Non-CRUD Operations"
- `05-rules.md` Rule: "Name Single-Action Controllers by Operation"
- `05-rules.md` Rule: "Expose Only __invoke() as a Public Method"
- `05-rules.md` Rule: "Keep __invoke() Under 15 Lines"
- `05-rules.md` Rule: "Prefer Single-Action Controllers Over Closure Routes"
- `05-rules.md` Rule: "Do Not Use Single-Action Controllers for CRUD Operations"
- `05-rules.md` Rule: "Register Single-Action Controllers by Class Only"
- `05-rules.md` Rule: "Use Constructor Injection in Single-Action Controllers"
- `05-rules.md` Rule: "Keep Single-Action Controllers Free of Custom Traits"
### Related Skills (from 06 skills)
- "Design and Implement Controller Architecture" â€” general controller patterns
- "Extract Non-CRUD Operations from a Resource Controller" â€” common source of single-action controllers
- "Convert a Closure Route to a Single-Action Controller" â€” migration from Closures

