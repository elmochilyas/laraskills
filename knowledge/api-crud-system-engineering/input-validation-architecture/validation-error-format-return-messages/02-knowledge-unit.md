# Knowledge Unit: Validation Error Format & Return Messages

## Metadata

- **ID:** api-crud-system-engineering/input-validation-architecture/validation-error-format-return-messages
- **Domain:** API CRUD System Engineering
- **Subdomain:** Input Validation Architecture
- **Slug:** api-crud-system-engineering-input-validation-architecture-validation-error-format-return-messages
- **Version:** 1.0.0
- **Maturity:** Generated
- **Status:** Published

## Executive Summary

Validation error format determines how validation failures are communicated back to API clients. Laravel's default format returns errors keyed by field: `{ message: "...", errors: { field: ["message1", "message2"] } }`. Customizing this format is critical for API contracts that require specific error structures (JSON:API, custom schemas) and for client-side error mapping. The choice between returning all errors vs first error only affects UX, security, and round-trip efficiency.

