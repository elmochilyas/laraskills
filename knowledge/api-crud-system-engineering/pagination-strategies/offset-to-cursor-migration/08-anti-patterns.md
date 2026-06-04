# Anti-Patterns — Offset-to-Cursor Migration

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Offset-to-Cursor Migration |
| Difficulty | Advanced |
| Category | Migration Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Big Bang Switch Without Warning | Critical | Low | Code review: offset removed and cursor added in single deployment |
| Silent Deprecation | High | Medium | Code review: offset parameters removed without deprecation headers |
| Inconsistent Response Formats | High | Medium | Code review: some endpoints use cursor format, others offset |
| Not Providing Migration Guides | High | Medium | Code review: no documentation for clients on how to adapt |
| No Rollback Plan | Critical | Medium | Code review: offset code deleted, cannot roll back |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Removing Offset Too Quickly | Minimal deprecation window (<6 months) | Clients that aren't updated break in production |
| Not Testing Cursor at Scale | Tests with small datasets pass | Missing indexes cause production degradation |
| Assuming All Clients Can Switch | Ignoring legacy/partner integrations | Unsupported clients left without working pagination |

---

## Anti-Pattern Details

### AP-OCM-01: Big Bang Switch Without Warning

**Description**: The API team removes offset pagination and deploys cursor pagination in a single release. No coexistence period, no deprecation notice, no sunset timeline. Clients that were using `?page=3` suddenly start receiving errors or empty responses because the parameter is no longer recognized. The next morning, support tickets flood in from every integration partner.

**Root Cause**: Impatience. The team wants to move forward with the new pagination strategy as quickly as possible and doesn't consider the client impact.

**Impact**:
- All clients break simultaneously — maximum blast radius
- Emergency rollback required, delaying the migration by weeks
- Lost trust: clients cannot rely on API stability
- Partner integrations (which take weeks to update) are blocked

**Detection**:
- Code review: offset pagination code deleted in the same PR that adds cursor pagination
- Code review: no `Deprecation` or `Sunset` headers added before the switch
- API changelog: no deprecation notice published before the breaking change

**Solution**:
- Support both pagination methods during a minimum 6-month transition period
- Add `Deprecation: true` and `Sunset` headers to offset responses
- Use feature flags to gradually enable cursor for a percentage of clients
- Announce the deprecation timeline in changelogs and direct partner communication

**Example**:
```php
// Dual-controller pattern:
public function index(Request $request): JsonResponse
{
    if ($request->has('cursor')) {
        return $this->cursorResponse($request);
    }

    // Legacy offset path with deprecation headers
    $response = $this->offsetResponse($request);
    return $response
        ->header('Deprecation', 'true')
        ->header('Sunset', 'Sat, 01 Jun 2027 00:00:00 GMT')
        ->header('Link', '</api/v2/posts>; rel="successor-version"');
}
```

---

### AP-OCM-02: Silent Deprecation

**Description**: The API removes `page` and `per_page` parameters without adding deprecation headers. Clients receive no warning that the parameters are going away — they just stop working one day. The deprecation is "silent" because the team updates the documentation but doesn't communicate the timeline through HTTP headers or changelogs.

**Root Cause**: Assuming clients read the documentation. The team publishes a changelog entry but doesn't use HTTP-level communication mechanisms.

**Impact**:
- Clients unaware of the change break when offset is removed
- No warning period: clients cannot plan or schedule their migration
- Runtime failures for clients that missed the changelog
- Support load spikes when the change takes effect

**Detection**:
- Code review: offset parameters removed without adding `Deprecation` headers
- API response: no `Deprecation`, `Sunset`, or `Link` headers indicating the migration
- Bug reports: "our integration broke without warning"

**Solution**:
- Add `Deprecation: true` and `Sunset` headers to all offset pagination responses during the deprecation period
- Include a `Link` header pointing to the migration documentation
- Announce the deprecation in the API changelog, developer newsletter, and status page

**Example**:
```php
// BEFORE: Silent deprecation
// $offset removed, only cursor works.
// No headers, no warning — clients discover at runtime.

// AFTER: Explicit deprecation headers
return response()->json($data)
    ->header('Deprecation', 'true')
    ->header('Sunset', 'Sat, 01 Jun 2027 00:00:00 GMT')
    ->header('Link', '<https://docs.example.com/pagination-migration>; rel="deprecation"');
```

---

### AP-OCM-03: Inconsistent Response Formats

**Description**: During the migration, some endpoints return the cursor pagination response format (with `next_cursor`, `has_more`) while others still use the offset format (with `current_page`, `total`, `last_page`). Clients must implement and maintain two different response parsers depending on the endpoint. The API contract is fragmented and confusing.

**Root Cause**: Piecemeal migration. Different teams migrate different endpoints at different times without standardizing the response structure.

**Impact**:
- Client code must branch on endpoint name to parse pagination metadata
- Shared client libraries cannot assume a consistent response shape
- Testing must cover both response formats
- Migration takes longer because every endpoint integration must be updated

**Detection**:
- API review: some endpoints return `next_cursor`/`has_more`, others return `total`/`last_page`
- Code review: different response formatters for different modules
- Client feedback: "paginating posts is different from paginating comments"

**Solution**:
- Standardize the response format before starting the migration
- Include both `next_cursor` and `total` during the coexistence period to reduce client changes
- Document the eventual format and the intermediate state

**Example**:
```php
// BEFORE: Inconsistent formats
// Posts endpoint (already migrated): { data: [], meta: { next_cursor, has_more } }
// Users endpoint (not migrated yet): { data: [], meta: { current_page, total, last_page } }

// AFTER: Unified response during migration
// Both endpoints return:
{
    "data": [],
    "meta": {
        "next_cursor": "abc123",   // new field
        "has_more": true,          // new field
        "current_page": 1,         // legacy field (will be removed)
        "total": 57,               // legacy field (will be removed)
        "per_page": 15
    }
}
```

---

### AP-OCM-04: Not Providing Migration Guides

**Description**: The API switches to cursor pagination but provides no migration guide, code examples, or parameter mapping for existing clients. Clients must reverse-engineer the new pagination mechanism from the API response, guess the correct parameters, and update their code without any reference. This leads to incorrect implementations, support tickets, and frustration.

**Root Cause**: Assuming cursor pagination is self-explanatory. The team knows how cursor pagination works but doesn't communicate it to clients.

**Impact**:
- Clients implement cursor pagination incorrectly (sending page instead of cursor, misreading has_more)
- Support team handles high volume of "how do I paginate" questions
- Partner integrations are delayed while clients figure out the new mechanism
- Incorrect client implementations cause data processing errors

**Detection**:
- API documentation: no migration section or guide in the changelog
- Support tickets: "how do I use the new pagination?"
- Code review: no `/api/pagination-migration-guide` endpoint

**Solution**:
- Create a migration guide with before/after code examples
- Include a dedicated migration documentation endpoint (`GET /api/pagination-migration-guide`)
- Provide code samples in multiple client languages
- Host a migration webinar or send migration instructions to known API consumers

**Example**:
```php
// Migration documentation endpoint:
public function migrationGuide(): JsonResponse
{
    return response()->json([
        'title' => 'Offset to Cursor Pagination Migration',
        'old_parameters' => [
            'page' => 'Page number (1-indexed)',
            'per_page' => 'Items per page (default 15, max 100)',
        ],
        'new_parameters' => [
            'cursor' => 'Opaque cursor string from previous response',
            'per_page' => 'Same as before (default 15, max 100)',
        ],
        'old_response' => [
            'meta.current_page' => 'Current page number',
            'meta.total' => 'Total records (will be removed)',
            'meta.last_page' => 'Last page number (will be removed)',
        ],
        'new_response' => [
            'meta.next_cursor' => 'Cursor for next page (null if no more)',
            'meta.has_more' => 'Boolean, true if more pages available',
        ],
        'code_example_php' => '
do {
    $response = $client->get("/api/posts?cursor=" . $cursor);
    $data = json_decode($response->getBody());
    $cursor = $data->meta->next_cursor;
} while ($cursor);
        ',
        'sunset_date' => '2027-06-01T00:00:00Z',
    ]);
}
```

---

### AP-OCM-05: No Rollback Plan

**Description**: The migration removes the offset pagination code entirely during the cursor implementation. If the cursor pagination has issues in production — performance problems, client incompatibility, or bugs — rolling back requires a full code revert and redeployment. The team cannot quickly switch back to offset to mitigate an incident.

**Root Cause**: Over-confidence. The team assumes cursor pagination will work perfectly in production and doesn't keep the old code as a safety net.

**Impact**:
- Rollback requires a full deployment cycle (30+ minutes)
- Production incidents last longer because offset code must be restored
- Pressure to fix cursor bugs under fire instead of reverting to known-good offset
- Clients experience extended downtime during cursor issues

**Detection**:
- Version control: offset pagination code deleted in the migration commit
- Code review: no feature flag or configuration toggle for pagination strategy
- Incident response: "we can't just flip back to offset"

**Solution**:
- Keep the offset pagination code behind a configuration toggle
- Implement a feature flag that controls the active pagination strategy per endpoint
- Provide a one-line config change to revert to offset if cursor has issues

**Example**:
```php
// Configuration-based strategy switching:
public function index(Request $request): JsonResponse
{
    return match (config('pagination.posts.strategy')) {
        'cursor' => $this->cursorResponse($request),
        'offset' => $this->offsetResponse($request), // ✅ kept for rollback
        'hybrid' => $request->has('cursor')
            ? $this->cursorResponse($request)
            : $this->offsetResponse($request),
        default => $this->cursorResponse($request),
    };
}

// Config file:
return [
    'posts' => [
        'strategy' => env('POSTS_PAGINATION_STRATEGY', 'hybrid'),
    ],
];

// Rollback: change POSTS_PAGINATION_STRATEGY=offset in .env
// No code deployment needed
```
