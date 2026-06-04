# Skill: Write Happy Path API Tests

## Purpose
Write positive scenario tests for each API endpoint covering successful creation, retrieval, update, and deletion with proper assertions on status, structure, and data.

## When To Use
- Every endpoint's primary success case
- Smoke tests for deployment verification
- API contract validation

## When NOT To Use
- Error/edge case testing — separate test methods
- Unit tests — happy path integration tests

## Prerequisites
- Feature test structure
- HTTP endpoint assertions

## Inputs
- Endpoint specifications and expected responses

## Workflow
1. Test successful index: `assertStatus(200)`, paginated `assertJsonCount(15, 'data')`
2. Test successful store: `assertStatus(201)`, `assertJsonStructure([...])`, `assertJsonFragment(...)`
3. Test successful show: `assertStatus(200)`, `assertJson(['data' => ['id' => $model->id]])`
4. Test successful update: `assertStatus(200)`, assert changed field value
5. Test successful destroy: `assertStatus(204)`, assert model deleted in DB
6. Test authenticated access returns data for authorized user
7. Verify response envelope structure for each operation
8. Verify returned data matches what was created/updated
9. Verify related resources loaded where applicable
10. Use factories to create valid test data for each scenario

## Validation Checklist
- [ ] index returns 200 with paginated data
- [ ] store returns 201 with created resource
- [ ] show returns 200 with correct resource
- [ ] update returns 200 with updated data
- [ ] destroy returns 204 and deletes model
- [ ] Authenticated requests succeed
- [ ] Response envelope structure verified
- [ ] Returned data matches input
- [ ] Related resources included where applicable
- [ ] Factories produce valid test data

## Related Skills
- Feature Test Structure
- HTTP Endpoint Assertions
- Authentication Test Patterns
