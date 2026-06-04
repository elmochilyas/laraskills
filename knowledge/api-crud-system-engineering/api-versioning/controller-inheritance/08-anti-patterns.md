# Controller Inheritance: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Controller Inheritance |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **God Base Controller** — Base controller contains methods used by only one version
2. **Abandoned Base** — All methods overridden in every version, base becomes empty shell
3. **Version Bleed** — Base controller references version-specific logic, causing runtime errors
4. **Deep Inheritance Chain** — More than 2 levels of inheritance (Base → V1 → V1_1 → V2)
5. **Missing `parent::` Call** — Overriding a method and forgetting to call the parent

## Repository-Wide Anti-Patterns

- Using inheritance when >50% of methods are overridden (should use composition)
- Not marking security-critical methods as `final` in the base controller
- Shared mutable state in base controller properties
- Base controller grows into a god object over time

---

## 1. God Base Controller

### Category
Design Decay

### Description
The base controller accumulates methods over time — pagination helpers, format utilities, cache logic, ACL checks. Most of these methods are used by only one version, creating coupling between unrelated controllers.

### Why It Happens
"Put it in the base controller so every version can use it." One developer adds a method for version 2, another adds one for version 3. The base grows without discipline.

### Warning Signs
- Base controller has 20+ methods
- Most methods are used by only one child class
- Adding a new method to the base requires testing all child controllers
- Breaking a method in the base breaks only one version
- Developers add "shared" methods to the base without checking if they're actually shared

### Why Harmful
Changes to the base controller have unpredictable blast radius. A fix for V2 breaks V1 because they share a method with different expectations. Testing every version takes longer.

### Real-World Consequences
A developer modifies the `paginate()` method in the base controller to support cursor-based pagination for V3. V1 and V2, which use offset pagination, now return incorrect pagination metadata. A production incident follows.

### Preferred Alternative
Keep the base controller lean — only methods that are genuinely identical across all versions. Use traits for optional shared functionality. Use middleware for cross-cutting concerns.

### Refactoring Strategy
1. Audit base controller methods by version usage
2. Extract version-specific methods to version controllers or traits
3. Move infrastructure concerns (pagination, caching) to middleware
4. Set a maximum method count for the base controller
5. Add architecture test preventing base controller bloat

### Detection Checklist
- [ ] Base controller has many methods (>15)
- [ ] Most methods used by only one version
- [ ] Base changes affect only some versions
- [ ] No version usage tracking for base methods

### Related Rules/Skills/Trees
- Rule: API-CONTROLLER-001 (Lean Base Controller)
- Skill: thin-controller-principle
- Tree: code-organization

---

## 2. Abandoned Base

### Category
Dead Code

### Description
Every version controller overrides all methods from the base controller. The base becomes an empty shell with abstract or default methods that are never used.

### Why It Happens
Versions diverge quickly after creation. The team creates a new version by overriding everything, leaving the original base methods unused.

### Warning Signs
- All base controller methods are overridden in every version
- Base controller methods have no callers outside tests
- Removing the base controller and inlining methods in each version produces identical behavior
- New versions are created by copy-pasting the previous version entirely

### Why Harmful
Dead code that must be maintained. Every change to the base controller requires updating N version controllers even though the base is never called. Misleading architecture — developers think the base provides shared functionality when it doesn't.

### Real-World Consequences
The base controller has a `respond()` method that formats all responses. Every version overrides it with its own version. A new team member adds a feature to the base `respond()` expecting it to apply everywhere — it doesn't, and the feature is only half-implemented.

### Preferred Alternative
When >50% of base methods are overridden, switch to composition: create version-specific controllers with shared trait imports for genuinely common logic.

### Refactoring Strategy
1. Calculate override percentage for the base controller
2. If >50%, inline base methods into version controllers
3. Extract genuinely shared logic into traits
4. Delete the base controller
5. Remove inheritance from version controllers

### Detection Checklist
- [ ] All base methods overridden in every version
- [ ] Base controller methods have zero usage
- [ ] Override ratio >50%
- [ ] Versions diverge significantly

### Related Rules/Skills/Trees
- Rule: API-CONTROLLER-002 (Composition Over Inheritance)
- Skill: service-vs-action-decision
- Tree: code-organization

---

## 3. Version Bleed

### Category
Cross-Contamination

### Description
The base controller contains logic specific to a particular version — V2-only caching rules, V3-only pagination defaults. When a V1 request hits the base controller, it executes V3-specific code and fails.

### Why It Happens
A developer adds a "shared" method to the base controller that references a config or service that only exists for newer versions. The method is called by all versions but only works for one.

### Warning Signs
- Base controller references `config('api.v3.*')` or `app(V3Service::class)`
- Version-specific services injected into base controller constructor
- Runtime errors in one version caused by base changes intended for another version
- Conditional statements in base controller that check `api_version`
- Tests for V1 fail after base changes for V3

### Why Harmful
Version-specific logic in the base controller creates tight coupling between versions. A fix for one version may break another. Testing all versions becomes necessary for every base change.

### Real-World Consequences
A developer adds `app(V2PaginationService::class)` to the base controller for a V2 feature. V1 controllers, which don't have this service bound in the container, throw `BindingResolutionException`. All V1 endpoints are down.

### Preferred Alternative
Version-specific logic belongs in version controllers, not the base. Use middleware for cross-cutting concerns that apply to all versions.

### Refactoring Strategy
1. Scan base controller for version-specific references
2. Move version-specific methods to the appropriate version controller
3. Use interface-based injection with version-specific implementations
4. Add architecture test that prevents version-specific references in the base
5. Restore version-independent base controller

### Detection Checklist
- [ ] Base controller references version-specific configs or services
- [ ] Version check conditionals in base controller
- [ ] V1 tests fail after V3 base changes
- [ ] Different version controllers inject different dependencies into base

### Related Rules/Skills/Trees
- Rule: API-CONTROLLER-003 (Version Independence)
- Skill: controller-dependency-injection
- Tree: code-organization

---

## 4. Deep Inheritance Chain

### Category
Structural Fragility

### Description
Creating more than 2 levels of controller inheritance — `BaseController → V1Controller → V1_1Controller → V2Controller`. Each level adds complexity and makes the code harder to understand.

### Why It Happens
"Don't repeat yourself" taken too far. A V1_1 version shares 90% of V1 logic, so it extends V1 instead of the base. Then V2 extends V1_1 because it shares 80%.

### Warning Signs
- Inheritance depth >2 levels (Base → Version)
- Understanding a single controller requires reading 3+ files
- Method resolution follows a long chain
- `parent::` calls cascade through multiple levels
- Adding a feature requires modifying several parent classes

### Why Harmful
Code becomes impossible to navigate. A change at any level can break all descendants. Unit tests must cover every level. New developers cannot trace method execution.

### Real-World Consequences
A bug fix in `V1Controller` was intended to apply only to V1. Because `V1_1Controller` extends `V1Controller`, the fix changes V1_1 behavior as well, causing a regression for V1_1 consumers.

### Preferred Alternative
Limit inheritance to 2 levels: Base → Version. For versions that need to share code, use traits or composition instead of inheritance.

### Refactoring Strategy
1. Flatten the inheritance chain to Base → Version
2. Extract intermediate-level logic into traits
3. Duplicate (don't inherit) code that is genuinely needed in multiple versions
4. Add architecture test enforcing 2-level max
5. Document the flattened structure

### Detection Checklist
- [ ] Inheritance depth >2
- [ ] Multiple `parent::` calls in a single method
- [ ] Understanding a controller requires reading 3+ files
- [ ] Changes to grandparent affect grandchildren unexpectedly

### Related Rules/Skills/Trees
- Rule: API-CONTROLLER-004 (Flat Inheritance)
- Skill: controller-organization-by-version
- Tree: code-organization

---

## 5. Missing `parent::` Call

### Category
Behavioral Regression

### Description
Overriding a base controller method in a version controller without calling `parent::method()`. The parent's logic (authorization, logging, data preparation) is silently skipped.

### Why It Happens
The developer focuses on the override behavior and forgets that the parent method contains important logic. No linting rule catches missing parent calls.

### Warning Signs
- Overridden methods don't call `parent::`
- Security checks that existed in the base are bypassed in the version
- Logging or metrics missing for specific versions
- Base method had side effects (authorization, validation) that are now skipped
- Bug reports for one version that doesn't apply to others

### Why Harmful
Silent behavioral regression — the version controller appears to work but misses critical base logic. Security authorization, input validation, or audit logging may be bypassed.

### Real-World Consequences
The base controller's `update()` method calls `$this->authorizeResource()` before the update logic. V2 overrides `update()` without calling `parent::update()`. V2 users can now update any resource without authorization.

### Preferred Alternative
Mark security-critical base methods as `final` to prevent bypass. Use the `#[Override]` attribute (PHP 8.3+) to catch accidental signature drift. Add architecture tests that verify parent calls.

### Refactoring Strategy
1. Audit all overridden methods for missing `parent::` calls
2. Add architecture test that verifies `parent::` is called for marked methods
3. Mark security-critical methods as `final` in the base controller
4. Document which base methods must call `parent::` when overridden
5. Add a PHPStan rule to detect missing `parent::` calls

### Detection Checklist
- [ ] Overridden methods lack `parent::` calls
- [ ] Base authorization/validation bypassed
- [ ] Logging missing in specific versions
- [ ] No `#[Override]` attribute usage on overrides

### Related Rules/Skills/Trees
- Rule: API-CONTROLLER-005 (Parent Call Enforcement)
- Skill: controller-inheritance
- Tree: code-organization
