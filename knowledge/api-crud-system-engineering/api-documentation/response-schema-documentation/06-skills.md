# Skill: Document Response Schemas

## Purpose
Document all response fields including server-generated values with explicit nullable conditions, read-only markers, reusable pagination metadata, and CI-validated schemas that match actual API output.

## When To Use
- Every endpoint that returns data
- APIs consumed by external teams building client applications
- APIs powering generated SDKs (response models are SDK outputs)
- APIs requiring contract testing against documented schemas

## When NOT To Use
- Endpoints returning binary streams (document as `type: string, format: binary`)
- Prototype endpoints with rapidly changing response shapes
- Internal-only utility endpoints

## Prerequisites
- Laravel API Resources or equivalent transformation layer
- JSON Schema basics
- OpenAPI spec structure

## Inputs
- API Resource definitions
- List of response fields including server-generated ones (id, timestamps)
- Pagination metadata schema
- Conditional field inclusion rules

## Workflow
1. Include every response field in the schema — including `id`, `created_at`, `updated_at`, and other server-generated values
2. Set `readOnly: true` on server-generated fields to distinguish from consumer-settable fields
3. Set `nullable: true` on every property that can be null with description explaining when/why
4. Define reusable pagination metadata schema in `components/schemas/PaginationMeta` for all paginated responses
5. Provide response examples per status code (200 success, 201 created, 422 validation, 404 not found)
6. Document conditional field availability — describe permissions or parameters that include/exclude fields
7. Write contract tests asserting actual API response payloads match documented schemas

## Validation Checklist
- [ ] Every response field documented including server-generated ones
- [ ] `readOnly: true` on id, created_at, updated_at, deleted_at
- [ ] `nullable: true` with conditions on nullable properties
- [ ] Reusable PaginationMeta schema for all paginated responses
- [ ] Response examples per status code
- [ ] Conditional field availability documented in descriptions
- [ ] Contract tests verify schemas match actual responses

## Common Failures
- Documenting only successful responses — consumers don't know error shapes
- Forgetting read-only fields — consumers try to send server-generated values
- Inconsistent nesting with actual response — contract tests catch this
- Omitting nullable responses — consumers don't handle null safely
- Pagination metadata inconsistency — define reusable schema

## Decision Points
- Response wrapper: data envelope vs bare body vs JSON:API format
- Pagination metadata: current_page/per_page/total vs cursor-based format
- Conditional fields: sparse fieldsets vs relationship includes vs permission-based

## Performance Considerations
- Response schemas form largest portion of OpenAPI spec; 30 resources with nested relationships can add 15,000-20,000 lines
- Use `$ref` aggressively to reduce duplication

## Security Considerations
- Review response schemas for accidental exposure of internal fields (password hashes, pivot data, internal IDs)
- Document conditional field availability based on permissions/roles
- Do not include production data in example values

## Related Rules
- Document Every Response Field Including Server-Generated Ones
- Mark Nullable Fields Explicitly With Conditions
- Mark Read-Only Properties With readOnly: true
- Define A Reusable Pagination Schema
- Validate Response Schemas Against Actual Responses In CI
- Document Conditional Field Availability

## Related Skills
- Document Error Responses
- Document Request Body Schemas
- Design API Resource Transformation

## Success Criteria
- All response fields are documented including server-generated values
- Read-only and nullable fields are explicitly marked
- Pagination metadata is consistent across all paginated endpoints
- Response examples exist for success and error status codes
- Conditional field behavior is documented in field descriptions
- Contract tests verify documented schemas match actual API output
