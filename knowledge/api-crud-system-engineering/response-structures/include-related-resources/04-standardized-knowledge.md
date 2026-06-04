# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Include Related Resources
**Difficulty:** Intermediate
**Category:** Response Structures
**Last Updated:** 2026-06-03

---

# Overview

Include Related Resources is the pattern of allowing API consumers to request related resources to be embedded in the response using a `?include=relationship` query parameter. It exists as an alternative to forcing multiple API calls for related data — clients can request exactly what they need in a single response.

Engineers must care because the include pattern is the most common solution to the N+1 problem across API boundaries. Without includes, clients either make too many requests (one per parent, one per relationship) or receive excessive data (always including all relationships). Well-designed includes give clients precise control over response composition.

---

# Core Concepts

**Include Parameter:** `?include=posts,comments` — requests that posts and comments relationships be embedded in the response.

**Allowed Includes:** An explicit allowlist of includable relationships. Rejects requests for non-allowed relationships.

**Nested Includes:** `?include=posts.comments` — requests posts with their comments embedded.

**Lazy Loading in Resources:** `$this->whenLoaded('posts')` in API resources checks if the relationship was loaded.

**Eager Loading in Controller:** The controller must eager load the requested relationships before passing to the resource.

---

# When To Use

- APIs with related resources that clients frequently access together
- APIs where response composition varies significantly by consumer
- APIs following JSON:API specification (includes are a core feature)
- Public APIs where client needs are unknown

---

# When NOT To Use

- Simple CRUD APIs where relationships are always included
- Internal APIs where all consumers want the same response
- Performance-critical endpoints where includes add unacceptable overhead

---

# Best Practices

**Use an explicit allowlist for includes.** Never allow including arbitrary relationships.

**Eager load included relationships in the controller.** `$query->with($request->validatedIncludes())` prevents N+1.

**Use whenLoaded() in resources.** Only include relationships that were actually loaded.

**Validate include parameters.** Return 422 for unknown include values.

**Limit nesting depth.** Allow `?include=posts.comments` but not `?include=posts.comments.user.profile`.

---

# Architecture Guidelines

**Include parsing and validation belongs in a dedicated service or Form Request.** `IncludeParser` handles the syntax; Form Request validates the values.

**Relationship loading happens in the controller or query builder.** Apply `with()` before paginating.

**Resource classes use whenLoaded() for all includable relationships.** This prevents N+1 while allowing includes.

**Include allowlist is defined per resource.** `UserResource` knows which relationships can be included.

---

# Performance Considerations

**Each included relationship adds at least one query.** Multiple includes multiply query count.

**Deep includes amplify query count.** `include=posts.comments` may trigger 2+ additional queries.

**Include allowlist prevents expensive relationship loading.** Only allow relationships that are performant.

**Paginated includes require careful loading.** Don't eager load relationships on the entire table — load only for the current page.

---

# Security Considerations

**Include allowlist prevents sensitive relationship exposure.** Don't allow including `password_resets` or `internal_notes`.

**Authorization should apply to included relationships.** A user who can't view comments shouldn't receive them via includes.

**Deep includes may bypass authorization.** Ensure authorization is checked at each level.

---

# Common Mistakes

**No include allowlist.** Clients can request any relationship, including sensitive or non-existent ones.

**No whenLoaded() check.** Resource accesses relationship without checking if it was loaded, causing N+1.

**Includes loaded after pagination.** `with()` applied after `paginate()`, loading relationships for all matching records instead of current page.

**No nesting limit.** Clients can request arbitrarily deep include chains, causing excessive queries.

---

# Anti-Patterns

**Unrestricted Includes:** No allowlist, allowing clients to include any model relationship.
**Better approach:** Define explicit allowlist per resource. Reject unknown includes.

**N+1 Via Includes:** Resource accesses relationship without whenLoaded(), loading it on every resource instance.
**Better approach:** Always use whenLoaded() for includable relationships.

**Unauthorized Includes:** Including related resources the user is not authorized to view.
**Better approach:** Apply authorization checks to included relationships at each level.

---

# Examples

**Include processing:**
```
// Form Request validates allowed includes
$request->validatedIncludes() // ['posts', 'comments']

// Controller loads relationships
User::query()
    ->with($request->validatedIncludes())
    ->paginate();

// Resource conditionally includes
'posts' => PostResource::collection($this->whenLoaded('posts')),

// Request: GET /api/users?include=posts
// Response includes users with their posts embedded
```

---

# Related Topics

**Prerequisites:**
- API Resource Transformation
- Eager Loading

**Closely Related Topics:**
- Conditional Relationship Inclusion — conditional includes
- JSON:API Compound Documents — include structure in JSON:API
- Sparse Fieldset Design — combined with includes

**Advanced Follow-Up Topics:**
- Nested Include Depth Control
- Include Authorization

**Cross-Domain Connections:**
- Query Parameter Filtering — combined with includes
- Pagination — includes with paginated responses
