# Nested Object Validation — Skills

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | nested-object-validation |

## Skills

### Skill: Validate Nested Object Properties
- **Description:** Use dot notation to validate specific properties within a nested object structure.
- **Steps:**
  1. Identify the parent field name and nested property name
  2. Write rules using `parent.property` syntax
  3. Add separate rules for each nested property
- **Context:** Dot notation works for any depth but is most maintainable at 1-2 levels.

### Skill: Validate Arrays of Objects
- **Description:** Use wildcard notation to validate each item in an array uniformly.
- **Steps:**
  1. Validate the array itself: `'items' => ['required', 'array', 'min:1', 'max:100']`
  2. Validate fields across all items: `'items.*.product_id' => ['required', 'integer', 'exists:products,id']`
  3. Validate nested arrays within array items: `'items.*.variants.*.sku' => ['required', 'string']`
- **Context:** Wildcard rules apply to every item; errors use the actual index in messages.

### Skill: Custom Error Messages for Nested Validation
- **Description:** Provide readable custom messages for nested validation errors.
- **Steps:**
  1. Override `messages()` in the FormRequest
  2. Use the dotted field path as the key
  3. Include the field position in the message using `:position` or `:index`
- **Context:** Default messages like `items.0.name.required` are machine-readable but may need human-friendly alternatives.

### Skill: Flatten Overly Nested Payloads
- **Description:** Restructure API payloads to reduce nesting depth.
- **Steps:**
  1. Identify payloads with 3+ levels of nesting
  2. Extract deeply nested structures into separate endpoints
  3. Use UUID references to link related data instead of embedding
- **Context:** Flatter payloads are easier to validate, document, and process.
