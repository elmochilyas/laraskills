# DTO vs Form Request

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** DTO vs Form Request
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

## Overview

The boundary between Form Requests and DTOs is the most consistently misunderstood architectural decision in Laravel applications. Form Requests validate and authorize HTTP input. DTOs carry typed data between layers. The confusion arises because both operate on the same data — incoming request fields — and both can define validation rules. The result is either duplication (both validate the same fields) or conflation (a DTO that depends on HTTP or a FormRequest that acts as a service input).

The correct architectural split is: Form Requests own the HTTP boundary (authorization, input preparation, input format validation). DTOs own the inter-layer data contract (typed properties, domain validation). The service layer receives DTOs, not FormRequests. The FormRequest produces a DTO via `payload()` or `toDto()`. Neither class replaces the other; they are sequential stages in the data flow.

## Core Concepts

- **Sequential, Not Overlapping:** Data flow is linear: HTTP Request → FormRequest (authorize + validate) → DTO (type + carry) → Service. The FormRequest runs first; the DTO is constructed from validated output.
- **Responsibility Split:** FormRequest: authorization, input format validation, input preparation. DTO: typed properties, data transport, cross-layer consistency.
- **The Bridging Pattern:** The bridge between FormRequest and DTO is explicit — either the FormRequest has a `payload()` method, or the DTO has a `fromRequest()` static method.
- **FormRequest Without DTO:** Services receiving `$request->validated()` arrays are coupled to array keys — no typed contract, no compiler verification.
- **DTO Without FormRequest (CLI/Queue):** CLI commands and queue jobs bypass FormRequests entirely; the DTO validates itself for non-HTTP entry points.

## When To Use

- **Use Both:** Any non-trivial HTTP endpoint where data crosses multiple layers — FormRequest for HTTP concerns, DTO for typed transport
- **FormRequest Only:** Simple endpoints where data flows directly from controller to a single service method
- **DTO Only:** CLI commands, queue jobs, and non-HTTP entry points where FormRequests don't apply

## When NOT To Use

- Do NOT pass FormRequests to services — this permanently couples the service layer to HTTP
- Do NOT create DTOs that mirror FormRequest validated keys exactly with no transformation — the DTO adds ceremony without value
- Do NOT define the same validation rules in both — they always diverge
- Do NOT use DTO authorization (`authorize()` method) as a replacement for FormRequest authorization — it lacks access to route parameters and request headers

## Best Practices (WHY)

- **Why sequential separation:** The FormRequest validates HTTP input format and authorization; the DTO provides typed data transport for the service layer. Each has a single, clear responsibility.
- **Why never inject FormRequest into services:** A service receiving a FormRequest is permanently coupled to HTTP. Test setup requires HTTP mocking. The service cannot be called from CLI or queue without constructing a fake request.
- **Why DTO transformation matters:** A DTO should represent the domain concept, not the HTTP form structure. Rename fields, flatten nesting, transform types — this is where the DTO pays off.
- **Why one validation layer:** Defining rules in both creates two sources of truth that diverge over time. Choose FormRequest for HTTP-specific rules, DTO for domain-level rules.

## Architecture Guidelines

- The controller depends on both FormRequest and DTO; the DTO depends on nothing; the FormRequest may depend on the DTO for rule delegation; the service depends only on the DTO
- Add a DTO when: same data shape used by multiple entry points, data crosses 3+ layers, or service method signature needs self-documentation
- Skip the FormRequest when: no HTTP-specific concerns (no authorization beyond auth, no input preparation) — use inline `request()->validate()`
- During code review: verify service receives DTO (not array), FormRequest validates HTTP concerns, DTO carries domain data

## Performance

No measurable difference. FormRequest and DTO validation both use the same `Validator` class. The extra method call for DTO construction is sub-microsecond. The decision is architectural, not performance-driven.

## Security

- Never inject FormRequest into services — carries request metadata (headers, cookies, session) the service should never see
- Ensure every DTO property has a corresponding validation rule in the FormRequest or in the DTO itself to prevent validation bypass
- Authorization logic in FormRequest's `authorize()` is not replicated for non-HTTP entry points — ensure CLI/queue entry points have their own authorization

## Common Mistakes

1. **DTO Properties Mirroring Request Fields Exactly:** If a DTO's properties are identical to the FormRequest's validated keys, the DTO adds no value. Transform fields, rename, flatten — this is where the DTO pays off.

2. **FormRequest Acting as DTO:** Passing a FormRequest to a service violates both the FormRequest's purpose (HTTP validation) and the service's contract (typed data).

3. **Duplicate Validation Rules:** When both FormRequest and DTO define the same rules, one will inevitably become out of date. Choose one validation layer as the single source of truth.

4. **Incomplete DTO Construction:** If the DTO's constructor requires fields that the FormRequest does not validate, a validation bypass exists.

## Anti-Patterns

- **The Conflated Object:** A FormRequest that acts as a DTO (passed directly to services) or a DTO that extends FormRequest. Each class has one job; conflating them loses both.
- **The Echo Chamber:** A DTO whose fields are identical to the FormRequest's validated keys with zero transformation. The DTO adds ceremony but no value. Either transform or skip the DTO.
- **The Duplicated Rule Set:** The same `'email' => ['required', 'email']` appearing in both FormRequest and DTO. Always diverges — one is updated for a new requirement, the other is forgotten.

## Examples

### FormRequest with payload() Method
```php
class StoreUserRequest extends FormRequest
{
    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:255'], 'email' => ['required', 'email', 'unique:users']];
    }

    public function authorize(): bool
    {
        return $this->user()->can('create', User::class);
    }

    public function payload(): UserDto
    {
        return new UserDto(...$this->validated());
    }
}

// Controller
public function store(StoreUserRequest $request, StoreUserAction $action)
{
    $action->execute($request->payload());
}
```

### DTO with fromRequest() Method
```php
readonly class UserDto
{
    public static function fromRequest(StoreUserRequest $request): self
    {
        return new self(...$request->validated());
    }
}

// Controller
public function store(StoreUserRequest $request, StoreUserAction $action)
{
    $action->execute(UserDto::fromRequest($request));
}
```

### CLI Command Without FormRequest
```php
class ImportUsersCommand extends Command
{
    public function handle()
    {
        $data = UserDto::fromArray([
            'name' => $this->argument('name'),
            'email' => $this->argument('email'),
        ]);
        // DTO validates itself — no FormRequest needed
        $this->action->execute($data);
    }
}
```

## Related Topics

- **Form Request Fundamentals** — FormRequest mechanics
- **DTO Fundamentals** — DTO purpose and definition
- **Form Request DTO Integration** — bridging patterns
- **Data Object Validation** — DTO-side validation
- **Action Parameter Strategies** — DTO as action input

## AI Agent Notes

- Use the sequential flow: FormRequest → DTO → Service
- Never pass FormRequest to a service method
- DTO should transform/rename fields, not mirror HTTP structure
- Define validation rules in only one layer per application
- For CLI/queue, DTO validation is the sole validation layer

## Verification

- [ ] Services receive DTOs (not FormRequests or raw arrays)
- [ ] FormRequest handles authorization and HTTP-specific validation
- [ ] DTO handles typed data transport and domain-level validation
- [ ] Validation rules are not duplicated between FormRequest and DTO
- [ ] DTO represents domain concept, not HTTP form structure
- [ ] Controllers bridge FormRequest to DTO via `payload()` or `fromRequest()`
- [ ] CLI/queue entry points construct DTOs directly with appropriate validation
