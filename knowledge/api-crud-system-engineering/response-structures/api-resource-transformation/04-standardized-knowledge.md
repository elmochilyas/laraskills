# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** API Resource Transformation
**Difficulty:** Intermediate
**Category:** Response Structures
**Last Updated:** 2026-06-03

---

# Overview

API Resource Transformation is the process of converting Eloquent models and collections into structured, consistent JSON responses using Laravel's API Resource classes (`JsonResource` and `ResourceCollection`). It exists as the presentation layer of the API, decoupling internal model structure from external API contracts.

Engineers must care because API Resources are the contract with consumers. A change to the transformation logic is a change to the API contract. Well-designed resources ensure consistent response structure, enable computed fields, handle conditional attributes, and manage relationship inclusion — all without leaking internal model structure.

---

# Core Concepts

**JsonResource:** A single-resource transformer. Defines the `toArray()` method that returns the JSON representation.

**ResourceCollection:** A collection transformer. Wraps `JsonResource::collection()` with pagination metadata.

**Conditional Attributes:** `$this->when($condition, $value)` includes attributes only when the condition is true.

**Relationship Inclusion:** `PostResource::make($post)->include('comments')` adds related resources to the response.

**Computed Fields:** Virtual attributes calculated from model data — `'full_name' => $this->first_name . ' ' . $this->last_name`.

**Merging Values:** `$this->merge($data)` for including arrays of attributes conditionally.

---

# When To Use

- Every API response returning model data
- Responses needing computed fields or data transformation
- Responses with conditional attribute inclusion
- Responses requiring nested relationship data
- Standardizing API response structure across endpoints

---

# When NOT To Use

- Non-model responses (dashboards, metrics, health checks)
- Raw data passthrough without transformation
- CLI output or non-JSON responses

---

# Best Practices

**Always use API Resources.** Never return raw models from controllers. Resources ensure consistent response structure.

**Define computed fields in resources, not models.** `'full_name'` belongs in the resource, not as an accessor on the model.

**Use conditional attributes for optional fields.** `$this->when($includeSensitive, 'ssn')` prevents sensitive data exposure.

**Use lazy eager loading for relationships.** Call `$resource->loadRelation()` in the resource, not in the controller.

**Keep resources focused on transformation.** Resources transform data; they don't contain business logic.

---

# Architecture Guidelines

**Resources belong in `App\Http\Resources`.** Organized by domain if needed: `App\Http\Resources\User\UserResource`.

**Resources map 1:1 to models.** `UserResource` transforms `User` model. `PostResource` transforms `Post` model.

**Collections extend `ResourceCollection`.** Customize the `toResponse()` method for pagination metadata.

**Nested relationships use their own resource classes.** `UserResource` includes `PostResource` for posts relationship.

**Resources are stateless.** They receive a model and return an array. No side effects.

---

# Performance Considerations

**Resource transformation is proportional to data size.** Large collections with many computed fields add overhead.

**Relationship inclusion adds query overhead.** `$resource->whenLoaded('comments')` prevents N+1 by only including loaded relations.

**Resource wrapping adds size overhead.** The default `data` wrapper adds 8 bytes per response. Consider whether wrapping is needed.

**Collection pagination resources may be large.** `UserResource::collection($users)` for 100 users creates 100 resource instances.

---

# Security Considerations

**Resources control data exposure.** Only include fields that should be exposed. Use conditional attributes for sensitive data.

**Never expose internal IDs or timestamps.** Map internal IDs to public UUIDs if consumers need stable identifiers.

**Relationship inclusion must respect authorization.** Don't include related resources the user isn't authorized to view.

**Computed fields must not leak sensitive data.** A computed `'is_admin'` field could reveal unauthorized information.

---

# Common Mistakes

**Returning raw models.** Controller returns `$user` instead of `UserResource::make($user)`. Internal model structure is exposed.

**Business logic in resources.** Resources performing calculations, querying the database, or checking authorization.

**No conditional attributes.** Including all fields always, including sensitive or irrelevant ones.

**Relationship N+1 in resources.** Resource accesses `$this->comments` without checking `$this->whenLoaded('comments')`.

**Inconsistent date formatting.** Some resources return `Carbon` objects, others return formatted strings.

---

# Anti-Patterns

**God Resource:** A single resource that handles multiple output formats based on conditions.
**Better approach:** Separate resources per use case. `UserListResource`, `UserDetailResource`, `UserAdminResource`.

**Model Leakage:** Returning model attributes directly without transformation, exposing the database schema.
**Better approach:** Always transform through resources. Map internal field names to API field names.

**Conditional Overload:** Ten `$this->when()` conditions in a single resource, making it unreadable.
**Better approach:** Split into separate resource classes for different contexts.

**N+1 In Resource:** Accessing relationships without `whenLoaded()`, causing N+1 queries.
**Better approach:** Always use `whenLoaded()` for relationship access in resources.

---

# Examples

**User resource:**
```
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->uuid,
            'name' => $this->name,
            'email' => $this->email,
            'avatar' => $this->avatar_url,
            'role' => $this->role,
            'joined_at' => $this->created_at->toIso8601String(),
            'posts' => PostResource::collection($this->whenLoaded('posts')),
            'can' => $this->when($request->user()?->isAdmin(), [
                'impersonate' => true,
                'delete' => true,
            ]),
        ];
    }
}
```

---

# Related Topics

**Prerequisites:**
- Laravel API Resources
- Eloquent Serialization

**Closely Related Topics:**
- JSON:API Resource Structure — JSON:API-specific resource format
- Sparse Fieldset Design — field selection
- Conditional Field Inclusion — conditional attributes

**Advanced Follow-Up Topics:**
- Resource Collection Customization — collection-level transformation
- Nested Relationship Inclusion — deep relationship inclusion

**Cross-Domain Connections:**
- Response Format Decision Framework — choosing a response format
- Data Wrapping Configuration — configuring the data wrapper
