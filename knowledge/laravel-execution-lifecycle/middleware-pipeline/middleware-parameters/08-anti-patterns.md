# ECC Anti-Patterns — Middleware Parameters

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Middleware Pipeline |
| **Knowledge Unit** | Middleware Parameters |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Over-Parameterization (6+ Comma-Separated Values)
2. Sensitive Data in Route Parameters
3. Truthy Check on String Parameters
4. Too Few Parameters Causing TypeError
5. Not Documenting Parameter Order

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — parameter parsing is a string split, not a DB operation
- Premature Caching — parameters are serialized in route cache; this is correct behavior

---

## Anti-Pattern 1: Over-Parameterization (6+ Comma-Separated Values)

### Category
Maintainability

### Description
Passing 6+ colon-delimited parameters to a middleware — impossible to read, easy to misorder.

### Why It Happens
Developers use route parameters as a configuration mechanism for complex middleware.

### Warning Signs
- `'middleware:a,b,c,d,e,f,g'` in route definitions
- Parameter order frequently confused
- Route files hard to scan

### Why It Is Harmful
Positional parameters with no names, no types, and no validation. Misordering the 4th and 5th parameters is invisible until runtime. Route files become unreadable. Refactoring the parameter list breaks every route without warning.

### Preferred Alternative
Use constructor injection or a configuration object for complex middleware configuration. Limit colon-delimited parameters to 3-4 simple scalar values.

### Detection Checklist
- [ ] 5+ parameters in colon-delimited string
- [ ] Parameter order confused
- [ ] Route definitions hard to read

### Related Rules
Limit Parameterized Middleware to 3-4 Parameters Maximum (05-rules.md)

---

## Anti-Pattern 2: Sensitive Data in Route Parameters

### Category
Security

### Description
Passing API keys, tokens, or secrets as middleware parameters in route definitions.

### Preferred Alternative
Read secrets from config or environment variables inside the middleware.

### Detection Checklist
- [ ] API keys visible in route files
- [ ] Secrets in version control history
- [ ] Secrets in route cache files

---

## Anti-Pattern 3: Truthy Check on String Parameters

### Category
Reliability

### Description
Using `if ($param)` or `if (!$param)` on a string parameter — `'false'` is truthy in PHP.

### Preferred Alternative
Compare with `=== 'true'` or `=== 'false'`.

### Detection Checklist
- [ ] `if ($enabled)` check on string parameter
- [ ] Feature flags always on regardless of value
- [ ] Boolean parameters behaving unexpectedly

---

## Anti-Pattern 4: Too Few Parameters Causing TypeError

### Category
Reliability

### Description
Middleware with explicit typed parameters — route passes fewer params, causing TypeError.

### Preferred Alternative
Use variadic `...$params` for optional parameters.

### Detection Checklist
- [ ] Fixed parameters with no defaults
- [ ] TypeError on route with fewer params
- [ ] Production outage from missing parameter

---

## Anti-Pattern 5: Not Documenting Parameter Order

### Category
Maintainability

### Description
Middleware parameters undocumented — developers must read the full middleware source to understand parameter order.

### Preferred Alternative
Document every parameter's position, type, and purpose in the `handle()` docblock.

### Detection Checklist
- [ ] Parameters undocumented
- [ ] Misordered parameters in route definitions
- [ ] Developer confusion about what each param does
