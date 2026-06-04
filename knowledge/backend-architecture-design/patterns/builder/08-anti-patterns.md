# Builder — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Builder pattern in PHP/Laravel context |
| Anti-Pattern Count | 4 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Builder Allowing Invalid Object State | Critical |
| 2 | Builder with Too Many Responsibilities | High |
| 3 | Not Providing Defaults | Medium |
| 4 | Mutable Builder Reused After build() | High |

---

## 1. Builder Allowing Invalid Object State

### Category
Data Integrity

### Description
The `build()` method does not validate that the constructed object is in a valid state, allowing partially configured or inconsistent objects.

### Why It Happens
Builder is treated as a simple data holder. Validation is deferred to the created object or never performed.

### Warning Signs
- `build()` never throws for invalid state
- Objects created with missing required fields
- Inconsistent objects (e.g., service URL without API key)
- Validation happens later, causing runtime errors

### Why Harmful
The pattern's purpose (controlled object construction) is defeated. Invalid objects leak into the system.

### Consequences
- Runtime failures from invalid objects
- Contract violations
- Debugging difficulty
- Inconsistent state

### Alternative
Validate required fields in `build()`. Throw `InvalidArgumentException` with clear message. Use factory for optional validation.

### Refactoring Strategy
1. Identify required field combinations
2. Add validation in build()
3. Add specific exception type
4. Test invalid state scenarios

### Detection Checklist
- [ ] Check build() for validation
- [ ] Test invalid object construction
- [ ] Verify required field enforcement

### Related Rules/Skills/Trees
- Skills: Builder, Object Construction
- Decision Trees: Builder Validation Strategy

---

## 2. Builder with Too Many Responsibilities

### Category
Architecture

### Description
A single builder handles construction for multiple different product types, each with unique configuration needs.

### Why It Happens
Builders grow by adding methods for new product types instead of creating dedicated builders.

### Warning Signs
- Builder methods for unrelated product types
- `build()` returning different types based on configuration
- Builder has sections for different products
- Caller confusion about which methods to use

### Why Harmful
SRP violation. The builder is hard to understand and maintain. Changes for one product type risk breaking another.

### Consequences
- SRP violation
- High complexity
- Confusing API
- Hard to test

### Alternative
One builder per product type. Share common interfaces if products have overlapping configuration.

### Refactoring Strategy
1. Group methods by product type
2. Extract to dedicated builders
3. Share common interfaces
4. Update consumers

### Detection Checklist
- [ ] Count product types per builder
- [ ] Evaluate method grouping
- [ ] Assess SRP compliance

### Related Rules/Skills/Trees
- Rules: Prefer Composition Over Inheritance
- Skills: Builder, SRP

---

## 3. Not Providing Defaults

### Category
Usability

### Description
Builder requires the caller to set every parameter, even when reasonable defaults exist, making the builder verbose and unpleasant to use.

### Why It Happens
Builder is created as a mechanical set-get-then-build wrapper without considering usability.

### Warning Signs
- Every parameter required to call build()
- No sensible defaults for common cases
- Callers always setting the same values for most parameters
- Builder provides no convenience over constructor

### Why Harmful
The builder's value (simplified construction) is lost. Callers must specify everything, defeating the purpose.

### Consequences
- Verbose call sites
- Poor developer experience
- No benefit over constructor with named arguments
- Resistance to using the builder

### Alternative
Provide sensible defaults for optional parameters. Use the fluent API to override only what differs.

### Refactoring Strategy
1. Identify common default values
2. Set defaults in builder fields
3. Document defaults
4. Test default construction

### Detection Checklist
- [ ] Check for sensible defaults
- [ ] Evaluate common caller patterns
- [ ] Assess usability improvement

### Related Rules/Skills/Trees
- Skills: Builder, Fluent API Design

---

## 4. Mutable Builder Reused After build()

### Category
Reliability

### Description
Builder is reused after `build()` to create another object, but mutations to the builder affect the previously built object or leak state between constructed instances.

### Why It Happens
Builder is designed as mutable. After `build()`, the builder state remains and modifying it changes the already-built object (if they share references).

### Warning Signs
- Builder reused for multiple builds
- Changes to builder after build() affect built object
- Shared mutable references between builder and created object
- Concurrency issues with builder reuse

### Why Harmful
Builder reuse with shared mutable state creates unpredictable objects. The second object may have different properties than expected because of leaked state.

### Consequences
- Unpredictable construction
- Shared state bugs
- Concurrency issues
- Hard-to-debug object differences

### Alternative
Make builder immutable (return new instance on each method call). Or create a fresh builder for each object.

### Refactoring Strategy
1. Add `reset()` method or create fresh builder
2. Avoid shared mutable references
3. Consider immutable builder pattern
4. Test builder reuse scenarios

### Detection Checklist
- [ ] Check for builder reuse patterns
- [ ] Test multiple builds from one builder
- [ ] Verify built-object independence

### Related Rules/Skills/Trees
- Skills: Builder, Immutability
