# Phase 5: Rules — Backward-Compatible Changes

## Add New Fields With Null Default
---
## Category
Maintainability
---
## Rule
Always add new response fields with a `null` default instead of requiring a value.
---
## Reason
Existing clients parse the response shape without explicit null-handling — a missing field causes consumer errors.
---
## Bad Example
```php
return ['id' => $this->id, 'new_field' => $this->new_field]; // no null fallback
```
---
## Good Example
```php
return ['id' => $this->id, 'new_field' => $this->new_field ?? null];
```
---
## Exceptions
When the field is a computed aggregation that always exists for the underlying resource.
---
## Consequences Of Violation
Consumer JSON parsers crash on missing fields; unplanned emergency releases.
---

## Use `$this->when()` For Conditional Fields
---
## Category
Maintainability
---
## Rule
Prefer `$this->when()` in API resources to conditionally include new fields based on request context.
---
## Reason
Fields not requested by the consumer are omitted by default, keeping the response stable for existing clients.
---
## Bad Example
```php
return ['id' => $this->id, 'excerpt' => $this->excerpt]; // always returned
```
---
## Good Example
```php
return ['id' => $this->id, 'excerpt' => $this->when($request->has('include_excerpt'), $this->excerpt)];
```
---
## Exceptions
When the field is part of the core resource contract that every client version requires.
---
## Consequences Of Violation
Response bloat; clients receive unexpected fields that may collide with their own property names.
---

## Default New Query Parameters To Existing Behavior
---
## Category
Design
---
## Rule
Always set the default value of new query parameters to match the existing behavior before the parameter was added.
---
## Reason
Existing clients do not send the new parameter — if the default changes behavior, they silently get different results.
---
## Bad Example
```php
$posts = Post::query()->orderBy($request->input('sort', 'created_at')); // changes default ordering
```
---
## Good Example
```php
$sort = $request->input('sort', 'id');
$posts = Post::query()->orderBy($sort); // existing default behavior preserved
```
---
## Exceptions
When the existing behavior is a known bug and the fix is explicitly communicated.
---
## Consequences Of Violation
Silent data corruption for existing consumers; hours of debugging as clients report "different results."
---

## Expand Enums Append-Only
---
## Category
Maintainability
---
## Rule
Never reorder, rename, or remove existing enum values — only append new values at the end.
---
## Reason
Existing clients may use exhaustive switch statements or numeric mapping that breaks on reorder/removal.
---
## Bad Example
```php
enum Status: string { case DRAFT = 'published'; case PUBLISHED = 'draft'; } // renamed values
```
---
## Good Example
```php
enum Status: string { case DRAFT = 'draft'; case PUBLISHED = 'published'; case ARCHIVED = 'archived'; }
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Consumer applications crash on unrecognized enum values; emergency client-side patches required.
---

## Relax Validation Never Tighten
---
## Category
Design
---
## Rule
Prefer relaxing validation rules (required → `nullable|sometimes`) over tightening them across existing API versions.
---
## Reason
Tightening validation breaks existing requests that previously succeeded, causing 422 errors for valid consumers.
---
## Bad Example
```php
// V1 had no rule; V2 adds required rule without new version
'title' => 'required|string|max:255'
```
---
## Good Example
```php
// V1 already had this field as required; V2 deprecates it
'title' => 'nullable|sometimes|string|max:255'
```
---
## Exceptions
Security-related tightening (SQL injection, XSS) may be backported with consumer notification.
---
## Consequences Of Violation
Production 422 errors for existing consumers; immediate rollback or emergency release.
---

## Add New Endpoints Without Modifying Existing Routes
---
## Category
Code Organization
---
## Rule
Always add new endpoints alongside existing ones without changing existing route paths, parameters, or response shapes.
---
## Reason
Existing clients hardcode endpoint paths — any route change silently breaks them.
---
## Bad Example
```php
Route::get('/posts', [PostController::class, 'index']); // changed to /posts-old
```
---
## Good Example
```php
Route::get('/posts', [PostController::class, 'index']);       // unchanged
Route::get('/posts/search', [PostController::class, 'search']); // new
```
---
## Exceptions
Internal endpoints with zero documented consumers and explicit team approval.
---
## Consequences Of Violation
404 errors for existing integrations; production outages during deployment.
---

## Mark Deprecated Fields With Response Hints
---
## Category
Maintainability
---
## Rule
Always include a machine-readable hint (e.g., `"deprecated": true`) next to fields that are deprecated but still present.
---
## Reason
Consumers need a signal to stop relying on a field before it is actually removed.
---
## Bad Example
```php
return ['id' => $this->id, 'old_field' => $this->old_field]; // no deprecation signal
```
---
## Good Example
```php
return ['id' => $this->id, 'old_field' => $this->old_field, 'old_field_deprecated' => true];
```
---
## Exceptions
When the entire endpoint is deprecated (deprecation headers cover it).
---
## Consequences Of Violation
Consumers continue depending on fields that will silently vanish in the next version.
