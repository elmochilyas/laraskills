# ECC Anti-Patterns — Scramble Integration

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | API & CRUD System Engineering |
| **Subdomain** | API Documentation |
| **Knowledge Unit** | Scramble Integration |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Relying on Scramble for Error Documentation
2. Missing Return Type Hints on Controller Methods
3. Unprotected Docs Route in Production
4. Zero Review of Auto-Generated Spec
5. Stale Cached Spec After Code Changes

---

## Repository-Wide Anti-Patterns

- Premature Optimization
- Ticket-Driven Development

---

## Anti-Pattern 1: Relying on Scramble for Error Documentation

### Category
Documentation

### Description
Assuming Scramble will automatically document error responses (4xx, 5xx) because it documents request and response schemas, leaving consumers with no documented error shapes.

### Why It Happens
Scramble's "zero-config, auto-documentation" marketing creates the impression that all documentation is handled automatically. Developers see beautifully generated success responses and assume errors are similarly documented. Scramble has no visibility into exception handlers, validation error responses, or middleware-rejected requests.

### Warning Signs
- API docs show only 200/201 responses
- No 422, 401, 403, 404, 429, or 500 schemas in the generated spec
- Error responses section is entirely absent from documentation
- Consumers report "the docs show success responses but no error shapes"
- Team has never discussed how to document errors alongside Scramble
- Scramble version does not support error inference (it never will — this is by design)

### Why It Is Harmful
An API documented entirely by Scramble has zero error documentation. Consumers integrating with such an API must discover every error shape through trial and error. The first API call (which will likely fail due to auth, validation, or rate limiting) returns an undocumented error shape. Every consumer's integration begins with a failure, and every error mode must be reverse-engineered.

### Real-World Consequences
A team launches a public API documented exclusively with Scramble. The docs are beautiful — every endpoint shows request and response schemas with examples. But there are no 422, 401, or 429 responses documented. Every new consumer's first integration attempt fails on validation or auth errors. The support team receives 50+ tickets in the first week: "What does your 422 response look like?" and "How do I handle rate limits?"

### Preferred Alternative
Plan a separate error documentation strategy alongside Scramble. Post-process the generated spec to overlay hand-written error components, or maintain error documentation manually.

### Refactoring Strategy
1. Create reusable error response components in a separate YAML file
2. Write a post-processing script that merges error components into Scramble's generated spec
3. Add error components for at least 422, 401, 403, 404, 429, and 500
4. Run the merge step in CI after `php artisan scramble:generate`
5. Verify the merged spec includes error documentation for all endpoints

### Detection Checklist
- [ ] Check generated spec for error response schemas
- [ ] Verify 422, 401, 403, 404, 429, 500 are documented on every endpoint
- [ ] Confirm error documentation strategy exists independent of Scramble
- [ ] Test that post-processing merge actually adds error components
- [ ] Review merged spec for completeness before publishing

### Related Rules
- Plan A Separate Error Documentation Strategy (05-rules.md)

### Related Skills
- Integrate Scramble for API Documentation (06-skills.md)

### Related Decision Trees
- Spec Caching Strategy — Development vs Production (07-decision-trees.md)

---

## Anti-Pattern 2: Missing Return Type Hints on Controller Methods

### Category
Framework Usage

### Description
Omitting explicit return type declarations on controller methods, causing Scramble to produce empty `{}` response schemas that provide no information about what the endpoint returns.

### Why It Happens
PHP does not require return type declarations. Many Laravel controllers omit them because Eloquent collections and Resource classes make the return type "obvious" from reading the code. Developers may not realize that Scramble uses return type reflection to generate response schemas.

### Warning Signs
- Controller methods return `UserResource::collection(...)` without `: AnonymousResourceCollection` return type
- Response schemas in generated docs are empty objects `{}`
- No `$ref` references appear in response body schemas
- Auto-generated spec has `schema: {}` on all endpoints
- SDK models generated from Scramble output are empty or have only basic fields
- Developer says "but it works in Postman" — the API works, only the documentation is broken

### Why It Is Harmful
Empty response schemas provide no value. Consumers cannot determine what data an endpoint returns. SDK generation produces unusable models. The documentation becomes a listing of endpoints with no information about their output. The entire purpose of auto-generating documentation is defeated because the critical response schema information is missing.

### Real-World Consequences
A team installs Scramble expecting zero-config documentation. Every endpoint's response schema shows `{}`. The team blames Scramble, not realizing their controllers lack return types. A consumer trying to generate an SDK from the spec produces empty models — no fields on any resource. The project abandons Scramble for Scribe, citing "Scramble doesn't work for us." The actual issue is missing return types.

### Preferred Alternative
Add explicit return type declarations — `UserResource`, `ResourceCollection`, `AnonymousResourceCollection` — to every controller method.

### Refactoring Strategy
1. Audit every controller method for missing return types
2. Add `: UserResource` for single resources, `: AnonymousResourceCollection` for collections
3. Regenerate the Scramble spec and verify response schemas appear
4. Add a CI lint rule that flags controller methods without return types
5. Include return type declarations in the team's coding standards checklist

### Detection Checklist
- [ ] Count controller methods with missing return type declarations
- [ ] Verify generated spec response schemas are non-empty
- [ ] Confirm Scramble's generated output includes `$ref` to resource schemas
- [ ] Test SDK codegen produces typed models from Scramble output
- [ ] Add CI check for controller method return types

### Related Rules
- Declare Explicit Return Types On Controller Methods (05-rules.md)

### Related Skills
- Integrate Scramble for API Documentation (06-skills.md)

### Related Decision Trees
- Spec Caching Strategy — Development vs Production (07-decision-trees.md)

---

## Anti-Pattern 3: Unprotected Docs Route in Production

### Category
Security

### Description
Leaving Scramble's built-in Swagger UI route (`/docs/api`) publicly accessible in production without authentication, exposing the full API surface to unauthenticated users.

### Why It Happens
Scramble registers the docs route automatically. In development, public access is convenient. Teams deploy to production without modifying the default configuration. The route is easy to forget because it works without any setup.

### Warning Signs
- `/docs/api` is accessible without authentication in production
- Anyone with the URL can see every API endpoint, schema, and configuration
- No rate limiting on the docs route
- Internal endpoint paths are visible in the spec
- Security audit flags the exposed documentation
- Team is unaware that Scramble registers a route automatically

### Why It Is Harmful
The Swagger UI endpoint reveals the complete API surface — every endpoint, parameter, schema, and configuration — to anyone who discovers the URL. Attackers can identify internal endpoints, understand data models, explore authentication schemes, and map the full attack surface. For internal APIs, this is a critical information disclosure vulnerability.

### Real-World Consequences
A startup's internal API docs route is publicly accessible. A competitor discovers the URL through a leaked Slack message. They see every internal endpoint: `/internal/revenue-report`, `/admin/user-impersonate`, `/internal/feature-flags`. The competitor learns the startup's upcoming feature set from the endpoint names and schema fields. The startup's competitive advantage is compromised.

### Preferred Alternative
Wrap the docs route with authentication middleware and rate limiting in production. For internal APIs, require authentication. For public APIs, add rate limiting.

### Refactoring Strategy
1. Configure Scramble to register the docs route only in non-production environments, or
2. Add authentication middleware to the docs route in `RouteServiceProvider`
3. Add rate limiting to prevent abuse of the docs endpoint
4. For public APIs, consider serving docs from a separate domain or CDN
5. Review access logs to confirm the route is protected

### Detection Checklist
- [ ] Test `/docs/api` access without authentication in production
- [ ] Verify the docs route has authentication middleware applied
- [ ] Check for rate limiting on the docs endpoint
- [ ] Confirm internal-only endpoints are not documented in public-accessible docs
- [ ] Review deployment config — is the docs route environment-gated?

### Related Rules
- Protect The Built-In Docs Route In Production (05-rules.md)

### Related Skills
- Integrate Scramble for API Documentation (06-skills.md)

### Related Decision Trees
- Route Exposure — Protected vs Public Docs Endpoint (07-decision-trees.md)

---

## Anti-Pattern 4: Zero Review of Auto-Generated Spec

### Category
Reliability

### Description
Publishing Scramble's generated OpenAPI spec without any review, trusting that auto-generation produces correct, complete, and secure documentation.

### Why It Happens
Scramble's promise of "zero-config" documentation creates an expectation that the output is ready to publish. Teams add Scramble, generate the spec, and deploy without manual or automated review. The assumption is that because the code is correct, the generated documentation must also be correct.

### Warning Signs
- Spec is deployed directly from `php artisan scramble:generate` output
- No manual review step between generation and deployment
- No automated lint validation of the generated spec
- Internal routes appear in the spec without the team's awareness
- Custom validation rules are missing from the generated schemas
- Accidental exposure of internal endpoints discovered months after deployment

### Why It Is Harmful
Scramble's inference is not perfect. It may miss custom validation rules, fail to resolve complex type hierarchies, or include routes intended for internal use. An unverified auto-generated spec is an untrusted spec. Publishing it directly risks exposing internal endpoints, providing incomplete schemas to consumers, and including inaccurate documentation that misleads integrators.

### Real-World Consequences
A team deploys Scramble's generated spec without review. The spec includes the `/telescope` route (Laravel Telescope's debug dashboard) and `/horizon` (queue monitoring). The spec gets imported into an API gateway that publishes all documented routes as public-facing. The `/telescope` and `/horizon` routes become accessible to the public. An attacker discovers these routes through the published spec and gains access to sensitive debugging information.

### Preferred Alternative
Always review Scramble's generated OpenAPI spec for completeness, correctness, and accidental endpoint exposure before publishing.

### Refactoring Strategy
1. Run `redocly lint` on the generated spec automatically in CI
2. Add a grep check for internal route patterns (`/telescope`, `/horizon`, `/_debugbar`, admin routes)
3. Review the generated schemas manually for a representative sample of endpoints
4. Compare generated request schemas against Form Request rules for completeness
5. Only deploy the spec after lint and manual review pass

### Detection Checklist
- [ ] Check if spec review step exists in the deployment pipeline
- [ ] Verify `redocly lint` runs on the generated spec
- [ ] Search generated spec for internal-only routes
- [ ] Compare generated schemas against actual Form Request rules
- [ ] Confirm review step is documented in the deployment checklist

### Related Rules
- Review Auto-Generated Spec Before Publishing (05-rules.md)

### Related Skills
- Integrate Scramble for API Documentation (06-skills.md)

### Related Decision Trees
- Route Exposure — Protected vs Public Docs Endpoint (07-decision-trees.md)

---

## Anti-Pattern 5: Stale Cached Spec After Code Changes

### Category
Maintainability

### Description
Caching the Scramble-generated spec in production but failing to re-cache after code changes, so the documentation describes an older version of the API.

### Why It Happens
Developers run `php artisan scramble:cache` once during initial setup. Subsequent deployments add new endpoints or modify schemas, but the cache step is not included in the deployment script. The cached spec remains unchanged, serving stale documentation to consumers.

### Warning Signs
- Deployment script does not include `php artisan scramble:cache`
- Spec modifications do not appear in production docs after deployment
- Code changes are reflected in development docs (uncached) but not production docs (cached)
- Consumers report that documented endpoints do not exist or return different responses
- Timestamps in spec metadata show the original cache date, not recent
- Team forgets to re-cache because it is not in the deployment checklist

### Why It Is Harmful
Stale cached documentation actively misleads consumers. New endpoints cannot be discovered. Modified schemas cause integration failures. Removed endpoints still appear as usable. The documentation becomes a source of disinformation, eroding consumer trust in the entire API.

### Real-World Consequences
A team adds a new `PATCH /users/{id}/profile` endpoint and modifies `GET /users/{id}` to return a `phone` field. They deploy without re-caching the Scramble spec. Consumers using the production docs do not see the new endpoint or the `phone` field. A consumer builds integration assuming `phone` does not exist. When their code reads `phone` from a real response, their deserializer crashes because the type they built (without `phone`) cannot parse the response.

### Preferred Alternative
Include `php artisan scramble:cache` in the deployment pipeline after code changes. Run it after migrations and before serving the documentation.

### Refactoring Strategy
1. Add `php artisan scramble:cache` to the deployment script after code updates
2. Add `php artisan route:cache` alongside it for consistency
3. Verify the cached spec is generated from the latest code
4. Add a CI check that compares the timestamp of the cached spec against the last deployment timestamp
5. Document the requirement to re-cache in the deployment runbook

### Detection Checklist
- [ ] Check deployment script for `php artisan scramble:cache` step
- [ ] Verify production spec timestamp matches deployment timestamp
- [ ] Compare development (uncached) spec against production (cached) spec
- [ ] Test that a code change followed by deploy without re-cache serves stale docs
- [ ] Add cache step to deployment checklist

### Related Rules
- Cache The Generated Spec In CI For Production (05-rules.md)

### Related Skills
- Integrate Scramble for API Documentation (06-skills.md)

### Related Decision Trees
- Spec Caching Strategy — Development vs Production (07-decision-trees.md)

---

