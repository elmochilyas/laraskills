# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Feature & HTTP Testing |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Testing External HTTP Calls Without Faking | Practice | Critical |
| 2 | Testing JSON API Without assertJsonStructure | Practice | High |
| 3 | Not Testing Validation Error Messages | Practice | Medium |
| 4 | Not Resetting Session Between Tests | Practice | High |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Testing External HTTP Calls Without Faking

### Category
Practice

### Description
Making actual HTTP calls to external services in tests causing flaky CI.

### Why It Happens
Not knowing about Http::fake(). Real test mentality.

### Warning Signs
Tests fail when network down. Fail when API rate limits hit.

### Why Harmful
External API availability is outside your control.

### Consequences
Flaky CI. External outages block deployments.

### Alternative
Use Http::fake() to stub external calls. Test error scenarios separately.

### Refactoring Strategy
1. Identify external HTTP calls. 2. Replace with Http::fake(). 3. Test error scenarios.

### Detection Checklist
- [ ] All external calls faked
- [ ] Error scenarios via fakes
- [ ] No real HTTP in unit/feature

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Fake all external HTTP calls
- 05-rules.md: Test error scenarios via fakes
- 06-skills.md: Stub External HTTP Calls with Http::fake()
- 07-decision-trees.md: External HTTP Test Strategy

---

## Anti-Pattern 2: Testing JSON API Without assertJsonStructure

### Category
Practice

### Description
Asserting exact JSON responses instead of structural shape.

### Why It Happens
assertJson is easier. Copying API responses into tests.

### Warning Signs
Tests break when API adds fields. Full response payloads in assertions.

### Why Harmful
Exact matching breaks on data changes. Timestamps and UUIDs cause false negatives.

### Consequences
Brittle API tests. Frequent updates for unrelated changes.

### Alternative
Use assertJsonStructure() for shape. assertJsonFragment() for specific values.

### Refactoring Strategy
1. Replace assertJson with assertJsonStructure. 2. Extract dynamic values.

### Detection Checklist
- [ ] assertJsonStructure for shape
- [ ] assertJsonFragment for keys
- [ ] Dynamic values separate

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Test JSON structure not exact content
- 06-skills.md: Write Robust JSON API Assertions
- 07-decision-trees.md: API Test Granularity Decision

---

## Anti-Pattern 3: Not Testing Validation Error Messages

### Category
Practice

### Description
Testing only success scenarios never verifying validation errors.

### Why It Happens
Happy-path focus. Validation already tested by framework assumption.

### Warning Signs
Only 200 tests. No 422 validation tests. Custom rules untested.

### Why Harmful
Broken validation confuses users and increases support tickets.

### Consequences
Users see generic errors. Custom validators untested.

### Alternative
Write tests per validation rule violation.

### Refactoring Strategy
1. Identify all rules. 2. Write test per violation. 3. Assert status 422 and message.

### Detection Checklist
- [ ] Validation errors tested per rule
- [ ] Custom validators have tests
- [ ] Messages match

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Test each validation rule
- 05-rules.md: Verify error messages
- 06-skills.md: Test Validation Rules and Error Responses
- 07-decision-trees.md: Validation Test Coverage Decision

---

## Anti-Pattern 4: Not Resetting Session Between Tests

### Category
Practice

### Description
Session state leaking across feature tests.

### Why It Happens
Not using RefreshDatabase. Shared auth state.

### Warning Signs
Auth tests pass together but fail individually. Session data visible across tests.

### Why Harmful
Non-deterministic results. Random order breaks them.

### Consequences
Flaky suite. CI failures on random order.

### Alternative
Use RefreshDatabase. Clear session in setUp().

### Refactoring Strategy
1. Add RefreshDatabase trait. 2. Clear session in setUp. 3. Auth independently.

### Detection Checklist
- [ ] DB refreshed between tests
- [ ] Session independent
- [ ] Pass random order

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Reset DB/session between tests
- 05-rules.md: Auth each test independently
- 06-skills.md: Ensure Test State Isolation
- 07-decision-trees.md: Test Isolation Strategy

---
