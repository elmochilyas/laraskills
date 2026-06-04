# json-api-compound-documents Rules

## Rule 1: Always Enforce an Include Allowlist
---
## Category
Security
---
## Rule
Always define and enforce a whitelist of includable relationships per resource — never accept arbitrary `include` parameter values.
---
## Reason
Arbitrary includes expose deep relationship chains that may include sensitive or internal data. An allowlist ensures only documented, authorized relationships can be embedded, preventing information disclosure and DoS via deep inclusion.
---
## Bad Example
```php
$includes = explode(',', $request->input('include', ''));
$query->with($includes); // arbitrary includes — no validation
```
---
## Good Example
```php
$allowedIncludes = ['author', 'comments', 'author.profile'];
$includes = array_intersect(
    explode(',', $request->input('include', '')),
    $allowedIncludes
);
$query->with($includes);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Client requests `include=internal_notes,deleted_by.admin.account` and receives sensitive data. Deep nested includes cause database and serialization timeouts.

## Rule 2: Limit Include Depth to at Most Three Levels
---
## Category
Performance
---
## Rule
Never allow dot-notation includes exceeding three levels of depth (e.g., `author.organization.address` is the maximum).
---
## Reason
Each level of depth multiplies query joins and serialization cost exponentially. Four or more levels create responses of unbounded size and query complexity.
---
## Bad Example
```php
// Allow infinite depth
$query->with(explode(',', $request->input('include', '')));
// Client requests: ?include=author.organization.address.geo.coordinates
```
---
## Good Example
```php
$maxDepth = 3;
$allowedIncludes = array_filter(
    explode(',', $request->input('include', '')),
    fn($path) => count(explode('.', $path)) <= $maxDepth
);
$query->with($allowedIncludes);
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Compound document size explodes to megabytes. Database query plan includes dozens of joins. Serialization time exceeds request timeouts. Memory exhaustion on large datasets.

## Rule 3: Always Deduplicate Included Resources by `type:id`
---
## Category
Design
---
## Rule
Always maintain a deduplication registry keyed by `type:id` when serializing included resources to guarantee each unique resource appears only once.
---
## Reason
JSON:API requires each included resource to appear at most once. Without deduplication, the same resource (referenced from multiple relationships) appears multiple times, wasting bandwidth and breaking client-side normalization stores.
---
## Bad Example
```php
$included = [];
foreach ($articles as $article) {
    $included[] = new AuthorResource($article->author);
}
// If two articles have the same author, author appears twice in "included"
```
---
## Good Example
```php
$included = [];
$dedup = [];
foreach ($articles as $article) {
    $key = 'people:' . $article->author_id;
    if (!isset($dedup[$key])) {
        $included[] = new AuthorResource($article->author);
        $dedup[$key] = true;
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Compound documents contain duplicate resources. Client-side stores (Redux, Ember Data) receive conflicting data for the same entity. Bandwidth wasted on redundant payload.

## Rule 4: Always Include `data` (Resource Linkage) in Relationship Objects
---
## Category
Design
---
## Rule
Always include `data` with `type` and `id` in every relationship object to provide resource linkage between the primary resource and included entries.
---
## Reason
Without `data` in the relationship object, clients cannot map included resources to relationship references. The compound document becomes a flat list of resources with no connection to the primary data.
---
## Bad Example
```php
'relationships' => [
    'author' => [
        'links' => [
            'related' => '/articles/1/author',
        ],
        // No "data" key — client cannot map to included
    ],
]
```
---
## Good Example
```php
'relationships' => [
    'author' => [
        'links' => [
            'self' => '/articles/1/relationships/author',
            'related' => '/articles/1/author',
        ],
        'data' => ['type' => 'people', 'id' => '9'],
    ],
]
```
---
## Exceptions
Relationship with zero related records — `data` is `null` or `[]` as per JSON:API spec.
---
## Consequences Of Violation
Included resources are orphaned — client receives the data but cannot associate it with the primary resource relationships.

## Rule 5: Map Includes to Eager Loads in Controllers Only
---
## Category
Code Organization
---
## Rule
Always parse the `include` parameter and map it to `->with()` calls in the controller, never lazy-load relationships during resource serialization.
---
## Reason
The controller owns query optimization. If the resource layer triggers lazy loads based on the `include` parameter, eager loading cannot be optimized, and N+1 queries are guaranteed.
---
## Bad Example
```php
// Resource triggers lazy loading based on include
public function toArray($request)
{
    $includes = explode(',', $request->input('include', ''));
    foreach ($includes as $include) {
        $this->load($include); // N+1 — loads per resource instance
    }
}
```
---
## Good Example
```php
// Controller maps includes to eager loads
public function index(Request $request)
{
    $includes = $this->parseAllowedIncludes($request);
    $articles = Article::with($includes)->paginate();
    return ArticleResource::collection($articles);
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
N+1 query explosion — loading 100 articles with "author" include generates 101 queries instead of 2. Endpoint becomes unusable under moderate load.

## Rule 6: Validate Includes Before Processing the Query
---
## Category
Performance
---
## Rule
Always validate the `include` parameter against the allowlist and depth limit before executing the database query.
---
## Reason
Invalid or malicious include requests should be rejected as early as possible — before database query building, before eager loading, before serialization. Early rejection avoids wasted database and CPU resources.
---
## Bad Example
```php
// Processes include after query — waste if include is invalid
$articles = Article::with('a.b.c.d.e.f')->paginate();
// Query with invalid includes already executed
```
---
## Good Example
```php
// Validate before any query
$includes = $this->parseAndValidateIncludes($request); // throws 400 if invalid
$articles = Article::with($includes)->paginate();
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Database executes expensive joins for invalid include paths before validation rejects them. Attackers can trigger heavy query execution without valid includes.

## Rule 7: Authorize Included Resources Independently
---
## Category
Security
---
## Rule
Always run authorization checks on included resources independently of the primary resource, ensuring the client has permission to access every included relationship.
---
## Reason
Included resources bypass the normal endpoint authorization flow. A client may lack direct access to an endpoint but still receive related data through the compound document if authorization is only checked for the primary resource.
---
## Bad Example
```php
$article = Article::with('internalNotes')->findOrFail($id);
// $this->authorize('view', $article) — only checks article permissions
// Internal notes leaked through compound document
```
---
## Good Example
```php
$article = Article::with(['internalNotes' => function ($query) use ($user) {
    $query->where(function ($q) use ($user) {
        // Pre-filter included resources by authorization
        $q->where('is_public', true)
          ->orWhere('author_id', $user->id);
    });
}])->findOrFail($id);
```
---
## Exceptions
Public relationships that have no authorization requirements.
---
## Consequences Of Violation
Sensitive related data leaked through compound documents. Authorized users see data they should not have access to by including the relationship.
