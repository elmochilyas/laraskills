# ECC Anti-Patterns — Testing with Container

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Testing with Container |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Not Resetting Scoped Instances Between Tests
2. Over-Mocking
3. Using swap Instead of shouldReceive
4. Not Using Built-in Fakes
5. Modifying Container State Without Restoration

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — testing container operations don't address database queries
- Premature Caching — container state management in tests is about isolation, not caching

---

## Anti-Pattern 1: Not Resetting Scoped Instances Between Tests

### Category
Reliability

### Description
Not calling `forgetScopedInstances()` in test setUp — scoped instances from one test leak to another.

### Warning Signs
- Tests pass in isolation but fail when run together
- Order-dependent test failures
- Singleton/scope-related state leaks

### Why It Is Harmful
ku-03 Standardized Knowledge warns: "Scoped bindings persist within a test case — not clearing them causes state leaks between tests." The container's `$scopedInstances` array retains instances across tests within the same PHPUnit process.

### Preferred Alternative
Call `$this->app->forgetScopedInstances()` in setUp or use `RefreshesApplication` trait.

### Detection Checklist
- [ ] Scoped bindings used in tested code
- [ ] No `forgetScopedInstances()` in setUp
- [ ] Order-dependent test failures

### Related Rules
Testing with Container (05-rules.md): N/A

### Related Skills
Testing with Container (06-skills.md): N/A

### Related Decision Trees
Testing with Container (07-decision-trees.md): D03 — State Reset Strategy.

---

## Anti-Pattern 2: Over-Mocking

### Category
Testing

### Description
Mocking every dependency instead of testing real interactions, even when built-in fakes or real implementations work.

### Warning Signs
- Every test mocks all dependencies
- Tests break when implementation details change
- No integration confidence from the test suite

### Why It Is Harmful
ku-03 Standardized Knowledge recommends: "Prefer fakes over mocks. Fakes implement the real interface; mocks break when method signatures change." Over-mocking creates brittle tests that validate implementation details rather than behavior.

### Preferred Alternative
Use built-in fakes (`Event::fake()`, `Bus::fake()`) where available. Use real implementations for simple services.

### Detection Checklist
- [ ] Every dependency mocked
- [ ] Tests couple to method call order and parameters
- [ ] Refactoring breaks tests despite correct behavior

### Related Rules
Testing with Container (05-rules.md): N/A

### Related Skills
Testing with Container (06-skills.md): N/A

### Related Decision Trees
Testing with Container (07-decision-trees.md): D01 — Mock vs Fake vs Real.

---

## Anti-Pattern 3: Using swap Instead of shouldReceive

### Category
Testing

### Description
Using `Cache::swap($mock)` manually instead of `Cache::shouldReceive('get')->andReturn('value')`.

### Preferred Alternative
Use `shouldReceive()` for richer assertions (call count, arguments, return values).

### Detection Checklist
- [ ] Manual `swap()` with Mockery mock
- [ ] No expectation assertions on calls

### Related Rules
Testing with Container (05-rules.md): N/A

### Related Skills
Testing with Container (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Not Using Built-in Fakes

### Category
Testing

### Description
Creating custom mocks for events, mail, queues, and notifications instead of using Laravel's built-in fakes.

### Preferred Alternative
Use `Event::fake()`, `Mail::fake()`, `Queue::fake()`, `Notification::fake()`.

### Detection Checklist
- [ ] Custom mocks for events/mail/queues
- [ ] Built-in fakes available but unused

### Related Rules
Testing with Container (05-rules.md): N/A

### Related Skills
Testing with Container (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Modifying Container State Without Restoration

### Category
Testing

### Description
Changing a binding via `instance()` in a test but not restoring it in tearDown.

### Preferred Alternative
Restore modified bindings in tearDown or use `refreshApplication()`.

### Detection Checklist
- [ ] `instance()` called in test without restoration
- [ ] Modified binding persists to next test

### Related Rules
Testing with Container (05-rules.md): N/A

### Related Skills
Testing with Container (06-skills.md): N/A

### Related Decision Trees
Testing with Container (07-decision-trees.md): D03 — State Reset Strategy.
