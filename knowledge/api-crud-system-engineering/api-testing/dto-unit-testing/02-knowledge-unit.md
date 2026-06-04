# DTO Unit Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** DTO Unit Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
DTO (Data Transfer Object) unit tests validate that data objects correctly construct from input, serialize to arrays/JSON, enforce type constraints, handle optional fields with defaults, and remain immutable after construction. DTOs are plain PHP objects with typed properties, often using `Spatie\LaravelData` or custom constructor + `toArray()` patterns. Testing DTOs requires no database, no framework booting, and no mocking — they are the purest form of unit test. Comprehensive DTO tests ensure data integrity across the API boundary.

---

## Core Concepts
A DTO is a plain PHP object that carries data between layers — typically from a controller to a service, or from a service to a transformer. DTOs define typed properties, constructors (named constructors or `fromArray`), and serialization methods (`toArray`, `toJson`). Tests assert: construction from valid input (all fields), construction from minimal input (optional fields get defaults), type enforcement (string vs int), immutability (no setters), and array/JSON serialization. Use `Spatie\LaravelData` for rich DTOs with validation; test the DTO class directly with `new PostDTO(...)` or `PostDTO::from([...])`.

---

## Mental Models
DTO testing is **stamp-making** — you define the stamp (DTO class) and test that every impression (constructed instance) has the correct shape, regardless of the ink (input data) used. If the stamp has the wrong shape, every letter it prints will be wrong. DTOs are the stamps of your API.

---

## Internal Mechanics
A DTO is a regular PHP class. Constructor arguments with typed properties enforce types at call time (PHP 8.0+ promoted properties). Named constructors (`fromArray`, `fromRequest`, `fromModel`) convert various input formats. `Spatie\LaravelData` uses `Data` base class with automatic `from()` resolution, `toArray()`/`toJson()` serialization, and optional `withValidator()` integration. Tests construct objects directly and use `assertInstanceOf`, `assertEquals`, `assertTrue/False` for property assertions. `jsonSerialize()` returns the `toArray()` representation.

---

## Patterns
- **Test construction from each input type**: `PostDTO::fromArray([...])`, `PostDTO::fromModel($post)`.
- **Test default values**: Assert optional fields have expected defaults when not provided.
- **Test type enforcement**: Pass wrong types and assert `TypeError` is thrown (PHP 8 typed properties).
- **Test serialization**: `$dto->toArray()`, `$dto->toJson()`, `json_encode($dto)`.
- **Test immutability**: Assert no setter methods exist; modify returned array from `toArray()` and verify the DTO doesn't change.
- **Test from request**: If DTO has `fromRequest()`, pass a mock request object and verify mapping.
- **Test nested DTOs**: If DTO contains other DTOs, test construction and serialization recursively.

---

## Architectural Decisions
DTOs are the contract definition between API layers. Testing them in isolation (no framework, no database) means they are the most reliable tests in the suite — failure is always a DTO bug, never an environment issue. The decision to use DTOs (vs passing raw arrays) is itself architectural: DTOs provide type safety and documentation but add boilerplate. Unit tests make the boilerplate maintainable by catching regressions.

---

## Tradeoffs
| Tradeoff | DTO with Tests | Raw Array (No DTO) |
|---|---|---|
| Type safety | High (typed properties) | None (strings, arrays) |
| Documentation | Self-documenting (class definition) | Implicit (docblocks or comments) |
| Boilerplate | Higher (class + tests) | None |
| Refactoring safety | High (tests catch changes) | Low (arrays have no contract) |

---

## Performance Considerations
DTO unit tests are essentially free — no test dependencies, no database, no framework. Run them on every file save. A DTO test suite for 50 DTOs completes in <100ms.

---

## Production Considerations
DTOs that carry data from untrusted sources (user input → DTO) should have validation integrated via `Spatie\LaravelData` or manual `assert*` in the constructor. Immutability prevents accidental data corruption. Serialization format determines API shape — test `toArray()` against expected structures to prevent accidental contract breaks.

---

## Common Mistakes
- Not testing serialization — the DTO constructs correctly but `toArray()` returns wrong keys or missing fields.
- Making DTOs mutable — setters allow accidental modification after construction.
- Testing DTOs through feature tests (HTTP → controller → DTO) — this tests the wiring, not the DTO itself.
- Omitting optional fields from construction tests — a nullable field that defaults wrong goes undetected.
- Using PHP 8 promoted properties but forgetting to declare types — `public $title` defaults to mixed, losing type safety.

---

## Failure Modes
- **Wrong serialization**: `toArray()` returns `name` but the DTO property is `fullName` — API consumers get missing keys.
- **Type coercion fails**: Constructor accepts `int $id` but the route binding passes a UUID string — `TypeError` at runtime.
- **Mutable DTO**: A service modifies the DTO after creation, and the downstream consumer sees corrupted data.
- **Missing fromRequest mapping**: A new field is added to the request but not mapped in `fromRequest()` — the DTO silently omits it.

---

## Ecosystem Usage
`Spatie\LaravelData` is the most popular DTO package for Laravel. Its own test suite validates DTO construction, serialization, and validation. `Laravel-Data` (Wendell Adriel) is another alternative. Custom DTO patterns are common in enterprise Laravel apps with strict typing requirements.

---

## Related Knowledge Units
### Prerequisites
- PHP 8 Typed Properties and Promoted Constructor
- DTO Design Patterns (Data Transfer Object)

### Related Topics
- response-shape-testing (DTO serialization matches response shape)
- action-service-unit-testing (DTOs as service input/output)
- layer-isolation-in-tests (DTOs are inherently isolated)

### Advanced Follow-up Topics
- Spatie Laravel Data advanced features (transformers, validation, type casting)
- CQRS with DTOs (command/query objects)
- Auto-generating DTOs from OpenAPI schemas

---

## Research Notes
### Source Analysis
PHP 8 promoted constructor properties. `Spatie\LaravelData\Data` base class provides `from()`, `toArray()`, `toJson()`. Custom DTOs are typically `readonly` classes with `__construct` and `toArray`.
### Key Insight
DTOs are the purest subject for unit testing in Laravel — no framework dependencies, no database, no mocking. A DTO test is the fastest test you can write and provides the most reliable signal.
### Version-Specific Notes
PHP 8.2 `readonly` classes are ideal for DTOs. PHP 8.1 `readonly` properties provide per-property immutability. `Spatie\LaravelData` v3+ supports PHP 8.2 named arguments and `readonly` classes.
