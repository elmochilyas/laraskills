# Skill: Bridge FormRequest to DTO via payload() or fromRequest()

## Purpose

Create an explicit bridge between a FormRequest and a DTO using either the `payload()` method on the FormRequest or the `fromRequest()` static method on the DTO, ensuring a clean sequential data flow without coupling the service layer to HTTP.

## When To Use

- Adding a new HTTP endpoint that uses both a FormRequest and a DTO
- Refactoring a controller that currently passes FormRequest directly to a service
- Standardizing the FormRequest → DTO bridge pattern across the project
- Adding DTO transformation (field renaming, type normalization) between HTTP and service layers

## When NOT To Use

- Simple endpoints where data flows directly to a single service method — FormRequest validated array is sufficient
- CLI/queue entry points — no FormRequest exists, so no bridge is needed
- spatie/laravel-data projects — `Data::fromRequest()` serves as the bridge automatically

## Prerequisites

- FormRequest class with authorization and validation rules
- DTO class with typed constructor parameters
- Decision on bridge ownership: FormRequest-owned (`payload()`) vs DTO-owned (`fromRequest()`)
- Mapping spec: how HTTP field names translate to DTO property names

## Inputs

- FormRequest class with `rules()` and `authorize()` methods
- DTO class with typed constructor parameters
- Field mapping: source HTTP field → destination DTO property (with type transformations)
- List of HTTP-specific rules (stay on FormRequest) vs domain rules (DTO)

## Workflow

1. Verify the service method receives a DTO (or typed array), not a FormRequest — if it currently receives a FormRequest, refactor it
2. Choose bridge pattern:
   - `payload()` on FormRequest: mapping lives close to the HTTP layer
   - `fromRequest()` on DTO: mapping lives on the data carrier (consistent across entry points)
3. Implement the bridge method:
   - For `payload()`: add `public function payload(): DtoType` to the FormRequest
   - For `fromRequest()`: add `public static function fromRequest(RequestType $request): self` to the DTO
4. Inside the bridge method, map HTTP fields to DTO properties — rename fields, flatten nesting, normalize types (string dates to Carbon, enums from int)
5. Ensure the bridge uses `$this->validated()` (FormRequest-owned) or `$request->validated()` (DTO-owned) — never `$request->all()`
6. Update the controller to use the bridge: `$service->execute($request->payload())` or `$service->execute(DtoType::fromRequest($request))`
7. Verify no validation rules are duplicated between FormRequest and DTO — if Domain rules exist on DTO, remove them from FormRequest (or vice versa)
8. Verify the DTO does not import or reference `Illuminate\Http\Request` — the bridge is the only place where HTTP and DTO meet
9. Write a test that constructs the DTO via the bridge and verifies correct mapping

## Validation Checklist

- [ ] Service receives DTO (or validated array), never a FormRequest
- [ ] Bridge method exists — either `payload()` on FormRequest or `fromRequest()` on DTO
- [ ] Bridge uses `validated()` data, never `$request->all()`
- [ ] DTO transforms/renames fields — it does not mirror HTTP structure exactly
- [ ] No validation rules are duplicated between FormRequest and DTO
- [ ] DTO has no HTTP dependencies (no `Request` imports)
- [ ] Controller uses the bridge method

## Common Failures

- **Service coupling**: Service receives FormRequest instead of DTO. Refactor to accept DTO.
- **Echo chamber DTO**: DTO properties mirror HTTP keys exactly with no transformation. Either transform or skip the DTO.
- **Duplicate validation**: Same rules in both FormRequest and DTO. Choose one authoritative layer.
- **Incomplete bridge**: Some controllers use the bridge, others inline DTO construction. Standardize.
- **Manual validated() in controller**: Controller calls `$request->validated()` and constructs DTO inline. Move mapping logic to the bridge.

## Decision Points

- **FormRequest-owned vs DTO-owned bridge**: FormRequest-owned (`payload()`) for teams that prefer HTTP-centric code organization. DTO-owned (`fromRequest()`) for teams that prefer data-centric organization.
- **Payload vs toDto naming**: `payload()` is shorter and indicates the FormRequest produces a DTO. `toDto()` is more explicit. Choose one convention per project.
- **spatie/laravel-data alternative**: When using spatie, `Data::fromRequest($request)` replaces the need for a manual bridge.

## Performance Considerations

- Bridge method call adds sub-microsecond overhead — no performance concern
- The cost is in the mapping logic (field renaming, type normalization), not the bridge pattern itself
- No difference between `payload()` and `fromRequest()` in terms of performance

## Security Considerations

- Never inject FormRequest into services — carries request metadata (headers, cookies, session) the service should never see
- Ensure every DTO property has a corresponding validation rule in the FormRequest or in the DTO itself to prevent validation bypass
- Authorization logic in FormRequest's `authorize()` is not replicated for non-HTTP entry points — ensure CLI/queue entry points have their own authorization

## Related Rules

- Rule 1: Never Pass FormRequest Instances to Services
- Rule 2: Use the Sequential Flow — FormRequest → DTO → Service
- Rule 3: DTOs Must Transform Data, Not Mirror HTTP Structure
- Rule 4: Define Validation Rules in Exactly One Layer
- Rule 5: Use the Bridging Pattern — `payload()` on FormRequest or `fromRequest()` on DTO
- Rule 6: Use DTO Validation as the Sole Validation Layer for CLI and Queue Entry Points

## Related Skills

- DTO Fundamentals: Implement Baseline DTO
- DTO Construction Patterns: Add Named Static Factories to a DTO
- Data Object Validation: Add Domain-Level Validation to a DTO

## Success Criteria

- Services receive DTOs (never FormRequests)
- A bridge method exists for every FormRequest → DTO pair
- Bridge uses `validated()` data and transforms fields meaningfully
- No validation rules are duplicated between FormRequest and DTO
- DTO has zero HTTP dependencies
