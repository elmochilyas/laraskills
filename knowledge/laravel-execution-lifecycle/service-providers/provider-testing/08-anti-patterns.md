# ECC Anti-Patterns — Provider Testing

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Providers |
| **Knowledge Unit** | Provider Testing |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Testing Resolution Instead of Registration
2. No provides() Test for Deferred Providers
3. Over-Isolated Tests
4. Testing boot() Without Prerequisites
5. Over-Mocking Container

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — provider tests verify container state, not query results
- Premature Caching — provider tests should verify registration before caching

---

## Anti-Pattern 1: Testing Resolution Instead of Registration

### Category
Testing

### Description
Using `$app->make(Service::class)` to verify a provider registered a binding — this passes even if another provider registered it.

### Warning Signs
- Tests call `make()` without checking `bound()`
- Test passes even if the tested provider is removed
- False confidence in registration correctness

### Why It Is Harmful
`make()` resolves the service regardless of which provider registered it. The test passes even if the tested provider doesn't register anything. The real question — "did MY provider register this binding?" — is never answered.

### Preferred Alternative
Use `$app->bound()` to verify the specific provider's registration before testing resolution.

### Detection Checklist
- [ ] Test uses `make()` without `bound()` check
- [ ] Provider removal doesn't break test
- [ ] Registration not directly tested

### Related Rules
Provider Testing (05-rules.md): N/A

### Related Skills
Provider Testing (06-skills.md): N/A

### Related Decision Trees
Provider Testing (07-decision-trees.md): D01 — Registration vs Resolution Testing.

---

## Anti-Pattern 2: No provides() Test for Deferred Providers

### Category
Testing

### Description
Not testing that `provides()` matches actual bindings in `register()`.

### Preferred Alternative
Add `provides()` assertion for every deferred provider.

### Detection Checklist
- [ ] Deferred provider without provides() test
- [ ] Mismatch between provides() and actual bindings

### Related Rules
Provider Testing (05-rules.md): N/A

### Related Skills
Provider Testing (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Over-Isolated Tests

### Category
Testing

### Description
Mock container that doesn't actually bind or resolve services — tests pass but production fails.

### Preferred Alternative
Use real container for `register()` tests.

### Detection Checklist
- [ ] Mock container in provider test
- [ ] Test behaviors differ from production

### Related Rules
Provider Testing (05-rules.md): N/A

### Related Skills
Provider Testing (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Testing boot() Without Prerequisites

### Category
Testing

### Description
Testing `boot()` without registering dependent providers first.

### Preferred Alternative
Register all dependencies before testing `boot()`.

### Detection Checklist
- [ ] `boot()` tests fail with "class not bound"
- [ ] Dependent providers not registered

### Related Rules
Provider Testing (05-rules.md): N/A

### Related Skills
Provider Testing (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Over-Mocking Container

### Category
Testing

### Description
Using `$this->createMock(Container::class)` for provider tests.

### Preferred Alternative
Use real container for most provider tests.

### Detection Checklist
- [ ] Mock container in provider test
- [ ] False confidence from mock behavior

### Related Rules
Provider Testing (05-rules.md): N/A

### Related Skills
Provider Testing (06-skills.md): N/A

### Related Decision Trees
Provider Testing (07-decision-trees.md): D02 — Isolation vs Integration.
