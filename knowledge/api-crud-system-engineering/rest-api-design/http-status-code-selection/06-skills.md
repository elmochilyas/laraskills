# Skill: Select HTTP Status Codes

## Purpose
Select correct HTTP status codes per endpoint and error type: 200 for success, 201 for created, 204 for deleted, 301 for moved, 400 for bad request, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict, 422 validation error, 429 rate limited, 500 server error.

## When To Use
- Every API response
- Error response design
- API contract specification

## When NOT To Use
- Non-API responses (web, CLI)

## Prerequisites
- HTTP response code knowledge
- API operation semantics

## Workflow
1. 200 OK for successful GET (show/index) and PUT/PATCH (update)
2. 201 Created for successful POST (store) — include `Location` header
3. 204 No Content for successful DELETE — no response body
4. 400 Bad Request for malformed syntax, invalid format
5. 401 Unauthorized for missing/invalid authentication
6. 403 Forbidden for authenticated but unauthorized
7. 404 Not Found for non-existent resources
8. 409 Conflict for duplicate resources, stale data
9. 422 Unprocessable Entity for validation errors
10. 429 Too Many Requests for rate limit exceeded
11. 500 Internal Server Error for unhandled exceptions

## Common Failures
- 200 for created resources — should be 201
- 200 for deleted resources with body — should be 204
- 400 for validation errors — should be 422
- 403 when 401 is correct — auth vs authorization
- 404 returning 403 — reveals resource existence

## Related Skills
- HTTP Method Semantics
- Error Response Testing
- Validation Error Testing
