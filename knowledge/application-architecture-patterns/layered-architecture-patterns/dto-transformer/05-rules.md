# Rules: DTOs and Transformers

## Rule 1 — DTOs Are Readonly

**Rule Name:** dtos-are-readonly
**Category:** Always
**Rule:** DTO classes must be declared `readonly` (PHP 8.2+) or have all properties declared `readonly`.
**Reason:** Immutability prevents accidental mutation and makes DTOs safe to share across layers.
**Bad Example:**
```php
class UserData
{
    public string $name;
    public string $email;
}
```
**Good Example:**
```php
readonly class UserData
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}
}
```
**Exceptions:** None — mutable DTOs are not DTOs.

## Rule 2 — DTOs Are Primitive-Only

**Rule Name:** dtos-are-primitive-only
**Category:** Always
**Rule:** DTO properties must be primitives, other DTOs, or Value Objects. Never Eloquent models or entities.
**Reason:** DTOs must not carry ORM baggage or lazy-loading potential across layer boundaries.
**Bad Example:**
```php
readonly class InvoiceData
{
    public function __construct(
        public User $user, // Eloquent model
        public Collection $items, // Lazy-loading collection
    ) {}
}
```
**Good Example:**
```php
readonly class InvoiceData
{
    public function __construct(
        public int $userId,
        public array $items,
    ) {}
}
```
**Exceptions:** Value Objects from the Domain layer are acceptable if they have no infrastructure dependencies.

## Rule 3 — No Domain Objects as DTOs

**Rule Name:** no-domain-objects-as-dtos
**Category:** Always
**Rule:** Domain objects (Entities, Aggregates, Value Objects with behavior) must not be used as DTOs.
**Reason:** Domain objects carry behavior and internal structure that should not cross layer boundaries.
**Bad Example:**
```php
// Use Case returns the Entity directly
public function execute(Input $input): Invoice { /* ... */ }
```
**Good Example:**
```php
public function execute(Input $input): InvoiceResult { /* ... */ }
```
**Exceptions:** None — this is a hard architectural boundary.

## Rule 4 — No Request Objects in Use Cases

**Rule Name:** no-request-objects-in-use-cases
**Category:** Always
**Rule:** Use Cases must receive DTOs, not HTTP Request objects.
**Reason:** HTTP objects couple application logic to the web layer, preventing CLI, queue, and test reuse.
**Bad Example:**
```php
class CreateInvoice
{
    public function execute(CreateInvoiceRequest $request): array { /* ... */ }
}
```
**Good Example:**
```php
public function execute(CreateInvoiceInput $input): InvoiceResult { /* ... */ }
```
**Exceptions:** None — this is a hard architectural boundary.

## Rule 5 — Transformers Produce Consistent API Structure

**Rule Name:** transformers-produce-consistent-structure
**Category:** Always
**Rule:** All transformers must return a consistent array structure within the same API version.
**Reason:** Inconsistent response structures break API clients and confuse consumers.
**Bad Example:**
```php
// Some endpoints return {data: {...}}, others return the object directly
public function transform(User $user): array
{
    return ['name' => $user->name, 'email' => $user->email];
}
```
**Good Example:**
```php
public function transform(User $user): array
{
    return [
        'data' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ],
    ];
}
```
**Exceptions:** Different API versions may use different envelopes.

## Rule 6 — Test Response Format

**Rule Name:** test-response-format
**Category:** Always
**Rule:** Transformer output must be tested for exact array structure.
**Reason:** Response structure changes silently break API contracts.
**Bad Example:**
```php
// No transformer test — structure changes undetected
public function test_show_invoice(): void
{
    $response = $this->get('/api/invoices/1');
    $response->assertOk();
}
```
**Good Example:**
```php
public function test_invoice_transformer_output(): void
{
    $result = new InvoiceResult(/* ... */);
    $transformer = new InvoiceTransformer();
    
    $expected = [
        'data' => [
            'id' => 1,
            'status' => 'paid',
            'total' => ['amount' => 10000, 'currency' => 'USD'],
        ],
    ];
    
    expect($transformer->transform($result))->toBe($expected);
}
```
**Exceptions:** None — response format is a contract that must be tested.

## Rule 7 — Transformers Must Not Expose Sensitive Fields

**Rule Name:** transformers-no-sensitive-fields
**Category:** Always
**Rule:** Transformers must explicitly list fields. Never use `$model->toArray()` or `$this->all()` in transformer output.
**Reason:** Accidental inclusion of new model attributes is a data leak.
**Bad Example:**
```php
class UserTransformer
{
    public function transform(User $user): array
    {
        return $user->toArray(); // Exposes ALL fields including password_hash
    }
}
```
**Good Example:**
```php
class UserTransformer
{
    public function transform(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
        ];
    }
}
```
**Exceptions:** None — explicit field listing is mandatory for security.

## Rule 8 — DTOs Have Named Constructors for External Sources

**Rule Name:** dtos-have-named-constructors
**Category:** Prefer
**Rule:** Add named constructors (`fromRequest`, `fromArray`, `fromModel`) to DTO classes for creation from external sources.
**Reason:** Centralized construction logic prevents duplication of extraction and validation code.
**Bad Example:**
```php
// Controller manually extracts and maps
public function store(Request $request): JsonResponse
{
    $input = new CreateInvoiceInput(
        customerId: $request->input('customer_id'),
        items: $request->input('items'),
    );
}
```
**Good Example:**
```php
// DTO encapsulates construction
public function store(CreateInvoiceRequest $request): JsonResponse
{
    $input = CreateInvoiceInput::fromRequest($request);
}
```
**Exceptions:** Trivial DTOs with 1-2 properties may not need named constructors.
