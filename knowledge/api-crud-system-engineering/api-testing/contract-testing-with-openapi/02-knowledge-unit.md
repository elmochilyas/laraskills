# Contract Testing with OpenAPI

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Contract Testing with OpenAPI
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary
Contract testing validates that API responses conform to their OpenAPI specification — ensuring the running implementation matches the documented contract. Tests parse the OpenAPI schema, make real requests, and validate responses against schema definitions for status codes, headers, request bodies, and response bodies. Tools like `league/openapi-psr7-validator`, `marc-mabe/php-openapi`, and custom Laravel test macros enable in-test schema validation. Contract tests catch discrepancies between documentation and implementation before they reach consumers.

---

## Core Concepts
An OpenAPI spec defines paths, methods, parameters, request bodies, and response schemas. Contract testing automates the verification that responses match these schemas. The spec is parsed from a YAML/JSON file (typically `openapi.yaml`). Each endpoint's response is validated against the corresponding `responses` schema for the returned status code. Validation covers: status codes (must match allowed codes), response headers (must match declared headers), response body (must match `schema`), and response body types (string, integer, array). Laravel's `TestResponse` can be extended with a custom `assertMatchesOpenApiSpec()` macro. Tools like `Spectator` (a Laravel package) automate this: it intercepts tests and validates all requests/responses against the spec file.

---

## Mental Models
Contract testing is **building inspector verification** — the architect drew blueprints (OpenAPI spec), the construction crew built the house (API implementation), and the inspector (contract test) checks every room against the blueprint. If the blueprint says 3 bedrooms, the inspector counts 3. If the blueprint says a 200 response has `{id, title}`, the test asserts those exact keys.

---

## Internal Mechanics
`Spectator` uses Laravel's `TestCase` booting to register a middleware that captures requests and responses. After each test, it matches the route to the OpenAPI path, finds the response status code in the spec, loads the schema, and validates. Validation uses `league/openapi-psr7-validator` under the hood, which validates PSR-7 messages against JSON Schema. `marc-mabe/php-openapi` reads and parses the OpenAPI file into a PHP object tree. Custom implementations can use `phpstan/phpdoc-parser` for type resolution or `json-schema` validators for schema conformance.

---

## Patterns
- **Auto-validation via middleware**: Install `Spectator` or a custom middleware that validates every test request/response against the spec.
- **Unit-test the spec file itself**: Validate the `openapi.yaml` against the OpenAPI schema using `swagger-cli validate` or `openapi-examples-validator`.
- **Selective endpoint validation**: Use `#[OpenApiTest]` attribute or `->withoutContractValidation()` for endpoints with dynamic schemas (e.g., file uploads with varying metadata).
- **Version-specific spec files**: Maintain per-version OpenAPI files and test each version group against its spec.
- **Schema generation from code**: Use `scrutinizer/php-openapi-gen` or `wyrihaximus/openapi-generator` to generate the spec from API Resource classes, then contract-test against the generated spec.

---

## Architectural Decisions
There are two approaches: (1) auto-validation middleware that validates all test traffic, and (2) explicit per-test assertions (`$response->assertMatchesOpenApiSpec()`). Approach 1 provides comprehensive coverage with zero per-test code changes but may be noisy for non-API routes. Approach 2 is explicit and selective but requires adding the assertion to every test. Most teams start with approach 2 for critical endpoints and expand to approach 1 once the spec stabilizes.

---

## Tradeoffs
| Tradeoff | Auto-validation (Middleware) | Explicit Assertion |
|---|---|---|
| Coverage | 100% of test requests | Per-test opt-in |
| Noise | High (non-API routes fail) | Low (intentional only) |
| Setup | Middleware registration | Test macro or trait |
| Migration effort | Low (add middleware, no test changes) | Higher (add assertion per test) |

---

## Performance Considerations
Schema validation on every response adds overhead — a complex schema may take 5-50ms to validate. For a test suite with hundreds of assertions, this adds up. Run contract validation as a separate CI pipeline stage (not in the fast-feedback `unit/feature` stage) or only on a subset of representative tests. Cache the parsed OpenAPI file in memory — parsing YAML on every request is expensive.

---

## Production Considerations
The OpenAPI spec is the single source of truth — if the spec and implementation diverge, fix whichever is wrong. Treat spec validation failures as CI blocking errors. In production, consider runtime schema validation for incoming requests (validate request bodies against the spec before they reach controllers) using `league/openapi-psr7-validator` middleware. Never deploy an API version without a corresponding OpenAPI spec.

---

## Common Mistakes
- Letting the OpenAPI spec drift from implementation — spec changes are not validated against tests.
- Validating the response schema but not the request schema — request validation on the server side may reject valid spec-compliant requests.
- Testing against an outdated spec file — the CI must ensure the spec file is the current version.
- Ignoring `oneOf`/`anyOf` schemas — complex schema composition requires deeper validation logic.

---

## Failure Modes
- **Spec out of date**: API returns a field not in the spec — contract test passes (spec doesn't know about the field) but consumer fails (their generated client doesn't have the field).
- **Spec too strict**: API returns additional optional fields that aren't in the schema — strict validation fails.
- **Type mismatch**: Spec says `id: integer` but API returns `"1"` (string) — validation catches the type mismatch.
- **Missing response code in spec**: API can return 422 but the spec only declares 200/404 — contract test fails on 422.

---

## Ecosystem Usage
Laravel teams commonly use `Spectator` for contract testing. `scrutinizer/php-openapi` is the most popular OpenAPI parser in PHP. `league/openapi-psr7-validator` is framework-agnostic. API Platform (Symfony) has built-in contract testing. `Dredd` is an API-level contract testing tool (not PHP-specific) that runs against a live server.

---

## Related Knowledge Units
### Prerequisites
- OpenAPI Specification 3.x (paths, schemas, responses, request bodies)
- response-shape-testing (manual schema validation)
- response-status-code-testing (status code contracts)

### Related Topics
- architecture-tests-for-apis (enforcing test coverage via architecture rules)
- api-version-behavior-testing (version-specific spec files)

### Advanced Follow-up Topics
- Consumer-driven contract testing (Pact.io)
- Schema evolution and backward compatibility checking
- Auto-generating tests from OpenAPI specs

---

## Research Notes
### Source Analysis
`league/openapi-psr7-validator` validates PSR-7 messages against OpenAPI schemas. `Spectator` wraps this for Laravel. `marc-mabe/php-openapi` provides OpenAPI file parsing. The OpenAPI 3.0 specification is at `openapis.org`.
### Key Insight
Contract testing shifts the validation burden from "does the API return the right data?" to "does the API match its documented contract?" — the latter is more stable and consumer-focused.
### Version-Specific Notes
OpenAPI 3.1 (JSON Schema 2020-12) changes the schema validation behavior compared to 3.0. Spectator v1.x supports OpenAPI 3.0; v2.x supports 3.1. Laravel 11's API resource classes generate OpenAPI-compatible response shapes naturally.
