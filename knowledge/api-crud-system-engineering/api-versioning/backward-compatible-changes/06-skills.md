# Skill: Add Backward-Compatible Changes

## Purpose
Add new fields, endpoints, enum values, and query parameters without breaking existing consumers by following Postel's Law — be conservative in what you send, liberal in what you accept.

## When To Use
- Adding optional fields to existing API responses
- Adding new endpoints alongside existing ones
- Expanding enum values (append-only)
- Relaxing validation rules (required to nullable)
- Adding new query parameters with default behavior

## When NOT To Use
- Removing or renaming existing fields
- Changing field types or semantics
- Making optional fields required
- Changing error response format
- Modifying existing endpoint behavior without defaults

## Prerequisites
- Understanding of API contract stability
- Laravel API Resources

## Inputs
- Field specifications for new additions
- Existing API contract documentation

## Workflow
1. Add new response fields with null default — `?? null` fallback in resources
2. Use `$this->when()` in API resources for conditional field inclusion
3. Default new query parameters to existing behavior — existing clients don't send them
4. Expand enums append-only — never reorder or remove existing values
5. Add new endpoints alongside existing ones without modifying existing route paths
6. Relax validation rules — `nullable|sometimes` instead of tightening
7. Mark deprecated fields with response hint — `"deprecated": true` adjacent to field
8. Document new fields as "added in version X" in API documentation

## Validation Checklist
- [ ] New fields added with null defaults (not required)
- [ ] New query parameters have default matching existing behavior
- [ ] Enum expansions are append-only
- [ ] New endpoints don't modify existing route structures
- [ ] Validation relaxed not tightened
- [ ] Documentation updated with "added in version X" notes
- [ ] Existing consumer tests pass without modification

## Common Failures
- Adding field without default — clients get null unexpectedly
- Adding required query parameter — existing clients get 422
- Expanding enum with reordered values — clients break on switch statements
- Adding non-null default that changes existing behavior

## Decision Points
- Conditional vs unconditional field — use `$this->when()` for optional, include directly for core contract
- New endpoint vs query parameter — new endpoint for distinct resource, parameter for filtering
- Append vs restructure enum — always append, never restructure

## Performance Considerations
- `$this->when()` adds negligible overhead (~0.01ms per condition)
- New query parameters don't affect request processing unless read
- New endpoints don't impact existing route lookups

## Security Considerations
- New fields with null defaults are safe — don't expose unintended data
- Validate new query parameters to prevent injection through new paths
- Never add fields containing sensitive data without auth checks

## Related Rules
- Add New Fields With Null Default
- Use `$this->when()` For Conditional Fields
- Default New Parameters To Existing Behavior
- Expand Enums Append-Only
- Relax Validation Never Tighten
- Add New Endpoints Without Modifying Existing Routes

## Related Skills
- Breaking Change Identification — detecting what is not backward-compatible
- When To Create New Version — deciding when backward-compatible is insufficient
- Resource Class Organization — versioned resource patterns

## Success Criteria
- New fields return null by default for existing clients
- New endpoints work alongside old without conflicts
- Enum expansions never break existing switch statements
- Validation changes never break existing valid requests
- All changes pass existing consumer test suites