# Abstract Factory — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Abstract Factory pattern in PHP/Laravel context |
| Anti-Pattern Count | 4 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Abstract Factory Interface Growing with Every New Product | High |
| 2 | Concrete Factories with Shared State | Medium |
| 3 | Factory Selection Logic with Hard-Coded Class Names | High |
| 4 | Not Testing the Factory Selection Path | High |

---

## 1. Abstract Factory Interface Growing with Every New Product

### Category
Architecture

### Description
The abstract factory interface adds a new creation method every time a product family grows, violating the Interface Segregation Principle.

### Why It Happens
Each new product in the family needs a creation method. The interface grows without refactoring.

### Warning Signs
- Interface with 10+ creation methods
- Most implementations only implement some methods
- New product type requires adding method to interface
- ISP violation recognized by implementors

### Why Harmful
Clients depend on methods they don't use. Adding a product type changes the interface, touching all implementations.

### Consequences
- ISP violation
- Interface instability
- High change impact
- Forced implementation of unused methods

### Alternative
Split factory into smaller role interfaces. Use factories of factories for complex hierarchies.

### Refactoring Strategy
1. Group related product creation methods
2. Split into smaller interfaces
3. Implement only needed interfaces
4. Update consumers

### Detection Checklist
- [ ] Count creation methods in factory interface
- [ ] Check for ISP violations
- [ ] Evaluate method grouping

### Related Rules/Skills/Trees
- Skills: Abstract Factory, Interface Segregation
- Decision Trees: Factory Granularity

---

## 2. Concrete Factories with Shared State

### Category
Reliability

### Description
Concrete factory instances hold shared mutable state that affects the objects they create, causing side effects across creation operations.

### Why It Happens
Factories cache results, track counters, or hold configuration that changes.

### Warning Signs
- Factory has mutable properties
- Creating objects in different order gives different results
- Factories reused across requests with state
- Singleton factory with mutable state

### Why Harmful
Shared state makes factory behavior non-deterministic. Objects created from the same factory may differ based on call order.

### Consequences
- Non-deterministic creation
- Shared state contamination
- Testing difficulty
- Hard-to-reproduce bugs

### Alternative
Factories should be stateless. Pass configuration as method parameters. For caching, use a separate layer.

### Refactoring Strategy
1. Remove mutable state from factories
2. Pass state-dependent data as parameters
3. Make factory methods pure functions
4. Test with concurrent access

### Detection Checklist
- [ ] Check factory for mutable state
- [ ] Test creation determinism
- [ ] Verify factory statelessness

### Related Rules/Skills/Trees
- Skills: Abstract Factory, Immutability

---

## 3. Factory Selection Logic with Hard-Coded Class Names

### Category
Architecture

### Description
Hard-coding concrete class names in factory selection logic, preventing new implementations from being added without code changes.

### Why It Happens
Switch/if-else on driver names with hard-coded class references.

### Warning Signs
- Switch statement with hard-coded class names
- Adding new driver requires modifying factory code
- No configuration-driven resolution
- OCP violation

### Why Harmful
OCP violation: adding a new factory requires modifying existing code. Configuration-driven selection would avoid this.

### Consequences
- OCP violation
- High change cost for new implementations
- Manual registration overhead
- Deployment required for new drivers

### Alternative
Use configuration-driven resolution or container binding. Register factory implementations in service providers.

### Refactoring Strategy
1. Extract factory class names to configuration
2. Use container binding for resolution
3. Register new factories via service providers
4. Remove hard-coded selection logic
5. Test factory resolution from config

### Detection Checklist
- [ ] Check for hard-coded class names
- [ ] Evaluate OCP compliance
- [ ] Review factory registration process

### Related Rules/Skills/Trees
- Skills: Abstract Factory, Open/Closed Principle
- Decision Trees: Factory Configuration Strategy

---

## 4. Not Testing the Factory Selection Path

### Category
Reliability

### Description
Each concrete factory is tested individually, but the selection logic (determining which factory to use at runtime) is not tested, causing wrong factory selection in production.

### Why It Happens
Focus on unit testing individual factories. Integration testing of selection path is overlooked.

### Warning Signs
- Factory selection not covered by tests
- Wrong driver used in production despite correct per-factory tests
- Selection logic changed and broke without detection
- Configuration changes cause selection errors

### Why Harmful
The factory pattern's value depends on correct selection. Incorrect selection means the wrong product family is used, potentially causing data corruption or incorrect behavior.

### Consequences
- Wrong product family in production
- Integration bugs not caught
- False confidence from unit tests
- Hard-to-diagnose failures

### Alternative
Test the factory selection path end-to-end. Verify correct factory is created for each configuration.

### Refactoring Strategy
1. Create integration tests for factory selection
2. Test each configuration option
3. Verify correct factory type returned
4. Test with invalid configuration

### Detection Checklist
- [ ] Check for factory selection tests
- [ ] Verify integration test coverage
- [ ] Test each configuration variant

### Related Rules/Skills/Trees
- Skills: Abstract Factory, Integration Testing
