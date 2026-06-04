# Anti-Patterns: JSON Resource

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** JSON Resource

## Anti-Patterns

### Resource as a Domain Object
Putting business logic, SQL queries, or heavy computation inside a resource class. Resources are a presentation layer — they should only transform data, not compute or fetch it.

**Problem:** Business logic leaking into the HTTP layer; resources become untestable; SRP violation.

**Solution:** Keep resources thin — extract complex logic to dedicated service classes or action objects.

### Resource Coupled to Request
Using `$request` inside `toArray()` for non-serialization purposes like session writes, authentication changes, or logging.

**Problem:** Side effects during serialization; unpredictable behavior when resources are used outside HTTP context.

**Solution:** Use `$request` only for serialization decisions (role-based visibility, conditional inclusion).

### Deep Resource Nesting Without Eager Loading
Nesting resources deeply (`PostResource` → `CommentResource` → `UserResource`) without ensuring all relationships are eagerly loaded. Each nested resource triggers lazy loading.

**Problem:** N+1 query disaster in serialization; extremely slow API responses.

**Solution:** Eager-load all relationships used in nested resources at the query site: `Post::with('comments.user')->get()`.

### Single Resource for All Contexts
Using one resource class for both admin and public API endpoints, leading to complex conditional logic with many `when()` branches.

**Problem:** Bloated resource class; hard to reason about what fields appear in each context.

**Solution:** Create separate resource classes per context (e.g., `UserResource` and `AdminUserResource`).

### Returning Resource from Non-HTTP Context
Queuing or broadcasting a `JsonResource`. Resources carry HTTP context (request, headers) and serialize the full Eloquent model — wasteful for non-HTTP channels.

**Problem:** Bloated queue payloads; HTTP-specific data leaked to non-HTTP channels.

**Solution:** Use DTOs or plain model `toArray()` for queue and broadcast serialization.

### Resource Without whenLoaded
Using `$this->author` in a nested resource without wrapping it in `whenLoaded('author')`. If the relationship is not eager-loaded, it triggers lazy loading.

**Problem:** Serialization triggers unexpected database queries; N+1 in API responses.

**Solution:** Always wrap nested relationship resources in `whenLoaded()`: `'author' => UserResource::make($this->whenLoaded('author'))`.

### Not Using Resource::collection() for Lists
Returning `collect(UserResource::make($user))` or manual array mapping instead of `UserResource::collection($users)`. Loses automatic pagination detection, wrapping, and metadata.

**Problem:** Missing pagination metadata; inconsistent collection structure; manual wrapping code.

**Solution:** Use `Resource::collection()` for all listing endpoints.
