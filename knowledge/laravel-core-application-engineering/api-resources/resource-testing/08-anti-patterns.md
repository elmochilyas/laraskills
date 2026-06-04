# ECC Anti-Patterns — Resource Testing

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | API Resources |
| **Knowledge Unit** | Resource Testing |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Testing Only the Happy Path (No Conditional Field Coverage)
2. Integration Tests Only (No Resource Unit Tests)
3. Snapshot Tests with Dynamic Values (Flaky Tests)
4. Testing `JsonResource` Base Functionality Instead of Own Logic

---

## Repository-Wide Anti-Patterns

- N/A

---

## Anti-Pattern 1: Testing Only the Happy Path

### Category
Testing

### Description
Resource tests only verify the default field set without testing conditional fields, authorization-based fields, or edge case inputs.

### Why It Happens
The happy path is the easiest to test. Conditionals require setting up different contexts.

### Warning Signs
- `when()`, `whenLoaded()`, `whenHas()` conditions are never tested in both states
- Authorization-conditional fields have no unauthorized test
- Test coverage does not include `assertArrayNotHasKey` assertions

### Preferred Alternative
Test every conditional path. For each `when()`, test both true (field present) and false (field omitted).

### Related Rules
- Rule: Test Every Conditional Path

---

## Anti-Pattern 2: Integration Tests Only

### Category
Testing | Performance

### Description
All resource testing is done through full HTTP feature tests (slow, coupled to routing) rather than fast resource unit tests.

### Why It Happens
Developers are unaware they can instantiate resources directly: `(new Resource($model))->response()->getData(true)`.

### Warning Signs
- Resource tests use `$this->getJson()` for every assertion
- Test suite for 20 resources takes 4+ seconds
- Tests fail when routes change (unrelated to resource logic)

### Preferred Alternative
Use resource unit tests for field-level assertions. Reserve integration tests for the adapter layer.

### Related Rules
- Rule: Use Resource Unit Tests for Field-Level Assertions

---

## Anti-Pattern 3: Snapshot Tests with Dynamic Values

### Category
Testing | Reliability

### Description
Using `assertMatchesJsonSnapshot()` on resources with dynamic values (timestamps, random IDs, auto-increment), causing flaky tests that fail on every run.

### Why It Happens
Developers use `User::factory()->create()` (dynamic IDs, real timestamps) instead of `User::factory()->make(['id' => 1])`.

### Warning Signs
- Snapshot tests fail on every test run
- Snapshots contain timestamps, random UUIDs, or auto-increment IDs
- Tests require `--update-snapshots` before every commit

### Preferred Alternative
Use fixed values in snapshot source models. `User::factory()->make(['id' => 1, 'name' => 'John'])` produces reproducible output.

### Related Rules
- Rule: Use Fixed Values in Snapshot Tests
