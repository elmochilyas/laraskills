# ECC Anti-Patterns — Top-Level Meta Data

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | API Resources |
| **Knowledge Unit** | Top-Level Meta Data |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Expensive Computation Inside `with()` Method
2. Sensitive Data Leaked via Metadata
3. Key Collision with Pagination Metadata
4. Inconsistent Metadata Structure Across Endpoints

---

## Repository-Wide Anti-Patterns

- N/A

---

## Anti-Pattern 1: Expensive Computation Inside `with()`

### Category
Performance

### Description
Running database queries, external API calls, or heavy computations inside the `with()` method, which runs on every resource response.

### Why It Happens
Developers think "I need this metadata computed for the response" and put the computation directly in `with()` without considering caching or pre-computation.

### Warning Signs
- `DB::query()`, `Http::get()`, or `Cache::get()` calls inside `with()`
- Response time correlates with metadata complexity
- The same metadata is computed identically across multiple requests

### Preferred Alternative
Pre-compute metadata in the controller and pass to the resource. Use caching for expensive computations.

### Related Rules
- Rule: Keep `with()` Computation Light

---

## Anti-Pattern 2: Sensitive Data Leaked via Metadata

### Category
Security

### Description
Including internal state, server paths, configuration values, or debugging information in the `with()` output, visible to every API consumer.

### Why It Happens
Metadata is added for debugging purposes and never removed. "It's useful for internal debugging" — but it's visible externally.

### Warning Signs
- Server paths, hostnames, or file paths in API response metadata
- Debug/error tracking IDs exposed
- Configuration values visible in `with()` output

### Preferred Alternative
Never include sensitive data in `with()`. Use `withResponse()` for headers only. Use middleware for internal-only response data.

### Related Rules
- Rule: Avoid Sensitive Data in Metadata
