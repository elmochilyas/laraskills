# ECC Standardized Knowledge — Endpoint Documentation Content

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Documentation |
| Knowledge Unit | Endpoint Documentation Content |
| Difficulty | Intermediate |
| Category | Documentation |
| Last Updated | 2026-06-02 |

## Overview

Endpoint documentation content describes what each endpoint does, when to use it, what parameters it accepts, what responses it returns, and what errors can occur. Well-written documentation answers five questions: What does it do? What do I send? What do I get? What goes wrong? How do I try it?

## Core Concepts

- **Summary**: Short, imperative description (5-10 words). "List all users." Fits in sidebar.
- **Description**: 2-5 sentence explanation of purpose, side effects, restrictions.
- **Parameters**: Each parameter needs name, location, type, required/optional, default, example, description.
- **Request body**: Content type, schema, example, required fields for POST/PUT/PATCH.
- **Responses**: Per-status-code description, content type, schema, example, headers.
- **Errors**: 400/422, 401, 403, 404, 429, 500 documented per endpoint.
- **operationId**: `resource.action` format (`users.list`). Unique identifier for SDK generation.

## When To Use

- Every endpoint in the API, including error responses
- Public and private API documentation
- SDK generation source material (operationId is required)

## When NOT To Use

- Health check and monitoring endpoints (minimal docs sufficient)
- Internal-only endpoints with no external consumers
- Trivially obvious endpoints (rare — document anyway for consistency)

## Best Practices

- **Five-question model**: What, send, get, errors, example — answer all five per endpoint.
- **Consumer-first writing**: Describe behavior, not implementation. "Creates a user" not "Inserts a SQL record."
- **Progressive disclosure**: Summary (scan) → description (understanding) → details (integration) → examples (copy-paste).
- **operationId convention**: `{resource}.{action}` — `users.list`, `users.create`, `users.show`, `users.update`, `users.delete`.
- **Document all realistic status codes**: Not just 200 — 401, 403, 404, 422, 429, 500.
- **Real copy-pasteable examples**: Consistent data across examples. Include edge cases.
- **Changelog links in descriptions**: Note recent changes in endpoint descriptions.

## Architecture Guidelines

- Summary → OpenAPI `summary` field. Description → OpenAPI `description` field.
- Parameters → OpenAPI `parameters` array. Request body → `requestBody` object.
- Responses → OpenAPI `responses` per status code.
- operationId → OpenAPI `operationId`. Tags → OpenAPI `tags`.
- In Scramble: route names → summaries, controller PHPDoc → descriptions.
- In Scribe: `@group` → tags, `@bodyParam` → parameters, `@response` → responses.

## Performance Considerations

- Documentation content has no runtime impact.
- Spec file size grows with documentation verbosity. Balance completeness with size.

## Security Considerations

- Do not document internal implementation details (SQL, server architecture).
- Error examples should use generic data, not expose real system behavior.
- Review auto-generated summaries for accidental information disclosure.

## Common Mistakes

- **Terse or missing descriptions**: Endpoint assumed self-explanatory. Consumers cannot determine purpose.
- **Documenting implementation, not behavior**: "Inserts record" vs "Creates account." Consumers only care about behavior.
- **Incomplete error documentation**: Only happy-path documented — consumers don't know error shapes.
- **Copy-pasted descriptions**: Similar endpoints share text, subtle differences missed.
- **Stale examples**: Example shows fields that no longer exist — new developers copy invalid data.

## Anti-Patterns

- **Describing what the code does internally**: SQL queries, service calls, implementation details. Consumers don't need this.
- **Skipping error responses**: Every endpoint can fail; document how.

## Examples

- Summary: "Create a new user." Description: "Creates a user account, sends a welcome email, and returns the created user with an authentication token. Rate limited to 10 requests per minute."
- operationId: `users.create`. Tags: `Users`.
- Error refs: `'401': { $ref: '#/components/responses/Unauthorized' }`, `'422': { $ref: '#/components/responses/ValidationError' }`.

## Related Topics

- **Prerequisites**: HTTP Methods and Semantics, REST Resource Design
- **Closely Related**: Request Body Schema Documentation, Response Schema Documentation, Error Response Documentation
- **Advanced**: Changelog Generation, Documentation CI Validation

## AI Agent Notes

When generating endpoint docs: always include summary + description + all parameters + all status codes (including errors) + realistic examples. Use `resource.action` operationId pattern. Write from consumer perspective.

## Verification

Sources: OpenAPI Path Item Object spec, Stripe API Reference, GitHub API docs, domain-analysis.md.
