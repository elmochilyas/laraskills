# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Resource Controllers
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Use apiResource for APIs
- [ ] Verify: Use make:controller with --resource or --api
- [ ] Verify: Keep Actions Thin
- [ ] Enforce: Use Resource Controllers for All CRUD Operations
- [ ] Enforce: Use apiResource for API Endpoints
- [ ] Enforce: Generate Resource Controllers via Artisan
- [ ] Enforce: Keep Each Resource Action Under 10 Lines
- [ ] Enforce: Do Not Add Non-Resource Actions to Resource Controllers
- [ ] Enforce: Use Form Requests for Store and Update Validation
- [ ] Enforce: Use Route Model Binding in Show, Edit, Update, Destroy
- [ ] Enforce: Avoid Resource Controllers for Non-CRUD Resources
- [ ] Enforce: Keep the Create/Edit Methods Minimal in Web Resources
- [ ] Controller generated via Artisan (`--resource` or `--api`), not manually
- [ ] All 7 methods (resource) or 5 methods (api) are implemented
- [ ] Every method body is under 10 lines following validate-delegate-return
- [ ] `store()` and `update()` use dedicated FormRequest type-hints
- [ ] `show()`, `edit()`, `update()`, `destroy()` use route model binding
- [ ] `create()` and `edit()` (web) return only a view with no business logic
- [ ] No non-standard methods (publish, archive) exist in the resource controller

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Resource Controller Structure
- [ ] Architecture guideline: class PostController extends Controller
- [ ] Architecture guideline: public function index() { /* list */ }
- [ ] Architecture guideline: public function create() { /* form */ }
- [ ] Architecture guideline: public function store(Request $request) { /* persist */ }
- [ ] Architecture guideline: public function show(Post $post) { /* single */ }
- [ ] Architecture guideline: public function edit(Post $post) { /* edit form */ }
- [ ] Architecture guideline: public function update(Request $request, Post $post) { /* update */ }
- [ ] Architecture guideline: public function destroy(Post $post) { /* delete */ }
- [ ] Architecture guideline: ### Route Registration
- [ ] Architecture guideline: Route::resource('posts', PostController::class);
- [ ] Architecture guideline: // 7 routes auto-registered with named routes

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Use apiResource for APIs
- [ ] Best practice: Use make:controller with --resource or --api
- [ ] Best practice: Keep Actions Thin
- [ ] Apply rule: Use Resource Controllers for All CRUD Operations
- [ ] Apply rule: Use apiResource for API Endpoints
- [ ] Apply rule: Generate Resource Controllers via Artisan
- [ ] Apply rule: Keep Each Resource Action Under 10 Lines
- [ ] Apply rule: Do Not Add Non-Resource Actions to Resource Controllers
- [ ] Apply rule: Use Form Requests for Store and Update Validation
- [ ] Apply rule: Use Route Model Binding in Show, Edit, Update, Destroy
- [ ] Apply rule: Avoid Resource Controllers for Non-CRUD Resources
- [ ] Apply rule: Keep the Create/Edit Methods Minimal in Web Resources

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
- [ ] Controller generated via Artisan (`--resource` or `--api`), not manually
- [ ] All 7 methods (resource) or 5 methods (api) are implemented
- [ ] Every method body is under 10 lines following validate-delegate-return
- [ ] `store()` and `update()` use dedicated FormRequest type-hints
- [ ] `show()`, `edit()`, `update()`, `destroy()` use route model binding
- [ ] `create()` and `edit()` (web) return only a view with no business logic
- [ ] No non-standard methods (publish, archive) exist in the resource controller

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Non-Resource Actions Mixed in Resource Controllers -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Overloaded Store/Update Without FormRequest -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Resource Controller for Non-CRUD Resources -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Fat Resource Actions (50+ Lines) -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Manual Model Resolution Instead of Route Model Binding -- apply preferred alternative
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
- Use Resource Controllers for All CRUD Operations
- Use apiResource for API Endpoints
- Generate Resource Controllers via Artisan
- Keep Each Resource Action Under 10 Lines
- Do Not Add Non-Resource Actions to Resource Controllers
- Use Form Requests for Store and Update Validation
- Use Route Model Binding in Show, Edit, Update, Destroy
- Avoid Resource Controllers for Non-CRUD Resources
- Keep the Create/Edit Methods Minimal in Web Resources
### Skills (from 06)
- Create a Resource Controller for CRUD Operations
- Extract Non-CRUD Operations from a Resource Controller
### Decision Trees (from 07)
- Web Resource vs API Resource Controller
- Full Resource vs Limited Resource Route Registration
- Standard CRUD vs Custom Actions Placement
### Anti-Patterns (from 08)
- Non-Resource Actions Mixed in Resource Controllers
- Overloaded Store/Update Without FormRequest
- Resource Controller for Non-CRUD Resources
- Fat Resource Actions (50+ Lines)
- Manual Model Resolution Instead of Route Model Binding
### Related Rules (from 06 skills)
- `05-rules.md` Rule: "Use Resource Controllers for All CRUD Operations"
- `05-rules.md` Rule: "Use apiResource for API Endpoints"
- `05-rules.md` Rule: "Generate Resource Controllers via Artisan"
- `05-rules.md` Rule: "Keep Each Resource Action Under 10 Lines"
- `05-rules.md` Rule: "Do Not Add Non-Resource Actions to Resource Controllers"
- `05-rules.md` Rule: "Use Form Requests for Store and Update Validation"
- `05-rules.md` Rule: "Use Route Model Binding in Show, Edit, Update, Destroy"
- `05-rules.md` Rule: "Avoid Resource Controllers for Non-CRUD Resources"
- `05-rules.md` Rule: "Keep the Create/Edit Methods Minimal in Web Resources"
### Related Skills (from 06 skills)
- "Design and Implement Controller Architecture" â€” foundation for resource controllers
- "Apply Middleware to Controller Actions" â€” protecting resource controller actions
- "Apply Dependency Injection to Controllers" â€” dependency injection for services
- "Write Feature Tests for Controller Actions" â€” testing every action

