# Anti-Patterns — Keyset Pagination Design

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Keyset Pagination Design |
| Difficulty | Intermediate |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Using Keyset for Public APIs Without Security Review | High | Medium | Code review: keyset pagination on public endpoint exposing sort columns |
| Relying on Client to Send Correct Keyset Values | High | Medium | Code review: no validation of keyset parameter types |
| Implementing Keyset Without Default Sort | High | Medium | Code review: no ORDER BY defined when keyset params absent |
| Forging Keyset Values Across User Contexts | Critical | Low | Code review: cursor shared across different authorization scopes |
| Using Keyset With Dynamically Generated Sort Columns | High | Low | Code review: dynamic ORDER BY without matching index |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Not Including a Tiebreaker | Single-column keyset on non-unique column | Non-deterministic page boundaries |
| Mixing after and before Parameters | Both send without direction guard | Contradictory WHERE clause |
| Reusing Keysets Across Different Filter Contexts | Keyset from filtered view used in unfiltered query | Incorrect position in different dataset |
| Raw String Interpolation for Keyset Values | Concatenating keyset values into SQL string | SQL injection vulnerability |

---

## Anti-Pattern Details

### AP-KPD-01: Using Keyset for Public APIs Without Security Review

**Description**: Keyset pagination is used on a public-facing API, exposing internal sort column values directly in URL parameters: `?after_id=100&after_created_at=2026-06-01T00:00:00Z`. Clients can see that IDs are sequential, timestamps reveal write patterns, and sort column values may leak business intelligence (e.g., revenue amounts, internal status codes, or priority values).

**Root Cause**: Convenience. The developer reuses the internal API's keyset pagination for the public API without reviewing which information is exposed.

**Impact**:
- Business intelligence leakage: competitors can estimate write volume from timestamp patterns
- Sequential ID exposure: attackers learn how many records exist and creation rate
- Internal status/priority values exposed in sort columns
- Cannot change the sort structure without breaking existing clients

**Detection**:
- API review: keyset parameters with raw column values in public endpoint documentation
- Security review: exposed sort column values contain sensitive or internal data
- Bug reports: "our competitor seems to know our exact post volume and timing"

**Solution**:
- Use opaque cursor pagination (encoded/signed cursors) for public APIs
- If keyset is required, only expose columns that are already in the response body
- Wrap keyset values in opaque encoding rather than passing raw values

**Example**:
```php
// BEFORE: Raw keyset values exposed to public API
// GET /api/posts?after_id=100&after_created_at=2026-06-01T00:00:00Z
// ❌ exposes ID sequence and exact creation timestamps

// AFTER: Opaque cursor for public API
// GET /api/posts?cursor=eyJpZCI6MTAwLCJjcmVhdGVkX2F0IjoiMjAyNi0wNi0wMVQwMDowMDowMFoifQ==

// Internal API (admin panel) can still use keyset:
// GET /api/admin/posts?after_id=100&after_created_at=2026-06-01T00:00:00Z
// ✅ appropriate for internal use with trusted clients
```

---

### AP-KPD-02: Relying on Client to Send Correct Keyset Values

**Description**: The server accepts keyset parameters (`after_id`, `after_created_at`) without validating their types, format, or existence. If the client sends a string where an integer is expected (`after_id=abc`), or a date in the wrong format (`after_created_at=2026/06/01`), the database comparison produces incorrect results or errors. The server trusts the client to generate valid keyset values.

**Root Cause**: Assuming the client will follow documented format. The developer validates request body data but ignores keyset parameter validation.

**Impact**:
- Type mismatches cause incorrect WHERE clause comparisons
- String vs integer comparisons may produce PHP warnings or DB errors
- Invalid dates cause SQL errors or 500 responses
- No guidance to the client about correct format

**Detection**:
- Code review: keyset parameters accepted without validation rules
- Code review: keyset values passed directly to query builder without type casting
- Bug reports: intermittent pagination errors with certain clients

**Solution**:
- Validate keyset parameter types in the FormRequest or controller
- Cast values to expected types before using in queries
- Return 400 with clear error messages for invalid keyset values

**Example**:
```php
// BEFORE: No validation
$afterId = $request->input('after_id'); // ❌ could be "abc" or null
$posts = Post::where('id', '>', $afterId)->orderBy('id')->take(15)->get();

// AFTER: With validation
public function rules(): array
{
    return [
        'after_id' => ['integer', 'min:0'],
        'after_created_at' => ['date', 'date_format:Y-m-d\TH:i:s\Z'],
    ];
}

// Or cast before use:
$afterId = (int) $request->input('after_id', 0); // ✅ cast to int
$posts = Post::where('id', '>', $afterId)->orderBy('id')->take(15)->get();
```

---

### AP-KPD-03: Implementing Keyset Without Default Sort

**Description**: The keyset pagination implementation accepts `after_id` and `after_created_at` parameters but has no fallback when these parameters are absent. The first page request with no parameters causes a query with no ORDER BY or WHERE clause, returning records in database insertion order (which may be unpredictable). The keyset pagination has no defined starting point.

**Root Cause**: Assuming the client always sends keyset parameters. The developer only implemented the paginated path and forgot the initial request.

**Impact**:
- First page returns records in undefined order (database-dependent)
- No consistency between first page and subsequent pages
- Client cannot determine what the first page should look like
- Pagination navigation breaks if the first page doesn't match the keyset ordering

**Detection**:
- Code review: no `if (!request->has('after_id'))` default sort logic
- Code review: query builder has no default ORDER BY
- Bug reports: "the first page looks different from the rest"

**Solution**:
- Always define a default sort order for the initial (no-cursor) request
- Apply the same ORDER BY to both the initial request and paginated requests
- Ensure the initial page's last record could be a valid keyset value

**Example**:
```php
// BEFORE: No default sort
public function index(Request $request): JsonResponse
{
    $query = Post::query();

    if ($request->has('after_id')) {
        $query->where('id', '>', $request->input('after_id')); // ❌ no ORDER BY
    }

    $posts = $query->take(15)->get(); // ❌ no default sort — undefined order
}

// AFTER: Default sort always applied
public function index(Request $request): JsonResponse
{
    $query = Post::query();

    if ($request->has('after_id')) {
        $query->where('id', '>', $request->input('after_id'));
    }

    $posts = $query->orderBy('id', 'asc')->take(15)->get(); // ✅ consistent default sort
}
```

---

### AP-KPD-04: Forging Keyset Values Across User Contexts

**Description**: A keyset value obtained from one user's paginated results is used by another user or in a different authorization context. Since keyset values are transparent (raw column values), a user can note the `after_id` from their feed, switch accounts, and use the same `after_id` to paginate into the second user's data that should be scoped by authorization filters.

**Root Cause**: Assuming keyset values are scoped to the current request context. The developer doesn't consider that keysets from one session may be used in another.

**Impact**:
- Authorization bypass: user A can paginate into user B's filtered results
- Data leakage across scopes: one user's pagination cursor accesses another user's data
- Inconsistent results: keyset pointing to a record that doesn't exist in the current scope

**Detection**:
- Code review: keyset pagination applied after authorization scoping, but keyset values from other contexts work
- Security review: `after_id` from one user works for another user's query
- Bug reports: user seeing records they shouldn't have access to

**Solution**:
- Always apply authorization scoping (where clauses) before adding the keyset WHERE
- The keyset WHERE is additive: it narrows within the already-scoped query
- Do not accept keyset values that reference records outside the user's scope

**Example**:
```php
// BEFORE: Keyset without context scoping
$afterId = $request->input('after_id', 0);
$posts = Post::where('id', '>', $afterId) // ❌ no user scope — cross-user leakage
    ->orderBy('id')
    ->take(15)
    ->get();

// AFTER: Scope first, then keyset
$posts = Post::where('user_id', $request->user()->id) // ✅ scope first
    ->when($request->has('after_id'), fn($q) => $q->where('id', '>', $request->input('after_id')))
    ->orderBy('id')
    ->take(15)
    ->get();
```

---

### AP-KPD-05: Using Keyset With Dynamically Generated Sort Columns

**Description**: The keyset parameters accept arbitrary sort columns from the client: `?sort=title&after_title=Hello`. The server has no corresponding composite index for most sort combinations. Since keyset pagination requires a composite index matching the ORDER BY columns exactly, dynamic sorts mean most queries do full table scans. The keyset pagination's performance guarantee is lost.

**Root Cause**: Flexibility over performance. The developer wants to support any column sorting.

**Impact**:
- Full table scans for most sort combinations
- Index cannot be created for all possible sort combinations
- Keyset pagination performs worse than offset for unindexed sorts
- Query times degrade dramatically with dataset growth

**Detection**:
- Code review: `$request->input('sort')` determines keyset columns
- Code review: no allowlist for sortable columns
- Database review: missing indexes for commonly used sort combinations

**Solution**:
- Support only a fixed set of predetermined sort columns
- Create composite indexes for each supported sort combination
- Validate sort columns against a strict allowlist

**Example**:
```php
// BEFORE: Dynamic sort columns
$sortColumn = $request->input('sort', 'id'); // ❌ any column
$afterValue = $request->input('after_' . $sortColumn);
$posts = Post::where($sortColumn, '>', $afterValue)
    ->orderBy($sortColumn)
    ->take(15)
    ->get(); // ❌ no index match for most columns

// AFTER: Allowlisted sort columns
const ALLOWED_SORTS = ['id', 'created_at', 'title'];

public function index(Request $request): JsonResponse
{
    $sortColumn = in_array($request->input('sort'), ALLOWED_SORTS)
        ? $request->input('sort')
        : 'id';

    $query = Post::query();
    if ($request->has("after_{$sortColumn}")) {
        $query->where($sortColumn, '>', $request->input("after_{$sortColumn}"));
    }

    $posts = $query->orderBy($sortColumn)->take(15)->get(); // ✅ indexable sorts only
}
```
