# Metadata

Domain: Application Architecture Patterns
Subdomain: Service Layer Pattern
Knowledge Unit: Action classes: single-operation-per-class pattern
Knowledge Unit ID: SLP-02
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Overview

Action classes encapsulate one business operation per class. Instead of `UserService::register()` with 10 other methods, you have `RegisterUserAction::execute()`. Each action has exactly one public method. This is the most granular organizational pattern: each operation is independently testable, injectable, and composable. Actions prevent the god service class problem by forcing a new class for each operation.

---

# Core Concepts

```php
class RegisterUserAction {
    public function execute(array $data): User { /* one operation */ }
}
```
- Actions follow the Command pattern (GoF). Each represents one business operation.
- Action names are verb-noun commands: `RegisterUser`, `ProcessPayment`, `GenerateInvoice`.

---

# When To Use

- Service classes are growing into god objects.
- Operations are distinct enough to warrant individual classes.
- Maximum testability per operation is desired.

---

# When NOT To Use

- Operations are tightly related and share significant internal logic (use service classes).
- Application is simple CRUD with few operations.

---

# Best Practices

- **Actions should not call other actions.** WHY: Actions are leaf nodes in the call graph. Composition happens at the service level. Action calling action creates opaque call graphs.
- **Actions should not have state between construction and execution.** WHY: Under Octane, state on singletons leaks between requests. Actions should be stateless.
- **Group actions by domain directory.** WHY: 100 flat action files in `app/Actions/` is unmanageable. Use `app/Actions/User/`, `app/Actions/Order/`.
- **Avoid anemic actions.** WHY: An action that simply calls `User::create($data)` adds no value. Actions should contain operation-specific logic.

---

# Architecture Guidelines

- Actions are leaf-node operations — they call repositories/models but not other actions.
- Actions can be invoked directly (`app(RegisterUserAction::class)->execute()`) or via command bus.
- Recommended: Services orchestrate workflows, actions are leaf-node operations. Services call actions, actions don't call actions.

---

# Performance Considerations

- Action resolution adds negligible overhead. Each action resolved once per invocation.

---

# Security Considerations

- No specific implications. Authorization in policies/form requests.

---

# Common Mistakes

1. **Actions calling actions:** Action A depends on Action B. Cause: convenience. Consequence: couples operations, bypasses service orchestration. Better: services coordinate; actions are leaf nodes.

2. **Actions with state:** Setting properties on action between construction and execution. Cause: OOP habit. Consequence: state leaks under Octane. Better: pass parameters to execute().

3. **Anemic actions:** Action just calls a single model method. Cause: extraction without value. Consequence: boilerplate without benefit. Better: only extract when orchestration or complexity is needed.

---

# Anti-Patterns

- **Action explosion without organization**: 100 flat action files. Group by domain subdirectory.
- **Giant action**: 10+ constructor dependencies or 100+ lines. Split into multiple actions.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| SLP-01 Service classes | SLP-08 Action naming conventions | SLP-10 Service vs Action vs Use Case |
| SLP-03 Controller thinning | SLP-09 Dependency injection | SLP-19 Octane service state |

---

# AI Agent Notes

- Default to actions for leaf-node operations.
- Never generate action-to-action calls.
- Group actions by domain subdirectory.
- Actions should be stateless — pass all data via execute() parameters.

---

# Verification

- [ ] Each action has exactly one public method
- [ ] Actions don't call other actions
- [ ] Actions are stateless (no mutable properties)
- [ ] Actions are organized by domain directory
- [ ] No anemic actions (logicless model wrappers)
