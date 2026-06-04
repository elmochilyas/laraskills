# ECC Anti-Patterns — SDK Generation & Distribution

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 08-sdk-generation |
| **Knowledge Unit** | SDK Generation & Distribution |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Fat SDK — Business Logic Mixed in Connector Layer
2. No Version Strategy — SDK Version Misaligned with API Version
3. Leaking Guzzle/PSR-7 Types Outside SDK
4. No Request Logging Middleware
5. Monolithic SDK Package for All API Versions
6. Assuming Uniform Response Envelope Structure
7. No Nullable Handling in Generated DTOs
8. Documentation as Afterthought

---

## Repository-Wide Anti-Patterns

- Premature Auto-Generation
- Premature SDK Extraction

---

## Anti-Pattern 1: Fat SDK — Business Logic Mixed in Connector Layer

### Category
Architecture | Maintainability

### Description
Embedding business logic, validation, or orchestration rules inside the SDK's Connector or Request classes instead of keeping the SDK thin and adding logic in a separate service layer.

### Why It Happens
Developers see the SDK as the natural home for all integration code, not distinguishing transport from business rules.

### Warning Signs
- Connector classes contain if/else branching on response data
- Request classes call other services or repositories
- Same SDK used across multiple apps with app-specific logic baked in

### Why It Is Harmful
SDK becomes coupled to application business rules, making it impossible to reuse across projects or version independently.

### Real-World Consequences
SDK cannot be open-sourced or shared between projects. Every application using the SDK must accept the baked-in business rules.

### Preferred Alternative
Keep SDK thin — only handle transport, auth, error mapping, and DTO construction. Place business logic in a service layer above the SDK.

### Refactoring Strategy
1. Identify business rules inside Connector/Request classes
2. Extract each rule to a service class (e.g., `StripePaymentService`)
3. Pass SDK as a dependency to the service — service calls SDK methods
4. Remove business logic from SDK classes

### Detection Checklist
- [ ] Connector classes contain business-related if/else conditions
- [ ] Request classes call external services or databases
- [ ] SDK is not reusable as-is across different projects
- [ ] Unit tests for SDK also test business rules

### Related Rules
Keep SDK Separate as Composer Package (05-rules.md)

### Related Skills
Generate PHP SDKs from External API Specifications (06-skills.md)

### Related Decision Trees
SDK Approach (07-decision-trees.md)

---

## Anti-Pattern 2: No Version Strategy — SDK Version Misaligned with API Version

### Category
Release Management | Compatibility

### Description
Not aligning SDK package versions with the API version they target, leading to confusion about which SDK version works with which API version.

### Why It Happens
Teams version the SDK independently without tracking which API version it targets.

### Warning Signs
- README doesn't specify which API version the SDK targets
- `composer.json` version numbers have no relation to API version
- Consumers frequently ask "which SDK version works with API v2?"
- Breaking API changes not reflected in SDK major version bump

### Why It Is Harmful
Consumers cannot safely upgrade SDK without cross-referencing API changelogs. Downgrading SDK to match API version becomes guesswork.

### Real-World Consequences
Production outages caused by SDK-API version mismatch. SDK upgrade fear leads to stagnation on outdated versions.

### Preferred Alternative
Align SDK major version with API major version. Document the API version in the SDK README and `composer.json` description.

### Refactoring Strategy
1. Determine current API version(s) the SDK targets
2. Add API version to SDK metadata (README, composer.json description)
3. Create version mapping table in README: `SDK v2.x → API v2`, `SDK v1.x → API v1`
4. Set up CI to test SDK against all supported API versions
5. Bump SDK major version when targeting a new API major version

### Detection Checklist
- [ ] No API version documented in SDK README
- [ ] SDK version history doesn't mention API version changes
- [ ] No CI matrix testing SDK against multiple API versions
- [ ] `composer.json` description doesn't mention API target

### Related Rules
Keep SDK Separate as Composer Package (05-rules.md)

### Related Skills
Generate PHP SDKs from External API Specifications (06-skills.md)

### Related Decision Trees
Distribution Strategy (07-decision-trees.md)

---

## Anti-Pattern 3: Leaking Guzzle/PSR-7 Types Outside SDK

### Category
Coupling | Maintainability

### Description
Exposing Guzzle Response objects, PSR-7 interfaces, or raw arrays from SDK public methods instead of returning only SDK-defined types (DTOs, collections).

### Why It Happens
Developers take the path of least resistance, returning the HTTP response directly rather than mapping to a typed DTO.

### Warning Signs
- SDK methods return `\GuzzleHttp\Psr7\Response` or `array`
- Application code calls `$response->getBody()` or `$response['data']`
- Changing HTTP client would break all SDK consumers

### Why It Is Harmful
Couples all application code to the HTTP transport layer. Swapping Guzzle for a different client (e.g., during testing or upgrade) breaks every caller.

### Real-World Consequences
Cannot upgrade Guzzle without rewriting SDK consumers. Mock testing requires Guzzle-specific mocking setup in every test.

### Preferred Alternative
Always return typed DTOs or domain-specific collections from SDK public methods. Keep Guzzle/PSR-7 types internal to the SDK.

### Refactoring Strategy
1. Identify all public methods returning transport-layer types
2. Create typed DTOs for each response shape
3. Update methods to return DTOs (use `createDtoFromResponse` in Saloon)
4. Remove transport-type imports from all consumer code
5. Update tests to assert against DTO properties, not response body

### Detection Checklist
- [ ] SDK public methods return `Response`, `array`, or `Collection` from HTTP calls
- [ ] Application code calls HTTP-specific methods (`getBody()`, `getStatusCode()`)
- [ ] Changing HTTP client would require changes in application code
- [ ] No DTO classes defined for SDK responses

### Related Rules
Never Leak Guzzle/PSR-7 Types Outside SDK (05-rules.md)

### Related Skills
Generate PHP SDKs from External API Specifications (06-skills.md)

### Related Decision Trees
Testing Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: No Request Logging Middleware

### Category
Observability | Debugging

### Description
Shipping the SDK without logging middleware that captures endpoint, status, timing, and request ID, making production debugging reliant on guesswork.

### Why It Happens
Logging is seen as application-level concern, not SDK-level. Teams forget to add middleware until a production incident forces it.

### Warning Signs
- Debugging integration issues requires adding temporary log statements
- No record of which API calls were made during an incident
- Cannot determine latency of individual API calls
- Support tickets ask "what API calls happened at time X?"

### Why It Is Harmful
Production debugging requires deploying new code. Incident response time increases 5-10x without historical request data.

### Real-World Consequences
Slow incident diagnosis during payment failures. Cannot audit API usage for cost optimization. No performance baseline for regression detection.

### Preferred Alternative
Add logging middleware at SDK construction time using Guzzle middleware or Saloon plugins. Log method, URI, status, timing, and error details.

### Refactoring Strategy
1. Implement a logging middleware class (Guzzle middleware handler or Saloon plugin)
2. Register middleware in the Connector's `defaultMiddleware()` or `boot()` method
3. Log method, URI, status code, duration in milliseconds, and error context
4. Add a unique request ID header for correlating SDK calls with API provider logs
5. Test that logs fire on success and error responses

### Detection Checklist
- [ ] No logging middleware present in Connector setup
- [ ] Debugging integration issues requires `dd()` or temporary `Log::` statements
- [ ] No historical record of SDK API calls available in log system
- [ ] Duration and status not tracked per API call

### Related Rules
Log All SDK Calls with Full Context (05-rules.md)

### Related Skills
Generate PHP SDKs from External API Specifications (06-skills.md)

### Related Decision Trees
SDK Approach (07-decision-trees.md)

---

## Anti-Pattern 5: Monolithic SDK Package for All API Versions

### Category
Release Management | Compatibility

### Description
Maintaining a single Composer package that supports multiple API versions simultaneously, with conditional branching inside the code to handle version differences.

### Why It Happens
Teams want to avoid the overhead of maintaining multiple packages and assume version differences are small enough to handle with conditionals.

### Warning Signs
- SDK code contains `if ($apiVersion === 'v2')` branching
- Same class file handles v1 and v2 request/response shapes
- Consumers must configure API version in every call
- README has complex "which version to use" matrix

### Why It Is Harmful
Code becomes complex and brittle. Testing matrix multiplies. Removing old version support requires surgery, not package retirement.

### Real-World Consequences
SDK maintainers spend 40% of time on backward compatibility code. New contributors struggle with version branching. Old version baggage slows v3 development.

### Preferred Alternative
Use separate namespaces (`Vendor\Sdk\V1`, `Vendor\Sdk\V2`) or separate packages per API version. Consumers declare which version they target.

### Refactoring Strategy
1. Identify version-specific code paths and extract to version-namespaced classes
2. Create `V1` and `V2` namespaces under the SDK
3. Create a version selector or separate packages
4. Remove version conditionals — each version is self-contained
5. Deprecate old version namespace/package when API version sunsets

### Detection Checklist
- [ ] SDK code contains API version conditionals
- [ ] Single class has multiple versions of the same method
- [ ] Consumers must pass API version parameter to every call
- [ ] CI matrix tests cover N versions × N endpoint combinations

### Related Rules
Keep SDK Separate as Composer Package (05-rules.md)

### Related Skills
Generate PHP SDKs from External API Specifications (06-skills.md)

### Related Decision Trees
Distribution Strategy (07-decision-trees.md)

---

## Anti-Pattern 6: Assuming Uniform Response Envelope Structure

### Category
Reliability | Error Handling

### Description
Assuming all API responses have identical envelope structure (e.g., always `{data: ..., meta: ...}`), leading to runtime errors when different endpoints return different shapes.

### Why It Happens
Developers test against one endpoint and assume all endpoints follow the same pattern.

### Warning Signs
- Single DTO class used for all endpoint responses
- No per-endpoint DTO customization
- `null` errors on optional fields that differ per endpoint
- Assumption that success envelope equals error envelope

### Why It Is Harmful
Type errors at runtime when an endpoint returns a different structure. Error responses parsed as success data. Null field exceptions on optional responses.

### Real-World Consequences
Production crashes on endpoints that return paginated vs single-item responses differently. Error messages not surfaced to users because error envelope differs from success envelope.

### Preferred Alternative
Define per-endpoint DTOs and response handling. Each endpoint's response shape is independent. Use Saloon's `createDtoFromResponse` per Request class.

### Refactoring Strategy
1. Document the response shape for each endpoint
2. Create per-endpoint DTOs matching each shape
3. Implement `createDtoFromResponse` in each Request class
4. Handle success and error envelopes separately
5. Test each endpoint's response mapping independently

### Detection Checklist
- [ ] Single DTO or array type used for all endpoint responses
- [ ] No per-endpoint response transformation
- [ ] Paginated and single-item responses use same handling
- [ ] Error responses parsed as success responses

### Related Rules
Handle Nullable Fields Explicitly in DTOs (05-rules.md)

### Related Skills
Generate PHP SDKs from External API Specifications (06-skills.md)

### Related Decision Trees
SDK Approach (07-decision-trees.md)

---

## Anti-Pattern 7: No Nullable Handling in Generated DTOs

### Category
Reliability | Type Safety

### Description
Generating DTOs with non-nullable types for all fields, causing runtime type errors when the API omits optional fields or returns null.

### Why It Happens
Auto-generation tools map OpenAPI types directly without analyzing `nullable: true` or optional field semantics.

### Warning Signs
- DTO properties use `string`, `int`, `array` instead of `?string`, `?int`, `?array`
- Runtime `TypeError` on null values from API responses
- No default values for optional DTO fields
- OpenAPI spec has `nullable: true` fields mapped as non-nullable

### Why It Is Harmful
Every nullable field is a potential production crash. Debugging requires analyzing each response to find which field was unexpectedly null.

### Real-World Consequences
Intermittent production crashes on API responses with omitted optional fields. Support escalations for cryptic "call to member function on null" errors.

### Preferred Alternative
Use nullable types (`?string`, `?int`) for all fields that can be null or omitted. Set sensible defaults (`= null`) for optional fields. Audit generated code before committing.

### Refactoring Strategy
1. Audit all DTOs for non-nullable properties that could be null
2. Change types to nullable (`string` → `?string`)
3. Add `= null` defaults for optional fields
4. Add constructors or named constructors that handle null values
5. Test DTO creation with fixture data that omits optional fields

### Detection Checklist
- [ ] DTO properties use non-nullable types for API response fields
- [ ] Optional OpenAPI fields mapped as required in DTOs
- [ ] No `null` default values on optional DTO properties
- [ ] Runtime `TypeError` on partial API responses

### Related Rules
Handle Nullable Fields Explicitly in DTOs (05-rules.md)

### Related Skills
Generate PHP SDKs from External API Specifications (06-skills.md)

### Related Decision Trees
Testing Strategy (07-decision-trees.md)

---

## Anti-Pattern 8: Documentation as Afterthought

### Category
Developer Experience | Maintainability

### Description
Shipping an SDK without README, changelog, upgrade guide, or example code, making adoption and maintenance unnecessarily difficult.

### Why It Happens
Documentation is deprioritized during development. Teams assume the code is self-documenting.

### Warning Signs
- No README in package root
- No changelog or release notes
- No upgrade guide for breaking version changes
- Consumers must read source code to understand API
- New team members struggle to make first SDK call

### Why It Is Harmful
Adoption friction — developers choose an inferior but better-documented SDK. Maintenance burden — nobody understands how to update the SDK safely.

### Real-World Consequences
Low adoption despite SDK being technically superior. Each breaking release causes support tickets. Maintainer bus factor increases.

### Preferred Alternative
Include README with quickstart, API reference, and configuration guide. Maintain CHANGELOG.md with semantic versioning. Provide upgrade guides for major version bumps.

### Refactoring Strategy
1. Write README covering: installation, quickstart, configuration, error handling, pagination, testing
2. Create CHANGELOG.md from git history with Conventional Commits
3. Write upgrade guide for each major version, listing breaking changes and migration steps
4. Add code examples for common operations (CRUD, pagination, error handling)
5. Include API reference or link to external API documentation

### Detection Checklist
- [ ] No README in package
- [ ] No CHANGELOG or release notes
- [ ] No upgrade guide for major versions
- [ ] Consumers must read source code to understand usage
- [ ] No example code for common operations

### Related Rules
Keep SDK Separate as Composer Package (05-rules.md)

### Related Skills
Generate PHP SDKs from External API Specifications (06-skills.md)

### Related Decision Trees
Distribution Strategy (07-decision-trees.md)
