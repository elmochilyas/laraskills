# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Action Class Design
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Use `final readonly` for Dependency Immutability
- [ ] Verify: Accept DTOs, Not Request Objects
- [ ] Verify: Keep Actions Stateless
- [ ] Verify: Enforce the Single Public Method Rule
- [ ] Verify: Return Typed Results
- [ ] Verify: Keep Constructor Dependencies Under 5-8
- [ ] Verify: Use Domain Subdirectories, Not a Flat List
- [ ] Verify: Use a Single Naming Convention Across the Team
- [ ] Enforce: Enforce Single Public Method Per Action
- [ ] Enforce: Declare Action Classes as `final readonly`
- [ ] Enforce: Never Accept HTTP Request Objects in Actions
- [ ] Enforce: Return Typed Results from Every Action
- [ ] Enforce: Limit Constructor Dependencies to a Maximum of 8
- [ ] Enforce: Organize Actions in Domain Subdirectories
- [ ] Enforce: Keep Actions Stateless â€” Never Set Mutable Properties During Execution
- [ ] Enforce: Do Not Create Actions for Simple Eloquent CRUD Pass-Through
- [ ] Enforce: Establish a Single Method Name Convention Across the Team
- [ ] Enforce: Enforce Action Purity with Pest Architecture Tests
- [ ] Enforce: Prefer DTOs or Individual Parameters Over Loose Arrays

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Layer Placement
- [ ] Architecture guideline: Actions sit between the entry point layer (controllers, commands, listeners) and the data access ...
- [ ] Architecture guideline: HTTP Controllers / CLI Commands / Queue Jobs / Event Listeners
- [ ] Architecture guideline: [Actions]  â† business logic layer
- [ ] Architecture guideline: Repositories / Eloquent Models / External Services
- [ ] Architecture guideline: ### Boundary Rules
- [ ] Architecture guideline: - **Actions must not know about HTTP.** No `Request`, `Response`, or session dependencies in acti...
- [ ] Architecture guideline: - **Actions must not know about the queue.** If an action needs to be queued, use a trait or a wr...
- [ ] Architecture guideline: - **Actions must not know about the view.** No rendering, no view data preparation. Return data; ...
- [ ] Architecture guideline: - **Actions may call other actions.** Composition is the primary way to build complex operations ...
- [ ] Architecture guideline: - **Actions may call repositories directly.** There is no requirement for a service layer between...
- [ ] Architecture guideline: - **Actions should not call controllers.** The dependency direction is entry-point-to-action, not...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Use `final readonly` for Dependency Immutability
- [ ] Best practice: Accept DTOs, Not Request Objects
- [ ] Best practice: Keep Actions Stateless
- [ ] Best practice: Enforce the Single Public Method Rule
- [ ] Best practice: Return Typed Results
- [ ] Best practice: Keep Constructor Dependencies Under 5-8
- [ ] Best practice: Use Domain Subdirectories, Not a Flat List
- [ ] Best practice: Use a Single Naming Convention Across the Team
- [ ] Apply rule: Enforce Single Public Method Per Action
- [ ] Apply rule: Declare Action Classes as `final readonly`
- [ ] Apply rule: Never Accept HTTP Request Objects in Actions
- [ ] Apply rule: Return Typed Results from Every Action

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] ### Resolution Cost
- [ ] Each action resolution requires the container to reflect on the constructor and recursively resolve dependencies. For...
- [ ] **Tradeoff:** The container does not cache action instances by default. Every `app(Action::class)` call performs a fu...
- [ ] ### Memory Per Action
- [ ] An action instance consumes approximately 1-2KB of memory for the object plus its resolved dependencies. In a request...
- [ ] Action class files are autoloaded via Composer's PSR-4 loader. After OpCache warmup, autoloading has zero per-request...
- [ ] ### Octane/RoadRunner Considerations
- [ ] In long-lived processes, action instances are cached in the container's singleton or scoped bindings. An action that ...
- [ ] **Important:** If an action is accidentally bound as a singleton in the container, its dependencies are resolved once...

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Data Leakage via Stateful Actions (Octane/RoadRunner)
- [ ] If an action captures per-request data as instance properties and the action is resolved from a cached container, dat...
- [ ] **Mitigation:** Enforce stateless actions. Never set `$this->property` during `handle()`. Use `readonly class` to pre...
- [ ] ### Authorization Bypass via Action Reuse
- [ ] When an action is called from multiple entry points (controller, CLI, queue), it is the caller's responsibility to au...
- [ ] **Mitigation:** Either enforce authorization at every entry point or add explicit `authorize()` calls in the action. ...
- [ ] ### Input Validation Bypass

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
- [ ] Action class is declared `final readonly` (or `final` on PHP < 8.2)
- [ ] Action class has exactly one public method
- [ ] Action class does not import from `Illuminate\Http` namespace
- [ ] Action class returns a concrete type (not `mixed`, not bare `array`)
- [ ] Constructor has at most 8 parameters
- [ ] Action does not call `request()`, `auth()`, `session()`, or `response()` helpers
- [ ] Action does not set mutable properties during `handle()`/`execute()`

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: God Action -- apply preferred alternative
    - [ ] Count constructor parameters in each action class
    - [ ] Measure `handle()` method line count
    - [ ] Count distinct namespace imports
- [ ] Prevent: Action as Service (Multi-Method Action) -- apply preferred alternative
    - [ ] Scan all `App\Actions\` classes for more than one public method
    - [ ] Check for Pest architecture test enforcing single public method
- [ ] Prevent: HTTP-Coupled Action -- apply preferred alternative
    - [ ] Grep `use Illuminate\Http` in all `App\Actions\` files
    - [ ] Grep `request()->` in all `App\Actions\` files
- [ ] Prevent: Stateful Action -- apply preferred alternative
    - [ ] Audit all `$this->` assignments in action `handle()` methods
    - [ ] Verify classes are `readonly` (PHP 8.2+)
    - [ ] Check for getter methods in action classes
- [ ] Prevent: CRUD Pass-Through Action Ceremony -- apply preferred alternative
    - [ ] Identify actions with empty constructors (zero injected dependencies)
    - [ ] Identify actions whose `handle()` body is a single Eloquent call
    - [ ] Check if the action is called from only one entry point
- [ ] Avoid mistake: Actions with Mutable State
- [ ] Avoid mistake: Actions with Multiple Public Methods
- [ ] Avoid mistake: Actions Accepting HTTP Request Objects
- [ ] Avoid mistake: Actions With Too Many Constructor Parameters
- [ ] Avoid mistake: Actions That Return Mixed Types
- [ ] Avoid mistake: Actions That Wrap Every Eloquent Call

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
### Related Topics (from 04)
- Service Container Basics
- Dependency Injection
- Controller Architecture
- Action Naming Conventions
- Action Composition
- Transactional Actions
- Action Testing
- Action vs Service vs Use Case
- Queued Actions
- Use Case Variant
- Octane Safety
- Laravel Eloquent & Domain Modeling
- Async & Distributed Systems
- API & CRUD System Engineering
- Testing & Reliability Engineering
### Rules (from 05)
- Enforce Single Public Method Per Action
- Declare Action Classes as `final readonly`
- Never Accept HTTP Request Objects in Actions
- Return Typed Results from Every Action
- Limit Constructor Dependencies to a Maximum of 8
- Organize Actions in Domain Subdirectories
- Keep Actions Stateless â€” Never Set Mutable Properties During Execution
- Do Not Create Actions for Simple Eloquent CRUD Pass-Through
- Establish a Single Method Name Convention Across the Team
- Enforce Action Purity with Pest Architecture Tests
- Prefer DTOs or Individual Parameters Over Loose Arrays
- Do Not Bind Actions as Singleton Services
### Skills (from 06)
- Extract Controller Logic to an Action
- Design an Octane-Safe Stateless Action
- Migrate Action Parameters from Arrays to DTOs
### Decision Trees (from 07)
- Action vs Inline Logic (Controller/Service)
- DTO vs Array vs Individual Parameters
- Constructor vs Method Injection in Actions
### Anti-Patterns (from 08)
- God Action
- Action as Service (Multi-Method Action)
- HTTP-Coupled Action
- Stateful Action
- CRUD Pass-Through Action Ceremony
### Common Mistakes (from 04)
- Actions with Mutable State
- Actions with Multiple Public Methods
- Actions Accepting HTTP Request Objects
- Actions With Too Many Constructor Parameters
- Actions That Return Mixed Types
- Actions That Wrap Every Eloquent Call
### Related Rules (from 06 skills)
- Rule: Enforce Single Public Method Per Action (action-class-design/05-rules.md)
- Rule: Declare Action Classes as `final readonly` (action-class-design/05-rules.md)
- Rule: Never Accept HTTP Request Objects in Actions (action-class-design/05-rules.md)
- Rule: Return Typed Results from Every Action (action-class-design/05-rules.md)
- Rule: Limit Constructor Dependencies to a Maximum of 8 (action-class-design/05-rules.md)
- Rule: Keep Actions Stateless (action-class-design/05-rules.md)
- Rule: Do Not Create Actions for Simple Eloquent CRUD Pass-Through (action-class-design/05-rules.md)
- Rule: Establish a Single Method Name Convention (action-class-design/05-rules.md)
- Rule: Enforce Action Purity with Pest Architecture Tests (action-class-design/05-rules.md)
- Rule: Prefer DTOs or Individual Parameters Over Loose Arrays (action-class-design/05-rules.md)
### Related Skills (from 06 skills)
- Compose Actions into a Workflow (action-composition/06-skills.md)
- Choose the Right Pattern for a Business Operation (action-vs-service-vs-usecase/06-skills.md)
- Write a Pure Unit Test for an Action (action-testing/06-skills.md)

