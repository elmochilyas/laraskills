# sparse-fieldset-design Rules

## Rule 1: Always Validate Requested Fields Against a Whitelist
---
## Category
Security
---
## Rule
Always validate client-requested field names against a defined whitelist of allowed fields — never accept arbitrary field names.
---
## Reason
Without a whitelist, clients can request internal model attributes (`_pivot`, `laravel_through_key`, timestamps) that were never intended for public exposure. A whitelist enforces the documented public API contract.
---
## Bad Example
```php
$fields = explode(',', $request->input('fields.users', ''));
return collect($data)->only($fields);
// Client requests: fields[users]=_pivot,internal_note,password_hash
```
---
## Good Example
```php
protected static array $allowed = ['id', 'name', 'email', 'role'];

$raw = explode(',', $request->input('fields.users', ''));
$fields = array_intersect($raw, static::$allowed);
```
---
## Exceptions
Internal-only APIs where all consumers are trusted.
---
## Consequences Of Violation
Internal model attributes leaked through fieldset requests. Sensitive fields like password hashes, pivot data, and internal timestamps exposed to unauthorized clients.

## Rule 2: Apply Fieldsets to Included Resources Recursively
---
## Category
Design
---
## Rule
Always apply sparse fieldset filtering to included/related resource types when the client specifies `fields[relatedType]`, not just the primary type.
---
## Reason
Compound documents include multiple resource types. A client that requests specific fields for `posts` expects those fields to be restricted on included `posts` too. Ignoring fieldsets on included types forces over-fetching.
---
## Bad Example
```php
// Client: GET /users?fields[users]=id,name&fields[posts]=id,title
// Resource applies fieldset to users but not to included posts
'posts' => PostResource::collection($this->whenLoaded('posts')),
// Posts returned with ALL fields — over-fetching
```
---
## Good Example
```php
public function toArray($request)
{
    $userFields = $this->getSparseFields($request, 'users');
    $postFields = $this->getSparseFields($request, 'posts');

    return [
        'id' => in_array('id', $userFields) ? (string) $this->id : null,
        'name' => in_array('name', $userFields) ? $this->name : null,
        'posts' => $this->whenLoaded('posts', function () use ($postFields) {
            return PostResource::collection($this->posts)->setSparseFields($postFields);
        }),
    ];
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Compound documents include full resource objects for related types despite client requesting specific fields. Bandwidth savings from sparse fieldsets are lost on included resources.

## Rule 3: Combine with `Model::select()` for Database Optimization
---
## Category
Performance
---
## Rule
Always combine sparse fieldset parsing with `Model::select()` to reduce the columns loaded from the database, not just the fields serialized to JSON.
---
## Reason
Sparse fieldsets applied only at the serialization layer still load all model attributes from the database. The majority of query cost (data transfer, hydration) is unaffected. `Model::select()` ensures the database also returns only needed columns.
---
## Bad Example
```php
$users = User::all(); // loads all columns — 50 columns
// Then fieldset only shows 3 fields in JSON
```
---
## Good Example
```php
$fields = $this->getSparseFields($request, 'users');
$dbColumns = array_intersect($fields, ['id', 'name', 'email']);
$users = User::select($dbColumns)->get();
```
---
## Exceptions
When computed/accessor attributes require the full model (e.g., `$appends` fields derived from multiple columns).
---
## Consequences Of Violation
Database loads unnecessary BLOB/TEXT columns. Hydration time and memory usage unaffected by sparse fieldsets. Performance gains are minimal despite smaller JSON output.

## Rule 4: Use a Reusable Trait for Sparse Fieldset Logic
---
## Category
Code Organization
---
## Rule
Always implement sparse fieldset parsing logic as a reusable trait applied to all resource classes, never duplicated per resource.
---
## Reason
Sparse fieldset implementation involves field parsing, whitelist validation, and request parameter extraction. Duplicating this across resources guarantees inconsistency and increases maintenance burden.
---
## Bad Example
```php
class UserResource extends JsonResource
{
    public function toArray($request)
    {
        $fields = explode(',', $request->input('fields.users', ''));
        $allowed = ['id', 'name', 'email'];
        $active = array_intersect($fields, $allowed);
        // ... code duplicated in PostResource, CommentResource, etc.
    }
}
```
---
## Good Example
```php
trait HasSparseFields
{
    public function getSparseFields(Request $request, string $type): array
    {
        $raw = explode(',', $request->input("fields.{$type}", ''));
        return array_intersect($raw, static::$allowedFields);
    }
}

class UserResource extends JsonResource
{
    use HasSparseFields;

    protected static array $allowedFields = ['id', 'name', 'email'];

    public function toArray($request)
    {
        $fields = $this->getSparseFields($request, 'users');
        // ...
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Adding a resource requires copying the entire sparse fieldset implementation. Bug fixes must be applied to every resource. Inconsistent field names between resources.

## Rule 5: Cache Parsed Fieldsets Per Request
---
## Category
Performance
---
## Rule
Always cache parsed/validated fieldset values for the duration of a single request to avoid re-parsing across nested resources and included relationships.
---
## Reason
Compound documents and nested resources parse the same fieldset parameters multiple times per request (primary resource, included resources, nested serialization). Re-parsing adds overhead proportional to nesting depth.
---
## Bad Example
```php
public function getSparseFields(Request $request, string $type): array
{
    // Parsed from scratch every time — called 10 times per request
    $raw = explode(',', $request->input("fields.{$type}", ''));
    return array_intersect($raw, static::$allowedFields);
}
```
---
## Good Example
```php
protected array $parsedFieldsets = [];

public function getSparseFields(Request $request, string $type): array
{
    if (isset($this->parsedFieldsets[$type])) {
        return $this->parsedFieldsets[$type];
    }
    $raw = explode(',', $request->input("fields.{$type}", ''));
    return $this->parsedFieldsets[$type] = array_intersect($raw, static::$allowedFields);
}
```
---
## Exceptions
Simple resources with no nested or included relationships.
---
## Consequences Of Violation
Parsing overhead multiplies with every nested resource. A compound document with 5 levels of includes re-parses the same fieldset 5+ times.

## Rule 6: Never Affect `meta` and `links` with Sparse Fieldsets
---
## Category
Design
---
## Rule
Always ensure sparse fieldset filtering applies only to resource `attributes` — never exclude `meta` or `links` fields.
---
## Reason
`meta` and `links` contain transport metadata (pagination, request ID, navigation) that clients need regardless of which resource fields they requested. Stripping them breaks client navigation and correlation.
---
## Bad Example
```php
// Fieldset removes 'meta' and 'links' because they weren't in the field list
return array_intersect_key($this->toArray($request), array_flip($fields));
// Pagination metadata and self links are gone
```
---
## Good Example
```php
public function toArray($request)
{
    $fields = $this->getSparseFields($request, 'users');
    $attributes = [];
    foreach (static::$allowedFields as $field) {
        if (in_array($field, $fields)) {
            $attributes[$field] = $this->$field;
        }
    }
    return [
        'type' => 'users',
        'id' => (string) $this->id,
        'attributes' => $attributes, // only attributes are filtered
        // self link always present
        'links' => ['self' => route('users.show', $this)],
    ];
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Clients lose pagination navigation URLs. Self links disappear from resources. Request IDs are missing from meta, breaking client-side log correlation.
