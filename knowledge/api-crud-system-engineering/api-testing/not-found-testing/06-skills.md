# Skill: Test Not Found Responses

## Purpose
Write feature tests verifying that non-existent resources return 404 for every member route, covering invalid ID shapes, soft-deleted resource access, error body assertions, and database state checks on denied mutations.

## When To Use
- Every resource-member route (show, update, destroy, restore)
- Endpoints using implicit or explicit route model binding
- Endpoints with `findOrFail()` or `firstOrFail()` calls

## When NOT To Use
- Non-existent route paths (404 is expected but not resource-specific)
- Collection index endpoints (empty collection returns 200, not 404)
- Endpoints without resource identifier parameters

## Prerequisites
- Feature test structure
- Route model binding configured
- Soft-delete setup if applicable

## Inputs
- List of resource-member routes
- Non-existent resource IDs for testing
- Soft-delete model factories

## Workflow
1. Test every member route (show, update, destroy, restore) with non-existent resource ID for 404
2. Assert error body structure alongside `assertNotFound()` — not just status code
3. Test invalid ID shapes (string for integer binding, negative numbers, zero) — may throw 500 if misconfigured
4. Test soft-deleted resource access — deleted record exists in DB but returns 404
5. Verify no DB mutation on update/destroy with non-existent ID — assert record count unchanged
6. Use PestPHP datasets to iterate all resource endpoints for compact coverage
7. Ensure consistent 404 error shape across all endpoints (customize globally in exception handler)

## Validation Checklist
- [ ] Every member route (show, update, destroy, restore) tested for 404
- [ ] Error body asserted alongside 404 status
- [ ] Invalid ID shapes tested (string, negative, zero)
- [ ] Soft-deleted resource access returns 404
- [ ] No DB mutation on update/destroy with non-existent ID
- [ ] Consistent 404 error shape across all endpoints

## Common Failures
- Not testing 404 with soft-delete — deleted resource ID exists in DB
- Testing 404 with ID that doesn't match route key type (string UUID vs integer) — may throw 500
- Confusing empty collection (200 with []) with resource not found (404)
- Not testing invalid ID shapes — string UUID for integer binding causes 500

## Decision Points
- Non-existent ID value: 999999 vs UUID vs factory-created-then-deleted
- Error body assertion: per-endpoint vs global exception handler test
- Invalid ID scope: all shapes vs representative sample

## Performance Considerations
- 404 tests are among the cheapest feature tests — no seed data needed
- Maximize coverage by testing with single PestPHP dataset iterating all endpoints

## Security Considerations
- 404 responses must not reveal whether a resource ID once existed or was never created
- Use consistent 404 messages for both missing and soft-deleted resources
- Don't leak table-specific information in 404 messages

## Related Rules
- Test Every Member Route For 404
- Assert Error Body On 404
- Test Invalid ID Shapes
- Test Soft-Deleted Resource Access
- Verify No DB Mutation On Non-Existent Resource Updates

## Related Skills
- Test Error Response Shape
- Test Response Status Code
- Test Authentication Failures

## Success Criteria
- All resource-member routes are covered by 404 tests
- Invalid ID shapes return 404, not 500
- Soft-deleted resources return 404
- Database is not mutated on 404 responses
- 404 error body is consistent across all endpoints
