# Rules: ReBAC (Relationship-Based Access Control)

## Start With RBAC, Add ReBAC Only Where Relationships Are Needed
---
## Category
Architecture
---
## Rule
Use RBAC for role-based authorization and add ReBAC only for resources where per-resource relationships (owner, editor, viewer) are required.
---
## Reason
RBAC is simpler and covers most authorization needs. ReBAC adds relationship tuple tables, graph traversal logic, and consistency requirements. Premature adoption significantly increases complexity without benefit when simple role checks suffice.
---
## Bad Example
```php
// ReBAC for all resources — over-engineering
$access = $rebacService->check($user, 'view', $post);
```
---
## Good Example
```php
// RBAC for simple checks
if ($user->can('view-posts')) { ... }
// ReBAC only for shared resources
if ($rebacService->check($user, 'view', $sharedDocument)) { ... }
```
---
## Exceptions
Applications with inherently relationship-based authorization (e.g., Google Drive-style sharing).
---
## Consequences Of Violation
Unnecessary complexity for simple authorization needs.
---

## Store Relationship Tuples in a Dedicated Table
---
## Category
Architecture
---
## Rule
Store relationship tuples in a dedicated `resource_relationships` table with columns for `resource_type`, `resource_id`, `relation`, `user_id`. Never embed relationships in resource table columns.
---
## Reason
A dedicated table supports efficient querying, indexing, and cascading deletes. Embedding relationships in resource columns (e.g., `document.owner_id`, `document.editor_ids`) does not scale to complex sharing scenarios and makes it impossible to query "what resources does user X have access to?"
---
## Bad Example
```php
// JSON column in resource table — not queryable
Schema::table('documents', function ($table) {
    $table->json('shared_with')->nullable();
});
```
---
## Good Example
```php
Schema::create('resource_relationships', function ($table) {
    $table->id();
    $table->string('resource_type'); // 'document', 'project'
    $table->unsignedBigInteger('resource_id');
    $table->string('relation'); // 'owner', 'editor', 'viewer'
    $table->foreignId('user_id')->constrained();
    $table->unique(['resource_type', 'resource_id', 'relation', 'user_id']);
});
```
---
## Exceptions
Simple single-owner resources with no sharing (ReBAC not needed).
---
## Consequences Of Violation
Poor query performance, cannot find all resources accessible by user.
---

## Use Strong Consistency for Relationship Changes
---
## Category
Reliability
---
## Rule
Execute relationship tuple changes (grant, revoke, transfer) within database transactions. Ensure reads of relationship state see the latest committed data.
---
## Reason
ReBAC authorization decisions depend on the current relationship state. Eventual consistency means a revoked user may still have access for seconds or minutes. Strong consistency (DB transactions + READ COMMITTED isolation) ensures that access changes take effect immediately.
---
## Bad Example
```php
// No transaction — partial updates possible
ResourceRelationship::where('user_id', $userId)->delete(); // User may still have access
```
---
## Good Example
```php
DB::transaction(function () {
    ResourceRelationship::where('user_id', $userId)->delete();
    ResourceRelationship::create(['user_id' => $newUserId, 'relation' => 'owner', ...]);
});
```
---
## Exceptions
No common exceptions — ReBAC decisions require strong consistency.
---
## Consequences Of Violation
Stale authorization decisions, revoked users retain access.
---

## Cascade Delete Relationships When Resources Are Deleted
---
## Category
Architecture
---
## Rule
Delete all relationship tuples for a resource when the resource is deleted. Implement via database foreign key cascades or a scheduled cleanup job.
---
## Reason
Orphaned relationship tuples accumulate when resources are deleted without cleanup. They cause wasted storage, confusing query results ("deleted document shows in shared list"), and potential security issues if a new resource is created with the same ID (foreign key confusion).
---
## Bad Example
```php
// Resource deleted but relationship tuples remain
$document->delete(); // ResourceRelationship entries orphaned
```
---
## Good Example
```php
// Cascade delete via model event
protected static function booted(): void {
    static::deleted(function ($document) {
        ResourceRelationship::where('resource_type', 'document')
            ->where('resource_id', $document->id)
            ->delete();
    });
}
```
---
## Exceptions
Soft-deleted resources where relationships must be preserved for restore.
---
## Consequences Of Violation
Orphaned tuples, wasted storage, potential ID confusion.
---

## Cache Resolved Relationship Queries
---
## Category
Performance
---
## Rule
Cache the resolved ReBAC access result for a user+resource combination with a TTL appropriate to the relationship change frequency.
---
## Reason
ReBAC evaluation may require querying the relationship table and potentially traversing a relationship graph. Without caching, every authorization request repeats these queries. Caching reduces repeated lookups to a single cache hit per TTL window.
---
## Bad Example
```php
// Relationship query on every request — no cache
$canEdit = ResourceRelationship::where(...)->exists();
```
---
## Good Example
```php
$cacheKey = "rebac:{$user->id}:{$resource->id}:edit";
$canEdit = cache()->remember($cacheKey, 300, function () use ($user, $resource) {
    return ResourceRelationship::where(...)->exists();
});
```
---
## Exceptions
Real-time collaboration tools where relationship changes must be visible immediately.
---
## Consequences Of Violation
Redundant database queries, slower authorization decisions.
---

## Log All Relationship Changes for Audit
---
## Category
Audit Logging
---
## Rule
Record every relationship tuple change (grant, revoke, ownership transfer) with who performed the change, the user affected, the resource, and the timestamp.
---
## Reason
Relationship changes modify who can access what. Without auditing, unauthorized privilege escalation (a user granting themselves editor access) goes undetected. Audit logs enable forensic investigation of access changes.
---
## Bad Example
```php
// Relationship change not logged
ResourceRelationship::create(['user_id' => $user->id, 'relation' => 'owner', ...]);
```
---
## Good Example
```php
activity()
    ->performedOn($document)
    ->causedBy(Auth::user())
    ->withProperties(['granted_to' => $user->id, 'relation' => 'owner'])
    ->log('relationship_granted');
ResourceRelationship::create(['user_id' => $user->id, 'relation' => 'owner', ...]);
```
---
## Exceptions
No common exceptions — all relationship changes must be auditable.
---
## Consequences Of Violation
Undetected privilege escalation, compliance audit failure.
---

## Define a Consistent Relationship Vocabulary
---
## Category
Maintainability
---
## Rule
Document and use a consistent set of relationship names across the application (`owner`, `editor`, `viewer`). Never use synonyms like `admin`, `manager`, or `writer` for the same relationship type.
---
## Reason
Inconsistent relationship names cause confusion, duplicate logic, and authorization bugs. A developer checking for `editor` access may miss the `writer` relationship that should grant the same level. A documented vocabulary prevents ambiguity.
---
## Bad Example
```php
// Inconsistent names across resources
'document' => ['owner', 'editor', 'viewer']
'project' => ['admin', 'contributor', 'reader'] // Different names, similar semantics
```
---
## Good Example
```php
// Consistent vocabulary across all resources
'*' => ['owner', 'editor', 'viewer']
```
---
## Exceptions
No common exceptions — vocabulary consistency is essential.
---
## Consequences Of Violation
Confusion, duplicate authorization logic, access management bugs.
