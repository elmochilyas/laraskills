# Anti-Patterns: Metadata

## Metadata

| Field | Value |
|-------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Mocking & Fakes |
| Knowledge Unit | Metadata |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Using Mocks Instead of Fakes for Simple Services | Practice | High |
| 2 | Mocking Final Classes or Methods | Practice | High |
| 3 | Mocking Third-Party Code (Not Wrapped) | Practice | Medium |
| 4 | Mocking Without Verifying Expectations | Practice | Medium |

## Repository-Wide Anti-Patterns

- **Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- **Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.

---

## Anti-Pattern 1: Using Mocks Instead of Fakes for Simple Services

### Category
Practice

### Description
Using Mockery mocks for simple services instead of fakes, creating brittle interaction tests.

### Why It Happens
Mocking is default. Fakes seem like more code.

### Warning Signs
Complex shouldReceive chains. Interface changes break mocks.

### Why Harmful
Mocks test call patterns not outcomes.

### Consequences
Brittle tests. Refactoring requires updating all mocks.

### Alternative
Create fake implementations. Assert on outcomes not calls.

### Refactoring Strategy
1. Create FakeMailer etc. 2. Replace mocks with fakes. 3. Assert on outcomes.

### Detection Checklist
- [ ] Fakes preferred for services
- [ ] Mocks only for complex interactions
- [ ] Fakes minimal

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Prefer fakes over mocks for services
- 05-rules.md: Assert on outcomes
- 06-skills.md: Implement Fake Implementations vs Mocks
- 07-decision-trees.md: Mock vs Fake Decision

---

## Anti-Pattern 2: Mocking Final Classes or Methods

### Category
Practice

### Description
Attempting to mock final classes requiring brittle workarounds.

### Why It Happens
Adding final did not consider testability.

### Warning Signs
Partial mocks with onlyMethods. Workarounds for final.

### Why Harmful
Bypassing final creates coupling to implementation.

### Consequences
Brittle tests. Cannot refactor freely.

### Alternative
Mock the interface not final class. Extract interface.

### Refactoring Strategy
1. Extract interface. 2. Type-hint against interface. 3. Mock interface.

### Detection Checklist
- [ ] No final classes mocked
- [ ] Interfaces mocked
- [ ] Design changes do not break mocks

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Mock interfaces not final classes
- 05-rules.md: Extract interfaces for mockability
- 06-skills.md: Design Testable Code with Interfaces
- 07-decision-trees.md: Mockability Design Decision

---

## Anti-Pattern 3: Mocking Third-Party Code (Not Wrapped)

### Category
Practice

### Description
Mocking SDK classes directly instead of wrapping behind adapter.

### Why It Happens
No adapter pattern. Direct dependency on SDK.

### Warning Signs
Partial mocks of vendor classes. SDK upgrades break tests.

### Why Harmful
Third-party code may change internals. Tests couple to vendor.

### Consequences
SDK upgrade requires test updates.

### Alternative
Wrap SDK in adapter interface. Mock adapter not SDK.

### Refactoring Strategy
1. Create adapter interface. 2. Implement adapter. 3. Mock adapter.

### Detection Checklist
- [ ] Third-party behind adapter
- [ ] Adapter mocked
- [ ] SDK upgrades do not break tests

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Wrap third-party behind adapter
- 05-rules.md: Mock the adapter
- 06-skills.md: Decouple Tests from Third-Party Code
- 07-decision-trees.md: External Dependency Strategy

---

## Anti-Pattern 4: Mocking Without Verifying Expectations

### Category
Practice

### Description
Creating mocks but never calling Mockery::close() leaving assertions unenforced.

### Why It Happens
Forgetting verification step.

### Warning Signs
Expected but test passes when unmet. Mockery::close() missing.

### Why Harmful
Unverified expectations give false confidence.

### Consequences
False negatives. Missing behavior verification.

### Alternative
Always call Mockery::close() in tearDown.

### Refactoring Strategy
1. Add close() to tearDown. 2. Verify expectations enforced.

### Detection Checklist
- [ ] Mockery::close() in tearDown
- [ ] Expectations enforced

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: Metadata
- 05-rules.md: Always verify mock expectations
- 05-rules.md: Use proper teardown
- 06-skills.md: Verify Mock Expectations Correctly
- 07-decision-trees.md: Mock Verification Strategy

---
