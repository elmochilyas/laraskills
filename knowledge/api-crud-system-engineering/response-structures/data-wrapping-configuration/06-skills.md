# Skill: Design API Data Wrapping Configuration

## Purpose
Configure JSON wrapping for API Resource responses: set `$wrap` property on resources, use `withoutWrapping()` for JSON:API compliance, or maintain consistent wrapper key across all versions.

## When To Use
- API envelope response design
- Resource serialization configuration
- Wrapper key decision and implementation

## When NOT To Use
- Non-envelope responses (204, binary)
- Non-Laravel Resource serialization

## Prerequisites
- API Resource transformation
- Envelope response design

## Inputs
- Wrapper key specification (data, null, or custom)
- Envelope consistency requirements

## Workflow
1. Decide wrapper strategy: `$wrap = 'data'` for envelope, `withoutWrapping()` for bare responses
2. Set global wrapper via `JsonResource::wrap('data')` in `AppServiceProvider`
3. Or disable global wrapping with `JsonResource::withoutWrapping()` for JSON:API compliance
4. Override wrapper per resource: `protected $wrap = 'user'` for specific resources
5. Apply `withoutWrapping()` per-resource to disable wrapper for non-collection resources
6. Use `$wrap = null` for resources that should not have a wrapper
7. Keep wrapper key consistent across all responses within a version
8. Wrap collections in `data` key automatically via `Resource::collection()`
9. Handle paginated resources — `paginate()` already wraps in wrapper key
10. Test wrapper behavior — single resource, collection, paginated collection, empty collection

## Validation Checklist
- [ ] Wrapper key strategy decided (data, null, or custom)
- [ ] Global wrapper set in AppServiceProvider or per-resource
- [ ] `withoutWrapping()` applied where needed
- [ ] Wrapper consistent across all resources
- [ ] Collections wrapped correctly via `::collection()`
- [ ] Paginated responses wrapped correctly
- [ ] Single resources wrapped correctly
- [ ] Empty collections wrapped in envelope format
- [ ] Wrapper behavior tested for all resource types
- [ ] Wrapper key stable within version

## Common Failures
- Inconsistent wrapping — some resources wrapped, others bare
- Double wrapping — resource returned with `data` key, then wrapped again in middleware
- `withoutWrapping()` applied globally — collections not wrapped in any key
- Paginated response not wrapped — `PaginatedCollection` not configured
- Empty collection returns `[]` instead of `{'data': []}` — breaks envelope contract
- Wrapper key changes between versions — clients parse using old key

## Decision Points
- Wrapped vs unwrapped — envelope for public, unwrapped for internal
- Global vs per-resource wrapper — global for consistency, per-resource for exceptions
- Wrapper key name — `data` for generic, `results` for Google-style, null for JSON:API

## Performance Considerations
- Wrapping adds negligible overhead — key insertion in array
- Paginated wrapping adds metadata merging cost per page
- Global wrapper configuration is one-time operation

## Security Considerations
- Wrapper key must not expose implementation details
- `data` wrapper doesn't imply any security properties
- Empty collection still wrapped in envelope — consistent client parsing
- `withoutWrapping()` should not apply to error responses — errors always wrapped

## Related Rules
- Set Global Wrapper Key Consistently
- Use withoutWrapping For JSON:API Compliance
- Override Wrapper Per Resource Where Needed
- Keep Wrapper Key Stable Within Version
- Test Wrapper Behavior For All Resource Types
- Wrap Empty Collections In Envelope

## Related Skills
- Envelope Response Design — for overall envelope structure
- API Resource Transformation — for resource serialization
- JSON:API Resource Structure — for JSON:API compliance
- Pagination Metadata Design — for paginated wrapper behavior

## Success Criteria
- Correct wrapper key on all resource responses
- Consistency across single, collection, and paginated responses
- Empty collections return `{'data': []}` not `[]`
- Wrapper key stable within API version
- `withoutWrapping()` correctly applied where intended
- Wrapper behavior covered in integration tests
