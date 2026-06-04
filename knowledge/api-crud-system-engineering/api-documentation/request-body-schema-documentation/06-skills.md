# Skill: Document Request Body Schemas

## Purpose
Document POST/PUT/PATCH request body schemas in OpenAPI specs mirroring Laravel validation rules, with explicit required fields, complete nested object definitions, enum value descriptions, and full request body examples.

## When To Use
- Every POST, PUT, PATCH endpoint that accepts a request body
- APIs with complex nested payload structures
- APIs consumed by external teams needing precise data contracts
- APIs powering generated SDKs

## When NOT To Use
- GET/DELETE endpoints without request bodies
- Prototype endpoints with rapidly changing payload structure
- Internal endpoints with single consumer who reads code directly

## Prerequisites
- Laravel Form Request validation rules
- JSON Schema basics
- OpenAPI spec structure

## Inputs
- Form Request rule definitions
- List of required vs optional fields
- Enum value definitions with descriptions
- Example request payloads

## Workflow
1. Map each Laravel validation rule to corresponding JSON Schema constraint (`required` → `required: true`, `max:255` → `maxLength: 255`, `email` → `format: email`)
2. Define reusable request schemas in `components/schemas` and reference via `$ref`
3. Document every nesting level of nested objects with explicit `properties` definitions
4. Include every required field name in the schema's `required` array — never rely on descriptions
5. Provide at least one complete JSON request body example per mutation endpoint
6. Document each enum value with a short description of what it represents
7. Auto-generate schemas from Form Requests using Scramble to eliminate drift between validation and documentation

## Validation Checklist
- [ ] Validation rules mirrored in schema constraints (required, maxLength, format, pattern)
- [ ] Reusable schemas in components/schemas with $ref references
- [ ] Nested objects have explicit property definitions at every level
- [ ] Required fields in explicit `required` array
- [ ] Complete request body example per mutation endpoint
- [ ] Enum values documented with descriptions
- [ ] Schemas auto-generated from Form Requests (if using Scramble)

## Common Failures
- Documenting only top-level fields — nested object schemas omitted
- Missing required fields flag — field assumed obviously required
- Constraints without descriptions — field purpose unclear
- Example mismatch with schema — example violates schema constraints
- Schema too permissive — missing maxLength/pattern constraints

## Decision Points
- Schema organization: inline per endpoint vs reusable components with $ref
- Auto-generation: Scramble (from Form Requests) vs manual Scribe annotations
- Polymorphic bodies: oneOf/anyOf/allOf for varying request shapes

## Performance Considerations
- Each request schema adds to OpenAPI spec size; 50 schemas with nested structures can add 5,000-10,000 lines
- Bundle and compress spec for production serving

## Security Considerations
- Review request schemas for sensitive field exposure in example values
- Do not include internal validation implementation details in descriptions
- Ensure nullable fields do not bypass required validation through documentation ambiguity

## Related Rules
- Mirror Validation Rules In Schema Constraints
- Document Every Nesting Level Of Nested Objects
- Always Mark Required Fields Explicitly
- Include A Complete Request Body Example
- Document Enum Values With Descriptions
- Auto-Generate Schemas From Form Requests Using Scramble

## Related Skills
- Document Error Responses
- Document Response Schemas
- Design Form Request Validation

## Success Criteria
- Every validation rule has corresponding JSON Schema constraint
- All nested objects are fully typed with property definitions
- Required fields are explicitly listed in the `required` array
- Complete request examples are provided for every mutation endpoint
- Enum values have descriptions explaining their semantics
- Auto-generated schemas stay in sync with Form Request validation rules
