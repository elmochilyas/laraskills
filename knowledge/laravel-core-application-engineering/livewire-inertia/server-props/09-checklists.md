# Inertia Server Props — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Inertia
- **Knowledge Unit:** Inertia Server Props
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Inertia Laravel adapter installed
- [ ] Controller returns `Inertia::render()` for page routes
- [ ] Client-side page components exist for all rendered routes

## Implementation Checklist
- [ ] All Eloquent models are serialized via `->toArray()` or Resource classes before passing
- [ ] Props are kept minimal — only data the component renders
- [ ] TypeScript interfaces exist matching the server-side prop structure
- [ ] Pagination is used for list data exceeding 100 records
- [ ] Related data is grouped into nested structures (not 20+ flat props)
- [ ] Lazy prop optimization used for expensive computations
- [ ] Props are passed as associative array to `Inertia::render()`
- [ ] All values are JSON-serializable (no closures, binary, dates without formatting)

## Verification Checklist
- [ ] Initial load JSON is embedded in Blade layout's `<script>` tag
- [ ] Subsequent navigation returns JSON as response body
- [ ] Resource classes are automatically resolved when used as props
- [ ] Page-specific props override shared data props with same key
- [ ] Prop size is profiled early (Laravel Debugbar or `strlen(json_encode($props))`)

## Security Checklist
- [ ] No passwords, API tokens, internal IDs, or PII in prop arrays
- [ ] Models are serialized (`->toArray()` or `->only()`) — never passed directly
- [ ] Authorization checks happen before passing props
- [ ] Props visible in HTML source are reviewed for sensitive data
- [ ] Serialization boundary controls exactly what is exposed

## Performance Checklist
- [ ] Large datasets use pagination (not all records in one prop)
- [ ] Expensive props use lazy evaluation (`Inertia::lazy()`)
- [ ] Prop payload size is monitored (<500KB per page is typical)
- [ ] Only data the UI renders is included in props
- [ ] Unnecessary nested data is flattened

## Production Readiness Checklist
- [ ] TypeScript interfaces are kept in sync with server prop structure
- [ ] No hardcoded prop names in JS (use TypeScript as single source of truth)
- [ ] Props are documented or have clear naming conventions
- [ ] No duplicate API endpoint doing same job as props

## Common Mistakes to Avoid
- [ ] Passing untransformed Eloquent models — exposes all attributes
- [ ] Overloading props with unnecessary data — large initial payload
- [ ] Mutating props on client — breaks Inertia's immutable data flow
- [ ] Non-serializable props — JSON encoding errors at runtime
- [ ] Prop explosion (20+ individual props) — group related data
- [ ] API duplication — building separate endpoint returning same data as props
