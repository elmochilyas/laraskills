# Skill: Validate API Responses Against OpenAPI Schema
## Purpose
Automatically verify that API responses conform to their OpenAPI contract — status code, headers, JSON structure, and data types — preventing undocumented changes from reaching consumers.
## When To Use
Before API version releases; as part of CI pipeline after test suite passes; when implementing a new endpoint; when changing existing response shapes.
## When NOT To Use
Exploratory or debugging sessions (use targeted assertions instead); testing value correctness (schema validation checks shape/type, not content).
## Prerequisites
OpenAPI/Swagger specification document; working API endpoints; Pest or PHPUnit with schema validation library; Response Shape Testing.
## Inputs
OpenAPI specification (JSON/YAML); HTTP client; list of endpoint/status-code pairs to validate.
## Workflow
1. Load OpenAPI specification into a schema validator instance
2. For each endpoint, define the expected response status codes
3. Call the endpoint with valid request data
4. Extract response status code, headers, and body
5. Match response against the corresponding schema path + method + status code
6. Run json-schema validation on the response body
7. Assert no validation errors — fail the test if any are found
8. Repeat for success (2xx) and error (4xx) responses for each endpoint
9. Run as a dedicated CI step, separate from unit/feature tests
## Validation Checklist
- [ ] Every public endpoint has schema validation coverage
- [ ] Both 2xx success and 4xx error responses are validated
- [ ] Schema validation is triggered as a CI check on every push
- [ ] Validation library supports DRY references ($ref) for reusable schemas
- [ ] Response headers are validated where specified (Content-Type, pagination links)
- [ ] Breaking schema changes are reviewed and version-bumped before merging
- [ ] schema validation tests are grouped in a separate test suite from value assertions
## Common Failures
- Schema is out of date — a response passes the test but doesn't match the documented contract
- Schema uses overly permissive type definitions (any, object with no properties) — validation becomes useless
- Using draft-04 validators against OpenAPI 3.1 (which uses draft-2020-12) — subtle differences in format validation
- Forgetting to test error responses — they diverge most often when the schema is static
## Decision Points
- Strict mode (reject additional properties) vs lax mode (allow undocumented extensions)
- Build a small custom test harness vs using a dedicated library (e.g. `opis/json-schema`, `league/openapi-psr7-validator`)
- Validate inline per test vs generate test cases from the schema itself
## Performance/Security Considerations
Schema parsing is expensive — load and cache the OpenAPI spec once per test suite run (setUpBeforeClass or service container singleton). Avoid loading the spec in every test method. Security: schema validation can detect data leaks (fields exposed that aren't in the contract).
## Related Rules/Skills
Response Shape Testing; Response Status Code Testing; API Versioning Strategy; OpenAPI Documentation Generation.
## Success Criteria
Any response that violates the documented OpenAPI contract is caught as a test failure; consumers can trust the specification as an accurate reflection of the API.
