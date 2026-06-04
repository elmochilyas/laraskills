# ECC Anti-Patterns — Request Body Schema Documentation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | Request Body Schema Documentation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Schema Permissive Beyond Server Validation
2. Undocumented Nested Object Structures
3. Required Fields Not in `required` Array
4. No Complete Request Body Example
5. Enum Values Without Semantic Descriptions

---

## Repository-Wide Anti-Patterns

- Magic Numbers
- Divergent Change

---

## Anti-Pattern 1: Schema Permissive Beyond Server Validation

### Category
Reliability

### Description
Documenting request body schemas with constraints that are looser than the server's actual validation rules — omitting maxLength, pattern, minimum, or uniqueness constraints — so payloads that pass schema validation fail server validation.

### Why It Happens
Schemas are documented independently from validation rules. When a Form Request rule changes (e.g., `max:255` → `max:100`), the schema is not updated. Auto-generation tools like Scramble reduce this risk, but manual schemas or annotations in Scribe are commonly missed during validation rule changes.

### Warning Signs
- Consumers report "the documentation says this should work but the API returns 422"
- Schema has `type: string` but no `maxLength` constraint
- Form Request has `regex` patterns not reflected in schema `pattern` field
- Schema missing `minLength`, `minimum`, `maximum` constraints present in validation rules
- `unique` validation rules have no corresponding description in schema
- Consumers send valid-by-schema payloads that are rejected by the server

### Why It Is Harmful
Schema-rule mismatch is the most common documentation bug. Consumers trust the documented schema as the source of truth. When payloads that pass schema checks are rejected by the server, consumers perceive the API as broken or unreliable. Every mismatch generates a support ticket and erodes trust.

### Real-World Consequences
The `email` field is documented as `{type: string, format: email}` but the Form Request also enforces `max:100`. A consumer sends a valid email that is 200 characters long. It passes schema validation. The server returns 422: "The email must not be greater than 100 characters." The consumer files a support ticket. The team traces the issue to the missing `maxLength: 100`.

### Preferred Alternative
Mirror every validation rule as a JSON Schema constraint. Map `required` → `required: true`, `max:255` → `maxLength: 255`, `email` → `format: email`, `regex:/^[a-z]+$/` → `pattern: ^[a-z]+$`.

### Refactoring Strategy
1. Compare every Form Request rule against its documented schema constraint
2. Add missing constraints: maxLength, minLength, pattern, minimum, maximum
3. For business-rule-only validations (unique, exists), document in the field description
4. Use Scramble auto-generation to eliminate this drift permanently
5. Add CI validation that checks schema constraints match Form Request rules

### Detection Checklist
- [ ] Compare maxLength/max constraints between Form Request and schema
- [ ] Verify regex patterns in Form Request have corresponding `pattern` in schema
- [ ] Check that required fields in Form Request are in schema `required` array
- [ ] Confirm `unique` and `exists` rules are documented in field descriptions
- [ ] Test payload that is valid-by-schema but invalid-by-validation — expect clear error

### Related Rules
- Mirror Validation Rules In Schema Constraints (05-rules.md)

### Related Skills
- Document Request Body Schemas (06-skills.md)

### Related Decision Trees
- Schema Source — Auto-Generated vs Manually Curated (07-decision-trees.md)

---

## Anti-Pattern 2: Undocumented Nested Object Structures

### Category
Documentation

### Description
Defining nested object properties as `type: object` without specifying their internal `properties`, `required` fields, or constraints — forcing consumers to guess the nested structure.

### Why It Happens
Nested objects are more work to document than flat schemas. Developers document the top-level fields (they are visible in the request body) but skip nested objects because they "should be obvious." Auto-generation tools sometimes produce untyped object placeholders when the validation rule uses `array` or `json` without specifying the child structure.

### Warning Signs
- Schema has `address: { type: object }` with no `properties`
- Nested object fields are documented only in examples, not in the schema
- Consumers send incorrect nested payloads and receive 422 errors
- SDK generators produce `Record<string, any>` for nested objects
- Code review shows `type: object` without property definitions
- Nested validation errors reveal field names not documented in the schema

### Why It Is Harmful
Undocumented nested objects are the #1 source of "the request body is confusing" consumer complaints. Without explicit property definitions, consumers cannot construct valid nested payloads without trial and error. SDK codegen produces untyped maps, eliminating the type safety that OpenAPI enables. Every nesting level without documentation multiplies the guesswork for consumers.

### Real-World Consequences
The `CreateUserRequest` schema has `preferences: { type: object }` with no properties. The actual API expects `{ language: string, timezone: string, marketing_consent: boolean, theme: "light" | "dark" }`. A consumer building an iOS app sends `{ language: "en", theme: "auto" }`. The API returns 422: "The selected theme is invalid. The timezone field is required." The consumer must iterate through error messages to discover the full structure.

### Preferred Alternative
Define every nested object with explicit `properties` at all nesting levels, including types, constraints, descriptions, and a `required` array.

### Refactoring Strategy
1. Identify every `type: object` without `properties` in request schemas
2. Trace the actual expected structure from Form Request validation rules
3. Add complete `properties` definitions with types, constraints, and descriptions
4. Add `required` arrays for mandatory nested fields
5. Add `example` nested payloads that match the schema

### Detection Checklist
- [ ] Search for `type: object` without `properties` in request schemas
- [ ] Compare documented nested fields against actual validation rules
- [ ] Verify SDK generator produces typed nested objects
- [ ] Test that consumers can construct valid nested payloads from schema alone
- [ ] Confirm nested `required` fields are explicitly listed

### Related Rules
- Document Every Nesting Level Of Nested Objects (05-rules.md)

### Related Skills
- Document Request Body Schemas (06-skills.md)

### Related Decision Trees
- Schema Structure — Flat vs Nested (07-decision-trees.md)

---

## Anti-Pattern 3: Required Fields Not in `required` Array

### Category
Documentation

### Description
Relying on field descriptions or conventions ("all fields are required unless stated otherwise") instead of the explicit `required` array in the schema, so tooling and consumers treat required fields as optional.

### Why It Happens
Developers assume that saying "this field is required" in the description is sufficient. They may not know that OpenAPI tooling reads only the `required` array. In some editors, the `required` array is easy to forget because it is a separate array from `properties`.

### Warning Signs
- Schema has no `required` array, but descriptions say "required field"
- Consumers omit required fields and receive 422 errors
- SDK generator output makes all fields optional in constructors
- Validation errors reveal missing required fields not marked as required in schema
- Some schemas have `required` arrays, others do not — inconsistent

### Why It Is Harmful
OpenAPI consumers and SDK generators check the `required` array programmatically. A required field documented only in a description is invisible to tooling. Generated SDKs make the field optional, so the consumer's code compiles successfully but fails at runtime. Every missing required field creates a 422 error that could have been prevented at compile time.

### Real-World Consequences
The `name` field is described as "The user's full name (required)" but is not in the `required` array. A consumer generates a TypeScript SDK. The `CreateUserRequest` interface has `name?: string` (optional). The consumer sends a request without `name`. The API returns 422. The consumer's type-safe code compiled, but the runtime failed because the SDK generated an incorrect contract.

### Preferred Alternative
Include every required field name in the schema's `required` array. Never rely on descriptions or conventions to communicate requirement.

### Refactoring Strategy
1. Audit every request schema for missing `required` arrays
2. Compare each schema's required fields against the Form Request rules
3. Add complete `required` arrays to all request schemas
4. Remove any "required" notes from descriptions (the `required` array replaces them)
5. Add a CI lint rule that flags schemas without explicit `required` arrays

### Detection Checklist
- [ ] Count schemas with missing or empty `required` arrays
- [ ] Compare `required` array entries against Form Request `required` rules
- [ ] Check that field descriptions do not duplicate `required` status
- [ ] Verify SDK generator produces required fields as non-optional
- [ ] Test that omitting a required field fails schema validation

### Related Rules
- Always Mark Required Fields Explicitly (05-rules.md)

### Related Skills
- Document Request Body Schemas (06-skills.md)

### Related Decision Trees
- Schema Source — Auto-Generated vs Manually Curated (07-decision-trees.md)

---

## Anti-Pattern 4: No Complete Request Body Example

### Category
Documentation

### Description
Providing only per-property examples (showing the format of individual fields) without a complete JSON request body example that shows how all fields compose into a working payload.

### Why It Happens
Schema documentation tools generate per-property examples by default. A "complete example" requires an additional step of writing a JSON/XML block. Teams may not realize that consumers need to see the full payload structure, not just individual field formats.

### Warning Signs
- Schema has per-property `example` fields but no top-level `example` on the request body
- Consumers ask "can you show me a full request body?"
- Integration time from documentation to first successful API call is more than 30 minutes
- First consumer API call always returns 422 due to structural errors
- Example is an incomplete snippet showing only a few fields

### Why It Is Harmful
Developers building integrations start by copy-pasting examples. Without a complete example, they must mentally compose individual field examples into a full payload — a process that introduces structural errors. Every integration's first call fails not because the concept is hard, but because the documentation didn't provide a working model.

### Real-World Consequences
A consumer building a Python integration studies the `CreateUserRequest` schema. Each field has an example: `name: "Jane Doe"`, `email: "jane@example.com"`, `address: { ... }` as a per-property example. The consumer writes a payload combining these. They miss that `address` requires a nested `country` field that was shown in the per-property example but the consumer assumed it was optional. The first API call returns 422. The consumer spends 20 minutes debugging.

### Preferred Alternative
Provide at least one complete JSON request body example per mutation endpoint that matches the schema exactly, including all required and representative optional fields.

### Refactoring Strategy
1. For each mutation endpoint, construct a complete request body payload
2. Verify the payload passes schema validation
3. Add it as `example` in the `requestBody` content section
4. Include both a minimal (required only) and a full (all fields) example for complex endpoints
5. Validate the example against the schema in CI

### Detection Checklist
- [ ] Count mutation endpoints with complete request body examples
- [ ] Verify examples include all required fields
- [ ] Check that example values are realistic and consistent
- [ ] Validate examples against their schema
- [ ] Test that copy-pasting the example produces a successful API call

### Related Rules
- Include A Complete Request Body Example (05-rules.md)

### Related Skills
- Document Request Body Schemas (06-skills.md)

### Related Decision Trees
- Schema Structure — Flat vs Nested (07-decision-trees.md)

---

## Anti-Pattern 5: Enum Values Without Semantic Descriptions

### Category
Documentation

### Description
Listing enum values in the schema without explaining what each value means, leaving consumers to guess the semantics of each option.

### Why It Happens
It is easy to list enum values (`admin`, `editor`, `viewer`) and assume their meanings are self-evident. However, the distinction between `editor` and `viewer` may be subtle, and the permissions associated with each role are not obvious from the name alone.

### Warning Signs
- Enum properties have no description explaining each value's meaning
- Consumers select incorrect enum values in integration
- Support questions ask "what's the difference between admin and editor?"
- Documentation has enum lists without any context
- Enum values are technical identifiers (`role_1`, `role_2`) that convey no meaning
- Authorization errors result from incorrect role selection

### Why It Is Harmful
Undocumented enum values force consumers to guess the semantics of each option. They may pick a role with too many permissions (security risk) or too few (application won't work). Each incorrect selection generates a support ticket or, worse, a production permission issue that goes undetected until it causes a problem.

### Real-World Consequences
The `role` field has `enum: [admin, editor, viewer]` with no descriptions. A consumer selects `admin` because "it sounds like the most capable option." The consumer's integration now runs with full system access. A security audit later flags the over-permissioned integration. The consumer's application never needed admin access — they just didn't know what `editor` actually meant.

### Preferred Alternative
For every enum property, list each allowed value with a short description of what it represents, including the permissions or capabilities associated with that value.

### Refactoring Strategy
1. Identify every enum property in request schemas
2. For each enum value, write a one-sentence description of its meaning
3. Add the descriptions to the field's `description` in the schema
4. Use multiline descriptions or markdown lists to clearly map values to meanings
5. Include enum descriptions in the complete request example

### Detection Checklist
- [ ] Search for `enum` properties without value descriptions
- [ ] Verify each enum value has an explanation of its semantics
- [ ] Check that descriptions distinguish between similar-sounding values
- [ ] Confirm examples use enum values consistent with their described semantics
- [ ] Test that consumers can select the correct value from documentation alone

### Related Rules
- Document Enum Values With Descriptions (05-rules.md)

### Related Skills
- Document Request Body Schemas (06-skills.md)

### Related Decision Trees
- Schema Source — Auto-Generated vs Manually Curated (07-decision-trees.md)

---

