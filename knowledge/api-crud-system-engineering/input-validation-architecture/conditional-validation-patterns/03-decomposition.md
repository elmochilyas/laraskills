# Conditional Validation Patterns

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Stewardship:** API Platform Team
- **Last Updated:** 2026-06-02
- **Phase:** 3 (Production Hardening & Integration)
- **Tags:** conditional-validation, testing, complex-conditions, state-machine

## Executive Summary
Phase 3 covers testing conditional validation in isolation, state-machine-driven validation for multi-step forms, production observability for conditional rule evaluation, integration with DTOs, and strategies for maintaining complex conditional rule sets at scale.

## Core Concepts

### Validation State Machine
Complex conditional validation can be modeled as a state machine. Each valid input combination maps to a state. Transitions between states are triggered by field values. This formal model prevents impossible or contradictory rule combinations.

### Deterministic Condition Evaluation
Every conditional branch must be tested to produce a deterministic, predictable outcome. Conditions that depend on external state (database, cache, time) must be made explicit and testable.

## Internal Mechanics

### Validator::sometimes() with after() for Cross-Field Logic
```php
protected function withValidator(Validator $validator): void
{
    $validator->sometimes('shipping_address', 'required|array', function ($input) {
        return $input->requires_shipping === true;
    });

    $validator->after(function ($validator) {
        $input = $validator->getData();

        if (($input['requires_shipping'] ?? false) && empty($input['shipping_address'])) {
            $validator->errors()->add('shipping_address', 'Shipping address is required.');
        }

        if (($input['delivery_date'] ?? null) && ($input['order_date'] ?? null)) {
            if ($input['delivery_date'] <= $input['order_date']) {
                $validator->errors()->add('delivery_date', 'Delivery date must be after order date.');
            }
        }
    });
}
```

### Extraction of Complex Condition Methods
```php
public function rules(): array
{
    return array_merge(
        $this->baseRules(),
        $this->conditionalRulesForType(),
        $this->conditionalRulesForPayment(),
    );
}

protected function conditionalRulesForType(): array
{
    return match ($this->input('type')) {
        'business' => [
            'company_name' => ['required', 'string', 'max:255'],
            'vat_number' => ['required', 'string', 'vat_number'],
        ],
        'personal' => [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
        ],
        default => [],
    };
}
```

## Patterns

### Testing Conditional Validation Rules
```php
public function test_business_type_requires_company_name(): void
{
    $validator = Validator::make(
        ['type' => 'business', 'vat_number' => 'DE123456789'],
        (new StoreCustomerRequest())->rules(),
        (new StoreCustomerRequest())->messages(),
    );

    $this->assertTrue($validator->fails());
    $this->assertArrayHasKey('company_name', $validator->errors()->messages());
}

public function test_personal_type_does_not_require_company_name(): void
{
    $validator = Validator::make(
        ['type' => 'personal', 'first_name' => 'John', 'last_name' => 'Doe'],
        (new StoreCustomerRequest())->rules(),
    );

    $this->assertTrue($validator->passes());
}

public function test_mutually_exclusive_fields(): void
{
    $validator = Validator::make(
        ['delivery_method' => 'shipping', 'pickup_location' => 'Downtown'],
        (new StoreOrderRequest())->rules(),
        (new StoreOrderRequest())->messages(),
    );

    // withValidator should reject pickup_location when delivery is shipping
    $request = new StoreOrderRequest();
    $request->replace(['delivery_method' => 'shipping', 'pickup_location' => 'Downtown']);

    $validator = Validator::make(
        $request->all(),
        $request->rules(),
    );

    $request->withValidator($validator);

    $this->assertTrue($validator->fails());
}

public function test_after_hook_cross_field_validation(): void
{
    $data = ['start_date' => '2026-06-10', 'end_date' => '2026-06-05'];

    $request = new DateRangeRequest();
    $validator = Validator::make($data, $request->rules());
    $request->withValidator($validator);

    $this->assertTrue($validator->fails());
    $this->assertArrayHasKey('start_date', $validator->errors()->messages());
}
```

### State Machine Pattern for Complex Conditions
```php
enum OrderType: string
{
    case Physical = 'physical';
    case Digital = 'digital';
    case Service = 'service';
}

enum FulfillmentMethod: string
{
    case Shipping = 'shipping';
    case Email = 'email';
    case Pickup = 'pickup';
}

class StoreOrderRequest extends FormRequest
{
    private array $stateRules = [
        OrderType::Physical->value => [
            FulfillmentMethod::Shipping->value => ['shipping_address' => 'required|array'],
            FulfillmentMethod::Pickup->value => ['pickup_location' => 'required|string'],
        ],
        OrderType::Digital->value => [
            FulfillmentMethod::Email->value => ['email' => 'required|email'],
        ],
        OrderType::Service->value => [
            FulfillmentMethod::Shipping->value => ['shipping_address' => 'required|array', 'service_date' => 'required|date'],
            FulfillmentMethod::Pickup->value => ['service_date' => 'required|date', 'pickup_location' => 'required|string'],
        ],
    ];

    public function rules(): array
    {
        $type = $this->input('type');
        $fulfillment = $this->input('fulfillment_method');

        $rules = $this->stateRules[$type][$fulfillment] ?? [];

        return array_merge([
            'type' => ['required', Rule::enum(OrderType::class)],
            'fulfillment_method' => ['required', Rule::enum(FulfillmentMethod::class)],
            'items' => ['required', 'array', 'min:1'],
        ], $rules);
    }
}
```

## Architectural Decisions

| Decision | Rationale |
|---|---|
| Condition methods extracted from rules() | Testable in isolation, readable |
| State machine for complex conditions | Formal model prevents illegal state combinations |
| withValidator() for cross-field rules | after() only runs if all rules pass; keeps rules() simple |

## Tradeoffs

| Dimension | Benefit | Cost |
|---|---|---|
| Extracted condition methods | Unit testable, clean rules() | More methods per request class |
| State machine mapping | Exhaustive state coverage, no surprises | Upfront design overhead; rigid for new states |
| withValidator() + after() | Cross-field logic after rules pass | Logic hidden from rules(); harder to discover |

## Performance Considerations
- `withValidator()` closures run per-request — keep them lean.
- State machine rules are pre-computed — minimal overhead.
- Match statements in `conditionalRulesForType()` are O(1) and fast.
- Avoid database calls inside condition closures — cache or batch in constructor.

## Production Considerations
- Log which conditional branch was taken for debugging:
  ```php
  Log::debug('Conditional validation branch', [
      'type' => $this->input('type'),
      'fulfillment' => $this->input('fulfillment_method'),
  ]);
  ```
- Monitor `after()` hooks for exceptions — they run userland code that can throw.
- Document conditional validation rules in API contract (OpenAPI `oneOf`/`anyOf`).
- Test all state combinations in CI.

## Common Mistakes
- Putting expensive logic in `after()` hook — it runs on every successful validation.
- Forgetting to test the "all conditions fail" path — undefined state leads to empty rule set.
- Using `required_without` instead of explicit state machine — creates hidden dependencies.
- Overusing `Rule::when()` — nested when calls are hard to debug.
- Ignoring the default/else branch — what happens when no condition matches?

## Failure Modes

| Failure Mode | Symptom | Mitigation |
|---|---|---|
| Unhandled state combination | Empty ruleset, validation bypass | Default branch in match() must throw or set restrictive rules |
| after() hook exception | 500 error on valid input | Wrap after() logic in try/catch |
| Condition reading mutated input | Non-deterministic validation | Freeze input reading; don't modify input during validation |
| Complex required_if with dot-notation | Condition silently fails | Test every conditional branch in isolation |

## Ecosystem Usage

### OpenAPI oneOf / anyOf Mapping
Conditional validation maps naturally to OpenAPI `oneOf`:
```yaml
components:
  schemas:
    OrderInput:
      oneOf:
        - $ref: '#/components/schemas/PhysicalOrderInput'
        - $ref: '#/components/schemas/DigitalOrderInput'
```

### Spatie Laravel Data Discriminated Union
```php
class OrderInput extends Data
{
    public function __construct(
        public OrderType $type,
        #[TypeFromField('type')]
        public PhysicalOrderInput|DigitalOrderInput|null $orderDetails,
    ) {}
}
```

## Related Knowledge Units

### Prerequisites
- **conditional-validation-patterns** — Phase 2 conditional mechanics.
- **form-request-design-for-apis** — request class structure for conditional rules.

### Related Topics
- **input-preparation** — preparing input before conditional evaluation.
- **after-validation-hooks** — post-validation hooks after conditionals.

### Advanced Follow-up Topics
- **dto-integration-payload-method** — conditional DTO creation.
- **bulk-request-validation** — conditional validation within arrays.

## Research Notes

### Source Analysis
The `Validator::sometimes()` method calls `setAttribute()` with the condition closure. If the closure returns true, rules are added via `addRules()`. The closure receives a `Fluent` object wrapping the input data, not the raw array. This means property access uses `$input->field_name`, not `$input['field_name']`.

### Key Insight
Conditional validation transforms a flat rule set into a **decision tree**. Each `sometimes()`, `Rule::when()`, or `required_if` creates a branch. The total number of valid input combinations is the product of all branches — testing must cover each combination.

### Version-Specific Notes
- Laravel 10: `Rule::when()` and `Rule::unless()` for inline conditional composition.
- Laravel 11: No changes to conditional validation API.
- PHP 8.1: Enumerations improve state machine conditional validation readability.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization