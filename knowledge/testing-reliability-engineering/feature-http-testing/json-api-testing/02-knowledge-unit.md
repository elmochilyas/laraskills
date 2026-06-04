# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Feature & HTTP Testing
Knowledge Unit: JSON API Testing
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
JSON API testing validates the structure, content, and contracts of JSON responses returned by Laravel applications. Laravel provides `getJson()`, `postJson()`, `putJson()`, `patchJson()`, and `deleteJson()` HTTP helpers alongside the fluent `AssertableJson` class for deep JSON structure assertions. JSON API tests are the most important test type for modern Laravel applications (which typically serve as backends for SPAs, mobile apps, or third-party integrations). Fluent JSON path assertions catch contract violations before they reach consumers.

# Core Concepts
- **`getJson()`, `postJson()`, etc.**: HTTP helpers that send `application/json` requests and expect JSON responses. Automatically set `Accept: application/json` and `Content-Type: application/json` headers.
- **`assertJson(array $data)`**: Asserts the response JSON contains the given data (partial match). Does not check for exact equality; only verifies the subset exists.
- **`assertExactJson(array $data)`**: Verifies the response JSON exactly matches the given structure and values. Order-independent.
- **`assertJsonStructure(array $structure)`**: Validates the JSON structure (keys and types) without checking values. Useful for contract validation.
- **`assertJsonPath(string $path, $expected)`**: Asserts a value at a dot-notation path. Example: `assertJsonPath('data.user.name', 'John')`.
- **`AssertableJson` fluent API**: `assertJson(fn (AssertableJson $json) => $json->where('id', 1)->whereType('name', 'string')->has('items', 3))`.
- **`assertJsonCount()`**: Asserts the count of items in a JSON array at a specific path.
- **`assertJsonMissing()`**: Asserts that a key or value is NOT present in the response JSON.

# Mental Models
- **JSON structure as API contract**: The JSON structure IS your API contract. Tests verify that the contract is maintained. A structure change is a breaking change.
- **Partial match vs exact match**: `assertJson()` checks "does this subset exist?" `assertExactJson()` checks "is this exactly the response?" Prefer partial match unless testing idempotency.
- **JSON path as navigation**: `data.user.addresses[0].city` is a JSON path. `assertJsonPath()` traverses the decoded array using dot notation.
- **Fluent assertion tree**: `AssertableJson` methods chain to navigate nested structures. Each scope (e.g., `->where()`) applies to the current JSON level.

# Internal Mechanics
- **`AssertableJson` implementation**: A proxy class wrapping the PHPUnit constraint. Methods like `where()`, `whereType()`, `has()`, `missing()` register PHPUnit assertions against the JSON structure.
- **JSON path resolution**: `assertJsonPath()` uses `Illuminate\Support\Str::parseCallback()` to split the dot path into segments. It traverses the decoded array using `data_get()`.
- **Type assertions**: `whereType('count', 'integer')` uses `gettype()` internally. Available types: `string`, `integer`, `boolean`, `array`, `object`, `double`, `NULL`.
- **Collection assertions**: `has('items', 3)` verifies `items` is an array with 3 elements. `has('items', fn ($json) => $json->each(...))` iterates over each item for nested assertions.
- **`assertJson()` partial matching**: Uses `PHPUnit\Framework\Constraint\ArraySubset` (deprecated in PHPUnit 12 but still functional). Recursively checks that the expected array is a subset of the actual.
- **Missing assertion**: `assertJsonMissing('key')` uses `array_key_exists()` check on the decoded JSON. Also available: `assertJsonMissingExact()`.

# Patterns
- **Pattern: Structure-first, values-second**
  - Purpose: Validate API contract first, then specific values
  - Benefits: Contract changes break the test clearly, not silently
  - Tradeoffs: Two assertions per endpoint make tests slightly longer
  - Implementation: Method 1 in test: `assertJsonStructure([...])`. Method 2+: `assertJsonPath(...)`.

- **Pattern: AssertableJson callback for nested structures**
  - Purpose: Traverse deeply nested responses with readable assertions
  - Benefits: Fluent, self-documenting, IDE-friendly
  - Tradeoffs: Callback nesting can reach 4-5 levels
  - Implementation: `$this->getJson('/api/users')->assertJson(fn ($json) => $json->has('data', fn ($data) => $data->each(fn ($user) => $user->where('role', 'admin')->etc())))`

- **Pattern: Pagination structure validation**
  - Purpose: Verify paginated responses have correct metadata structure
  - Benefits: Catches pagination contract violations early
  - Tradeoffs: More verbose assertions for pagination
  - Implementation: `assertJsonStructure(['data' => [...], 'links' => ['first', 'last', 'prev', 'next'], 'meta' => ['current_page', 'last_page', 'total', 'per_page']])`

- **Pattern: Error response structure contract**
  - Purpose: Validate consistent error format across all endpoints
  - Benefits: API consumers rely on consistent error structure
  - Tradeoffs: Every error test must assert the same structure
  - Implementation: Extract a `assertErrorStructure()` helper method that validates common error JSON shape

# Architectural Decisions
- **`assertJson()` vs `assertExactJson()`**: Use `assertJson()` (partial match) for most testsâ€”it's less brittle. Use `assertExactJson()` only for idempotency tests (POST same data twice should return same result).
- **`assertJsonPath()` vs `AssertableJson`**: `assertJsonPath()` is simpler for single-value assertions. `AssertableJson` is better for multi-value or nested structure assertions.
- **JSON structure only vs values**: Structure-only tests (`assertJsonStructure`) validate contracts. Value tests validate business logic. Both are needed.
- **Assertion granularity**: One endpoint test should assert: status code, structure, and 1-3 specific values. Too many value assertions make tests brittle.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fluent `AssertableJson` is highly readable | Deeply nested callbacks can be hard to debug | Limit nesting to 3 levels; extract helpers |
| `assertJsonPath()` is simple and powerful | Only checks one path per call | Chain calls or use `AssertableJson` for multiple paths |
| Structure assertions catch contract breaks | Structure tests may be too permissive (no value checks) | Combine structure + value assertions |
| Partial matching reduces brittleness | Partial matches may hide unexpected extra data | Use `assertExactJson()` sparingly for strict contracts |

# Performance Considerations
- **JSON response size**: Large JSON responses (1000+ items) take longer to decode and assert. Paginate in tests to 10-15 items maximum.
- **Assertion overhead**: `assertJson()` with large expected arrays is slower than `assertJsonPath()` with specific values. Profiling difference is <1ms for typical responses.
- **`AssertableJson` chain overhead**: Each fluent call adds method call overhead. For deep structures with 20+ assertions, this is <0.5ms.
- **Serialization cost**: The response JSON is serialized by Laravel's response factory. Loaded relationships and appended attributes increase serialization time.

# Production Considerations
- **API versioning**: Include version in URL path (`/api/v1/users`). Test each version separately. Structure assertions catch version-specific contract breaks.
- **Null vs missing**: Decide whether null values are returned as `null` or omitted from the response. Test both cases.
- **Empty states**: Test `GET /api/users` with 0, 1, and 100 users. Empty responses should return `{"data": []}`, not 404.
- **Error consistency**: All error responses should follow the same structure. Test that validation errors, auth errors, and server errors all produce consistent JSON shapes.
- **Resource collection vs single resource**: Test both `index` (collection) and `show` (single) responses. Their structures should follow the same pattern.

# Common Mistakes
- **Mistake: Using `assertJson()` for exact matching**
  - Why: `assertJson()` does partial matching
  - Why harmful: Test passes with extra unexpected data; API contract may diverge
  - Better: Use `assertExactJson()` or `assertJsonStructure()` + `assertJsonPath()` combination

- **Mistake: Hardcoding IDs in assertions**
  - Why: Using `assertJsonPath('data.id', 1)` with seeded data
  - Why harmful: Test breaks when seed order changes or DB is refreshed
  - Better: Assert the ID is an integer: `whereType('data.id', 'integer')`

- **Mistake: Not testing JSON structure (only testing values)**
  - Why: Focus on business logic values
  - Why harmful: API response structure changes break consumers silently
  - Better: Always assert structure in addition to values

- **Mistake: Asserting dates/timestamps as exact strings**
  - Why: `assertJsonPath('created_at', '2026-01-15T12:00:00Z')`
  - Why harmful: Fails on timezone, format, or second differences
  - Better: Assert date format or use Carbon to parse and compare

# Failure Modes
- **JSON decode failure**: If response is not valid JSON, `assertJson()` throws a `PHPUnit\Framework\AssertionFailedError`. Check `assertStatus()` first to ensure the request succeeded.
- **Deep path traversal failure**: `assertJsonPath('data.user.addresses[0].city', $value)` fails if intermediate keys are missing. Use `has()` checks first for optional nested structures.
- **AssertableJson callback scope leakage**: Nested `AssertableJson` callbacks share variable scope in PHP closures. Be careful with loop variables.
- **Type coercion surprises**: JSON returns strings for numeric values unless explicitly cast. `whereType('id', 'integer')` fails if Eloquent casts `id` to string.

# Ecosystem Usage
- **Laravel API resources**: `JsonResource` collections should be tested with `assertJsonStructure` to verify the expected resource wrapping.
- **Laravel Sanctum/Breeze**: API authentication flows use JSON responses. Tests verify token structure and auth error JSON format.
- **Laravel Fortify**: Authentication endpoints return JSON responses. Fortify's test suite demonstrates comprehensive JSON testing patterns.
- **Spatie Laravel JSON API Paginate**: The pagination JSON structure is standardized by this package; tests should assert the pagination contract.

# Related Knowledge Units
- **Prerequisites**: HTTP test helpers, Eloquente API resources, Route design
- **Related Topics**: Authentication testing, Validation testing, Contract testing, API resource serialization
- **Advanced Follow-up**: OpenAPI contract testing, Consumer-driven contracts, JSON:API specification testing

# Research Notes
- Laravel's HTTP test helpers (get(), post(), put(), delete()) provide a full-stack testing experience without starting a web server — requests flow through the kernel internally
- Response assertions (ssertStatus(), ssertJson(), ssertSee()) are chainable and provide clear failure messages for debugging test failures
- Pest's higher-order expectations (expect()->toBeOk()) provide a more expressive syntax than PHPUnit's $response->assertOk()
- Test datasets (#[DataProvider]) reduce boilerplate when testing multiple input variations for validation and API endpoint testing
- Exception handling testing requires intercepting Laravel's exception handler to assert specific exceptions are thrown with expected messages
