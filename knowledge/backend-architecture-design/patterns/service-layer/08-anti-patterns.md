# Service Layer — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Service Layer (Fowler) in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Fat Service with 20+ Methods | Critical |
| 2 | Service Knowing About HTTP | High |
| 3 | Service Returning HTTP Response Objects | High |
| 4 | Anemic Service | Medium |
| 5 | Service with Mixed Concerns | High |

---

## 1. Fat Service with 20+ Methods

### Category
Architecture

### Description
A single service class accumulating 20+ methods covering unrelated business operations, becoming a god object.

### Why It Happens
All business operations for a domain go into one service class. Adding a new method is easier than creating a new class.

### Warning Signs
- 20+ methods in a single service
- Methods covering unrelated operations
- No domain grouping within the service
- Service file exceeding 500 lines

### Why Harmful
God object service violates SRP. Every team member adds to it. Understanding the service requires navigating a massive interface.

### Consequences
- SRP violation
- Low cohesion
- High change impact
- Testing complexity (many dependencies)
- Developer avoidance

### Alternative
Split by concern: `OrderCreationService`, `OrderCancellationService`, `OrderQueryService`. Each service has focused responsibility.

### Refactoring Strategy
1. Group related methods
2. Extract into focused service classes
3. Keep shared dependencies via composition
4. Limit services to 3-5 methods

### Detection Checklist
- [ ] Count methods per service
- [ ] Evaluate method relatedness
- [ ] Check SRP compliance

### Related Rules/Skills/Trees
- Skills: Service Layer, SRP

---

## 2. Service Knowing About HTTP

### Category
Architecture

### Description
Service layer classes referencing HTTP concerns: `Request`, `Session`, `Auth` facade, redirects, or response objects.

### Why It Happens
Controllers are seen as just method calls. Developers pass entire `$request` to services for convenience.

### Warning Signs
- `Illuminate\Http\Request` imported in service
- `session()`, `auth()`, `request()` helpers in services
- Services performing redirects or setting HTTP headers
- Service methods receiving `$request` parameter

### Why Harmful
HTTP-aware services cannot be used outside web context (CLI, queue, API). Domain logic becomes coupled to HTTP.

### Consequences
- Cannot reuse services in non-HTTP contexts
- Testing requires HTTP request simulation
- Hidden dependencies on HTTP state
- Violates separation of concerns

### Alternative
Pass only extracted data (validated DTOs, primitive values) to services. Services should not know about the request mechanism.

### Refactoring Strategy
1. Identify HTTP references in services
2. Extract request data to DTOs before calling service
3. Remove HTTP imports and references
4. Verify services callable from CLI/queue

### Detection Checklist
- [ ] Scan service imports for HTTP classes
- [ ] Check service methods for `$request` parameter
- [ ] Verify non-HTTP usage capability

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Service Layer, DTOs

---

## 3. Service Returning HTTP Response Objects

### Category
Architecture

### Description
Service methods returning `Response`, `JsonResponse`, `RedirectResponse`, or other HTTP-specific objects.

### Why It Happens
Services are built to serve controllers. Returning a response object is the natural endpoint for the service.

### Warning Signs
- Service return type is HTTP response
- Services building JSON or redirect responses
- Controllers directly returning service results
- Service output coupled to HTTP

### Why Harmful
HTTP-specific returns prevent non-HTTP reuse. The presentation concern leaks into the service layer.

### Consequences
- Cannot reuse for CLI/queue output
- Couples business logic to HTTP presentation
- Testing requires response assertions
- Reduces service layer value

### Alternative
Return business data (DTOs, domain objects, primitives). Let controllers handle HTTP response creation.

### Refactoring Strategy
1. Identify HTTP response returns
2. Replace with data DTOs or primitives
3. Controllers convert to HTTP responses
4. Test service without HTTP context

### Detection Checklist
- [ ] Check service return types
- [ ] Verify controllers handle response creation
- [ ] Test service outside HTTP context

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Service Layer, Controller-Response Separation

---

## 4. Anemic Service

### Category
Architecture

### Description
Service that just calls repository methods without any business logic, acting as a pointless pass-through layer.

### Why It Happens
Developers create services "just in case" before there's actual business logic.

### Warning Signs
- Service methods that just delegate to repository
- No validation, transformation, or orchestration
- Service is a one-to-one mirror of repository
- Removing the service changes nothing

### Why Harmful
Anemic services add indirection without value. Every repository change requires service update. Codebase size increases without benefit.

### Consequences
- Unnecessary indirection
- Double maintenance
- No abstraction value
- Developer frustration

### Alternative
Only add service layer when business logic exists beyond data access. Start with controllers calling Eloquent directly, extract services when complexity demands.

### Refactoring Strategy
1. Identify anemic service methods
2. Remove service, use repository directly in controllers
3. Re-introduce services when actual business logic emerges
4. Document service creation criteria

### Detection Checklist
- [ ] Evaluate service logic vs pass-through
- [ ] Count methods with no business logic
- [ ] Assess service value over direct repository use

### Related Rules/Skills/Trees
- Rules: Start Simple, Refactor Later
- Skills: Service Layer, YAGNI

---

## 5. Service with Mixed Concerns

### Category
Architecture

### Description
Service handling reporting, CRUD, email sending, logging, and notification — mixing multiple unrelated responsibilities.

### Why It Happens
Services grow organically. New features add methods to existing services because it's convenient.

### Warning Signs
- Service method names from unrelated domains
- Reporting methods alongside CRUD methods
- Email and notification logic in data service
- Service imports from diverse namespaces

### Why Harmful
Mixed concerns violate SRP. Service becomes hard to understand, test, and change. Related logic is scattered while unrelated logic is together.

### Consequences
- SRP violation
- Low cohesion
- High coupling to multiple systems
- Difficult testing
- Hidden side effects

### Alternative
One service per business concern: `OrderReportService`, `OrderEmailService`, `OrderCrudService`. Each with focused dependencies.

### Refactoring Strategy
1. Identify concern groups within service
2. Extract each group to its own service
3. Share common infrastructure via smaller focused services
4. Document service responsibility boundaries

### Detection Checklist
- [ ] Group service methods by concern
- [ ] Evaluate cohesion
- [ ] Check service import diversity

### Related Rules/Skills/Trees
- Rules: Prefer Composition Over Inheritance
- Skills: Service Layer, SRP
- Decision Trees: Service Granularity
