# Phase 5: Rules — Request Body Schema Documentation

## Mirror Validation Rules In Schema Constraints
---
## Category
Reliability
---
## Rule
Every Laravel validation rule on a Form Request must have a corresponding JSON Schema constraint in the documented request schema. Map `required` → `required: true`, `max:255` → `maxLength: 255`, `email` → `format: email`.
---
## Reason
Schema-rule mismatch is the leading cause of "the documentation says this should work but the API rejects it" consumer issues. Validating against documentation that is more permissive than the server causes integration failures that appear to be consumer errors but are actually documentation errors.
---
## Bad Example
```php
// Form Request
'email' => ['required', 'email', 'max:255', 'unique:users']
// OpenAPI schema
email:
  type: string
  # No maxLength, no uniqueness mention
```
---
## Good Example
```yaml
email:
  type: string
  format: email
  maxLength: 255
  description: Must be unique — will receive 422 if email is already taken.
```
---
## Exceptions
Business-logic-only rules with no OpenAPI equivalent (e.g., "subscription plan must be active"). Document these in the description.
---
## Consequences Of Violation
Consumers send payloads that pass documented schema but fail server validation; trust in documentation erodes; support volume increases.
---

## Document Every Nesting Level Of Nested Objects
---
## Category
Documentation
---
## Rule
Explicitly define all nested object properties in the schema. Do not use `type: object` without a `properties` definition at any nesting level.
---
## Reason
Undocumented nested properties force consumers to guess the internal structure or reverse-engineer it from error messages. SDK generators produce `Map<string, any>` for undocumented nested objects, eliminating type safety.
---
## Bad Example
```yaml
address:
  type: object
  # No properties defined — consumers guess the structure
```
---
## Good Example
```yaml
address:
  type: object
  properties:
    street: { type: string, maxLength: 255, description: "Street address line 1" }
    city: { type: string, maxLength: 100 }
    postal_code: { type: string, maxLength: 20 }
    country: { type: string, maxLength: 2, description: "ISO 3166-1 alpha-2 country code" }
  required: [street, city, country]
```
---
## Exceptions
Truly dynamic objects with arbitrary keys where properties genuinely cannot be enumerated (e.g., metadata maps). Document the key/value types.
---
## Consequences Of Violation
Consumers send incorrect nested structures; SDK codegen produces untyped maps; integration failures cascade from the first nested request.
---

## Always Mark Required Fields Explicitly
---
## Category
Documentation
---
## Rule
Include every required field name in the schema's `required` array. Never rely on descriptions or conventions to communicate requirement.
---
## Reason
OpenAPI consumers and SDK generators check the `required` array programmatically. Required fields documented only in descriptions are invisible to tooling, so generated clients will not enforce them at compile time, and consumers will omit them.
---
## Bad Example
```yaml
properties:
  name: { type: string }
  email: { type: string, format: email }
# No required array — consumer assumes all fields optional
```
---
## Good Example
```yaml
required: [name, email]
properties:
  name: { type: string, description: "User's full name" }
  email: { type: string, format: email }
```
---
## Exceptions
No common exceptions. Every request schema must have an explicit `required` array.
---
## Consequences Of Violation
Consumers omit required fields; each omitted field generates a 422 error that could have been prevented at development time.
---

## Include A Complete Request Body Example
---
## Category
Documentation
---
## Rule
Provide at least one complete JSON request body example per mutation endpoint that matches the schema exactly, including all required and representative optional fields.
---
## Reason
Per-property examples show the format of individual fields but not how they compose into a complete payload. A full example gives consumers a working model they can copy, modify, and send with confidence.
---
## Bad Example
```yaml
requestBody:
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/CreateUserRequest'
      # No example — consumer must construct payload from property descriptions
```
---
## Good Example
```yaml
requestBody:
  content:
    application/json:
      schema:
        $ref: '#/components/schemas/CreateUserRequest'
      example:
        name: "Jane Doe"
        email: "jane@example.com"
        password: "securePassword123"
        role: "editor"
        preferences:
          language: "en"
          notifications: true
```
---
## Exceptions
No common exceptions. Every mutation endpoint needs a complete example.
---
## Consequences Of Violation
Integration time increases as consumers must construct payloads from scattered property descriptions; first API call is always a 422.
---

## Document Enum Values With Descriptions
---
## Category
Documentation
---
## Rule
For every enum property, list each allowed value with a short description of what it represents.
---
## Reason
Enums without descriptions are opaque — consumers see allowed values but not their semantics. Descriptions like `"admin" — Full system access with all permissions` vs `"editor" — Can create and edit content but cannot manage users` enable informed selection.
---
## Bad Example
```yaml
role:
  type: string
  enum: [admin, editor, viewer]
  # No explanation of what each role means
```
---
## Good Example
```yaml
role:
  type: string
  enum: [admin, editor, viewer]
  description: |
    - `admin`: Full system access with all permissions
    - `editor`: Create and edit content, manage own profile
    - `viewer`: Read-only access to published content
```
---
## Exceptions
Self-explanatory enums (e.g., `gender: [male, female, other]`). When in doubt, add descriptions.
---
## Consequences Of Violation
Consumers select wrong enum values; permissions issues arise from incorrect role assignment; support volume increases.
---

## Auto-Generate Schemas From Form Requests Using Scramble
---
## Category
Framework Usage
---
## Rule
Use Scramble to auto-generate request body schemas from Laravel Form Request validation rules rather than maintaining schemas manually.
---
## Reason
Manually maintained request schemas drift from validation rules. Scramble reads `rules()` methods directly and generates matching JSON Schema, eliminating the most common source of documentation-vs-implementation mismatch for request bodies.
---
## Bad Example
```php
// Manually maintained OpenAPI schema
// Schema says maxLength: 100 but Form Request says max:50
```
---
## Good Example
```php
// Form Request — single source of truth
public function rules(): array
{
    return [
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'max:255', 'unique:users'],
    ];
}
// Scramble auto-generates: maxLength: 255, format: email, etc.
```
---
## Exceptions
Pure schema-first projects where the spec is designed before any code is written.
---
## Consequences Of Violation
Form Request validation rules and documentation schema diverge; consumers receive 422 errors for payloads that pass documented schema checks.
---
