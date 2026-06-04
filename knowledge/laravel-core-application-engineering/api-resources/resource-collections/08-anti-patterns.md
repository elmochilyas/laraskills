# ECC Anti-Patterns — Resource Collections

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | API Resources |
| **Knowledge Unit** | Resource Collections |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Collection-as-Controller (Pagination Logic Inside Collection)
2. Over-Customized Pagination Metadata (Inconsistent Shapes)
3. Raw Collection Without Resource (Exposing Models Directly)
4. Missing `$collects` Property on Custom ResourceCollection

---

## Repository-Wide Anti-Patterns

- N+1 Query Problem (relationships accessed without eager loading in collections)
- Hidden Database Queries (lazy loading inside collection iteration)

---

## Anti-Pattern 1: Collection-as-Controller

### Category
Architecture

### Description
Putting pagination logic (page size, sorting, filtering) inside the collection resource class instead of the controller.

### Why It Happens
Developers treat the collection as a "smart" layer that should handle all list logic, not just formatting.

### Warning Signs
- Collection resource reads `$request->input('per_page')` or `$request->input('sort')`
- Controller passes `Model::all()` and the collection paginates internally
- Collection calls `$this->collection->paginate()` or sorts items

### Why It Is Harmful
Controllers handle request parameters; resources format data. Mixing the two makes testing harder and violates separation of concerns.

### Preferred Alternative
Controller decides pagination, sorting, and filtering. Collection only formats whatever it receives.

### Related Rules
- Rule: Controller Decides Pagination Parameters; Collection Only Formats

---

## Anti-Pattern 2: Over-Customized Pagination Metadata

### Category
Maintainability

### Description
Every collection defining different `paginationInformation()` shapes, preventing clients from writing generic pagination handlers.

### Why It Happens
Each endpoint team customizes metadata for their specific needs without considering API-wide consistency.

### Warning Signs
- Different collections return different `meta` keys
- Clients must write endpoint-specific pagination parsing
- No base collection class exists

### Preferred Alternative
Use a base collection class to enforce consistent pagination metadata structure across all endpoints.

### Related Rules
- Rule: Standardize Pagination Metadata via a Base Collection

---

## Anti-Pattern 3: Missing `$collects` Property

### Category
Reliability

### Description
Failing to set `$collects` on a custom `ResourceCollection`, relying on namespace derivation which breaks when resource and collection names diverge.

### Why It Happens
Laravel's convention-based derivation works initially but silently fails when the resource class is renamed or namespaced differently.

### Warning Signs
- Collection works locally but fails in production (wrong resource class derived)
- Collection class has no `$collects` property
- Resource was renamed or moved but collection was not updated

### Preferred Alternative
Always set `$collects` explicitly.

### Related Rules
- Rule: Set `$collects` Explicitly on Custom Resource Collections
