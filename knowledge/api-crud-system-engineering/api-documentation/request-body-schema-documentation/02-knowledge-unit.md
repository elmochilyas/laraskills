# Request Body Schema Documentation

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Documentation
- **Knowledge Unit:** Request Body Schema Documentation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Request body schema documentation describes the structure, constraints, and semantics of data that clients send to API endpoints. In OpenAPI, this is represented under `requestBody` → `content` → `application/json` → `schema`. The schema defines which properties are allowed, which are required, their types, formats, validation constraints, and examples.

Well-documented request bodies reduce integration errors by making the precise data contract visible to consumers. In Laravel, request body schemas are derived from Form Request validation rules (via Scramble) or manually documented via `@bodyParam` annotations (via Scribe). The schema should mirror the validation rules exactly, including nullable fields, string lengths, array constraints, and nested object structures.

---

## Core Concepts

### Schema Components
Each request body property should document:
- **Name** — Property key in the JSON body
- **Type** — JSON Schema type (string, integer, number, boolean, array, object)
- **Format** — Subtype qualifier (email, date, date-time, uuid, uri)
- **Required/Optional** — Whether the property must be present
- **Nullable** — Whether the property can be `null`
- **Constraints** — minLength, maxLength, minimum, maximum, pattern, enum
- **Description** — What the property represents
- **Example** — A concrete valid value
- **Default** — Value used if property is omitted

### Nested Object Schemas
Request bodies commonly contain nested objects and arrays. Each nesting level must be documented:

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [name, email, address]
        properties:
          name: { type: string, maxLength: 255 }
          address:
            type: object
            properties:
              street: { type: string }
              city: { type: string }
```

### Array Constraints
For array properties, document:
- Item type and shape
- minItems / maxItems
- uniqueItems (if applicable)

### Polymorphic Request Bodies
When an endpoint accepts varying request shapes (oneOf, anyOf, allOf), document each variant with its distinguishing field and expected structure.

---

## Mental Models

### Schema Mirroring Validation
The request body schema in documentation should be a machine-readable version of the server's validation rules. Every `required` rule becomes a `required` property; every `max:255` becomes `maxLength: 255`. The schema is the validation rules published as a contract.

### Consumer's Lens
Document from the consumer's perspective: "What do I need to send to make this work?" rather than "What does the server validate?" Include examples, defaults, and notes about behavior when optional fields are omitted.

### Flat vs Nested Decisions
The choice between flat request bodies (all properties at top level) and nested structures (address.city) affects documentation complexity. Flat bodies are easier to document but may not reflect domain relationships. Nested bodies require deeper schema documentation but better represent the domain model.

---

## Internal Mechanics

### Form Request → Schema Translation
Scramble translates Laravel validation rules to JSON Schema:

| Laravel Rule | JSON Schema Constraint |
|---|---|
| `required` | `required: true` |
| `string` | `type: string` |
| `max:255` | `maxLength: 255` |
| `min:3` | `minLength: 3` |
| `email` | `format: email` |
| `integer` | `type: integer` |
| `numeric` | `type: number` |
| `in:foo,bar` | `enum: [foo, bar]` |
| `array` | `type: array` |
| `nullable` | `type: [string, null]` or `nullable: true` |

### Manual Schema Authoring (OpenAPI)
When writing request schemas manually:

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/CreateUserRequest'
```

The schema is defined in `components/schemas` and referenced, promoting reuse across endpoints.

### Scramble's Form Request Analysis
Scramble reflects on the Form Request class and:
1. Calls `rules()` to get validation rules
2. Maps each rule to OpenAPI schema keywords
3. Inspects `messages()` for description text
4. Reads PHPDoc property annotations for descriptions

### Scribe's @bodyParam Annotation
Scribe documents request body fields via annotations:

```php
/**
 * @bodyParam name string required User's full name. Example: John Doe
 * @bodyParam email string required User's email address. Example: john@example.com
 * @bodyParam roles integer[] Array of role IDs. Example: [1, 2]
 */
```

---

## Patterns

### Define Reusable Request Schemas
Define all reusable request bodies in `components/schemas/`:

```yaml
components:
  schemas:
    CreateUserRequest:
      type: object
      properties:
        name: { $ref: '#/components/schemas/UserName' }
        email: { $ref: '#/components/schemas/EmailAddress' }
```

### Consistent Nullable Handling
Use `type: [string, null]` (OpenAPI 3.1) or `nullable: true` (OpenAPI 3.0) consistently across all nullable fields.

### Enums Documented with Descriptions
For enum fields, document each value:

```yaml
status:
  type: string
  enum: [active, inactive, suspended]
  description: |
    - `active` - Account is fully operational
    - `inactive` - Account exists but cannot be used
    - `suspended` - Account temporarily disabled
```

### Example Objects
Include a complete request body example at the path level, not just per-property examples:

```yaml
requestBody:
  content:
    application/json:
      example:
        name: Jane Doe
        email: jane@example.com
        role: admin
```

---

## Architectural Decisions

### Reusable vs Inline Schemas
Reusable schemas promote consistency and reduce duplication. Inline schemas are simpler for endpoints with unique request shapes. Decision: Use reusable schemas for domain entities (User, Post, Comment); use inline schemas for one-off request structures (search filters, batch operations).

### Flat vs Nested Request Structures
Flat structures (all properties at top level) simplify documentation and client code. Nested structures (address.city, address.zip) model domain relationships. The documentation follows the code: if the Form Request uses nested validation rules, document nested schemas.

### Versioned Request Schemas
When a new API version changes request structure, create a new schema component (`CreateUserRequestV2`) rather than modifying the existing one. This preserves backward compatibility in documentation.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Precise schema reduces integration errors | Maintaining detailed schemas is time-consuming | Auto-generation (Scramble) reduces cost |
| Reusable schemas promote consistency | Schema refactoring affects multiple endpoints | Versioning schemas adds complexity |
| Examples help consumers get started quickly | Examples can become stale | Regenerate examples in CI |
| Nested schemas model domain accurately | Deeply nested schemas are hard to read | Limit nesting to 3-4 levels |

---

## Performance Considerations

### Schema File Size
Each request schema adds to the OpenAPI spec size. 50 request schemas with nested structures can add 5,000-10,000 lines. Bundle and compress the spec for production serving.

---

## Production Considerations

### Schema Validation in CI
Validate that request body schemas match Form Request validation rules. Use contract tests that verify the documented schema accepts/rejects the same payloads as the actual validation.

### Schema Version History
When request schemas change, maintain the old schema as a separate component for historical documentation. Document the deprecation and migration path.

---

## Common Mistakes

### Documenting Only Top-Level Fields
Why it happens: Nested object schemas are more complex to write. Why it's harmful: Consumers don't know the structure of nested objects. Better approach: Document every nesting level explicitly.

### Missing Required Fields Flag
Why it happens: Developer assumes a field is obviously required. Why it's harmful: Consumers omit the field and get 422 errors. Better approach: Explicitly list required fields in the schema.

### Constraints Without Descriptions
Why it happens: String constraints (maxLength) are documented but what the field represents is not. Why it's harmful: Consumers don't know what to put in the field. Better approach: Always include a description alongside constraints.

### Example Mismatch with Schema
Why it happens: Example written before schema or vice versa. Why it's harmful: Consumers mix up example and constraint, sending invalid requests. Better approach: Validate examples against the schema in CI.

---

## Failure Modes

### Schema Too Permissive
The documented schema allows values that the server rejects (missing a `maxLength` or `pattern`). Failure mode: Consumers send requests that pass documentation validation but fail server validation, causing confusion.

### Schema Too Restrictive
The documented schema rejects values that the server would accept (extra enum values, wrong type). Failure mode: Consumers over-constrain their requests, missing valid integration paths.

### Nested Schema Omission
A Form Request validates `address.street`, but the documentation shows the top-level only. Failure mode: Consumers send requests without nested structures and get 422 errors.

---

## Ecosystem Usage

### Stripe API Request Schemas
Stripe documents every request parameter with type, description, and whether it's required. Optional parameters clearly state defaults. Nested objects are expanded inline with full documentation.

### GitHub API Request Schemas
GitHub uses `$ref` extensively for reusable request schemas. Required fields are clearly marked. GitHub also documents which parameters are mutually exclusive.

### Twilio API Request Schemas
Twilio documents request parameters in tables with clear examples. Complex request bodies include multiple examples showing different valid combinations.

---

## Related Knowledge Units

### Prerequisites
- JSON Schema Basics — type system, constraints, composition keywords
- Laravel Form Request Design — Rules, messages, authorization

### Related Topics
- Response Schema Documentation — Mirror documentation of response structures
- Error Response Documentation — Documenting validation error shapes
- Endpoint Documentation Content — Where request schemas fit in endpoint docs

### Advanced Follow-up Topics
- Polymorphic Request Schemas — oneOf/anyOf for varying request shapes
- Request Body Versioning — Managing schema evolution across API versions

---

## Research Notes

### Source Analysis
- JSON Schema Validation: https://json-schema.org/understanding-json-schema — Reference for schema constraint keywords
- OpenAPI 3.1 Request Body Object: https://spec.openapis.org/oas/v3.1.0#request-body-object

### Key Insight
The request body schema is the machine-readable version of the server's validation rules. When these drift apart, integration failures increase. Auto-generation (Scramble) eliminates this drift entirely.

### Version-Specific Notes
- OpenAPI 3.1: `example` and `examples` fields for request bodies
- OpenAPI 3.0: Only `example` (singular), not `examples`
- Scramble v0.10+: Form Request rule → schema translation with rule coverage
