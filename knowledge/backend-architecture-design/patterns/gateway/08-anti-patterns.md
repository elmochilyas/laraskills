# Gateway — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Gateway patterns in PHP/Laravel context |
| Anti-Pattern Count | 4 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Gateway with Business Logic | Critical |
| 2 | Gateway Exposing External System Types | High |
| 3 | Gateway Without Failure Handling | High |
| 4 | Gateway Without Interface | High |

---

## 1. Gateway with Business Logic

### Category
Architecture

### Description
Embedding domain or business logic inside a gateway class, mixing data access/integration concerns with business rules.

### Why It Happens
Convenience: gateway already knows the data structure, so adding validation or business transformation seems natural.

### Warning Signs
- Gateway methods that validate business rules
- Domain transformations inside gateway
- Gateway making business decisions
- Gateway methods with complex conditional logic

### Why Harmful
Business logic spread across domain objects and gateways cannot be tested independently. Changing business rules requires modifying data access code.

### Consequences
- Business logic not reusable outside gateway context
- Gateway becomes hard to test (requires external system)
- SRP violation
- Business rule changes risk breaking integration logic

### Alternative
Gateways handle only external system interaction and data translation. Business logic belongs in domain services, entities, or application layer.

### Refactoring Strategy
1. Identify business logic in gateways
2. Move to domain services or entities
3. Gateway keeps only raw data access and simple translation
4. Test business logic independently

### Detection Checklist
- [ ] Review gateway methods for business rules
- [ ] Check for domain logic outside domain layer
- [ ] Verify gateway SRP compliance

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Gateway, Service Layer

---

## 2. Gateway Exposing External System Types

### Category
Architecture

### Description
Gateway interface leaking external system types (API response classes, third-party library types, specific HTTP status codes) to callers.

### Why It Happens
Gateway returns raw API responses or third-party objects. Callers become coupled to external system types without realizing it.

### Warning Signs
- Gateway returns third-party SDK objects
- API response types appear outside gateway
- Callers check HTTP status codes from gateway
- External library imports in caller code

### Why Harmful
Leaky abstraction couples callers to external system details. Changing providers (stripe → braintree) forces changes throughout the application.

### Consequences
- High provider switching cost
- External system changes propagate through codebase
- Callers tied to specific technology
- Hard to mock in tests

### Alternative
Gateway translates external types to application-native types (DTOs, value objects). Callers depend only on gateway interface and native types.

### Refactoring Strategy
1. Create application-native DTOs for gateway data
2. Translate external types to DTOs inside gateway
3. Update gateway interface to return native types
4. Remove external type references from callers

### Detection Checklist
- [ ] Check gateway return types for external types
- [ ] Scan caller code for external imports
- [ ] Verify type translation exists

### Related Rules/Skills/Trees
- Skills: Gateway, Anti-Corruption Layer
- Decision Trees: Gateway Implementation Strategy

---

## 3. Gateway Without Failure Handling

### Category
Reliability

### Description
Gateway methods lack failure handling, allowing exceptions from external systems to propagate directly to application layers.

### Why It Happens
Gateway is treated as a simple pass-through. Error handling is deferred to callers or ignored.

### Warning Signs
- Network timeouts throwing raw exceptions
- No retry logic in gateway
- External API errors propagate as-is
- Gateway methods without try-catch

### Why Harmful
Raw exceptions are unpredictable, may contain sensitive data, and don't distinguish between transient vs permanent failures.

### Consequences
- Application errors from external system failures
- Sensitive data leak in exception messages
- No retry for transient failures
- Inconsistent error handling

### Alternative
Gateway catches external exceptions, translates to application exceptions, and implements retry with backoff for transient failures.

### Refactoring Strategy
1. Add try-catch to gateway methods
2. Translate to application-specific exceptions
3. Implement retry with exponential backoff
4. Circuit breaker for downstream failures
5. Log failures with context

### Detection Checklist
- [ ] Review gateway error handling
- [ ] Check for retry logic
- [ ] Verify exception translation
- [ ] Test external system failure scenarios

### Related Rules/Skills/Trees
- Skills: Gateway, Circuit Breaker, Retry Patterns

---

## 4. Gateway Without Interface

### Category
Architecture

### Description
Gateway classes implemented without a corresponding interface, making it impossible to mock or substitute in tests.

### Why It Happens
Gateway started as a simple class, grew over time, and interface was never extracted.

### Warning Signs
- Gateway class used directly via concrete type
- Tests hit real external systems
- Mocking requires complex workarounds
- No alternative implementation available

### Why Harmful
Without an interface, the gateway cannot be replaced (test double, different provider, cached version). Tests require real external system access.

### Consequences
- Tests depend on external systems
- Slow, flaky test suite
- Cannot substitute in different environments
- Hard to change provider

### Alternative
Always define an interface for the gateway. Depend on the interface in consuming code. Use DI to inject the implementation.

### Refactoring Strategy
1. Extract interface from gateway methods
2. Implement interface in gateway class
3. Update consumers to depend on interface
4. Register interface → implementation binding in container
5. Create test double implementation

### Detection Checklist
- [ ] Check gateway has interface
- [ ] Verify consumers depend on interface
- [ ] Test with mock implementation
- [ ] Confirm DI binding exists

### Related Rules/Skills/Trees
- Skills: Gateway, Dependency Injection
- Decision Trees: Gateway Implementation Strategy
