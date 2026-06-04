# Data Transfer Objects and Transformers

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-14-dto-transformer
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
Data Transfer Objects (DTOs) are immutable objects that carry data between architectural layers. Transformers convert domain and application objects into presentation-ready formats. Together, they form the data boundary layer that decouples internal object models from external contracts. DTOs provide explicit, typed, immutable contracts that make data flow visible and safe — preventing the most common architectural violation of passing internal objects (Eloquent models, Entities) across layer boundaries.

---

## Core Concepts
- **Layer Boundary Data Transfer**: Data crosses architectural layers — from HTTP to application, from application to domain, and back — each crossing point is a DTO candidate
- **Immutability**: DTOs must be immutable once constructed; PHP 8.1+ `readonly` properties and PHP 8.2+ `readonly` classes enforce this
- **Typed Properties**: Every DTO property has a PHP type hint — types document the contract and enable static analysis
- **Named Constructors**: DTOs use named static constructors for creation from different sources: `fromRequest()`, `fromArray()`, `fromModel()`
- **Serialization Control**: DTOs implement `toArray()` for controlled serialization — only properties intended for output are included
- **Presentation Decoupling**: Transformers decouple internal objects from external representation — a single domain object may have multiple transformers for different consumers

---

## Mental Models
1. **Data as Foreign Currency Crossing Borders**: Each architectural layer is a country with its own currency (Domain objects, Eloquent models, HTTP requests). DTOs are the exchange mechanism — they convert currency at the border so each country never needs to understand another's money. The conversion happens at the boundary, not inside the country.
2. **Contract Over Implementation**: A DTO is a contract — it says "I promise these fields exist with these types." The controller uses the DTO contract, not the implementation. The Use Case returns a DTO contract, not an internal object. Contracts enable independent evolution of producer and consumer.

---

## Internal Mechanics
A controller extracts data from HTTP Request, creates an input DTO via a named constructor (`CreateInvoiceInput::fromRequest($request)`), passes it to a Use Case. The Use Case processes and returns an output DTO (`InvoiceCreatedResult`). The controller calls a Transformer (`InvoiceTransformer::transform($result)`) to convert the output DTO to an array for JSON response. The DTO is constructed with all properties promoted in the constructor — PHP 8.2 `readonly class` makes all properties readonly automatically, enforcing immutability at the language level. Named constructors encapsulate the extraction logic for each source type.

---

## Patterns
### Input/Output DTO Per Use Case Pattern
- **Purpose**: Clear data contracts at every application boundary crossing
- **Mechanism**: One input DTO and one output DTO per Use Case
- **Benefits**: Type-safe, self-documenting contracts between layers
- **Tradeoffs**: DTO proliferation — group closely related contexts under one DTO with optional properties

### Transformer Per Consumer Pattern
- **Purpose**: Different output formats for different consumers (API, admin, CSV, email)
- **Mechanism**: Separate Transformer classes per consumer format
- **Benefits**: Internal representation changes don't affect external contracts
- **Tradeoffs**: Multiple transformers to maintain for the same underlying data

---

## Architectural Decisions
- **Choose DTOs when**: Passing data between architectural layers, decoupling internal changes from API contracts, multiple delivery mechanisms exist
- **Choose direct Eloquent serialization when**: Simple CRUD APIs with stable contracts, internal-only endpoints with coordinated changes
- **Key decision**: One DTO per Use Case boundary — each layer crossing has its own DTO; avoid sharing across unrelated use cases

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Type-safe layer boundary crossings | DTO classes per boundary — more files | Prevents Eloquent leak into application/domain layers |
| Immutability prevents accidental mutation | Must use named constructors for creation | Construction is the single point of validation |
| Transformers decouple internal from external format | Multiple transformers per data type | Essential for API contract stability |
| Explicit serialization control | Must maintain `toArray()` methods | Prevents accidental data exposure |

---

## Performance Considerations
DTO construction is cheap — typically 0.001ms per object with promoted constructor. Immutable DTOs reduce defensive copying — no need to clone before passing. Transformer overhead is proportional to output size — for deeply nested responses, consider caching the transformed representation. JsonResource wrapping adds overhead for each relationship level — profile endpoints with deep includes. For high-throughput read endpoints, cache the full transformed response, not the domain objects.

---

## Production Considerations
DTOs must not expose sensitive fields (passwords, tokens, internal IDs, payment details). When constructing DTOs from Eloquent models, explicitly select fields — never use `$model->toArray()` or `$model->all()`. Transformers must explicitly list fields — accidental inclusion of new model attributes is a data leak. Never log DTO contents that contain PII or sensitive business data. Response envelope consistency prevents information leakage through varying structures.

---

## Common Mistakes
1. **DTOs as Anemic Data Bags**: DTOs with no construction validation — validate input during DTO construction via named constructors or type hints.
2. **Domain Objects in DTO Roles**: Passing Eloquent models or entities directly as DTOs — always create a DTO for layer boundaries.
3. **Shared Mutable DTOs**: DTOs modified after creation, shared across threads — enforce immutability with `readonly` classes.
4. **Transformer Coupled to Eloquent**: Transformers accepting Eloquent models directly — transformers should accept DTOs; if they must accept models, extract with explicit method calls.
5. **Over-Fragmentation**: Too many DTO types for the same data — group closely related contexts under one DTO with nullable fields.

---

## Failure Modes
- **Eloquent Leak**: Eloquent models appearing outside the persistence layer — convert to DTOs at the repository boundary
- **Transformer Without Tests**: Response format changes silently break API contracts — add a test that asserts the exact array structure
- **Array Blindness**: Using arrays instead of DTOs — arrays have no type safety, documentation, or discoverability
- **Nested DTO Explosion**: Deep DTO nesting mirroring database schema — flatten DTOs for each use case

---

## Ecosystem Usage
Laravel's `JsonResource` classes provide built-in transformer functionality with pagination and relationship support. The `spatie/laravel-data` package provides advanced DTO management with automatic validation, transformation, and serialization. Enterprise Laravel projects commonly use explicit DTOs at every architectural boundary, with transformers for API responses.

---

## Related Knowledge Units
### Prerequisites
- Three-Layer Architecture (LAP-01)
- Use Case Classes (LAP-11)
- PHP 8.1+ readonly properties

### Related Topics
- Form Request Validation (LAP-12) — input DTO source
- API Resources — Laravel's built-in transformer
- Value Objects (LAP-07) — DTO vs VO distinction

### Advanced Follow-up Topics
- Spatie Laravel Data Package — advanced DTO management
- Data Object Validation
- Nested DTO Patterns

---

## Research Notes
Use `readonly` classes for DTOs — PHP 8.2+ language-level immutability. Keep DTOs focused on the data needed for their specific boundary crossing. Don't put logic in DTOs beyond named constructors. Test DTO construction and transformation output. Use API Resources for Laravel response integration. A DTO without validation is just a named type alias — valuable for type safety, but add validation for defense-in-depth.
