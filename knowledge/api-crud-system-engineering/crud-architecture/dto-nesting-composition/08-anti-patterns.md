# Anti-Patterns — DTO Nesting and Composition

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | DTO Nesting and Composition |
| Difficulty | Advanced |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Infinite Serialization Loop | High | Medium | Runtime error: `json_encode` crashes on circular references |
| Construction Cascade Failure | Medium | Medium | Code review: nested DTO failure produces unhelpful error messages |
| DTO as ORM Mirror | Medium | High | Code review: DTO nesting mirrors every Eloquent relationship |
| Deep Nesting Beyond Reason | Medium | Medium | Code review: 5+ levels of DTO nesting |
| Circular DTO References | High | Low | Code review: child DTO references parent DTO in its constructor |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Mixing Nesting Orientations | Some nested DTOs follow entity hierarchy, others follow API structure | Inconsistent, developers can't predict DTO structure for new endpoints |
| Children Dependent on Parent Context | Child DTOs require reference to parent DTO to be constructed correctly | Violates independent constructability, makes testing complex |
| Deep Serialization Cost | 5+ levels of nesting produce large JSON payloads regardless of API requirements | Unnecessary network overhead, slow serialization |

---

## Anti-Pattern Details

### AP-DNC-01: Infinite Serialization Loop

**Description**: A nested DTO graph contains circular references — child DTO A references parent DTO B, and parent DTO B references child DTO A (or a longer cycle). When serializing to JSON (e.g., via `toArray()` or `json_encode`), the serializer enters an infinite loop, causing a crash, memory exhaustion, or a hang.

**Root Cause**: Mapping bidirectional Eloquent relationships directly to DTOs. An `OrderDto` has a `CustomerDto`, and the `CustomerDto` has an `array<OrderDto>` — the same circular structure the database has, but DTOs have no lazy loading.

**Impact**:
- `json_encode($response)` crashes with memory limit exhaustion or maximum nesting level error
- API endpoints return 500 errors for data containing circular references
- Debugging is difficult because the error occurs after business logic completes
- Temporary fix (removing a relationship from serialization) is fragile

**Detection**:
- Runtime: `json_encode` throws "Recursion detected" or memory exhaustion
- Code review: DTO A has a property of DTO B, and DTO B has a property of DTO A
- Testing: serialization tests crash or produce enormous output

**Solution**:
- Break cycles by using ID references instead of object references
- Use `UserReferenceDto` (containing only `id`, `name`) instead of full `UserDto` in parent context
- Use API Resources for the output side instead of DTOs, where you control which relationships are included

**Example**:
```php
// BEFORE: Circular DTO references
class OrderDto
{
    public function __construct(
        public int $id,
        public CustomerDto $customer, // ❌ references CustomerDto
    ) {}
}
class CustomerDto
{
    public function __construct(
        public int $id,
        public array $orders, // OrderDto[] ❌ references back to OrderDto (cycle!)
    ) {}
}

// AFTER: Break cycle with scalar references
class OrderDto
{
    public function __construct(
        public int $id,
        public int $customerId, // ✅ ID reference, not full CustomerDto
    ) {}
}
class CustomerDto
{
    public function __construct(
        public int $id,
        public array $orderIds, // int[] ✅ IDs only
    ) {}
}
```

---

### AP-DNC-02: Construction Cascade Failure Without Clear Errors

**Description**: A deeply nested DTO fails to construct because a field in a child DTO at level 4 is missing or invalid. The error message is generic ("InvalidArgumentException" or a type mismatch) and doesn't indicate which level or which child DTO caused the failure. Developers must trace through the recursive construction to find the root cause.

**Root Cause**: Child DTOs throw generic exceptions without context. The parent DTO doesn't add contextual information about which child failed. When a form has 20+ nested fields, a single bad value produces an unhelpful stack trace.

**Impact**:
- Debugging nested DTO failures takes 5× longer than flat DTO failures
- API error responses are not helpful for frontend developers
- Missing field errors propagate as "null value" or type errors at unexpected locations
- Deep nesting means the stack trace spans 40+ frames

**Detection**:
- Development: debugging sessions where the error is at a DTO constructor but the source data is not obvious
- Code review: child DTO `fromArray` methods have no contextual error messages
- Code review: parent DTO doesn't wrap child construction in try-catch or add context

**Solution**:
- Include the data path in exception messages: `"order.items[3].product_id is required"`
- Validate nested data before construction (pre-validation with field paths)
- Use a validation wrapper that captures field paths during recursive construction
- For Spatie Data, use the package's built-in validation exception handling

**Example**:
```php
// BEFORE: Generic error on nested failure
class LineItemDto
{
    public static function fromArray(array $data): self
    {
        return new self(
            productId: $data['product_id'] ?? throw new InvalidArgumentException('missing field'),
        );
    }
}
// Error: "missing field" — which item? which field?

// AFTER: Contextual error message
class LineItemDto
{
    public static function fromArray(array $data, string $path = ''): self
    {
        return new self(
            productId: $data['product_id']
                ?? throw new InvalidArgumentException("{$path}product_id is required"),
        );
    }
}
// Parent passes path: "items[3]."
// Error: "items[3].product_id is required"
```

---

### AP-DNC-03: DTO as ORM Mirror

**Description**: A nested DTO structure that mirrors every Eloquent relationship, including polymorphic relationships, pivot tables, and has-many-through chains. The DTO graph is as complex as the full Eloquent model graph, with 5+ levels of nesting that include data the API consumer never uses.

**Root Cause**: The developer maps Eloquent relationships to DTOs automatically or copies the model structure without considering what the API response actually needs.

**Impact**:
- DTO construction is slow (constructing DTOs for relationships the consumer doesn't need)
- API responses are bloated with unnecessary nested data
- DTO structure changes when the database schema changes (brittle coupling)
- Testing requires constructing deeply nested DTOs with full relationship data

**Detection**:
- Code review: DTO nesting depth matches Eloquent model relationship depth
- Code review: DTO includes polymorphic relationships, pivot data
- Performance profiling: DTO construction takes 10ms+ due to deep nesting

**Solution**:
- Design DTOs based on API consumer needs, not database schema
- Flatten data that doesn't need nesting (use `customerName` instead of `customer.name`)
- Use API Resources for the output side where you control serialization
- Limit nesting to 3-4 levels; flatten beyond that
- Consider GraphQL-style field selection instead of fixed nested DTOs

**Example**:
```php
// BEFORE: DTO mirrors every relationship
class OrderDto
{
    public function __construct(
        public int $id,
        public CustomerDto $customer,       // nested customer
        public array $items,                // LineItemDto[]
        public PaymentDto $payment,          // nested payment
        public ShippingDto $shipping,        // nested shipping
        public array $history,              // StatusHistoryDto[]
        public InvoiceDto $invoice,          // nested invoice
        public array $notes,                // NoteDto[]
    ) {}
}

// AFTER: Consumer-driven DTO structure
class OrderListDto
{
    public function __construct(
        public int $id,
        public string $customerName,   // flattened
        public string $total,
        public string $status,
        public int $itemCount,
    ) {}
}
```
