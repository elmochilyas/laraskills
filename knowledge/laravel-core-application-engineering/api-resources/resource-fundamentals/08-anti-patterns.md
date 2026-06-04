# ECC Anti-Patterns — Resource Fundamentals

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | API Resources |
| **Knowledge Unit** | Resource Fundamentals |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Resource Exposing Full Model (Using `$this->resource->toArray()`)
2. Business Logic Inside `toArray()`
3. Resource Tightly Coupled to Database Schema
4. Resource Without Explicit Field Listing

---

## Repository-Wide Anti-Patterns

- Business Logic in Models (if models are serialized directly instead of through resources)
- Hidden Database Queries (N+1 from resource relationship access without eager loading)
- Authorization in Views (conditional field hiding used as access control)

---

## Anti-Pattern 1: Resource Exposing Full Model

### Category
Security | Design

### Description
A resource that uses `$this->resource->toArray()` or `$this->getAttributes()` instead of explicitly listing every field, exposing the entire database schema to API consumers.

### Why It Happens
Laziness or time pressure — listing every field individually seems tedious. Developers trust the model's `$hidden` and `$guarded` properties to protect sensitive fields.

### Warning Signs
- `toArray()` body is a single line: `return $this->resource->toArray();`
- Sensitive fields (`password`, `remember_token`) appear in responses
- Adding a column to the database automatically adds it to the API without code review
- No explicit field listing in the resource

### Why It Is Harmful
Every database column becomes an API field. Adding a column to the database silently adds it to the API response. Sensitive fields leak if they are not in `$hidden`. The API contract is undefined — it's whatever the database schema is.

### Real-World Consequences
A `password_reset_tokens` column is added to the users table for a feature. It automatically appears in the user API response. A client developer sees it and assumes it's a valid field. No one realizes the leak until a security audit.

### Preferred Alternative
Always explicitly list every field in `toArray()`. The resource is the whitelist.

### Refactoring Strategy
1. Replace `$this->resource->toArray()` with explicit field listing.
2. List only the fields the API should expose.
3. Add tests asserting sensitive fields are absent.
4. Enforce with code review: no dynamic `toArray()` calls in resources.

### Detection Checklist
- [ ] Grep for `->resource->toArray()` or `->getAttributes()` in resource files
- [ ] Check if resource fields match database columns exactly

### Related Rules
- Rule: Always Explicitly List Every Field in toArray

### Related Skills
- Skill: Design a Resource

---

## Anti-Pattern 2: Business Logic Inside `toArray()`

### Category
Architecture | Maintainability

### Description
Performing computation (calculating discounts, formatting dates, applying business rules) inside the resource's `toArray()` method instead of in a service/action layer.

### Why It Happens
Convenience — the resource has access to the model. The computation seems "part of the response."

### Warning Signs
- `toArray()` contains `if/else` business rules, loops, or calculations
- Mathematical operations, string formatting beyond simple casts
- Calls to external services or facades inside `toArray()`
- The same computation logic appears in multiple resources

### Why It Is Harmful
Business logic is untestable without HTTP context. Cannot be reused by CLI, queue, or other non-HTTP entry points. Violates separation of concerns — a resource is a transformer, not a computation engine.

### Real-World Consequences
A discount calculation is embedded inside `OrderResource::toArray()`. When the same discount needs to be shown in an email (CLI command), the developer either duplicates the logic or calls the resource from a CLI context — both are wrong.

### Preferred Alternative
Compute values in services/actions. Pass computed results to the resource as pre-formatted values. The resource only formats, never computes.

### Refactoring Strategy
1. Identify all computation in `toArray()`.
2. Move computation to a service/action/dedicated calculator.
3. Pass computed values to the resource constructor or as additional data.
4. Update the resource to only format pre-computed values.
5. Test computation in the service/action test, not the resource test.

### Detection Checklist
- [ ] Grep for `if`, `foreach`, `for`, `while` inside `toArray()` methods
- [ ] Grep for `Service`, `::make()`, `app()` calls inside resources

### Related Rules
- Rule: Keep toArray as Pure Transformation — No Business Logic
