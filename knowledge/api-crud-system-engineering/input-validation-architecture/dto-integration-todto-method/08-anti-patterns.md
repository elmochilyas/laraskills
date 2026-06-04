# Anti-Patterns — DTO Integration: toDto() Method

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | DTO Integration: toDto() Method |
| Difficulty | Advanced |
| Category | Integration Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Mapper Accessing Request Object Directly | High | Medium | Code review: `Request` injected into mapper |
| Mapper With Business Logic | Medium | Medium | Code review: calculations and decisions in mapper |
| payload and toDto on Same Endpoint | Medium | Medium | Code review: both `payload()` and `toDto()` present for same endpoint |
| Mapper Serializing/Deserializing | Low | Low | Code review: `json_encode`/`json_decode` inside mapper |
| Mapper With Side Effects | High | Low | Code review: DB writes, job dispatches in mapper |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Naming Collision With Eloquent toDto | `$model->toDto()` and `$request->toDto()` both exist | Confusion about which is the source of the DTO |
| Mapper Not Registered in Container | Mapper resolved manually instead of via DI | Cannot inject dependencies; harder to mock in tests |
| toDto Called Before Validation | Mapper receives raw request data instead of validated | Security vulnerability: unvalidated data in DTO |

---

## Anti-Pattern Details

### AP-DTM-01: Mapper Accessing Request Object Directly

**Description**: A standalone mapper class receives the entire `Request` (or `FormRequest`) object rather than just the validated data. Inside the mapper, it calls `$request->input()`, `$request->user()`, or accesses request headers. This couples the mapper to the HTTP layer, prevents reuse in non-HTTP contexts, and bypasses the validation guarantee — the mapper could access unvalidated input.

**Root Cause**: Convenience. Injecting the request gives the mapper access to everything it needs without explicitly passing specific data.

**Impact**:
- Mapper cannot be used in CLI commands, jobs, or service-layer contexts
- Unit tests must create fake Request objects to test the mapper
- Mapper may accidentally use unvalidated data from `$request->input()` instead of `validated()`
- Violates the separation between HTTP concerns and domain mapping

**Detection**:
- Code review: `Illuminate\Http\Request` or a `FormRequest` type-hint in the mapper constructor or method signature
- Code review: `$request->input()`, `$request->all()`, or `$request->header()` inside the mapper
- Test review: mapper tests use `Request::create()` or similar HTTP simulation

**Solution**:
- Pass only validated data (or a DTO) to the mapper, never the request object
- Use constructor or method parameters for dependencies
- Accept validated arrays or typed DTO inputs, not HTTP objects

**Example**:
```php
// BEFORE: Mapper accessing Request
class MapPostRequestToData
{
    public function __invoke(StorePostRequest $request): PostData // ❌ HTTP coupling
    {
        return PostData::from([
            ...$request->validated(),
            'author_id' => $request->user()->id, // ❌ accessing request
        ]);
    }
}

// AFTER: Mapper receives validated data
class MapPostRequestToData
{
    public function __invoke(array $validated, User $author): PostData // ✅ no HTTP coupling
    {
        return PostData::from([
            ...$validated,
            'author_id' => $author->id,
        ]);
    }
}

// Usage in controller:
$data = $mapper($request->validated(), $request->user());
```

---

### AP-DTM-02: Mapper With Business Logic

**Description**: A standalone mapper contains business logic — pricing calculations, discount rule evaluation, eligibility decisions, or status transitions — alongside data mapping. The mapper becomes responsible for both converting data AND making domain decisions, violating the Single Responsibility Principle and coupling business rules to the data transformation layer.

**Root Cause**: Treating the mapper as a "service-light" class. The developer puts logic that feels too small for a full service class into the mapper.

**Impact**:
- Business logic is embedded in the HTTP layer, not the domain layer
- Cannot reuse business rules from the mapper in other contexts
- Testing business logic requires going through the mapper's HTTP interface
- Mapper becomes a dumping ground for "the rest of the logic"

**Detection**:
- Code review: conditionals, switch statements, or loops in the mapper beyond simple mapping
- Code review: mapper calls external services or repositories
- Test review: mapper tests include assertions about business outcomes, not just data structure

**Solution**:
- Keep mappers focused on data transformation only
- Move business logic to service classes or action classes
- Use the mapper to convert request structure to domain structure; let services make decisions

**Example**:
```php
// BEFORE: Business logic in mapper
class MapOrderRequestToData
{
    public function __invoke(array $validated): OrderData
    {
        $total = $validated['quantity'] * $validated['price'];
        if ($total > 100) {
            $total *= 0.9; // ❌ business logic (discount)
        }
        return OrderData::from([...$validated, 'total' => $total]);
    }
}

// AFTER: Pure mapping
class MapOrderRequestToData
{
    public function __invoke(array $validated): OrderData
    {
        return OrderData::from($validated); // ✅ no business logic
    }
}

// Business logic in service:
class OrderService
{
    public function create(OrderData $data): Order
    {
        $total = $this->calculateTotal($data);
        // ...
    }
}
```

---

### AP-DTM-03: payload and toDto on Same Endpoint

**Description**: Both `payload()` (on the FormRequest) and a standalone `toDto()` mapper exist for the same endpoint. The controller developer must choose which to use, and different developers on the team may make different choices. The two implementations may drift apart, producing different DTOs from the same request data.

**Root Cause**: No team convention. One developer added `payload()` on the FormRequest; another added a standalone mapper for the same endpoint.

**Impact**:
- Two code paths that produce the same DTO — maintenance burden x2
- Drift: bug fix in one path may not be applied to the other
- Confusion: new developers don't know which to use or extend
- Testing both paths doubles the test surface

**Detection**:
- Code review: both `payload()` on `StorePostRequest` AND `MapPostRequestToData` mapper exist
- Code review: two different controllers for the same endpoint using different approaches
- File system: `payload()` in FormRequest and mapper class both exist for the same resource

**Solution**:
- Choose one pattern per endpoint and enforce consistency
- Use `payload()` for simple, per-endpoint mapping
- Use standalone mappers for cross-endpoint or cross-version mapping
- Document the convention in the project's coding standards

**Example**:
```php
// BEFORE: Two patterns coexisting
// StorePostRequest has payload() method
// app/Mappers/MapPostRequestToData also exists for the same endpoint
// Controller uses: $request->payload() or $mapper($request) — depends on developer

// AFTER: One pattern per endpoint
// For simple endpoints: use payload() on FormRequest
// Delete standalone mapper
// Controller consistently uses:
$post = $this->posts->create($request->payload());
```

---

### AP-DTM-04: Mapper Serializing/Deserializing

**Description**: The mapper converts data to JSON and back, or serializes to a string before constructing the DTO: `$data = json_decode(json_encode($validated), true)`. This round-trip through serialization is unnecessary, error-prone (loses types, converts integers to strings), and masks the actual mapping logic. DTO construction should be direct object creation, not serialization round-trips.

**Root Cause**: Copy-paste from API response code or misguided normalization attempt. The developer believes that serializing/deserializing will "clean" the data.

**Impact**:
- Type loss: integers become strings, booleans become integer 0/1
- Silent data corruption: null becomes "null" string, objects become arrays
- Performance overhead: unnecessary encode/decode cycles
- Debugging difficulty: data changes shape between input and DTO

**Detection**:
- Code review: `json_encode()` or `json_decode()` inside a mapper
- Code review: `serialize()`/`unserialize()` or `collect($data)->toArray()` round-trips
- Integration tests: DTO properties have wrong types after mapping

**Solution**:
- Construct DTOs directly from validated data
- Use Spatie's `Data::from()` for simple construction
- Manually map each property for complex transformations

**Example**:
```php
// BEFORE: Serialization round-trip
class MapPostRequestToData
{
    public function __invoke(array $validated): PostData
    {
        $data = json_decode(json_encode($validated), true); // ❌ unnecessary round-trip
        return PostData::from($data);
    }
}

// AFTER: Direct construction
class MapPostRequestToData
{
    public function __invoke(array $validated): PostData
    {
        return PostData::from([
            'title' => $validated['title'],
            'body' => $validated['body'],
            'status' => StatusEnum::from($validated['status']),
        ]); // ✅ direct, type-safe
    }
}
```

---

### AP-DTM-05: Mapper With Side Effects

**Description**: The mapper performs I/O operations during DTO construction — database queries to enrich data, external API calls to fetch related information, file uploads, or queue dispatches. Since the mapper is called during request processing, these side effects execute on every request, and if the mapper is called multiple times, side effects repeat.

**Root Cause**: Convenience. The developer needs related data for the DTO and places the query in the mapper because it "feels" like part of the mapping process.

**Impact**:
- Mapper cannot be tested in isolation — requires DB or API mocking
- Side effects may execute multiple times if mapper is called multiple times
- Failed side effects produce 500 errors during DTO construction
- Mapper is no longer a pure data transformation function

**Detection**:
- Code review: `DB::query()`, `Http::get()`, `Storage::put()`, or `dispatch()` inside a mapper
- Code review: try/catch blocks in mapper for handling side-effect failures
- Test review: mapper tests require database or network access

**Solution**:
- Keep mappers as pure transformation functions — no I/O
- Fetch required data in the controller or service layer before calling the mapper
- Pass enriched data as additional parameters to the mapper

**Example**:
```php
// BEFORE: Side effects in mapper
class MapOrderRequestToData
{
    public function __construct(private readonly ProductRepository $products) {}

    public function __invoke(array $validated): OrderData
    {
        $product = $this->products->findOrFail($validated['product_id']); // ❌ I/O
        return OrderData::from([
            ...$validated,
            'product_name' => $product->name,
            'unit_price' => $product->price,
        ]);
    }
}

// AFTER: Pure transformation
class MapOrderRequestToData
{
    public function __invoke(array $validated): OrderData
    {
        return OrderData::from($validated); // ✅ no I/O
    }
}

// I/O moved to controller/service:
$product = $this->products->findOrFail($validated['product_id']);
$data = $mapper($validated, $product);
```
