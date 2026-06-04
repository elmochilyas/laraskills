# DTO Nesting and Composition — Rules

## Rule 1: Limit Nesting Depth to 3-4 Levels
---
## Category
Maintainability
---
## Rule
Never compose DTOs deeper than 4 levels of nesting; flatten or split into separate operations when this limit is exceeded.
---
## Reason
Beyond 4 levels, serialization becomes unpredictable, error messages from deep validation failures become unhelpful, and construction complexity grows exponentially.
---
## Bad Example
```php
class InvoiceDto
{
    public function __construct(
        public CustomerDto $customer,        // Level 2
        public array $orders,                 // Level 2
        // OrderDto → AddressDto → CountryDto → CurrencyDto → SymbolDto → RateDto (Level 7)
    ) {}
}
```
---
## Good Example
```php
class InvoiceDto
{
    public function __construct(
        public int $customerId,              // Flattened to scalar
        public AddressDto $billingAddress,   // Level 2
        public array $orderIds,              // Flattened to IDs
    ) {}
}
// Deeply nested data fetched via separate queries
```
---
## Exceptions
API responses that must mirror deeply nested third-party schemas may exceed 4 levels, but should use API resources instead of DTOs for the output side.
---
## Consequences Of Violation
Serialization errors, unhelpful validation failures, construction code that is impossible to debug.
</rule>

## Rule 2: Never Create Circular DTO References
---
## Category
Reliability
---
## Rule
Never reference a parent DTO from a child DTO; use ID references (scalars) instead of object references for upward navigation.
---
## Reason
Circular references cause infinite recursion during serialization (`json_encode` crashes or hangs) and create a construction deadlock — the parent needs the child, the child needs the parent.
---
## Bad Example
```php
class OrderDto
{
    public function __construct(
        public int $id,
        public array $items, // LineItemDto[]
    ) {}
}

class LineItemDto
{
    public function __construct(
        public OrderDto $order, // ❌ Circular reference — serialization loop
    ) {}
}
```
---
## Good Example
```php
class OrderDto
{
    public function __construct(
        public int $id,
        public array $items, // LineItemDto[]
    ) {}
}

class LineItemDto
{
    public function __construct(
        public int $orderId, // ✅ Scalar reference — no circularity
    ) {}
}
```
---
## Exceptions
No common exceptions. DTO graphs must always be acyclic.
---
## Consequences Of Violation
Infinite serialization loops, `json_encode` crashes, HTTP 500 errors with no clear cause.
</rule>

## Rule 3: Each Child DTO Must Be Independently Constructable
---
## Category
Architecture
---
## Rule
Every child DTO in a nested structure must be constructable and testable independently of its parent.
---
## Reason
A child that depends on its parent for construction cannot be tested in isolation. Independent construction also enables reuse of the child DTO across different parent contexts.
---
## Bad Example
```php
class LineItemDto
{
    public function __construct(
        public int $productId,
        public int $quantity,
        // Must be constructed through OrderDto — no independent construction path
    ) {}
    // No fromArray — can only be built inside OrderDto::fromArray
}
```
---
## Good Example
```php
class LineItemDto
{
    public function __construct(
        public int $productId,
        public int $quantity,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            productId: $data['product_id'],
            quantity: $data['quantity'],
        );
    }
}
// Testable independently
$dto = LineItemDto::fromArray(['product_id' => 1, 'quantity' => 2]);
```
---
## Exceptions
No common exceptions. Independent constructability is a hard requirement for all DTOs.
---
## Consequences Of Violation
Untestable child DTOs, can only be constructed through parent, impossible to reuse children in other contexts.
</rule>

## Rule 4: Use Nullable Types for Optional Nested Data
---
## Category
Design
---
## Rule
Always declare optional nested DTOs with nullable types (`?AddressDto`) and default null values; never include them as required constructor parameters.
---
## Reason
Required nested DTOs force every consumer to provide data that may not exist. Nullable optional DTOs clearly communicate that the data is conditional.
---
## Bad Example
```php
class OrderDto
{
    public function __construct(
        public AddressDto $billingAddress,          // Required
        public DiscountDto $discount,               // Always required — even when no discount
    ) {}
}
```
---
## Good Example
```php
class OrderDto
{
    public function __construct(
        public AddressDto $billingAddress,
        public ?DiscountDto $discount = null,       // ✅ Nullable — discount is optional
    ) {}
}
```
---
## Exceptions
No common exceptions. Optional nested data must always be nullable.
---
## Consequences Of Violation
Callers must pass dummy data for optional nested structures, unclear API contract, null errors from missing optional data.
</rule>

## Rule 5: Prefer Entity Hierarchy Over API Structure for Nesting Orientation
---
## Category
Maintainability
---
## Rule
Nest DTOs according to the natural entity hierarchy (Order has Items) rather than the API response structure.
---
## Reason
Entity hierarchy is stable — it reflects the business domain. API structure changes frequently (flattening, versioning, field grouping). Entity-oriented nesting requires fewer refactors over time.
---
## Bad Example
```php
// Nested according to API v2 response structure
class UserResponseV2Dto
{
    public function __construct(
        public UserProfileDto $profile,
        public UserStatsDto $stats,
    ) {}
}
// When API changes to V3, entire DTO must be restructured
```
---
## Good Example
```php
// Nested according to entity hierarchy
class UserDto
{
    public function __construct(
        public string $name,
        public string $email,
        public AddressDto $address,
    ) {}
}
// API resource handles the response mapping
```
---
## Exceptions
DTOs that exist solely for API output and will never be reused may follow API structure, but should use API resources instead.
---
## Consequences Of Violation
Frequent DTO restructuring when API changes, DTOs tied to HTTP layer concerns, reduced reusability.
</rule>
