# Anti-Patterns — Pagination Parameter Validation

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | Pagination Parameter Validation |
| Difficulty | Intermediate |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| No Pagination Validation at All | Critical | Medium | Code review: index endpoint without pagination rules |
| Hardcoded per_page in Controller | Medium | High | Code review: `paginate(15)` ignoring request parameter |
| Same max for All User Tiers | Medium | Medium | Code review: same per_page limit for admin and regular users |
| Cursor Without Format Validation | High | Low | Code review: cursor accepted as raw string without validation |
| Allowing per_page=0 | High | Low | Code review: no min:1 on per_page rule |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Same per_page for All Resources | Lightweight and heavy endpoints have same limit | Heavy endpoints (audit logs) return huge responses |
| No Default for per_page | Required parameter causes client errors | Client must always specify per_page |
| No sort Allowlist Validation | Sort parameter passed directly to query builder | SQL injection via column orderBy |

---

## Anti-Pattern Details

### AP-PPV-01: No Pagination Validation at All

**Description**: Index endpoints accept `page`, `per_page`, `cursor`, and `sort` parameters without any validation rules. A client can submit `page=-1`, `per_page=100000`, or `sort=password;DROP TABLE users` — and the parameters are passed directly to the query builder. This is a critical resource exhaustion and SQL injection vulnerability.

**Root Cause**: Assuming pagination parameters are "safe" because they're metadata, not content. The developer validates the request body but ignores query parameters.

**Impact**:
- SQL injection via `sort` parameter passed directly to `orderBy()`
- Resource exhaustion via `per_page=100000` returning millions of rows
- Database errors from `LIMIT -1` or `OFFSET` with negative values
- Memory exhaustion from loading excessive result sets

**Detection**:
- Code review: index FormRequest has rules for body fields but none for `page`, `per_page`, or `sort`
- Code review: `$request->input('sort')` passed to `orderBy()` without validation
- Security testing: sending `sort=password;DROP TABLE users` and observing the query

**Solution**:
- Always validate pagination parameters on every index endpoint
- Use a reusable `HasPaginationValidation` trait for consistency
- Validate `sort` against an allowlist — never pass user input directly to the query builder

**Example**:
```php
// BEFORE: No pagination validation
public function rules(): array
{
    return [
        'status' => ['sometimes', Rule::in(['draft', 'published'])],
    ];
    // ❌ no rules for page, per_page, sort
}

// AFTER: With pagination validation
public function rules(): array
{
    return array_merge($this->paginationRules(), [
        'status' => ['sometimes', Rule::in(['draft', 'published'])],
    ]);
}

protected function paginationRules(): array
{
    return [
        'page' => ['integer', 'min:1'],
        'per_page' => ['integer', 'min:1', 'max:100'],
        'sort' => ['sometimes', 'string', Rule::in(['title', 'created_at', '-title', '-created_at'])],
    ];
}
```

---

### AP-PPV-02: Hardcoded per_page in Controller

**Description**: The controller calls `Model::paginate(15)` or `Model::simplePaginate(15)` with a hardcoded value, completely ignoring the `per_page` query parameter. If the client specifies `?per_page=50`, the server ignores it and always returns 15 items. The client cannot control page size, leading to excessive requests for large collections.

**Root Cause**: Simplistic implementation. The developer hardcodes pagination because "nobody uses the per_page parameter."

**Impact**:
- Clients must make more requests to paginate through large collections
- Mobile apps with small screens cannot request fewer items per page
- Admin panels cannot request more items per page
- API contract differs from behavior — documented `per_page` parameter is ignored

**Detection**:
- Code review: `Model::paginate(15)` or `Model::simplePaginate(15)` with a numeric literal
- Code review: `$perPage = 15;` without reading `$request->input('per_page')`
- API testing: sending `?per_page=100` and receiving 15 items

**Solution**:
- Read `per_page` from validated request data, bounded by min/max
- Apply a sensible default when the parameter is omitted
- Use `prepareForValidation()` to inject default values

**Example**:
```php
// BEFORE: Hardcoded per_page
public function index(Request $request): JsonResponse
{
    $posts = Post::paginate(15); // ❌ ignores request parameter
    return PostResource::collection($posts);
}

// AFTER: Using validated per_page
public function index(IndexPostsRequest $request): JsonResponse
{
    $posts = Post::paginate($request->validated('per_page', 15)); // ✅ respects request
    return PostResource::collection($posts);
}

// In FormRequest:
protected function prepareForValidation(): void
{
    $this->merge([
        'per_page' => min(max(1, (int) $this->input('per_page', 15)), 100),
    ]);
}
```

---

### AP-PPV-03: Same max for All User Tiers

**Description**: The same `per_page` maximum (e.g., 100) applies to regular users, admin users, and internal services. Regular users requesting 100 items per page may be excessive for their use case (slow mobile connection), while admins needing 500 items for a bulk export are forced to paginate through many requests with no performance benefit.

**Root Cause**: One-size-fits-all approach. The developer applies a single limit across all user tiers without considering different usage patterns.

**Impact**:
- Regular users waste bandwidth on large pages they can't display
- Admin users make 5x more requests than necessary for bulk operations
- Mobile apps cannot reduce page size to match screen constraints
- Internal services bypass limits by requesting smaller pages inefficiently

**Detection**:
- Code review: `maxPerPage()` returns the same value regardless of user role
- Code review: no role-based or tier-based conditional in pagination validation
- Monitoring: all users requesting the same `per_page` value

**Solution**:
- Implement role-based or tier-based `per_page` limits
- Allow admin/internal users higher limits than regular users
- Cap mobile app clients at a lower limit than desktop clients

**Example**:
```php
// BEFORE: Same limit for all
protected function maxPerPage(): int
{
    return 100; // ❌ same for everyone
}

// AFTER: Role-based limits
protected function maxPerPage(): int
{
    if ($this->user()?->isAdmin()) {
        return 500; // ✅ admins can request larger batches
    }
    if ($this->user()?->isInternalService()) {
        return 1000; // ✅ internal services need larger pages
    }
    return 50; // ✅ regular users limited to smaller pages
}

// In validation:
'per_page' => ['integer', 'min:1', 'max:' . $this->maxPerPage()],
```

---

### AP-PPV-04: Cursor Without Format Validation

**Description**: Cursor-based pagination accepts the `cursor` parameter as a raw string without any format validation. An attacker can inject malicious payloads into the cursor string — base64-encoded SQL, serialized objects, or path traversal sequences — which may be decoded and processed unsafely by the backend.

**Root Cause**: Trusting that cursors are opaque and unguessable. The developer decodes the cursor without validating its structure first.

**Impact**:
- Serialization injection if cursor is unserialized without validation
- SQL injection if cursor contains encoded query fragments
- Path traversal if cursor contains encoded file paths
- Invalid cursors produce 500 errors instead of 422

**Detection**:
- Code review: cursor decoded and used without format validation
- Code review: cursor passed to `unserialize()`, `json_decode()`, or `decrypt()` without checksum verification
- Error logs: exceptions from cursor decoding with unusual input patterns

**Solution**:
- Validate cursor format — length, character set, expected structure
- Use signed/encrypted cursors that cannot be tampered with
- Throw a clear validation error for malformed cursors

**Example**:
```php
// BEFORE: No cursor validation
public function rules(): array
{
    return [
        'cursor' => ['sometimes', 'string'], // ❌ accepts anything
    ];
}

// AFTER: Cursor format validation
public function rules(): array
{
    return [
        'cursor' => ['sometimes', 'string', new ValidCursorFormat()],
    ];
}

// Custom rule:
class ValidCursorFormat implements ValidationRule
{
    public function __invoke(string $attribute, mixed $value, Closure $fail): void
    {
        // Validate that cursor is a base64-encoded, encrypted JSON structure
        if (!preg_match('/^[A-Za-z0-9+\/=]{20,100}$/', $value)) {
            $fail('Invalid cursor format.');
            return;
        }
        // Optionally verify the cursor decodes correctly
        try {
            $decoded = decrypt(base64_decode($value));
            if (!isset($decoded['id'], $decoded['timestamp'])) {
                $fail('Invalid cursor data.');
            }
        } catch (\Throwable $e) {
            $fail('Invalid or expired cursor.');
        }
    }
}
```

---

### AP-PPV-05: Allowing per_page=0

**Description**: The `per_page` validation rule allows values as low as 0 or negative numbers. A `per_page=0` value causes `LIMIT 0` in the database query, returning zero results — but the database may also error on `LIMIT 0` depending on the driver. Negative values can cause SQL errors or unexpected behavior. Even if the database handles it, the response is useless to the client.

**Root Cause**: Forgetting the `min:1` constraint. The developer adds `integer` validation but doesn't bound the minimum.

**Impact**:
- Database error on LIMIT 0 or negative LIMIT in some SQL modes
- Empty responses that confuse clients (zero items returned)
- Potential for API abuse: requesting `per_page=0` to avoid returning data while still counting
- Inconsistent behavior across different database drivers

**Detection**:
- Code review: `per_page` rule has `['integer', 'max:100']` but no `min:1`
- API testing: sending `?per_page=0` and observing empty response or error
- Bug reports: "our pagination endpoint returns no results when per_page=0"

**Solution**:
- Always enforce `min:1` on `per_page` validation
- Inject default through `prepareForValidation()` for missing values
- Test the boundary condition `per_page=0` explicitly

**Example**:
```php
// BEFORE: No min constraint
'per_page' => ['integer', 'max:100'], // ❌ per_page=0 or -1 passes

// AFTER: Min constraint
'per_page' => ['integer', 'min:1', 'max:100'], // ✅ per_page=0 fails validation

// With default injection:
protected function prepareForValidation(): void
{
    $this->merge([
        'per_page' => min(max(1, (int) $this->input('per_page', 15)), 100),
    ]);
}
```
