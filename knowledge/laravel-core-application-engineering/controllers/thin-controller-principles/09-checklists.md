# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Thin Controller Principles
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Target 5-10 Lines Per Method
- [ ] Verify: Never Query in Controllers
- [ ] Verify: Never Format Responses in Controllers
- [ ] Verify: Delegate to Services or Actions
- [ ] Enforce: Never Write Database Queries in Controllers
- [ ] Enforce: Never Format Responses Inline in Controllers
- [ ] Enforce: Delegate All Business Logic to Services or Actions
- [ ] Enforce: Keep Controller Methods Under 10 Lines
- [ ] Enforce: Use FormRequest for Every Store and Update Action
- [ ] Enforce: Limit Controller Imports to HTTP-Layer Concerns
- [ ] Enforce: Follow the Three-Step Pattern: Validate, Delegate, Return
- [ ] Enforce: Do Not Use Controllers as Orchestrators
- [ ] Enforce: Never Perform Authorization Logic Directly in Controllers
- [ ] Enforce: Ban Eloquent Model and DB Imports in Controllers via Architecture Tests
- [ ] Every controller method is now under 10 lines
- [ ] No inline validation remains (all store/update use FormRequests)
- [ ] No Eloquent/DB queries remain in any method
- [ ] No inline JSON array construction remains
- [ ] No inline authorization checks remain

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Fat Controller (Avoid)
- [ ] Architecture guideline: class UserController extends Controller
- [ ] Architecture guideline: public function index()
- [ ] Architecture guideline: $users = User::where('active', true)
- [ ] Architecture guideline: return response()->json([
- [ ] Architecture guideline: 'data' => $users->map(fn($user) => [
- [ ] Architecture guideline: 'id' => $user->id,
- [ ] Architecture guideline: 'name' => $user->name,
- [ ] Architecture guideline: 'post_count' => $user->posts->count(),
- [ ] Architecture guideline: 'meta' => ['total' => $users->total()],
- [ ] Architecture guideline: ### Thin Controller (Preferred)
- [ ] Architecture guideline: class UserController extends Controller

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Target 5-10 Lines Per Method
- [ ] Best practice: Never Query in Controllers
- [ ] Best practice: Never Format Responses in Controllers
- [ ] Best practice: Delegate to Services or Actions
- [ ] Apply rule: Never Write Database Queries in Controllers
- [ ] Apply rule: Never Format Responses Inline in Controllers
- [ ] Apply rule: Delegate All Business Logic to Services or Actions
- [ ] Apply rule: Keep Controller Methods Under 10 Lines
- [ ] Apply rule: Use FormRequest for Every Store and Update Action
- [ ] Apply rule: Limit Controller Imports to HTTP-Layer Concerns
- [ ] Apply rule: Follow the Three-Step Pattern: Validate, Delegate, Return
- [ ] Apply rule: Do Not Use Controllers as Orchestrators

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
- [ ] Every controller method is now under 10 lines
- [ ] No inline validation remains (all store/update use FormRequests)
- [ ] No Eloquent/DB queries remain in any method
- [ ] No inline JSON array construction remains
- [ ] No inline authorization checks remain
- [ ] No `app()->make()` or service locator calls remain
- [ ] Controller imports only HTTP-layer classes (FormRequests, Services, Resources)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Query-and-Respond Controller -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Controller as Orchestrator -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Inline Response Formatting (No API Resources) -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Inline Authorization Logic -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Fat Controller with 50+ Line Methods -- apply preferred alternative
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
- Never Write Database Queries in Controllers
- Never Format Responses Inline in Controllers
- Delegate All Business Logic to Services or Actions
- Keep Controller Methods Under 10 Lines
- Use FormRequest for Every Store and Update Action
- Limit Controller Imports to HTTP-Layer Concerns
- Follow the Three-Step Pattern: Validate, Delegate, Return
- Do Not Use Controllers as Orchestrators
- Never Perform Authorization Logic Directly in Controllers
- Ban Eloquent Model and DB Imports in Controllers via Architecture Tests
### Skills (from 06)
- Refactor a Fat Controller into a Thin Controller
- Enforce Thin Controller Compliance with Architecture Tests
### Decision Trees (from 07)
- What to Extract from Fat Controllers (Priority Order)
- Controller Orchestration vs Service Orchestration
- Enforcement Strategy (Manual vs Automated)
### Anti-Patterns (from 08)
- Query-and-Respond Controller
- Controller as Orchestrator
- Inline Response Formatting (No API Resources)
- Inline Authorization Logic
- Fat Controller with 50+ Line Methods
### Related Rules (from 06 skills)
- `05-rules.md` Rule: "Never Write Database Queries in Controllers"
- `05-rules.md` Rule: "Never Format Responses Inline in Controllers"
- `05-rules.md` Rule: "Delegate All Business Logic to Services or Actions"
- `05-rules.md` Rule: "Keep Controller Methods Under 10 Lines"
- `05-rules.md` Rule: "Use FormRequest for Every Store and Update Action"
- `05-rules.md` Rule: "Limit Controller Imports to HTTP-Layer Concerns"
- `05-rules.md` Rule: "Follow the Three-Step Pattern: Validate, Delegate, Return"
- `05-rules.md` Rule: "Do Not Use Controllers as Orchestrators"
- `05-rules.md` Rule: "Never Perform Authorization Logic Directly in Controllers"
- `05-rules.md` Rule: "Ban Eloquent Model and DB Imports in Controllers via Architecture Tests"
### Related Skills (from 06 skills)
- "Design and Implement Controller Architecture" â€” the target architecture
- "Apply Dependency Injection to Controllers" â€” injecting the extracted services
- "Apply Middleware to Controller Actions" â€” adding middleware to the refactored controller
- "Write Feature Tests for Controller Actions" â€” testing after refactoring
- "Enforce Thin Controller Compliance with Architecture Tests" â€” preventing regression

