# Adapter — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Adapter pattern in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Adapter Leaking Vendor-Specific Exceptions | Critical |
| 2 | Adapter Doing More Than Translation | High |
| 3 | Not Adapting Return Types | High |
| 4 | Adapter Interface Modeled After One Specific Vendor | High |
| 5 | Adapter in Domain Layer | Critical |

---

## 1. Adapter Leaking Vendor-Specific Exceptions

### Category
Reliability

### Description
Adapter methods throw vendor-specific exceptions (e.g., `Stripe\Error\Card`) that propagate to callers, coupling them to the adapted library.

### Why It Happens
The adapter catches exceptions from the vendor but does not translate them to application-level exceptions.

### Warning Signs
- `catch (Vendor\Specific\Exception)` in calling code
- Caller imports vendor exception classes
- Adapter documentation mentions vendor exceptions
- Changing vendor requires changing exception handling throughout

### Why Harmful
Exception coupling leaks the vendor abstraction. Changing providers requires changing exception handling across the codebase.

### Consequences
- High provider switching cost
- Exception handling coupled to vendor
- Callers depend on vendor-specific types
- Testing difficulties

### Alternative
Translate vendor exceptions to application-specific exceptions in the adapter. Callers catch only application exceptions.

### Refactoring Strategy
1. Identify vendor-propagating exceptions
2. Wrap vendor calls in try-catch
3. Translate to application exceptions
4. Update callers to catch application exceptions
5. Test vendor failure scenarios

### Detection Checklist
- [ ] Check adapter for vendor exception propagation
- [ ] Scan callers for vendor exception imports
- [ ] Verify exception translation

### Related Rules/Skills/Trees
- Skills: Adapter, Anti-Corruption Layer, Exception Handling
- Decision Trees: Adapter Translation Strategy

---

## 2. Adapter Doing More Than Translation

### Category
Architecture

### Description
Adapter performs validation, logging, caching, or business logic in addition to interface translation, violating SRP.

### Why It Happens
It's convenient to add logic at the adapter level. The adapter already handles the interaction.

### Warning Signs
- Adapter methods over 30 lines
- Validation logic in adapter
- Logging beyond debug/trace
- Caching logic mixed with translation
- Business rules in adapter

### Why Harmful
Adapter SRP violation couples translation with secondary concerns. Changing business rules requires changing adapter code.

### Consequences
- SRP violation
- Testing complexity
- Hidden dependencies
- Maintenance difficulty

### Alternative
Adapter only translates between interfaces. Use decorator for caching/logging. Keep business logic separate.

### Refactoring Strategy
1. Identify non-translation logic in adapter
2. Extract caching to decorator
3. Extract logging to middleware
4. Keep adapter focused on translation only

### Detection Checklist
- [ ] Review adapter for SRP compliance
- [ ] Measure adapter method complexity
- [ ] Identify non-translation responsibilities

### Related Rules/Skills/Trees
- Skills: Adapter, SRP, Decorator Pattern

---

## 3. Not Adapting Return Types

### Category
Architecture

### Description
Adapter returns vendor-specific types (SDK objects, raw API responses) instead of translating them to application-native types.

### Why It Happens
Returning the vendor's own types is the simplest implementation. Translation seems unnecessary.

### Warning Signs
- Adapter returns vendor SDK objects
- Caller depends on vendor types for returned data
- Changing vendor requires changing caller type handling
- No DTO or native type mapping

### Why Harmful
The caller becomes coupled to vendor types through return values. The adapter abstraction is incomplete.

### Consequences
- Caller depends on vendor types
- High switching cost
- Incomplete abstraction
- Testing requires vendor objects

### Alternative
Translate vendor return types to application-native DTOs or value objects inside the adapter.

### Refactoring Strategy
1. Create application-native DTOs
2. Map vendor response to DTO in adapter
3. Update caller to use DTO
4. Remove vendor type dependency from callers

### Detection Checklist
- [ ] Check adapter return types
- [ ] Scan callers for vendor type usage
- [ ] Verify return type translation

### Related Rules/Skills/Trees
- Skills: Adapter, DTOs
- Decision Trees: Adapter Translation Strategy

---

## 4. Adapter Interface Modeled After One Specific Vendor

### Category
Architecture

### Description
The adapter interface is designed around one vendor's capabilities and naming, making it impossible for other vendors to conform.

### Why It Happens
The interface is extracted from the first adapter implementation, not abstracted from the general concept.

### Warning Signs
- Second vendor cannot implement the interface
- Interface methods named after first vendor's API
- Generic concepts missing from interface
- Adapter files named after first vendor

### Why Harmful
The adapter pattern's purpose (interchangeable vendors) is defeated. Adding a new provider requires interface changes.

### Consequences
- Cannot add second vendor without interface changes
- Vendor lock-in despite adapter
- Interface redesign needed
- OCP violation

### Alternative
Design the interface around the domain abstraction, not the first implementation. Focus on what the application needs, not what the vendor offers.

### Refactoring Strategy
1. Identify vendor-specific interface elements
2. Abstract to domain-level concepts
3. Update all adapters
4. Verify new vendors can implement

### Detection Checklist
- [ ] Review interface for vendor-specific elements
- [ ] Check second vendor implementation feasibility
- [ ] Assess interface abstraction level

### Related Rules/Skills/Trees
- Skills: Adapter, Interface Segregation
- Decision Trees: Adapter Interface Design

---

## 5. Adapter in Domain Layer

### Category
Architecture

### Description
Placing the adapter implementation in the domain layer, coupling domain logic to infrastructure concerns (HTTP, third-party SDK).

### Why It Happens
Developers place the adapter where the domain logic is, for convenience.

### Warning Signs
- Adapter class in domain namespace
- Vendor imports in domain layer
- Domain layer with network I/O code
- Testing domain requires network access

### Why Harmful
Domain layer should have zero knowledge of infrastructure. Adapters belong in the infrastructure layer.

### Consequences
- Domain coupled to infrastructure
- Testing requires network setup
- Domain not portable
- Architecture violation

### Alternative
Place adapter interfaces in the domain layer, adapter implementations in the infrastructure layer.

### Refactoring Strategy
1. Move adapter implementation to infrastructure
2. Keep interface in domain layer
3. Update namespace and imports
4. Verify domain layer has no infrastructure imports
5. Update DI bindings

### Detection Checklist
- [ ] Check adapter location
- [ ] Verify domain layer infrastructure independence
- [ ] Confirm DI binding points to infrastructure implementation

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Adapter, Hexagonal Architecture
- Decision Trees: Architecture Layer Placement
