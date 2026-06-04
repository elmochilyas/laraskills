# Validation Error Format & Return Messages — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | validation-error-format-return-messages |

## Rules

### Rule: Match Error Format to API Contract
- **Condition:** When the API specification defines a specific error response structure
- **Action:** Override `failedValidation()` in FormRequest to match the spec exactly. Use a base FormRequest for consistency.
- **Consequence:** Clients receive errors in the expected format; API contract compliance is maintained.
- **Enforcement:** Contract tests validate error response shape against the API specification.

### Rule: Return All Errors for Form UIs
- **Condition:** When the client is a multi-field form that displays per-field errors
- **Action:** Return all validation errors in one response grouped by field name.
- **Consequence:** Users see all field errors at once; one round-trip validates the entire form.
- **Enforcement:** UX review verifies all field errors are displayed simultaneously.

### Rule: Return First Error for Programmatic APIs
- **Condition:** When the client is an automated system (CLI, integration, machine-to-machine)
- **Action:** Return only the first validation error. Clients fix one error and retry.
- **Consequence:** Simpler client error handling; less information about validation rule structure.
- **Enforcement:** Integration tests verify single error response for automated clients.

### Rule: Include Request Identifier in Error Responses
- **Condition:** When returning validation error responses in production
- **Action:** Include a unique request ID or correlation ID in every error response.
- **Consequence:** Debugging is faster; errors can be correlated with server logs.
- **Enforcement:** Review ensures error responses contain traceable identifiers.

### Rule: Never Leak Internal Rule Details
- **Condition:** When configuring validation error messages
- **Action:** Use generic field-appropriate messages. Avoid revealing specific rule values (regex patterns, exact character limits, DB constraints).
- **Consequence:** Attackers cannot reverse-engineer validation rules from error messages.
- **Enforcement:** Security review reads error messages for information leakage.
