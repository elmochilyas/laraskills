# ECC Anti-Patterns — Data Wrapping

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | API Resources |
| **Knowledge Unit** | Data Wrapping |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Inconsistent Wrapping Across Endpoints
2. Forgetting `withoutWrapping()` in Tests
3. Custom `$wrap` Key Inconsistency
4. Unwrapped Paginated Collections (Breaking Change Later)

---

## Repository-Wide Anti-Patterns

- N/A (format-specific anti-patterns)

---

## Anti-Pattern 1: Inconsistent Wrapping Across Endpoints

### Category
Design | Reliability

### Description
Some endpoints wrap responses in `data` while others return bare objects. Clients cannot determine the response format without checking each endpoint individually.

### Why It Happens
Different developers wrote different endpoints. Some used `withoutWrapping()` globally; others used per-resource `$wrap`. No global wrapping policy was established.

### Warning Signs
- Some single-resource endpoints return `{ "data": { ... } }` while others return `{ ... }`
- No `AppServiceProvider::boot()` call for `withoutWrapping()`
- Combination of `$wrap` and default wrapping in the same API

### Why It Is Harmful
Client parsing code must handle both formats. Adding a new endpoint requires checking which format the team is using. Migration between formats is a breaking change.

### Real-World Consequences
A mobile app uses a JSON parsing library that expects `response.data`. Half the endpoints return `data`, half don't. The app crashes on endpoints that return bare objects.

### Preferred Alternative
Decide on wrapping policy globally and enforce it. Either wrap all resources (`withWrapping`) or unwrap all (`withoutWrapping`). Never mix.

### Refactoring Strategy
1. Decide on wrapping policy: wrapped or unwrapped.
2. Apply globally: add `withoutWrapping()` or remove it.
3. Remove all per-resource `$wrap` overrides.
4. Update tests to match the policy.
5. Document the policy in API docs.

### Detection Checklist
- [ ] Are all endpoints consistent in their wrapping format?
- [ ] Is `withoutWrapping()` called globally or not?

### Related Rules
- Rule: Be Consistent Across All Endpoints in the Same API Version

---

## Anti-Pattern 2: Forgetting `withoutWrapping()` in Tests

### Category
Testing

### Description
Test assertions check for `data` key but production uses `withoutWrapping()`, or vice versa. Tests pass locally but fail in production because of the wrapping mismatch.

### Why It Happens
The wrapping choice is configured in `AppServiceProvider`, which is booted in feature tests (if using `CreatesApplication`), but resource unit tests may not boot the provider.

### Warning Signs
- Resource unit tests assert `$response['data']` but production resources use `withoutWrapping()`
- Feature tests pass but unit tests fail for the same resource
- No `setUp()` call for wrapping in test base class

### Why It Is Harmful
Tests provide false confidence. The resource produces different output in production than in tests. Client-facing schema changes silently.

### Real-World Consequences
A resource removes the `data` wrapper in production via `withoutWrapping()`, but tests still expect `['data' => ['id' => 1]]`. Tests pass because they don't boot the service provider. Production breaks.

### Preferred Alternative
Mirror production wrapping in test configuration. Call `withoutWrapping()` in test base class `setUp()`.

### Refactoring Strategy
1. In resource unit tests, apply the same wrapping configuration as production.
2. Create a `ResourceTestCase` base class that configures wrapping.
3. Update all resource tests to extend the base class.
4. Add a CI test that asserts wrapping consistency between test and production.

### Detection Checklist
- [ ] Do test assertions match production wrapping configuration?
- [ ] Is wrapping configured in test base class?

### Related Rules
- Rule: Match Production Wrapping in Test Configuration
