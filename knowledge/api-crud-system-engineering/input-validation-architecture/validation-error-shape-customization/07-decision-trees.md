# Decision Trees: Validation Error Shape Customization

## Tree 1: Error Format Selection

```
What API specification does the API follow?
├── JSON:API (spec-compliant) → Use JSON:API error format: errors array with status, code, title, detail, source.pointer.
├── Custom REST API → Use consistent custom envelope. Document format in OpenAPI.
├── Minimal / micro API → Use flat error array: [{ field, message }]. Simple, low overhead.
├── Internal API with first-party clients → Use any consistent format. JSON:API still recommended.
└── Public API with third-party consumers → Use JSON:API. Industry standard with broad tooling support.
```

## Tree 2: Pointer Format For Nested Fields

```
Does the API accept nested payloads (arrays of objects)?
├── YES, JSON:API style → Convert dot-notation to /data/attributes/{path} pointer format.
├── YES, custom nested structure → Convert to JSON pointer notation /{path}/{to}/{field}.
├── YES, deep nesting (3+ levels) → Use full JSON pointer path. Include array indices.
├── NO, flat payload only → Simple field name in pointer or flat error list. No path conversion needed.
└── NO, minimal error output → Field name only. No pointer structure.
```

## Tree 3: Error Message Content

```
Should error messages include validation metadata (min, max)?
├── YES, consumer-friendly APIs → Include constraint info: "Must be at least 3 characters."
├── YES, developer-focused APIs → Include exact constraint: "Minimum length: 3, maximum: 255."
├── NO, security-sensitive APIs → Generic messages only: "Invalid value." Don't reveal constraints.
├── PARTIALLY, for some fields → Custom message per field/rule. Generic for sensitive fields.
└── NO, machine-readable only → Error code + field. No human-readable message. Rarely appropriate.
```

## Tree 4: Localization Strategy

```
Does the API serve a multi-language audience?
├── YES, public API with global audience → Localize messages per Accept-Language. Keep codes in English.
├── YES, but only field names translated → Use attributes() method for field name translation.
├── NO, single language audience → English messages. Consistent regardless of locale.
├── NO, internal API only → English messages. No localization needed.
└── YES, but only for first-party apps → Localize in the app. API returns English + error codes.
```

## Tree 5: Exception Handling for Manual Validation

```
Where does the manual validation error need to be formatted?
├── HTTP context (service layer called from controller) → Throw ValidationException. Let base class error formatter handle it.
├── Non-HTTP context (job, CLI) → Catch ValidationException. Format errors manually for output.
├── Batch processing → Return errors per item. Don't throw. Collect all errors first.
├── Mixed (service may be called from HTTP or CLI) → Throw ValidationException. Caller decides how to format.
└── Third-party API response validation → Log errors. Don't throw. Return validation result to caller.
```
