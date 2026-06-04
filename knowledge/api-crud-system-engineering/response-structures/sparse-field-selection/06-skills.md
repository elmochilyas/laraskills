# Skill: Implement Sparse Field Selection

## Purpose
Implement field selection via `?fields[resource]=id,title,created_at` query parameter using resource-level field whitelist validation, returning only requested fields per JSON:API spec.

## When To Use
- APIs with large resource schemas
- Bandwidth-constrained clients (mobile, IoT)
- Public APIs where consumers need only specific fields

## When NOT To Use
- Internal APIs with fixed response schemas
- Small resource schemas (<5 fields)
- Write-heavy endpoints — field selection is for reads only

## Prerequisites
- API resource transformation
- Query parameter parsing

## Inputs
- Field whitelist per resource type
- Default field set specification

## Workflow
1. Define field whitelist per resource type: `'users' => ['id', 'name', 'email', 'created_at', 'updated_at']`
2. Parse `fields[resource]` query parameter — comma-separated field list
3. Validate requested fields against whitelist — ignore unknown fields silently (per spec) or error
4. Apply field selection in resource transformation: only return whitelisted+requested fields
5. Always include `id` and `type` fields regardless of selection — required for resource identification
6. Return default field set when parameter omitted — full whitelist
7. Handle nested sparse fields: `fields[posts]=id,title` for included relationships
8. Document available fields per resource type
9. Test field selection with valid and invalid field names
10. Combine with include parameter — fields apply to included resources too

## Validation Checklist
- [ ] Field whitelist per resource type defined
- [ ] `fields[resource]` query parameter parsed
- [ ] Requested fields validated against whitelist
- [ ] Unknown fields silently ignored or error
- [ ] `id` and `type` always included regardless of selection
- [ ] Default field set on parameter omission
- [ ] Nested sparse fields for included resources
- [ ] Available fields documented per resource type
- [ ] Tests with valid fields, invalid fields, omission
- [ ] Combines with include parameter

## Common Failures
- No field whitelist — client can request any field including sensitive ones
- Missing `id` and `type` — resource not identifiable
- Nested resources not respecting field filters — included resources return all fields
- Invalid fields returning error — JSON:API spec says ignore unknown, not error
- Field selection not propagated to pagination — inconsistent response structure
- Performance regression — selecting 1 field vs 20 fields loads same data from DB

## Decision Points
- Silent ignore vs error on unknown fields — ignore per JSON:API spec, error for strict contracts
- Default field set — all whitelisted fields vs minimal subset
- DB optimization — load all or use `->select()` for selected fields only

## Performance Considerations
- Field selection primarily reduces payload size, not query time by default
- `->select($selectedFields)` can reduce data transfer from DB but may miss eager-loaded relations
- Consider partial resource loading for memory optimization with large schema
- Payload reduction can be significant (60-80%) for large schemas with selective clients

## Security Considerations
- Whitelist prevents field enumeration and sensitive data access
- Never allow selection on password fields, tokens, or internal metadata
- `id` always included prevents client confusion about which resource they received
- Default field set must exclude sensitive fields

## Related Rules
- Define Field Whitelist Per Resource Type
- Validate Requested Fields Against Whitelist
- Always Include id and type In Response
- Return Default Fields When Parameter Omitted
- Handle Nested Sparse Fields For Included Resources
- Document Available Fields Per Resource Type

## Related Skills
- API Resource Transformation — for resource serialization
- Include Related Resources — for field selection on included
- Envelope Response Design — for overall response structure

## Success Criteria
- Clients select exactly the fields they need via query parameter
- Default response returns full field set without parameter
- Unknown fields silently ignored (per JSON:API)
- `id` always present regardless of selection
- Included resources respect sparse field selection
- Payload size reduced proportionally to selected fields
- Sensitive fields not exposed via field selection
