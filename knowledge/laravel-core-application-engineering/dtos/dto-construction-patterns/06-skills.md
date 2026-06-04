# Skill: Add Named Static Factories to a DTO

## Purpose

Create per-source named static factory methods (`fromArray()`, `fromRequest()`, `fromModel()`) on a DTO that provide explicit, type-safe construction from each supported data source.

## When To Use

- Creating a new DTO that will be constructed from different source types
- Adding a new data source (model, request, queue payload) to an existing DTO
- Refactoring from a single generic `from()` method to source-specific factories
- Standardizing DTO construction across the codebase

## When NOT To Use

- Using spatie/laravel-data — the package provides `Data::from()` and `Data::fromRequest()` automatically
- DTO with a single construction source — one factory is sufficient
- Construction requires service dependencies (database, API calls) — resolve them before calling the factory

## Prerequisites

- DTO class declared with `readonly class` and constructor promotion
- Source types identified (array, FormRequest, Eloquent model, CLI command arguments)
- Per-source mapping rules: which source keys map to which DTO properties

## Inputs

- DTO class definition with typed constructor parameters
- For each source type: the source class/type and the key-to-property mapping
- Null handling rules for optional fields per source
- Type transformation requirements per source (Carbon from string, enum from int)

## Workflow

1. Identify all source types the DTO will be constructed from (array, request, model, command, queue payload)
2. For each source type, create a named static factory method following the pattern `from{Source}()`:
   - `fromArray(array $data): self` — always required as the universal factory
   - `fromRequest(CreateUserRequest $request): self` — for HTTP entry points
   - `fromModel(User $user): self` — for Eloquent model sources
3. Inside each factory, use explicit key-to-parameter mapping — do not use array spread for production code
4. Handle missing keys explicitly with `?? null` defaults for nullable properties
5. For `fromRequest()`, always use `$request->validated()` — never `$request->all()`
6. For `fromModel()`, eager-load all required relations before passing the model — do not rely on lazy loading
7. Keep all factory methods dependency-free — no database queries, API calls, or service resolution
8. Add a `collection()` factory method for batch construction from a source array
9. Type all method parameters and return types with PHP native types
10. Write a test for each factory method verifying correct property mapping

## Validation Checklist

- [ ] Each source type has a dedicated named factory method
- [ ] `fromRequest()` uses `$request->validated()` (not `$request->all()`)
- [ ] Factory methods use explicit key mapping (not spread operator) for production code
- [ ] `fromModel()` does not trigger lazy loading — relations are eager-loaded before call
- [ ] No service dependencies (DB, cache, API) in any factory method
- [ ] Missing keys are handled with explicit `?? null` defaults
- [ ] Factory methods have typed parameters and return types
- [ ] Collection factory maps an array of source items to an array of DTOs
- [ ] Each factory method has at least one passing test

## Common Failures

- **Spreading unvalidated data**: `new self(...$request->all())` bypasses validation. Always use `$request->validated()`.
- **Mixed sources in one factory**: A single `from()` method that checks parameter types. Use separate `fromRequest()` and `fromModel()`.
- **Lazy loading in fromModel**: Accessing relations without eager-loading triggers N+1 queries. Eager-load before calling.
- **Service dependencies in factories**: Querying the database inside `fromArray()`. Resolve external data before the factory call.
- **Missing collection factory**: Callers duplicate `array_map` with inline closures. Add a `collection()` method.

## Decision Points

- **Spread vs manual mapping**: Spread is safe only with `$request->validated()`. For all other sources, use manual mapping.
- **DTO-owned factories vs FormRequest-owned factories**: DTO-owned (`fromRequest()`) is consistent across all entry points. FormRequest-owned (`payload()`) is closer to the HTTP layer.
- **Collection factory naming**: `collection()` if single source, `collectionFromModels()` / `collectionFromArrays()` if multiple source types need collection support.

## Performance Considerations

- Named factory: ~0.005ms per DTO. Direct constructor: ~0.002ms. Builder: ~0.01ms.
- All patterns are fast enough for typical applications — construction overhead is negligible
- The builder pattern matters only when constructing thousands of DTOs per request

## Security Considerations

- Never construct DTOs from `$request->all()` — raw input may contain mass-assignment fields (`is_admin`, `role_id`)
- Always use `$request->validated()` as the source for HTTP-originated DTOs
- DTO factories must have no side effects — they construct data carriers, not execute operations

## Related Rules

- Rule 1: Use Named Static Factories for Each Source Type
- Rule 2: Always Construct DTOs from Validated Data — Never from `$request->all()`
- Rule 3: Use Manual Mapping Over Spread Operator in Production Factories
- Rule 4: Eager-Load Relations Before Passing Models to `fromModel()` Factories
- Rule 5: Keep Factory Methods Free of Service Dependencies
- Rule 6: Provide a Collection Factory for Batch Construction

## Related Skills

- DTO Fundamentals: Implement Baseline DTO
- DTO vs Form Request: Bridge FormRequest to DTO
- Nested DTOs: Construct and Serialize Nested DTO Trees

## Success Criteria

- Every DTO has at least `fromArray()` as a universal factory
- Each source type has a dedicated `from{Source}()` method with explicit mapping
- No factory method uses `$request->all()` — all HTTP factories use `validated()`
- No factory method has service dependencies
- Collection factory exists for batch construction
- All factory methods have passing tests
