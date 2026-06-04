# Skill: Implement JSON:API Resource Structure

## Purpose
Structure API resource responses following JSON:API specification with `type`, `id`, `attributes`, `relationships`, `links`, and `included` top-level keys using dedicated Resource classes.

## When To Use
- JSON:API compliant APIs
- Public APIs requiring JSON:API standard compliance
- APIs with complex relationship graphs

## When NOT To Use
- Simple CRUD APIs without relationships
- Internal APIs where JSON:API overhead isn't justified
- APIs already committed to custom envelope format

## Prerequisites
- JSON:API specification understanding
- API Resource class customization

## Inputs
- Resource type definitions
- Relationship mapping

## Workflow
1. Set resource type in `toArray()`: `'type' => 'users'` — plural kebab-case
2. Include `'id' => (string) $this->id` — always string per spec
3. Wrap attributes in `'attributes'` key: exclude `id` from attributes
4. Define `'relationships'` with `'links'` for related resource URLs
5. Use `'links'` at resource level: `self`, `related` URLs
6. Include related resources via `'included'` top-level key — not nested
7. Use `'jsonapi'` top-level key with version: `'version' => '1.1'`
8. Apply `spatie/laravel-json-api-paginate` for JSON:API pagination
9. Use dedicated JSON:API resource classes (spatie/json-api or custom)
10. Return 409 Conflict for relationship constraint violations

## Validation Checklist
- [ ] Resource `type` set to plural kebab-case
- [ ] `id` formatted as string
- [ ] `attributes` key wraps all non-id fields
- [ ] `relationships` defined with `links`
- [ ] `links` section with self/related URLs
- [ ] Related resources in `included`, not nested
- [ ] `jsonapi` top-level key with version
- [ ] Pagination follows JSON:API spec
- [ ] Dedicated resource classes used
- [ ] Relationship integrity errors return 409

## Common Failures
- `id` as integer — spec requires string
- Attributes at top-level instead of under `attributes` — breaks parsers
- Related resources nested instead of included — defeats spec purpose
- Missing `type` — resource not identifiable
- Self link missing — client can't construct resource URL
- Pagination not following spec — different library, different format
- No `jsonapi` version — spec compliance incomplete

## Decision Points
- Full JSON:API vs envelope — full spec for compliance, envelope for simplicity
- Relationship links vs data — links for lazy, data for eager-loaded
- Included by default vs via include parameter — include parameter for performance

## Performance Considerations
- JSON:API structure adds ~20% payload overhead vs flat JSON
- Included resources add significant payload for deeply related graphs
- Relationship links add extra URL generation overhead per resource
- Pagination metadata parsing is library-dependent

## Security Considerations
- Never include sensitive attributes in the `attributes` block
- Relationship links must not expose unauthorized related resources
- Included resources must respect authorization — don't include what user can't see
- `jsonapi` version metadata must not expose library version details

## Related Rules
- Set Resource type To Plural kebab-case
- Format id As String
- Wrap Attributes Under attributes Key
- Define relationships With Links
- Include Related Resources In included
- Add jsonapi Top-Level Version Key

## Related Skills
- Envelope Response Design — for custom envelope approach
- Include Related Resources — for relationship loading
- Pagination Metadata Design — for pagination in JSON:API
- OpenAPI Spec Generation — for JSON:API spec documentation

## Success Criteria
- Resource responses follow JSON:API specification
- type, id, attributes, relationships, links keys present
- Related resources in `included`, not nested
- Pagination follows JSON:API specification
- Dedicated resource classes generate consistent output
- JSON:API parsers can consume the API without customization
