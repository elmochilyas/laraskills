# DTO Construction Patterns — Rules

## Rule 1: Always Use Named Constructors for Source-Specific Mapping
---
## Category
Design
---
## Rule
Never repeat DTO construction logic across callers; encapsulate each data source's mapping in a static named constructor on the DTO class.
---
## Reason
Without named constructors, every controller and service that builds the DTO duplicates the key-to-property mapping. A DTO field rename requires finding every call site.
---
## Bad Example
```php
// Duplicated in every controller
$dto = new UserDto(
    name: $request->validated('name'),
    email: $request->validated('email'),
);
```
---
## Good Example
```php
class UserDto
{
    public static function fromRequest(CreateUserRequest $request): self
    {
        return new self(
            name: $request->validated('name'),
            email: $request->validated('email'),
        );
    }
}
```
---
## Exceptions
Direct constructor calls are acceptable when constructing from another DTO or domain object that already matches the parameter list exactly.
---
## Consequences Of Violation
Duplicated mapping logic, brittle refactoring, missed call sites when fields change.
</rule>

## Rule 2: Handle Missing Keys Explicitly in Factory Methods
---
## Category
Reliability
---
## Rule
Never use null-coalescing operators that silently accept missing keys for required fields; throw `InvalidArgumentException` with a clear message.
---
## Reason
Silent null assignment hides bugs — a missing key in the input causes a null value that propagates through the system and surfaces as an unrelated error far from the actual cause.
---
## Bad Example
```php
public static function fromArray(array $data): self
{
    return new self(
        name: $data['name'] ?? null, // ❌ Silent null — missing key not detected
        email: $data['email'] ?? null,
    );
}
```
---
## Good Example
```php
public static function fromArray(array $data): self
{
    return new self(
        name: $data['name'] ?? throw new InvalidArgumentException('name is required'),
        email: $data['email'] ?? throw new InvalidArgumentException('email is required'),
    );
}
```
---
## Exceptions
Optional fields with declared `?type` and `= null` defaults should use null-coalescing to set the default.
---
## Consequences Of Violation
Null propagation errors, hours of debugging to find the source of a null value, data corruption from missing required fields.
</rule>

## Rule 3: Limit Named Constructors to 3-4 Per DTO
---
## Category
Maintainability
---
## Rule
Never define more than 4 named constructors on a single DTO; extract operation-specific DTOs or separate factory classes when this limit is exceeded.
---
## Reason
6+ factory methods on one DTO indicate the DTO is used in too many contexts. Each factory adds maintenance surface and increases the chance of mapping inconsistencies.
---
## Bad Example
```php
class OrderDto
{
    public static function fromCreateRequest(CreateOrderRequest $r): self { /* ... */ }
    public static function fromUpdateRequest(UpdateOrderRequest $r): self { /* ... */ }
    public static function fromArray(array $data): self { /* ... */ }
    public static function fromModel(Order $order): self { /* ... */ }
    public static function fromApiResponse(array $response): self { /* ... */ }
    public static function fromCsvRow(array $row): self { /* ... */ } // Too many
}
```
---
## Good Example
```php
class CreateOrderDto { /* create-specific fields */ }
class UpdateOrderDto { /* update-specific fields */ }
class OrderResponseDto { /* response-specific fields */ }
```
---
## Exceptions
Response DTOs that must serialize from multiple source formats may justify 4+ factories, but this should be rare.
---
## Consequences Of Violation
Bloated DTO with mixed concerns, confusing API surface, high risk of mapping bugs.
</rule>

## Rule 4: Extract Complex Construction to Instance Factories
---
## Category
Architecture
---
## Rule
When DTO construction requires database lookups, external API calls, or injected dependencies, extract construction to a separate factory class instead of using static named constructors.
---
## Reason
Static methods cannot use dependency injection. Complex construction that queries the database or calls APIs inside a static method makes testing impossible and violates the principle of least surprise.
---
## Bad Example
```php
class OrderDto
{
    public static function fromCheckout(array $data): self
    {
        $product = Product::find($data['product_id']); // ❌ Database query in static factory
        return new self(/* ... */);
    }
}
```
---
## Good Example
```php
class OrderDtoFactory
{
    public function __construct(
        private ProductRepository $products,
    ) {}

    public function fromCheckout(array $data): OrderDto
    {
        $product = $this->products->find($data['product_id']);
        return new OrderDto(/* ... */);
    }
}
```
---
## Exceptions
No common exceptions. Complex construction always warrants an instance factory.
---
## Consequences Of Violation
Untestable static factories, hidden database queries in DTO construction, mocking impossible.
</rule>

## Rule 5: Coerce Types in Constructor or Factory Method
---
## Category
Reliability
---
## Rule
Always coerce raw input types (string dates to Carbon, string IDs to int) inside the DTO constructor or factory method, never in downstream consumers.
---
## Reason
Each consumer should not need to know that the source provides strings but the DTO expects Carbon. Centralized coercion guarantees consistent type handling and fails fast.
---
## Bad Example
```php
// Downstream consumer must coerce every time
$dto = new OrderDto(
    createdAt: Carbon::parse($data['created_at']), // ❌ Coercion scattered
);
```
---
## Good Example
```php
readonly class OrderDto
{
    public function __construct(
        public string $name,
        public Carbon $createdAt, // String → Carbon coerced in factory
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            createdAt: Carbon::parse($data['created_at']),
        );
    }
}
```
---
## Exceptions
No common exceptions. Type coercion is the DTO's responsibility.
---
## Consequences Of Violation
Duplicated coercion logic, inconsistent parsing behavior, downstream consumers must know source types.
</rule>

## Rule 6: Provide Collection Construction for Arrays of DTOs
---
## Category
Design
---
## Rule
Always include a typed `collection()` or `collectionFromArray()` factory method for DTOs that appear in arrays, returning `array<self>`.
---
## Reason
Without typed collection construction, arrays of DTOs degrade to arrays of arrays — losing all type guarantees. A collection factory documents the intent and enforces construction consistently.
---
## Bad Example
```php
// Caller builds array manually — no type guarantee
$items = array_map(fn(array $item) => new LineItemDto(
    productId: $item['product_id'],
    quantity: $item['quantity'],
), $data['items']);
```
---
## Good Example
```php
class LineItemDto
{
    /** @return array<self> */
    public static function collection(array $items): array
    {
        return array_map(fn(array $item) => self::fromArray($item), $items);
    }
}
```
---
## Exceptions
DTOs that never appear in arrays (single-item operations) do not need collection methods.
---
## Consequences Of Violation
Inconsistent array construction, duplicated mapping logic, type safety lost at the array boundary.
</rule>
