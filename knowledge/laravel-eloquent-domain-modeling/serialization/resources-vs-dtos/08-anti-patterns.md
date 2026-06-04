# Anti-Patterns: Resources vs DTOs

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Resources vs DTOs

## Anti-Patterns

### Resource in Queue
Serializing a `JsonResource` to a queue job. Resources carry HTTP context (request, headers, response) and serialize the full Eloquent model — wasteful and inappropriate for non-HTTP channels.

**Problem:** Bloated queue payloads; HTTP-specific data leaked to queue workers; unnecessary data transfer.

**Solution:** Use DTOs or plain model `toArray()` for queue and broadcast serialization. Reserve Resources for HTTP responses.

### DTO Domain Leak
A DTO gradually accumulates business logic methods, becoming an anemic domain model instead of a pure data transfer object.

**Problem:** Business logic in the wrong layer; DTOs lose their focused purpose; testing complexity increases.

**Solution:** Keep DTOs strictly for data transfer. Extract any behavior to domain services or action classes.

### Over-Engineering
Three-layer serialization (Model → DTO → Resource) for a simple CRUD app with a single API channel. Adds unnecessary complexity without proportional benefit.

**Problem:** Excessive boilerplate; slower development; no tangible benefit for simple use cases.

**Solution:** Use Resources alone for single-channel APIs. Add DTOs only when data crosses multiple channels.

### Under-Engineering
Returning Eloquent models directly from controllers because "Resources are overkill." Exposes internal model structure and risks lazy loading.

**Problem:** Internal model structure exposed to API consumers; N+1 risks in serialization.

**Solution:** Always use at least Resources for HTTP responses to decouple internal from external representation.

### Inconsistent Pattern
Some endpoints use Resources, others use DTOs, others return models directly. API consumers cannot predict the response format.

**Problem:** Inconsistent API contract; consumer confusion; increased maintenance burden.

**Solution:** Choose one consistent approach (or a well-defined layered approach) and apply it across the entire API.

### Not Versioning Serialization Contracts
Changing a Resource or DTO structure without versioning the API contract. Existing consumers break when the serialization shape changes.

**Problem:** Breaking changes for API consumers; production incidents with every deployment.

**Solution:** Version serialization contracts. Create separate Resource/DTO classes per API version.

### Resource in Non-HTTP Service Layer
Passing a `JsonResource` to a service layer or domain logic. Resources belong at the HTTP boundary — they should never enter domain layers.

**Problem:** HTTP coupling in domain logic; resources passed where models or DTOs belong.

**Solution:** Keep Resources at the HTTP boundary (controllers). Pass DTOs or models to service layers.
