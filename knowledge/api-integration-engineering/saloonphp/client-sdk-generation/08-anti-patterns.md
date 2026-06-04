# ECC Anti-Patterns — Client SDK Generation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | api-integration-engineering |
| **Subdomain** | 02-saloonphp |
| **Knowledge Unit** | Client SDK Generation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. God Connector — One Connector for All APIs
2. Modifying Auto-Generated SDK Code
3. Unversioned SDKs — Breaking Consumers on Regeneration
4. No Request Logging in Connector Pipeline
5. Non-Nullable DTO Fields Causing Runtime Type Errors

---

## Repository-Wide Anti-Patterns

- God Services
- Premature Abstraction
- Overengineering

---

## Anti-Pattern 1: God Connector — One Connector for All APIs

### Category
Code Organization | Architecture

### Description
Creating a single Saloon connector class for all external API integrations, with conditional logic to handle different base URLs, auth methods, and configurations.

### Why It Happens
Developers create one generic `ApiConnector` class to "reuse" code. Conditionals inside the connector manage different services.

### Warning Signs
- Conditionals in `resolveBaseUrl()` for different services
- Single connector injected into all service classes
- Connector configuration mixes Stripe keys with Mailgun config

### Why It Is Harmful
Violates SRP. Adding a new API requires modifying the shared connector. Configuration conflicts (same timeout for all APIs, same auth). Testing one service requires configuring all.

### Real-World Consequences
`ApiConnector` handles Stripe and GitHub. A developer adds GitHub's rate limit middleware. Stripe requests are now also rate limited. Payment processing is throttled unnecessarily.

### Preferred Alternative
Create one Connector class per external API service.

### Refactoring Strategy
1. Identify services managed by the god connector
2. Create dedicated connector per service (StripeConnector, GitHubConnector)
3. Move service-specific config to each connector
4. Remove conditional logic
5. Update bindings in ServiceProvider

### Detection Checklist
- [ ] Single connector used for multiple APIs
- [ ] Conditional logic in connector methods
- [ ] Mixing configurations for different services

### Related Rules
Create One Connector Per API Service (05-rules.md)

### Related Skills
Generate SaloonPHP Client SDKs from OpenAPI Specifications (06-skills.md)

### Related Decision Trees
SDK Generation Approach (07-decision-trees.md)

---

## Anti-Pattern 2: Modifying Auto-Generated SDK Code

### Category
Maintainability | Architecture

### Description
Editing auto-generated Saloon connector or request classes directly to add custom behavior. Changes are lost on regeneration.

### Why It Happens
It's faster to edit the generated file than to figure out the correct extension mechanism. Developers don't plan for regeneration.

### Warning Signs
- Git diff shows changes to files in `sdk/` or generated directory
- Regeneration fails or overwrites custom code
- Comments like "DO NOT EDIT" are ignored

### Why It Is Harmful
The next regeneration overwrites all custom changes silently. SDK drifts from the generated baseline. Updating for a new API version breaks custom modifications.

### Real-World Consequences
Developer adds custom error handling to `ListChargesRequest` (generated). When Stripe updates their API, the SDK is regenerated — all custom error handling is lost. Production silently returns incomplete error messages for 3 weeks.

### Preferred Alternative
Extend generated classes or wrap them in a service layer for custom behavior.

### Refactoring Strategy
1. Revert all changes to generated files
2. Identify custom behavior needed
3. Create extending classes that add custom logic
4. Or create wrapper service classes that delegate to generated code
5. Document that generated files are never manually edited

### Detection Checklist
- [ ] Generated files show manual edits in git history
- [ ] Regeneration causes merge conflicts
- [ ] Custom code mixed with generated code

### Related Rules
Keep SDK Separate from Application Code (05-rules.md)

### Related Skills
Generate SaloonPHP Client SDKs from OpenAPI Specifications (06-skills.md)

### Related Decision Trees
Auto-Generated vs Hand-Written Code Management (07-decision-trees.md)

---

## Anti-Pattern 3: Unversioned SDKs — Breaking Consumers on Regeneration

### Category
Maintainability | Architecture

### Description
Deploying auto-generated SDKs without version constraints. Consumers are broken whenever the SDK is regenerated.

### Why It Happens
The SDK is included directly in the application code without version management. Regeneration affects all consumers immediately.

### Warning Signs
- SDK files in application repository without version tag
- No Composer version constraint for the SDK package
- Regeneration breaks existing consumers unexpectedly

### Why It Is Harmful
Consumers can't opt into SDK changes. A regeneration that renames a method or changes DTO structure breaks all consuming code simultaneously. No migration window.

### Real-World Consequences
SDK is regenerated from an updated OpenAPI spec. `UserDto::getName()` is renamed to `UserDto::getDisplayName()`. All 20 consumers of this DTO break at deployment time. Application is down for 2 hours while developers fix references.

### Preferred Alternative
Package SDKs as separate Composer packages with semantic versioning.

### Refactoring Strategy
1. Extract generated SDK to a separate package/repository
2. Add Composer version constraint to application
3. Use semantic versioning for SDK releases
4. Document migration between major versions
5. Pin generator version in CI for reproducible builds

### Detection Checklist
- [ ] SDK not versioned with Composer
- [ ] No semver constraint
- [ ] Regeneration immediately affects all consumers
- [ ] SDK in same repository as application

### Related Rules
Keep SDK Separate from Application Code (05-rules.md)

### Related Skills
Generate SaloonPHP Client SDKs from OpenAPI Specifications (06-skills.md)

### Related Decision Trees
SDK Versioning Strategy (07-decision-trees.md)

---

## Anti-Pattern 4: No Request Logging in Connector Pipeline

### Category
Observability | Reliability

### Description
Deploying an SDK connector without adding request logging middleware in `bootConnector()`. All API calls are invisible in logs.

### Why It Happens
Logging is added later as an afterthought. By the time it's needed, adding middleware requires changing every request path.

### Warning Signs
- `bootConnector()` has no logging middleware
- Debugging API issues requires adding `dd()` or `Log::debug()` inline
- No history of API call timing or errors

### Why It Is Harmful
When an integration fails in production, there is no forensic evidence. Was the request sent? What was the response? How long did it take? Every incident requires reproducing the issue.

### Real-World Consequences
Stripe returns 500 for 5 minutes. No logging middleware captures the requests or responses. The team can't determine if the issue was Stripe-side or their own. Wastes 3 hours investigating their code before Stripe publishes an incident report.

### Preferred Alternative
Add request logging middleware to the connector's pipeline during initial setup.

### Refactoring Strategy
1. Add `$this->addLogger(new RequestLogger())` in `bootConnector()`
2. Configure structured logging with duration, status, service name
3. Redact sensitive headers (Authorization) from log output
4. Verify logs appear in development before deploying
5. Retrofit logging to existing connectors immediately

### Detection Checklist
- [ ] No logging middleware in connector pipeline
- [ ] API calls produce no log entries
- [ ] Incident investigation requires reproducing issues

### Related Rules
Always Add Request Logging Middleware Early (05-rules.md)

### Related Skills
Generate SaloonPHP Client SDKs from OpenAPI Specifications (06-skills.md)

### Related Decision Trees
SDK Generation Approach (07-decision-trees.md)

---

## Anti-Pattern 5: Non-Nullable DTO Fields Causing Runtime Type Errors

### Category
Maintainability | Reliability

### Description
Declaring DTO fields as non-nullable when the API may omit or return null for those fields, causing runtime type errors on null values.

### Why It Happens
Developers assume all documented fields are always present. API docs say "optional" but developers treat fields as required.

### Warning Signs
- `public string $name` (non-nullable) for a documented optional field
- Runtime errors: "Cannot assign null to property string"
- Production errors on responses with omitted fields

### Why It Is Harmful
A single null value from the API crashes the entire DTO construction. Null handling is discovered in production when the API returns an edge case response. No graceful degradation.

### Real-World Consequences
Stripe's `charge.description` is optional and can be null. DTO declares `public string $description`. Stripe returns null for a specific charge type. DTO construction throws a TypeError. The payment page crashes. Customer sees a 500 error.

### Preferred Alternative
Use nullable types (`?string`) for all optional or undocumented fields.

### Refactoring Strategy
1. Audit all DTO fields for nullability
2. Change types from `string` to `?string` where field may be absent
3. Update all consumer code to handle null
4. Add factory method validation that throws meaningful exceptions on missing required fields
5. Document which fields are required vs optional

### Detection Checklist
- [ ] Non-nullable types on optional DTO fields
- [ ] Runtime TypeError from null values in production
- [ ] No null handling in DTO construction

### Related Rules
Handle Nullable Fields Externally in DTOs (05-rules.md)

### Related Skills
Generate SaloonPHP Client SDKs from OpenAPI Specifications (06-skills.md)

### Related Decision Trees
Auto-Generated vs Hand-Written Code Management (07-decision-trees.md)
