# Domain Services — Decomposition

## Prime Directive
Design domain services that encapsulate cross-aggregate business logic, remain stateless and testable, and are clearly distinguished from infrastructure services and application services.

## 1. Problem Space Decomposition

### 1.1 Responsibility Identification
- **Concern:** Distinguishing logic that belongs in a service vs on a model.
- **Sub-concerns:**
  1. Does the operation involve multiple aggregates? → Service
  2. Does the operation primarily manipulate one aggregate's state? → Model method
  3. Does the operation require external system interaction (via domain abstraction)? → Service

### 1.2 Service Granularity
- **Concern:** How many operations per service class.
- **Sub-concerns:**
  1. Single-action services (one public method per class)
  2. Multi-operation services (related operations grouped)
  3. Service methods vs Service classes per use case

### 1.3 Dependency Management
- **Concern:** What domain services depend on.
- **Sub-concerns:**
  1. Repositories (loaded aggregates)
  2. Other domain services (coordination)
  3. Infrastructure abstractions (payment gateways, notification services)
  4. Nothing from the HTTP layer

### 1.4 Result Handling
- **Concern:** How services communicate outcomes to callers.
- **Sub-concerns:**
  1. Exceptions for business rule violations
  2. Result objects with success/failure + data
  3. Event-driven: service dispatches events, caller listens

## 2. Solution Space Decomposition

### 2.1 Service Structure
- **Decision:** How service classes are organized.
- **Implementation slices:**
  1. `app/Services/Domain/OrderFulfillmentService.php`
  2. `app/Domain/Services/Order/OrderFulfillmentService.php`
  3. `app/Actions/OrderFulfillment.php` (single-action)

### 2.2 Input/Output Contracts
- **Decision:** How callers interact with the service.
- **Implementation slices:**
  1. Receive domain objects, return void (mutate in place)
  2. Receive primitives/DTOs, return result object
  3. Receive domain objects, return new domain objects

### 2.3 Transaction Scope
- **Decision:** Where transactions are managed.
- **Implementation slices:**
  1. Application service wraps domain service in transaction
  2. Domain service manages its own transaction
  3. Transaction managed at controller/command level

### 2.4 Error Communication
- **Decision:** How services report failures.
- **Implementation slices:**
  1. Domain-specific exception classes (caught by caller)
  2. Result object with `->succeeded()`, `->error()` methods
  3. Both: exception for exceptional cases, result for expected failures

## 3. Integration Points

| Component | Interaction |
|-----------|-------------|
| Controller | Calls domain service (often through an application service) |
| Application Service | Handles auth, transactions; delegates to domain service |
| Model | Passed to domain service as input; mutated by service |
| Repository | Used by service to load/persist aggregates |
| Other Domain Services | May be injected and called for sub-operations |
| Event System | May dispatch events for side effects |
| Infrastructure Service | Payment, email, etc. — injected as abstraction |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization