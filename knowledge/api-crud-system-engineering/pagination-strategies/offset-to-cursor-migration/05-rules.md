# Offset-to-Cursor Migration — Phase 5 Rules

## Support Both Pagination Methods During a 6-12 Month Transition
---
## Category
Reliability | Maintainability
---
## Rule
Implement a dual-controller pattern supporting both `cursor` and `page` parameters during the migration period; never remove offset support without a documented deprecation window.
---
## Reason
Clients integrate offset pagination into their codebases. Removing it without transition breaks client applications. A 6-12 month coexistence period gives clients time to migrate at their own pace.
---
## Bad Example
```php
// Big bang switch — all clients break immediately
public function index(Request $request) {
    return Post::orderBy('created_at', 'desc')->cursorPaginate(15);
    // Old clients using ?page=2 now fail
}
```
---
## Good Example
```php
// Dual-controller — both methods supported
public function index(Request $request) {
    if ($request->has('cursor')) {
        return $this->cursorResponse($request);
    }
    return $this->offsetResponse($request);
}

private function cursorResponse(Request $request) {
    $posts = Post::orderBy('created_at', 'desc')
        ->orderBy('id', 'desc')
        ->cursorPaginate(15);
    return response()->json([...]);
}

private function offsetResponse(Request $request) {
    $posts = Post::paginate(15);
    return response()->json([...])
        ->header('Deprecation', 'true')
        ->header('Sunset', 'Sat, 01 Jun 2027 00:00:00 GMT');
}
```
---
## Exceptions
Internal APIs where all clients are controlled and can be updated simultaneously.
---
## Consequences Of Violation
Broken client applications; production incidents; emergency rollbacks; lost client trust.
---

## Use Deprecation and Sunset HTTP Headers
---
## Category
Maintainability
---
## Rule
Add `Deprecation: true` and `Sunset: <RFC 1123 date>` headers to all offset pagination responses during the migration period.
---
## Reason
Standardized HTTP headers (RFC 8594) communicate the deprecation timeline programmatically. Clients can monitor these headers and plan their migration without relying on blog posts or emails.
---
## Bad Example
```php
// Silent deprecation — clients discover breakage at runtime
return Post::paginate(15); // No deprecation notification
```
---
## Good Example
```php
// Standard deprecation headers
return response()->json($data)
    ->header('Deprecation', 'true')
    ->header('Sunset', 'Sat, 01 Jun 2027 00:00:00 GMT');
```
---
## Exceptions
When the `Deprecation` header interferes with CDN caching or proxy behavior (test first).
---
## Consequences Of Violation
Clients unaware of deprecation; sudden breakage on removal date; support incidents.
---

## Verify Cursor Indexes Exist Before Enabling Cursor Pagination
---
## Category
Performance | Reliability
---
## Rule
Verify that required composite indexes exist and are verified with EXPLAIN ANALYZE before enabling cursor pagination for any traffic percentage.
---
## Reason
Cursor pagination without matching composite indexes performs full table scans, resulting in worse performance than the offset pagination it's replacing. This causes a production degradation instead of improvement.
---
## Bad Example
```php
// Enabling cursor pagination without verifying indexes
// Production immediately degrades — full table scans
```
---
## Good Example
```php
// Index verification before enabling
Schema::table('posts', function (Blueprint $table) {
    $table->index(['created_at', 'id']);
});

// Verify: EXPLAIN ANALYZE SELECT * FROM posts
//   ORDER BY created_at DESC, id DESC LIMIT 16;
// Confirm: "Index Range Scan"

// Now safe to enable cursor pagination
```
---
## Exceptions
No common exceptions — always verify indexes before enabling cursor pagination.
---
## Consequences Of Violation
Production performance degradation; worse than original offset pagination; emergency rollback.
---

## Feature-Flag Rollout Starting at Low Traffic Percentage
---
## Category
Reliability
---
## Rule
Enable cursor pagination gradually using feature flags, starting at 10% of traffic and increasing as confidence grows.
---
## Reason
Gradual rollout catches edge cases (cursor format issues, edge-case data, client incompatibilities) before affecting all users. Starting at low percentage limits blast radius of any issues.
---
## Bad Example
```php
// All-at-once rollout — any issue affects all users
public function index(Request $request) {
    return Post::cursorPaginate(15); // Full rollout immediately
}
```
---
## Good Example
```php
// Gradual rollout with feature flag
public function index(Request $request) {
    $userId = auth()->id();
    $rolloutPercent = config('migration.cursor_rollout_percent', 0);
    $isEnabled = crc32((string) $userId) % 100 < $rolloutPercent;

    if ($isEnabled && $request->has('cursor')) {
        return $this->cursorResponse($request);
    }
    return $this->offsetResponse($request);
}
```
---
## Exceptions
APIs with no active clients where full switch is safe.
---
## Consequences Of Violation
Widespread production issues; difficult to isolate cursor-specific bugs; rollback impacts all users.
---

## Normalize Response Structures Across Both Methods
---
## Category
Maintainability | Design
---
## Rule
Normalize response structures between offset and cursor pagination as much as possible to minimize client changes during migration.
---
## Reason
Clients adapting their code to cursor pagination should only need to change how they compute the next request parameters, not how they parse the entire response. Consistent structure reduces migration effort and bug surface.
---
## Bad Example
```php
// Completely different response structures
// Offset: { "data": [...], "meta": { "total": 100, "last_page": 7, "current_page": 2 }, "links": { ... } }
// Cursor: { "data": [...], "next_cursor": "abc", "prev_cursor": "def" }
// Client must rewrite all parsing logic
```
---
## Good Example
```php
// Normalized meta structure
// Offset: { "data": [...], "meta": { "total": null, "has_more": true, "per_page": 15 }, "links": { "next": "...", "prev": "..." } }
// Cursor: { "data": [...], "meta": { "total": null, "has_more": true, "per_page": 15 }, "links": { "next": "...", "prev": "..." } }
// Client only changes pagination parameter computation, not response parsing
```
---
## Exceptions
When normalizing would introduce breaking changes for existing offset clients.
---
## Consequences Of Violation
Higher client migration effort; more bugs during transition; slower adoption of new pagination.
---

## Monitor Page vs Cursor Request Ratio
---
## Category
Maintainability
---
## Rule
Monitor the ratio of `page` vs `cursor` parameter usage to track migration progress and determine when to sunset offset support.
---
## Reason
The sunset decision should be data-driven. Monitor until cursor usage exceeds 95% for 3+ months before removing offset support, ensuring no active clients are left behind.
---
## Bad Example
```php
// No monitoring — guessing when to sunset
// Remove offset support based on feelings, not data
```
---
## Good Example
```php
// Log which pagination method each request uses
Log::info('Pagination method used', [
    'method' => $request->has('cursor') ? 'cursor' : 'offset',
    'endpoint' => $request->path(),
]);

// Dashboard query:
// SELECT COUNT(*) FROM logs WHERE method = 'cursor' / SELECT COUNT(*) FROM logs WHERE method = 'offset'
// Sunset when cursor > 95% for 3+ consecutive months
```
---
## Exceptions
Internal APIs where all clients are known and migration is verified manually.
---
## Consequences Of Violation
Premature sunset breaks remaining offset clients; missed sunset date extends migration indefinitely.
---

## Keep Offset Code Available for Rollback After Migration
---
## Category
Reliability
---
## Rule
Keep offset pagination code available but disabled behind a configuration toggle after migration, enabling quick rollback if cursor pagination introduces issues.
---
## Reason
Cursor pagination issues (undetected edge cases, index problems, client incompatibilities) can surface after full migration. A toggle-based rollback provides instant mitigation without a deployment.
---
## Bad Example
```php
// Offset code deleted after migration — cannot rollback
// If cursor has issues, full re-deployment of offset code required
```
---
## Good Example
```php
// Toggle-based fallback — instant rollback
$strategy = config('pagination.posts.strategy', 'cursor');

if ($strategy === 'offset') {
    return $this->offsetResponse($request);
}
return $this->cursorResponse($request);
```
---
## Exceptions
When offset pagination creates a security vulnerability or has been completely superseded by a new API version.
---
## Consequences Of Violation
Emergency redeployment during incidents; extended downtime during rollback.
---

## Contact Known API Consumers Directly Before Sunsetting
---
## Category
Maintainability | Reliability
---
## Rule
Directly notify known API consumers (email, changelog, dedicated migration guide) before the sunset date, not just through HTTP headers.
---
## Reason
HTTP deprecation headers are passive — many clients may not monitor them. Direct communication ensures active clients are aware of the timeline and can plan their migration.
---
## Bad Example
```php
// Passive deprecation only — relying on headers clients may not read
return $response->header('Deprecation', 'true');
```
---
## Good Example
```php
// Active communication plan
// 1. Add Deprecation headers (passive)
// 2. Email all API key holders (active)
// 3. Publish changelog entry
// 4. Provide migration guide at GET /api/migration-guide
// 5. Schedule reminder emails at T-6 months, T-3 months, T-1 month
```
---
## Exceptions
Internal APIs where all consumers are within the same organization and communicate through other channels.
---
## Consequences Of Violation
Missed deprecation notices; production incidents on sunset date; client dissatisfaction.
---

## Provide a Sandbox Endpoint for Testing
---
## Category
Testing | Maintainability
---
## Rule
Provide a dedicated sandbox or staging endpoint where clients can test their cursor pagination implementation before the migration deadline.
---
## Reason
Clients need a safe environment to validate their cursor pagination code without risking production data or hitting production rate limits.
---
## Bad Example
```php
// No sandbox — clients must test in production
// GET /api/v2/posts — same endpoint, same data
```
---
## Good Example
```php
// Dedicated sandbox endpoint
// GET /api/sandbox/posts?cursor=abc
// Uses production schema but isolated rate limits and logging
Route::prefix('sandbox')->middleware('api', 'throttle:sandbox')->group(function () {
    Route::get('/posts', [SandboxPostController::class, 'index']);
});
```
---
## Exceptions
No common exceptions — always provide sandbox access for breaking changes.
---
## Consequences Of Violation
Clients testing in production; accidental data mutations; support incidents.
---

## Never Remove Offset Support Without a Sunset Header Grace Period
---
## Category
Reliability | Maintainability
---
## Rule
Maintain offset support for at least one full deprecation cycle (6-12 months) with documented sunset date; never remove it without prior announcement.
---
## Reason
API clients have their own release cycles, testing periods, and support timelines. Removing offset without adequate notice causes production issues for clients who cannot immediately update.
---
## Bad Example
```php
// Removing offset support without notice
public function index(Request $request) {
    if ($request->has('page')) {
        abort(410, 'Offset pagination is no longer supported.'); // Gone
    }
}
```
---
## Good Example
```php
// Documented deprecation with grace period
// June 2026: Add cursor support, Deprecation header on offset
// Dec 2026: Reminder email, increase Deprecation header prominence
// June 2027: Sunset — remove offset, return 410 with migration guide link
```
---
## Exceptions
Security vulnerabilities in offset pagination that require immediate removal (rare).
---
## Consequences Of Violation
Client production failures; support escalation; reputational damage; lost API consumers.
