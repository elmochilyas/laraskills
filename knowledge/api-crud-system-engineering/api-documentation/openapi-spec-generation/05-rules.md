# Phase 5: Rules — OpenAPI Spec Generation

## Define All Schemas In Components With $ref References
---
## Category
Code Organization
---
## Rule
Define every data model in `components/schemas` and reference it via `$ref` in path definitions. Never use inline schemas for request bodies or response bodies.
---
## Reason
Inline schemas create duplication that inevitably drifts apart, bloat the spec file, and break code generation tools that expect component-level definitions. Component-based schemas enable reuse, single-point updates, and clean SDK model generation.
---
## Bad Example
```yaml
paths:
  /users:
    post:
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
```
---
## Good Example
```yaml
components:
  schemas:
    CreateUserRequest:
      type: object
      properties:
        name: { type: string }
paths:
  /users:
    post:
      requestBody:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
```
---
## Exceptions
One-of wrapper schemas with no reuse potential and trivial structure (fewer than 3 properties).
---
## Consequences Of Violation
Schema duplication across endpoints; SDK codegen produces duplicate type definitions; spec size grows unnecessarily.
---

## Use `resource.action` operationId Convention
---
## Category
Design
---
## Rule
Set `operationId` to `{resource}.{action}` format — `users.list`, `users.create`, `users.show`, `users.update`, `users.delete` — for every operation.
---
## Reason
SDK generators derive method names from `operationId`. Without a consistent convention, generated clients have unpredictable method names like `apiV1UsersIdGet`. The `resource.action` pattern produces intuitive `client.users.list()`.
---
## Bad Example
```yaml
operationId: getUsers
operationId: addNewUser
operationId: deleteUserByID
```
---
## Good Example
```yaml
operationId: users.list
operationId: users.create
operationId: users.delete
```
---
## Exceptions
No common exceptions. Every operation must have a unique, conventionally-named operationId.
---
## Consequences Of Violation
Generated SDK method names are inconsistent; consumer developers must manually map spec operations to SDK methods.
---

## Always Include An `info.version` Matching The API Version
---
## Category
Code Organization
---
## Rule
Set `info.version` to the semantic version of the API and keep it synchronized with the release version. If the spec file is named `openapi-v2.yaml`, `info.version` must be `2.0.0`.
---
## Reason
Consumers and tooling read `info.version` to identify which version of the API the spec represents. Mismatches between filename, `info.version`, and the actual deployed API cause integration failures and confuse SDK versioning pipelines.
---
## Bad Example
```yaml
info:
  version: "1.5"
# File is openapi-v3.yaml — filename and version conflict
```
---
## Good Example
```yaml
info:
  version: "2.0.0"
# File is openapi-v2.yaml — consistent
```
---
## Exceptions
Pre-release APIs (0.x) where version changes frequently; use `info.version: "0.1.0"` and keep filename unversioned.
---
## Consequences Of Violation
Consumers retrieve the wrong spec for their target version; SDK generators produce incorrectly versioned packages.
---

## Validate Spec In CI Before Deployment
---
## Category
Testing
---
## Rule
Run `redocly lint` and `swagger-cli validate` (or equivalent) on the spec in CI. Block the pipeline on validation failures.
---
## Reason
Invalid specs silently break documentation renderers, SDK generators, and contract testing tools. CI validation catches YAML syntax errors, broken `$ref` references, and OpenAPI structural violations before they reach downstream consumers.
---
## Bad Example
No validation in CI. A PR introduces a spec with a broken `$ref: '#/components/schemas/NonExistent'`. The documentation site fails to render after deployment.
---
## Good Example
```yaml
steps:
  - run: npx @redocly/cli lint openapi.yaml
  - run: npx swagger-cli validate openapi.yaml
```
---
## Exceptions
Prototype APIs with no published documentation or external consumers.
---
## Consequences Of Violation
Invalid specs deployed; documentation renderers return errors; SDK generation fails; consumer trust is damaged.
---

## Set Global Security With Per-Operation Overrides
---
## Category
Design
---
## Rule
Define security schemes in `components/securitySchemes`, apply them globally via the root `security` key, and override to `security: []` for public endpoints.
---
## Reason
Applying security per-operation without a global default creates inconsistent documentation where some operations forget the security definition entirely. Global application with explicit overrides ensures every endpoint is intentional about its auth requirements.
---
## Bad Example
```yaml
# No global security; each operation defines its own
# Some operations forget security entirely and appear public
```
---
## Good Example
```yaml
components:
  securitySchemes:
    Sanctum:
      type: http
      scheme: bearer
security:
  - Sanctum: []
paths:
  /health:
    get:
      security: []  # Explicitly public
```
---
## Exceptions
APIs where every endpoint uses the same auth and there are zero public endpoints.
---
## Consequences Of Violation
Inconsistent authorization documentation; public endpoints accidentally appear authenticated (or vice versa).
---

## Bundle Multi-File Specs Before Deployment
---
## Category
Reliability
---
## Rule
Bundle multi-file OpenAPI specs into a single file before deployment using `redocly bundle` or `swagger-cli bundle`.
---
## Reason
Broken `$ref` references to external files are the most common spec deployment failure. Bundling resolves all references into a single self-contained file that renders correctly, imports cleanly into tools, and does not depend on the original file structure.
---
## Bad Example
```yaml
# $ref: ./schemas/User.yaml — deployed without bundling
# Consumer downloads the spec; the $ref resolves to a 404
```
---
## Good Example
```bash
npx @redocly/cli bundle openapi.yaml --output dist/openapi.yaml
```
---
## Exceptions
Single-file specs with no external references; bundling is a no-op.
---
## Consequences Of Violation
Consumer tools fail to resolve external `$ref` URIs; specs cannot be imported into API gateways or documentation portals.
---
