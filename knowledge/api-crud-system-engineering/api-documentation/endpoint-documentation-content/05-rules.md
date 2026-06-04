# Phase 5: Rules — Endpoint Documentation Content

## Answer All Five Questions Per Endpoint
---
## Category
Documentation
---
## Rule
Document every endpoint by answering five questions: What does it do? What do I send? What do I get? What goes wrong? How do I try it?
---
## Reason
Missing any of these five dimensions leaves consumers unable to integrate without trial-and-error or support requests. Incomplete endpoint documentation is the most common root cause of integration friction.
---
## Bad Example
```yaml
paths:
  /users:
    post:
      summary: Create user
      # Missing: description, request body, error responses, example
```
---
## Good Example
```yaml
paths:
  /users:
    post:
      summary: Create a new user
      description: Creates a user account, sends a welcome email, and returns the created user with Sanctum token. Rate limited to 10 requests per minute.
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
            example: { "name": "John Doe", "email": "john@example.com" }
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserResource'
        '422':
          $ref: '#/components/responses/ValidationError'
```
---
## Exceptions
Health check endpoints where error modes are identical to all other endpoints.
---
## Consequences Of Violation
Consumers cannot integrate independently; support volume increases; integration time per consumer increases.
---

## Use `resource.action` operationId Convention
---
## Category
Design
---
## Rule
Set `operationId` to `{resource}.{action}` — `users.list`, `users.create`, `users.show`, `users.update`, `users.delete`.
---
## Reason
SDK generators use `operationId` to name client methods. Without a consistent convention, generated SDKs produce inconsistent, unreadable method names like `apiUsersIdGet`. The `resource.action` pattern produces intuitive `client.users.list()` calls.
---
## Bad Example
```yaml
operationId: getUsersList
operationId: postNewUserEndpoint
operationId: fetchUserById
```
---
## Good Example
```yaml
operationId: users.list
operationId: users.create
operationId: users.show
```
---
## Exceptions
No common exceptions. Every operation must have a unique, conventionally-named `operationId`.
---
## Consequences Of Violation
Generated SDKs have inconsistent method names; cross-referencing SDK methods to documentation requires manual mapping.
---

## Write From Consumer Perspective Not Implementation Perspective
---
## Category
Documentation
---
## Rule
Describe what the endpoint does for the consumer, not how the server implements it. Use "Creates a user account" not "Inserts a record into the users table."
---
## Reason
Consumers care about the service behavior and outcomes, not the internal implementation. Implementation-focused descriptions expose internal architecture unnecessarily and become stale when the implementation changes without behavioral impact.
---
## Bad Example
```yaml
description: "Inserts a SQL record into the users table with a bcrypt-hashed password."
```
---
## Good Example
```yaml
description: "Creates a user account with the specified name and email. Sends a welcome email and returns the created user with an authentication token."
```
---
## Exceptions
Internal APIs documented exclusively for the owning team where implementation context helps debugging.
---
## Consequences Of Violation
Consumers are confused by irrelevant implementation details; internal architecture is unnecessarily exposed.
---

## Document Every Realistic HTTP Status Code
---
## Category
Reliability
---
## Rule
Document at minimum 200/201, 401, 403, 404, 422, 429, and 500 responses for every endpoint, using `$ref` to reusable error components.
---
## Reason
Happy-path-only documentation makes error handling impossible without trial-and-error. Consumers need documented error shapes to write robust error-handling code and to understand which failures are retryable versus permanent.
---
## Bad Example
```yaml
responses:
  '200':
    description: Successful response
```
---
## Good Example
```yaml
responses:
  '200':
    description: List of users
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/UserCollection'
  '401':
    $ref: '#/components/responses/Unauthorized'
  '403':
    $ref: '#/components/responses/Forbidden'
  '422':
    $ref: '#/components/responses/ValidationError'
  '429':
    $ref: '#/components/responses/TooManyRequests'
  '500':
    $ref: '#/components/responses/InternalServerError'
```
---
## Exceptions
Endpoints that truly cannot return certain status codes (e.g., a public health check cannot return 401).
---
## Consequences Of Violation
Consumer error handling code breaks on undocumented error shapes; support tickets for "why did I get a 429?" increase.
---

## Provide Real Copy-Pasteable Request And Response Examples
---
## Category
Documentation
---
## Rule
Include at least one complete request and response example per endpoint with consistent, realistic data across all examples.
---
## Reason
Developers building integrations start by copy-pasting examples. Inconsistent or unrealistic examples cause compilation errors and runtime failures. Examples validated against the schema catch schema-example mismatches before consumers see them.
---
## Bad Example
```yaml
example:
  name: "foo"
  email: 12345  # type mismatch with schema
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
        role: "admin"
responses:
  '201':
    content:
      application/json:
        example:
          id: 42
          name: "Jane Doe"
          email: "jane@example.com"
          created_at: "2026-06-02T12:00:00Z"
```
---
## Exceptions
No common exceptions. Every mutation endpoint must have at least one complete example.
---
## Consequences Of Violation
Consumers copy-paste invalid data; first integration request fails; trust in documentation quality erodes.
---

## Never Document Internal Implementation Details
---
## Category
Security
---
## Rule
Exclude SQL queries, server architecture, algorithm descriptions, and internal service names from endpoint documentation.
---
## Reason
Implementation details expose attack surface, reveal architecture to competitors, and create maintenance debt when internals change but behavior stays the same. Consumers need service contracts, not source code.
---
## Bad Example
```yaml
description: "Queries the users table with a LEFT JOIN on profiles and caches the result in Redis for 5 minutes."
```
---
## Good Example
```yaml
description: "Returns a paginated list of users with their profile information. Results are cached for improved performance."
```
---
## Exceptions
Internal APIs documented for the owning engineering team.
---
## Consequences Of Violation
Security-sensitive architecture is exposed; documentation becomes stale when implementation changes.
---
