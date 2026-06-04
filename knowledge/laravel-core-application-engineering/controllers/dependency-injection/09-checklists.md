# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Controller Dependency Injection
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Prefer Constructor Injection for Shared Dependencies
- [ ] Verify: Use Method Injection for Form Requests
- [ ] Verify: Avoid Request in Constructor
- [ ] Enforce: Use Constructor Injection for Shared Service Dependencies
- [ ] Enforce: Use Method Injection for Form Requests
- [ ] Enforce: Never Inject Request in Controller Constructors
- [ ] Enforce: Use Method Injection for Single-Method Dependencies
- [ ] Enforce: Avoid Service Locator Calls in Controller Methods
- [ ] Enforce: Limit Constructor Dependencies to a Reasonable Count
- [ ] Enforce: Always Type-Hint FormRequest Instead of Request
- [ ] Enforce: Use Method Injection for Route Model Binding
- [ ] `Illuminate\Http\Request` is NOT injected in the constructor (method injection only)
- [ ] Shared dependencies (used by 2+ methods) use constructor injection with `private readonly`
- [ ] FormRequests are injected in method signatures, never in the constructor
- [ ] Route model binding is used for model resolution (no `Model::findOrFail()`)
- [ ] Single-method services use method injection, not constructor injection
- [ ] No `app()->make()`, `resolve()`, or `App::make()` calls in any method
- [ ] Constructor has 5 or fewer dependencies
- [ ] All injected dependencies are actually used (no unused constructor parameters)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Constructor Injection Example
- [ ] Architecture guideline: class UserController extends Controller
- [ ] Architecture guideline: public function __construct(
- [ ] Architecture guideline: private UserService $service,
- [ ] Architecture guideline: private Logger $logger,
- [ ] Architecture guideline: public function index(): View { /* $this->service and $this->logger available */ }
- [ ] Architecture guideline: public function show(User $user): View { /* same here */ }
- [ ] Architecture guideline: ### Method Injection Example
- [ ] Architecture guideline: class UserController extends Controller
- [ ] Architecture guideline: public function store(StoreUserRequest $request): RedirectResponse
- [ ] Architecture guideline: // $request is validated before this line executes
- [ ] Architecture guideline: User::create($request->validated());

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Prefer Constructor Injection for Shared Dependencies
- [ ] Best practice: Use Method Injection for Form Requests
- [ ] Best practice: Avoid Request in Constructor
- [ ] Apply rule: Use Constructor Injection for Shared Service Dependencies
- [ ] Apply rule: Use Method Injection for Form Requests
- [ ] Apply rule: Never Inject Request in Controller Constructors
- [ ] Apply rule: Use Method Injection for Single-Method Dependencies
- [ ] Apply rule: Avoid Service Locator Calls in Controller Methods
- [ ] Apply rule: Limit Constructor Dependencies to a Reasonable Count
- [ ] Apply rule: Always Type-Hint FormRequest Instead of Request
- [ ] Apply rule: Use Method Injection for Route Model Binding
- [ ] Skill applied: Apply Dependency Injection to Controllers

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
- [ ] `Illuminate\Http\Request` is NOT injected in the constructor (method injection only)
- [ ] Shared dependencies (used by 2+ methods) use constructor injection with `private readonly`
- [ ] FormRequests are injected in method signatures, never in the constructor
- [ ] Route model binding is used for model resolution (no `Model::findOrFail()`)
- [ ] Single-method services use method injection, not constructor injection
- [ ] No `app()->make()`, `resolve()`, or `App::make()` calls in any method
- [ ] Constructor has 5 or fewer dependencies

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Request in Constructor -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Service Locator Calls in Controller Methods -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Constructor Bloat (6+ Dependencies) -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: FormRequest in Constructor -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Unused Constructor Dependencies -- apply preferred alternative
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
- Use Constructor Injection for Shared Service Dependencies
- Use Method Injection for Form Requests
- Never Inject Request in Controller Constructors
- Use Method Injection for Single-Method Dependencies
- Avoid Service Locator Calls in Controller Methods
- Limit Constructor Dependencies to a Reasonable Count
- Always Type-Hint FormRequest Instead of Request
- Use Method Injection for Route Model Binding
### Skills (from 06)
- Apply Dependency Injection to Controllers
- Refactor Away Service Locator Calls in Controllers
### Decision Trees (from 07)
- Constructor Injection vs Method Injection
- Service Locator vs Explicit Injection
- FormRequest vs Request Type Hinting
### Anti-Patterns (from 08)
- Request in Constructor
- Service Locator Calls in Controller Methods
- Constructor Bloat (6+ Dependencies)
- FormRequest in Constructor
- Unused Constructor Dependencies
### Related Rules (from 06 skills)
- `05-rules.md` Rule: "Use Constructor Injection for Shared Service Dependencies"
- `05-rules.md` Rule: "Use Method Injection for Form Requests"
- `05-rules.md` Rule: "Never Inject Request in Controller Constructors"
- `05-rules.md` Rule: "Use Method Injection for Single-Method Dependencies"
- `05-rules.md` Rule: "Avoid Service Locator Calls in Controller Methods"
- `05-rules.md` Rule: "Limit Constructor Dependencies to a Reasonable Count"
- `05-rules.md` Rule: "Always Type-Hint FormRequest Instead of Request"
- `05-rules.md` Rule: "Use Method Injection for Route Model Binding"
### Related Skills (from 06 skills)
- "Design and Implement Controller Architecture" â€” overall controller structure
- "Refactor a Fat Controller into a Thin Controller" â€” extraction workflow
- "Write Feature Tests for Controller Actions" â€” testing injected dependencies

